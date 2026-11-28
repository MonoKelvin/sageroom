use std::{io, ptr::{null, null_mut}, time::{Duration, Instant}};

use rusqlite::{Batch, Connection, fallible_iterator::FallibleIterator, hooks::{AuthAction, AuthContext, Authorization}, limits::Limit, params, types::ValueRef};
use serde_json::{Value, json};
use tokio_util::sync::CancellationToken;
use windows_sys::Win32::{
    Devices::DeviceAndDriverInstallation::{
        DIGCF_ALLCLASSES, DIGCF_PRESENT, HDEVINFO, SETUP_DI_REGISTRY_PROPERTY, SP_DEVINFO_DATA,
        SPDRP_CLASS, SPDRP_DEVICEDESC, SPDRP_FRIENDLYNAME, SetupDiDestroyDeviceInfoList,
        SetupDiEnumDeviceInfo, SetupDiGetClassDevsW, SetupDiGetDeviceRegistryPropertyW,
    },
    Foundation::ERROR_NO_MORE_ITEMS,
    Storage::FileSystem::{GetDiskFreeSpaceExW, GetDriveTypeW, GetLogicalDrives},
    System::WindowsProgramming::DRIVE_FIXED,
};

const MAX_DEVICES: u32 = 2048;
const MAX_ROWS: usize = 2048;
const MAX_RESULT: usize = 128 * 1024;

pub(super) struct QueryOutput {
    pub file: Vec<u8>,
    pub preview: String,
    pub truncated: bool,
}

struct Devices(HDEVINFO);

impl Drop for Devices {
    fn drop(&mut self) {
        unsafe { SetupDiDestroyDeviceInfoList(self.0) };
    }
}

impl Devices {
    fn property(&self, info: &SP_DEVINFO_DATA, property: SETUP_DI_REGISTRY_PROPERTY) -> Option<String> {
        let mut buffer = [0u16; 512];
        let ok = unsafe {
            SetupDiGetDeviceRegistryPropertyW(self.0, info, property, null_mut(), buffer.as_mut_ptr().cast(),
                size_of_val(&buffer) as u32, null_mut())
        };
        if ok == 0 { return None; }
        let end = buffer.iter().position(|&c| c == 0).unwrap_or(buffer.len());
        let text: String = String::from_utf16_lossy(&buffer[..end]).chars().filter(|c| !c.is_control()).collect();
        (!text.trim().is_empty()).then_some(text)
    }
}

fn load_inventory(db: &Connection, token: &CancellationToken) -> Result<bool, String> {
    db.execute_batch("CREATE TABLE windows_devices(name TEXT NOT NULL, class TEXT NOT NULL);
        CREATE TABLE windows_volumes(drive TEXT NOT NULL, free_bytes INTEGER, total_bytes INTEGER);")
        .map_err(|error| error.to_string())?;
    let handle = unsafe { SetupDiGetClassDevsW(null(), null(), null_mut(), DIGCF_PRESENT | DIGCF_ALLCLASSES) };
    if handle == -1 { return Err("无法读取 Windows 设备清单。".into()); }
    let devices = Devices(handle);
    let mut complete = false;
    let mut insert = db.prepare("INSERT INTO windows_devices VALUES (?1, ?2)").map_err(|error| error.to_string())?;
    for index in 0..MAX_DEVICES {
        if token.is_cancelled() { return Err("脚本执行已取消。".into()); }
        let mut info = SP_DEVINFO_DATA { cbSize: size_of::<SP_DEVINFO_DATA>() as u32, ..Default::default() };
        if unsafe { SetupDiEnumDeviceInfo(devices.0, index, &mut info) } == 0 {
            if io::Error::last_os_error().raw_os_error() != Some(ERROR_NO_MORE_ITEMS as i32) {
                return Err("Windows 设备清单读取中断。".into());
            }
            complete = true;
            break;
        }
        if let Some(name) = devices.property(&info, SPDRP_FRIENDLYNAME).or_else(|| devices.property(&info, SPDRP_DEVICEDESC)) {
            let class = devices.property(&info, SPDRP_CLASS).unwrap_or_default();
            insert.execute(params![name, class]).map_err(|error| error.to_string())?;
        }
    }
    let drives = unsafe { GetLogicalDrives() };
    let mut insert = db.prepare("INSERT INTO windows_volumes VALUES (?1, ?2, ?3)").map_err(|error| error.to_string())?;
    for index in 0..26 {
        if token.is_cancelled() { return Err("脚本执行已取消。".into()); }
        if drives & (1u32 << index) == 0 { continue; }
        let letter = b'A' + index as u8;
        let root = [letter as u16, b':' as u16, b'\\' as u16, 0];
        if unsafe { GetDriveTypeW(root.as_ptr()) } != DRIVE_FIXED { continue; }
        let (mut free, mut total) = (0, 0);
        let available = unsafe { GetDiskFreeSpaceExW(root.as_ptr(), &mut free, &mut total, null_mut()) } != 0;
        let free = if available { i64::try_from(free).ok() } else { None };
        let total = if available { i64::try_from(total).ok() } else { None };
        insert.execute(params![format!("{}:", char::from(letter)), free, total])
            .map_err(|error| error.to_string())?;
    }
    Ok(!complete)
}

fn query(mut db: Connection, source: &str, token: CancellationToken, input_truncated: bool) -> rusqlite::Result<QueryOutput> {
    db.execute_batch("PRAGMA temp_store=MEMORY; PRAGMA trusted_schema=OFF; PRAGMA query_only=ON;")?;
    for (limit, value) in [(Limit::SQLITE_LIMIT_LENGTH, 8192), (Limit::SQLITE_LIMIT_COLUMN, 24),
        (Limit::SQLITE_LIMIT_EXPR_DEPTH, 48), (Limit::SQLITE_LIMIT_COMPOUND_SELECT, 8), (Limit::SQLITE_LIMIT_VDBE_OP, 8192)] {
        db.set_limit(limit, value)?;
    }
    let start = Instant::now();
    let mut progress = 0;
    db.progress_handler(1000, Some(move || {
        progress += 1;
        token.is_cancelled() || progress > 250 || start.elapsed() > Duration::from_millis(400)
    }))?;
    db.authorizer(Some(|context: AuthContext<'_>| match context.action {
        AuthAction::Select | AuthAction::Read { table_name: "windows_devices" | "windows_volumes", .. } => Authorization::Allow,
        AuthAction::Function { function_name: "count" | "sum" | "min" | "max" | "avg" | "total" | "round" | "coalesce" | "ifnull"
            | "lower" | "upper" | "trim" | "substr" | "length" | "instr" | "replace" | "like" | "glob" | "group_concat" } => Authorization::Allow,
        _ => Authorization::Deny,
    }))?;
    let mut batch = Batch::new(&db, source);
    let Some(mut statement) = batch.next()? else { return Err(rusqlite::Error::InvalidQuery); };
    if batch.next()?.is_some() || !statement.readonly() || statement.column_count() == 0 {
        return Err(rusqlite::Error::InvalidQuery);
    }
    let columns: Vec<_> = statement.column_names().map(str::to_owned).collect();
    let mut rows = statement.query([])?;
    let mut result = Vec::new();
    let mut preview = Vec::new();
    let mut bytes = 0;
    let mut preview_bytes = 0;
    let mut truncated = input_truncated;
    while let Some(row) = rows.next()? {
        let values: Vec<_> = (0..columns.len()).map(|index| row.get_ref(index).map(|value| match value {
            ValueRef::Null | ValueRef::Blob(_) => Value::Null,
            ValueRef::Integer(value) => json!(value),
            ValueRef::Real(value) => json!(value),
            ValueRef::Text(value) => json!(String::from_utf8_lossy(value)),
        })).collect::<rusqlite::Result<_>>()?;
        let length = json!(values).to_string().len() + 1;
        if result.len() == MAX_ROWS || bytes + length > MAX_RESULT {
            truncated = true;
            break;
        }
        bytes += length;
        if preview.len() == result.len() && preview_bytes + length <= 1000 {
            preview_bytes += length;
            preview.push(values.clone());
        }
        result.push(values);
    }
    Ok(QueryOutput {
        file: json!({"columns":columns,"rows":result,"truncated":truncated}).to_string().into_bytes(),
        preview: json!({"columns":columns,"rows":preview,"row_count":result.len(),"preview_truncated":preview.len() != result.len()}).to_string(),
        truncated,
    })
}

pub(super) fn execute(source: &str, token: CancellationToken) -> Result<QueryOutput, String> {
    let db = Connection::open_in_memory().map_err(|error| error.to_string())?;
    let input_truncated = load_inventory(&db, &token)?;
    query(db, source, token, input_truncated).map_err(|error| format!("Windows 只读 SQL 未完成：{error}"))
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn queries_live_windows_devices_without_docker() {
        let result = execute("SELECT count(*) FROM windows_devices", CancellationToken::new()).unwrap();
        let result: Value = serde_json::from_slice(&result.file).unwrap();
        assert!(result["rows"][0][0].as_u64().unwrap() > 0);
    }

    #[test]
    fn query_rejects_writes_other_databases_and_multiple_statements() {
        for source in ["UPDATE windows_devices SET name='changed'", "SELECT name FROM sqlite_schema",
            "ATTACH DATABASE ':memory:' AS other", "SELECT 1; SELECT 2", "PRAGMA query_only=OFF"] {
            let db = Connection::open_in_memory().unwrap();
            db.execute_batch("CREATE TABLE windows_devices(name TEXT, class TEXT)").unwrap();
            assert!(query(db, source, CancellationToken::new(), false).is_err(), "{source}");
        }
    }
}

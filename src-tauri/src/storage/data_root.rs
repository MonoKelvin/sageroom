use std::{
    fs,
    io,
    path::{Path, PathBuf},
};

use serde::{Deserialize, Serialize};

/// 数据根目录覆盖配置。放在应用配置目录（而非数据目录内），
/// 这样迁移后仍能读到它，且卸载应用时不会随数据目录一起删除。
#[derive(Clone, Debug, Default, Serialize, Deserialize)]
#[serde(deny_unknown_fields)]
struct RootOverride {
    path: PathBuf,
}

fn override_file(config_dir: &Path) -> PathBuf {
    config_dir.join("data-root.json")
}

/// 读取用户设置的数据根目录；未设置或无效时返回 None。
pub fn configured_root(config_dir: &Path) -> Option<PathBuf> {
    let bytes = fs::read(override_file(config_dir)).ok()?;
    let value: RootOverride = serde_json::from_slice(&bytes).ok()?;
    if value.path.as_os_str().is_empty() || !value.path.is_dir() {
        return None;
    }
    Some(value.path)
}

/// 递归复制目录内容（保留文件属性，不跟随符号链接）。
fn copy_tree(from: &Path, to: &Path) -> io::Result<()> {
    fs::create_dir_all(to)?;
    for entry in fs::read_dir(from)? {
        let entry = entry?;
        let kind = entry.file_type()?;
        let source = entry.path();
        let target = to.join(entry.file_name());
        if kind.is_dir() {
            copy_tree(&source, &target)?;
        } else if kind.is_file() {
            fs::copy(&source, &target)?;
        }
    }
    Ok(())
}

/// 把当前数据目录迁移到目标位置，并写入覆盖配置。
/// 返回 true 表示需要重启应用才能切换到新目录。
pub fn migrate(current: &Path, config_dir: &Path, target: &Path) -> Result<(), String> {
    let target = if target.is_absolute() {
        target.to_path_buf()
    } else {
        return Err("目标路径必须是绝对路径。".into());
    };
    if !target.is_dir() {
        return Err("目标目录不存在或不是文件夹。".into());
    }
    if target == current {
        return Err("目标目录就是当前数据目录。".into());
    }
    // 目标必须为空，避免与旧数据混在一起产生不可预期的冲突。
    let occupied = fs::read_dir(&target)
        .map_err(|error| format!("无法读取目标目录：{error}"))?
        .next()
        .is_some();
    if occupied {
        return Err("目标目录不为空，请选择空文件夹。".into());
    }

    // 复制成功后才写覆盖配置，避免半途失败时下次启动指向不完整的新目录。
    if let Err(error) = copy_tree(current, &target) {
        return Err(format!("复制数据失败：{error}"));
    }

    fs::create_dir_all(config_dir).map_err(|error| format!("无法写入配置目录：{error}"))?;
    let payload = serde_json::to_vec(&RootOverride { path: target })
        .map_err(|error| format!("无法序列化配置：{error}"))?;
    fs::write(override_file(config_dir), payload)
        .map_err(|error| format!("无法保存目录配置：{error}"))?;
    Ok(())
}

/// 清除覆盖配置，恢复默认数据目录。
pub fn reset(config_dir: &Path) -> Result<(), String> {
    match fs::remove_file(override_file(config_dir)) {
        Ok(()) => Ok(()),
        Err(error) if error.kind() == io::ErrorKind::NotFound => Ok(()),
        Err(error) => Err(format!("无法清除目录配置：{error}")),
    }
}

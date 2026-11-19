use std::{collections::BTreeMap, error::Error, fs, path::PathBuf};

use schemars::{
    JsonSchema,
    generate::{Contract, SchemaSettings},
};
use serde_json::Value;
use ts_rs::{Config, TS};

use sageroom_lib::domain::contracts::*;

fn export<T: TS + JsonSchema + 'static>(
    name: &str,
    config: &Config,
    schemas: &mut BTreeMap<String, Value>,
) -> Result<(), Box<dyn Error>> {
    T::export_all(config)?;
    let settings = SchemaSettings::draft2020_12().with(|settings| {
        settings.contract = if name.ends_with("Response") || name == "DomainEvent" {
            Contract::Serialize
        } else {
            Contract::Deserialize
        };
    });
    schemas.insert(
        name.to_owned(),
        serde_json::to_value(settings.into_generator().root_schema_for::<T>())?,
    );
    Ok(())
}

fn main() -> Result<(), Box<dyn Error>> {
    let output = PathBuf::from(std::env::args_os().nth(1).ok_or("缺少合同输出目录")?);
    fs::create_dir_all(output.join("types"))?;
    let config = Config::new().with_out_dir(output.join("types"));
    let mut schemas = BTreeMap::new();
    export::<AppSnapshotRequest>("AppSnapshotRequest", &config, &mut schemas)?;
    export::<ApiResponse<AppSnapshot>>("AppSnapshotResponse", &config, &mut schemas)?;
    export::<ChatSendRequest>("ChatSendRequest", &config, &mut schemas)?;
    export::<ApiResponse<ChatSendResult>>("ChatSendResponse", &config, &mut schemas)?;
    export::<ChatListRequest>("ChatListRequest", &config, &mut schemas)?;
    export::<ApiResponse<MessagePage>>("ChatListResponse", &config, &mut schemas)?;
    export::<ChatSearchRequest>("ChatSearchRequest", &config, &mut schemas)?;
    export::<ApiResponse<SearchPage>>("ChatSearchResponse", &config, &mut schemas)?;
    export::<CancelSearchRequest>("CancelSearchRequest", &config, &mut schemas)?;
    export::<ApiResponse<CancelSearchResult>>("CancelSearchResponse", &config, &mut schemas)?;
    export::<AppearanceSaveRequest>("AppearanceSaveRequest", &config, &mut schemas)?;
    export::<ApiResponse<Appearance>>("AppearanceSaveResponse", &config, &mut schemas)?;
    export::<ExitRequest>("ExitRequest", &config, &mut schemas)?;
    export::<ApiResponse<ExitResult>>("ExitResponse", &config, &mut schemas)?;
    export::<DomainEvent>("DomainEvent", &config, &mut schemas)?;
    AppSnapshot::export_all(&config)?;
    ChatSendResult::export_all(&config)?;
    MessagePage::export_all(&config)?;
    SearchPage::export_all(&config)?;
    CancelSearchResult::export_all(&config)?;
    Appearance::export_all(&config)?;
    ExitResult::export_all(&config)?;
    fs::write(
        output.join("schemas.json"),
        serde_json::to_string_pretty(&schemas)? + "\n",
    )?;
    Ok(())
}

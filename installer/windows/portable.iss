; Sageroom 便携版：单文件 exe，不写注册表、不建快捷方式、不带卸载程序。
; 首次运行把程序解到 %LOCALAPPDATA%\Sageroom\portable，之后同版本再打开直接启动，不再解压。
#include "common.iss"

[Setup]
AppId={#PortableAppId}
AppName={#AppName} 便携版
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion} 便携版
AppPublisher={#AppPublisher}
AppPublisherURL={#AppUrl}
VersionInfoVersion={#AppVersion}
VersionInfoDescription={#AppName} 便携版
; 固定目录：升级覆盖同一份，不会按版本堆目录。
DefaultDirName={localappdata}\{#AppName}\portable
DisableDirPage=yes
DisableProgramGroupPage=yes
DisableWelcomePage=yes
DisableReadyPage=yes
DisableFinishedPage=yes
DisableStartupPrompt=yes
OutputDir={#RepoRoot}\build\windows
OutputBaseFilename={#AppName}-{#AppVersion}-portable
SetupIconFile={#RepoRoot}\src-tauri\icons\icon.ico
Compression=lzma2/max
SolidCompression=yes
LZMAUseSeparateProcess=yes
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
; 便携版只有进度页，用紧凑的经典向导。
WizardStyle=classic
ShowLanguageDialog=no
; 便携版不留卸载入口，也不出现在"应用和功能"里。
Uninstallable=no
CloseApplications=no
RestartApplications=no

[Languages]
Name: "zhcn"; MessagesFile: "ChineseSimplified.isl"

[Files]
Source: "{#StageDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Run]
; 静默模式只解压不启动，方便脚本预置；正常双击仍会直接打开。
Filename: "{app}\{#AppExeName}"; WorkingDir: "{app}"; Flags: nowait skipifsilent

[Code]
const
  WebView2Key = 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  WebView2Key32 = 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  WebView2Url = 'https://go.microsoft.com/fwlink/p/?LinkId=2124703';

function WebView2Installed(): Boolean;
var
  Version: String;
begin
  // 与安装版一致：显式指定注册表视图，避免 InitializeSetup 阶段被重定向。
  Result :=
    (RegQueryStringValue(HKLM64, WebView2Key32, 'pv', Version) and (Version <> '')) or
    (RegQueryStringValue(HKLM64, WebView2Key, 'pv', Version) and (Version <> '')) or
    (RegQueryStringValue(HKLM32, WebView2Key, 'pv', Version) and (Version <> '')) or
    (RegQueryStringValue(HKCU, WebView2Key, 'pv', Version) and (Version <> ''));
end;

function InstallRoot(): String;
begin
  Result := ExpandConstant('{localappdata}') + '\{#AppName}\portable';
end;

{ 版本戳用文件名区分：存在即代表这个版本已经解压好了。 }
function StampPath(): String;
begin
  Result := InstallRoot() + '\.v{#AppVersion}';
end;

function LaunchExisting(): Boolean;
var
  ErrorCode: Integer;
begin
  Result := ShellExec('open', InstallRoot() + '\{#AppExeName}', '', InstallRoot(),
                      SW_SHOWNORMAL, ewNoWait, ErrorCode);
end;

function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
begin
  Result := True;
  if not WebView2Installed() then begin
    if MsgBox('Sageroom 需要 Microsoft Edge WebView2 运行时，当前系统没有检测到。' + #13#10#13#10 +
              '点击"是"打开官方下载页，装好后再运行。', mbConfirmation, MB_YESNO) = IDYES then
      ShellExec('open', WebView2Url, '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
    Result := False;
    exit;
  end;
  { 同版本已经解压过：直接启动，省掉每次解压的一两秒。 }
  if FileExists(StampPath()) and FileExists(InstallRoot() + '\{#AppExeName}') then
    if LaunchExisting() then
      Result := False;
end;

{ 解压完成后写版本戳，并清掉更早版本留下的空戳文件。 }
procedure CurStepChanged(CurStep: TSetupStep);
var
  FindRec: TFindRec;
begin
  if CurStep <> ssPostInstall then
    exit;
  SaveStringToFile(StampPath(), '{#AppVersion}', False);
  if FindFirst(InstallRoot() + '\.v*', FindRec) then
  try
    repeat
      if (FindRec.Attributes and FILE_ATTRIBUTE_DIRECTORY) = 0 then
        if CompareText(FindRec.Name, '.v{#AppVersion}') <> 0 then
          DeleteFile(InstallRoot() + '\' + FindRec.Name);
    until not FindNext(FindRec);
  finally
    FindClose(FindRec);
  end;
end;

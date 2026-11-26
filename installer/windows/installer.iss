; Sageroom 安装版：单文件 setup.exe，写入用户目录，不弹 UAC。
; 体积优先：只打包 exe 本身，WebView2 用系统已有的运行时，缺失时提示下载。
#include "common.iss"

[Setup]
AppId={#AppId}
AppName={#AppName}
AppVersion={#AppVersion}
AppVerName={#AppName} {#AppVersion}
AppPublisher={#AppPublisher}
AppPublisherURL={#AppUrl}
AppSupportURL={#AppUrl}
AppUpdatesURL={#AppUrl}
VersionInfoVersion={#AppVersion}
VersionInfoDescription={#AppName} 安装程序
DefaultDirName={autopf}\{#AppName}
DefaultGroupName={#AppName}
DisableProgramGroupPage=yes
OutputDir={#RepoRoot}\build\windows
OutputBaseFilename={#AppName}-{#AppVersion}-setup
SetupIconFile={#RepoRoot}\src-tauri\icons\icon.ico
UninstallDisplayIcon={app}\{#AppExeName}
UninstallDisplayName={#AppName}
; 极限压缩 + 固实压缩：只有一个文件，固实模式省下的字典头很划算。
Compression=lzma2/max
SolidCompression=yes
LZMAUseSeparateProcess=yes
; 装到当前用户目录即可，不需要管理员权限，也就不弹 UAC。
PrivilegesRequired=lowest
ArchitecturesAllowed=x64compatible
ArchitecturesInstallIn64BitMode=x64compatible
MinVersion=10.0
; 现代向导默认 656×428，对小工具偏大，退回更紧凑的经典向导（约 500×360）。
WizardStyle=classic
ShowLanguageDialog=no
; 应用自己会处理单实例，不需要 Restart Manager 去关窗口。
CloseApplications=no
RestartApplications=no

[Languages]
; Inno Setup 不自带中文，语言文件随仓库一起提供。
Name: "zhcn"; MessagesFile: "ChineseSimplified.isl"

[Tasks]
Name: "desktopicon"; Description: "创建桌面快捷方式"; GroupDescription: "附加任务："; Flags: unchecked

[Files]
Source: "{#StageDir}\*"; DestDir: "{app}"; Flags: ignoreversion recursesubdirs createallsubdirs

[Icons]
Name: "{group}\{#AppName}"; Filename: "{app}\{#AppExeName}"
Name: "{group}\卸载 {#AppName}"; Filename: "{uninstallexe}"
Name: "{autodesktop}\{#AppName}"; Filename: "{app}\{#AppExeName}"; Tasks: desktopicon

[Run]
Filename: "{app}\{#AppExeName}"; Description: "立即运行 {#AppName}"; Flags: nowait postinstall skipifsilent

[Code]
const
  // Edge WebView2 Evergreen Runtime 的固定产品 GUID。
  // InitializeSetup 阶段安装模式还没定，注册表视图是不确定的，
  // 所以用 HKLM64 / HKLM32 显式指定视图，四条路径都查一遍。
  WebView2Key = 'SOFTWARE\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  WebView2Key32 = 'SOFTWARE\WOW6432Node\Microsoft\EdgeUpdate\Clients\{F3017226-FE2A-4295-8BDF-00C3A9A7E4C5}';
  WebView2Url = 'https://go.microsoft.com/fwlink/p/?LinkId=2124703';

function WebView2Installed(): Boolean;
var
  Version: String;
begin
  Result :=
    (RegQueryStringValue(HKLM64, WebView2Key32, 'pv', Version) and (Version <> '')) or
    (RegQueryStringValue(HKLM64, WebView2Key, 'pv', Version) and (Version <> '')) or
    (RegQueryStringValue(HKLM32, WebView2Key, 'pv', Version) and (Version <> '')) or
    (RegQueryStringValue(HKCU, WebView2Key, 'pv', Version) and (Version <> ''));
end;

function InitializeSetup(): Boolean;
var
  ErrorCode: Integer;
begin
  Result := True;
  if WebView2Installed() then
    exit;
  // 不打包离线运行时（+120MB），也不下载 bootstrapper：只提示一次，让用户自己装。
  if MsgBox('Sageroom 需要 Microsoft Edge WebView2 运行时，当前系统没有检测到。' + #13#10#13#10 +
            '点击"是"打开官方下载页，装好后再运行安装程序。', mbConfirmation, MB_YESNO) = IDYES then
    ShellExec('open', WebView2Url, '', '', SW_SHOWNORMAL, ewNoWait, ErrorCode);
  Result := False;
end;

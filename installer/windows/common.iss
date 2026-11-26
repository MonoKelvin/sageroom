; 安装版与便携版共用的定义。
; 版本号由 scripts/package-windows.mjs 通过 /DAppVersion=x.y.z 传入，
; 不要在这里写死，否则每次发版都要改两处。
#ifndef AppVersion
  #error 缺少 AppVersion：请用 iscc /DAppVersion=x.y.z 编译
#endif

#define AppName "Sageroom"
#define AppExeName "Sageroom.exe"
#define AppPublisher "MonoKelvin"
#define AppUrl "https://github.com/MonoKelvin/sageroom"

; 安装版的程序标识。
#define AppId "{{7C4B2F1A-9E63-4D18-8A52-3B6F0D9C5E71}"

; 构建脚本把 release exe 与 LICENSE 拷到这个目录。
#define StageDir "..\..\build\windows\stage"
#define RepoRoot "..\.."

param(
    [Parameter(Mandatory = $true)][int]$ProcessId,
    [ValidateSet('status', 'show', 'resize', 'maximize', 'restore', 'hit-test', 'capture', 'avatar-choose', 'avatar-cancel', 'tray-open', 'tray-quit')][string]$Action = 'status',
    [string]$Tooltip = '',
    [int]$Width = 1100,
    [int]$Height = 780,
    [int]$X = 0,
    [int]$Y = 0,
    [string]$FilePath = '',
    [string]$ImageFile = ''
)
$ErrorActionPreference = 'Stop'
[Console]::OutputEncoding = New-Object System.Text.UTF8Encoding($false)
Add-Type -TypeDefinition @'
using System;
using System.Text;
using System.Runtime.InteropServices;
public static class SageroomWindowTest {
    public delegate bool EnumCallback(IntPtr handle, IntPtr data);
    [StructLayout(LayoutKind.Sequential)] public struct Rect { public int Left, Top, Right, Bottom; }
    [StructLayout(LayoutKind.Sequential)] public struct Point { public int X, Y; }
    [DllImport("user32.dll")] public static extern IntPtr SetThreadDpiAwarenessContext(IntPtr context);
    [DllImport("user32.dll")] public static extern bool GetClientRect(IntPtr handle, out Rect rectangle);
    [DllImport("user32.dll")] public static extern bool ClientToScreen(IntPtr handle, ref Point point);
    [DllImport("user32.dll")] public static extern uint GetDpiForWindow(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool IsZoomed(IntPtr handle);
    [DllImport("user32.dll")] public static extern IntPtr SendMessageTimeout(IntPtr handle, uint message, IntPtr wparam, IntPtr lparam, uint flags, uint timeout, out UIntPtr result);
    public static long HitTest(IntPtr handle, int x, int y) {
        Point point = new Point { X = x, Y = y };
        if (!ClientToScreen(handle, ref point)) { throw new InvalidOperationException("无法转换窗口客户区坐标。"); }
        int packed = (point.X & 0xffff) | ((point.Y & 0xffff) << 16);
        UIntPtr result;
        if (SendMessageTimeout(handle, 0x84, IntPtr.Zero, new IntPtr(packed), 2, 1000, out result) == IntPtr.Zero) { throw new InvalidOperationException("窗口命中查询超过等待上限。"); }
        return unchecked((long)result.ToUInt64());
    }
    public static IntPtr FindOwnedWindow(uint processId, string title) {
        IntPtr found = IntPtr.Zero;
        EnumCallback callback = delegate(IntPtr handle, IntPtr data) {
            uint owner;
            GetWindowThreadProcessId(handle, out owner);
            StringBuilder text = new StringBuilder(512);
            GetWindowText(handle, text, 512);
            if (owner == processId && text.ToString() == title) { found = handle; return false; }
            return true;
        };
        EnumWindows(callback, IntPtr.Zero);
        return found;
    }
    public static void CloseOwnedDialog(uint processId, string title) {
        IntPtr handle = FindOwnedWindow(processId, title);
        if (handle == IntPtr.Zero) { return; }
        UIntPtr result;
        SendMessageTimeout(handle, 0x10, IntPtr.Zero, IntPtr.Zero, 2, 1000, out result);
    }
    [DllImport("user32.dll")] public static extern bool EnumChildWindows(IntPtr handle, EnumCallback callback, IntPtr data);
    [DllImport("user32.dll")] public static extern int GetDlgCtrlID(IntPtr handle);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetClassName(IntPtr handle, StringBuilder name, int maximum);
    [DllImport("user32.dll", CharSet=CharSet.Unicode, EntryPoint="SendMessageTimeoutW")] public static extern IntPtr SendTextTimeout(IntPtr handle, uint message, IntPtr wparam, string text, uint flags, uint timeout, out UIntPtr result);
    [DllImport("user32.dll")] public static extern bool PostMessage(IntPtr handle, uint message, IntPtr wparam, IntPtr lparam);
    public static void SelectAvatarFile(uint processId, string path) {
        IntPtr dialog = FindOwnedWindow(processId, "选择头像");
        if (dialog == IntPtr.Zero) { throw new InvalidOperationException("未找到测试进程的头像选择窗口。"); }
        IntPtr edit = IntPtr.Zero;
        EnumCallback callback = delegate(IntPtr handle, IntPtr data) {
            var name = new StringBuilder(256);
            GetClassName(handle, name, 256);
            if (GetDlgCtrlID(handle) == 1148 && name.ToString() == "Edit") { edit = handle; return false; }
            return true;
        };
        EnumChildWindows(dialog, callback, IntPtr.Zero);
        if (edit == IntPtr.Zero) { throw new InvalidOperationException("无法识别测试选择器的文件名输入控件。"); }
        UIntPtr result;
        if (SendTextTimeout(edit, 0xC, IntPtr.Zero, path, 2, 1000, out result) == IntPtr.Zero) { throw new InvalidOperationException("设置文件名超过等待上限。"); }
        if (!PostMessage(dialog, 0x111, new IntPtr(1), IntPtr.Zero)) { throw new InvalidOperationException("提交原生选择器失败。"); }
    }
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumCallback callback, IntPtr data);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr handle, out uint process);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr handle, StringBuilder text, int maximum);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr handle, out Rect rectangle);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr handle, int command);
    [DllImport("user32.dll")] public static extern bool PrintWindow(IntPtr handle, IntPtr dc, uint flags);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr handle, IntPtr after, int x, int y, int width, int height, uint flags);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint x, uint y, uint data, UIntPtr extra);
}
'@
# 使用物理像素，避免高 DPI 下 Win32 坐标虚拟化。
if ([SageroomWindowTest]::SetThreadDpiAwarenessContext([IntPtr]::new(-4)) -eq [IntPtr]::Zero) { throw '无法启用测试线程的逐显示器 DPI 坐标模式。' }
$script:Windows = New-Object 'System.Collections.Generic.List[System.IntPtr]'
$callback = [SageroomWindowTest+EnumCallback]{
    param($handle, $data)
    [uint32]$owner = 0
    $null = [SageroomWindowTest]::GetWindowThreadProcessId($handle, [ref]$owner)
    if ($owner -eq $ProcessId) {
        $text = New-Object System.Text.StringBuilder 512
        $null = [SageroomWindowTest]::GetWindowText($handle, $text, 512)
        if ($text.ToString().StartsWith('Sageroom')) { $script:Windows.Add($handle) }
    }
    return $true
}
$null = [SageroomWindowTest]::EnumWindows($callback, [IntPtr]::Zero)
if ($script:Windows.Count -eq 0) { throw '未找到指定测试进程的主窗口。' }
$window = $script:Windows[0]

if ($Action -eq 'show') {
    $null = [SageroomWindowTest]::ShowWindow($window, 9)
    $null = [SageroomWindowTest]::SetForegroundWindow($window)
}
if ($Action -eq 'resize') {
    $null = [SageroomWindowTest]::SetWindowPos($window, [IntPtr]::Zero, 0, 0, $Width, $Height, 6)
}
if ($Action -eq 'maximize') { $null = [SageroomWindowTest]::ShowWindow($window, 3) }
if ($Action -eq 'restore') { $null = [SageroomWindowTest]::ShowWindow($window, 9) }
$hit = $null
if ($Action -eq 'hit-test') { $hit = [SageroomWindowTest]::HitTest($window, $X, $Y) }

if ($Action -eq 'capture') {
    if ([string]::IsNullOrWhiteSpace($ImageFile)) { throw '窗口取证需要指定图片文件。' }
    if (-not [SageroomWindowTest]::IsWindowVisible($window)) { throw '不能截取隐藏的测试窗口。' }
    Add-Type -AssemblyName System.Drawing
    $bounds = New-Object SageroomWindowTest+Rect
    $null = [SageroomWindowTest]::GetClientRect($window, [ref]$bounds)
    $bitmap = New-Object System.Drawing.Bitmap ($bounds.Right - $bounds.Left), ($bounds.Bottom - $bounds.Top)
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
        $dc = $graphics.GetHdc()
        try {
            if (-not [SageroomWindowTest]::PrintWindow($window, $dc, 3)) { throw '测试窗口未能提供自己的画面，未截取其他屏幕内容。' }
        } finally { $graphics.ReleaseHdc($dc) }
        $bitmap.Save($ImageFile, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
}
if ($Action -eq 'avatar-cancel') { [SageroomWindowTest]::CloseOwnedDialog([uint32]$ProcessId, '选择头像') }
if ($Action -eq 'avatar-choose') {
    if ([string]::IsNullOrWhiteSpace($FilePath)) { throw '头像测试需要指定测试图片。' }
    [SageroomWindowTest]::SelectAvatarFile([uint32]$ProcessId, $FilePath)
}
if ($Action -like 'tray-*') {
    if ([string]::IsNullOrWhiteSpace($Tooltip)) { throw '托盘测试必须指定唯一的测试应用提示文本。' }
    Add-Type -AssemblyName UIAutomationClient
    Add-Type -AssemblyName UIAutomationTypes
    $root = [System.Windows.Automation.AutomationElement]::RootElement
    $taskbarCondition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ClassNameProperty, 'Shell_TrayWnd')
    $overflowCondition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ClassNameProperty, 'NotifyIconOverflowWindow')
    $nameCondition = New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, $Tooltip)
    $taskbar = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $taskbarCondition)
    if ($null -eq $taskbar) { throw '当前桌面没有可访问的任务栏。' }
    $icon = $taskbar.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $nameCondition)
    if ($null -eq $icon) {
        $buttons = $taskbar.FindAll([System.Windows.Automation.TreeScope]::Descendants, (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ControlTypeProperty, [System.Windows.Automation.ControlType]::Button)))
        foreach ($button in $buttons) {
            if ($button.Current.Name -match '^(显示隐藏的图标|显示隐藏图标|Show hidden icons|Hidden icons)$') {
                $button.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
                break
            }
        }
        $deadline = [DateTime]::UtcNow.AddSeconds(2)
        do {
            $overflow = $root.FindFirst([System.Windows.Automation.TreeScope]::Children, $overflowCondition)
            if ($null -ne $overflow) { $icon = $overflow.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $nameCondition) }
            if ($null -eq $icon) { [System.Threading.Thread]::Sleep(40) }
        } while ($null -eq $icon -and [DateTime]::UtcNow -lt $deadline)
    }
    if ($null -eq $icon) { throw '未找到唯一测试应用的托盘图标，需实机手动确认。' }
    if ($Action -eq 'tray-open') {
        $icon.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    } else {
        $bounds = $icon.Current.BoundingRectangle
        $null = [SageroomWindowTest]::SetCursorPos([int]($bounds.X + $bounds.Width / 2), [int]($bounds.Y + $bounds.Height / 2))
        [SageroomWindowTest]::mouse_event(8, 0, 0, 0, [UIntPtr]::Zero)
        [SageroomWindowTest]::mouse_event(16, 0, 0, 0, [UIntPtr]::Zero)
        $condition = New-Object System.Windows.Automation.AndCondition(
            (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::ProcessIdProperty, $ProcessId)),
            (New-Object System.Windows.Automation.PropertyCondition([System.Windows.Automation.AutomationElement]::NameProperty, '退出 Sageroom'))
        )
        $deadline = [DateTime]::UtcNow.AddSeconds(2)
        do {
            $item = $root.FindFirst([System.Windows.Automation.TreeScope]::Descendants, $condition)
            if ($null -eq $item) { [System.Threading.Thread]::Sleep(40) }
        } while ($null -eq $item -and [DateTime]::UtcNow -lt $deadline)
        if ($null -eq $item) { throw '未找到测试应用的退出菜单项，需实机手动确认。' }
        $item.GetCurrentPattern([System.Windows.Automation.InvokePattern]::Pattern).Invoke()
    }
}

$rectangle = New-Object SageroomWindowTest+Rect
$client = New-Object SageroomWindowTest+Rect
$null = [SageroomWindowTest]::GetClientRect($window, [ref]$client)
$null = [SageroomWindowTest]::GetWindowRect($window, [ref]$rectangle)
@{
    process_id = $ProcessId
    handle = $window.ToInt64().ToString()
    visible = [SageroomWindowTest]::IsWindowVisible($window)
    minimized = [SageroomWindowTest]::IsIconic($window)
    maximized = [SageroomWindowTest]::IsZoomed($window)
    dpi = [SageroomWindowTest]::GetDpiForWindow($window)
    client_width = $client.Right - $client.Left
    client_height = $client.Bottom - $client.Top
    hit_test = $hit
    width = $rectangle.Right - $rectangle.Left
    height = $rectangle.Bottom - $rectangle.Top
} | ConvertTo-Json -Compress

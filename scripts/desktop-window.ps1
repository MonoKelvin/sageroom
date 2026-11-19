param(
    [Parameter(Mandatory = $true)][int]$ProcessId,
    [ValidateSet('status', 'show', 'resize', 'tray-open', 'tray-quit')][string]$Action = 'status',
    [string]$Tooltip = '',
    [int]$Width = 420,
    [int]$Height = 780
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
    [DllImport("user32.dll")] public static extern bool EnumWindows(EnumCallback callback, IntPtr data);
    [DllImport("user32.dll")] public static extern uint GetWindowThreadProcessId(IntPtr handle, out uint process);
    [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr handle, StringBuilder text, int maximum);
    [DllImport("user32.dll")] public static extern bool IsWindowVisible(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool IsIconic(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool GetWindowRect(IntPtr handle, out Rect rectangle);
    [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr handle, int command);
    [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr handle);
    [DllImport("user32.dll")] public static extern bool SetWindowPos(IntPtr handle, IntPtr after, int x, int y, int width, int height, uint flags);
    [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
    [DllImport("user32.dll")] public static extern void mouse_event(uint flags, uint x, uint y, uint data, UIntPtr extra);
}
'@
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
$null = [SageroomWindowTest]::GetWindowRect($window, [ref]$rectangle)
@{
    process_id = $ProcessId
    handle = $window.ToInt64().ToString()
    visible = [SageroomWindowTest]::IsWindowVisible($window)
    minimized = [SageroomWindowTest]::IsIconic($window)
    width = $rectangle.Right - $rectangle.Left
    height = $rectangle.Bottom - $rectangle.Top
} | ConvertTo-Json -Compress

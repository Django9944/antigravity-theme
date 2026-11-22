# =====================================================================
#  Antigravity Theme - One-Click Installer (Windows)
#  Copyright (c) 2026 Django9944, licensed under the MIT License.
#  1) 备份 app.asar  2) 调用共享引擎 core/asar-patcher.js 注入主题钩子（幂等）  3) 分发主题文件
#  用法:  右键"使用 PowerShell 运行" 或 双击 install.bat
#  卸载:  powershell -File install.ps1 -Uninstall
#  诊断:  powershell -File install.ps1 -Doctor
# =====================================================================
param(
    [switch]$Uninstall,
    [switch]$CheckUpdate,
    [switch]$Update,
    [switch]$Doctor,
    [switch]$EnableAutoHeal,
    [switch]$DisableAutoHeal,
    [switch]$AutoHeal,
    [string]$AppPath = '',
    [switch]$NonInteractive
)
$ErrorActionPreference = 'Stop'

$ScriptDir            = Split-Path -Parent $MyInvocation.MyCommand.Path
$ManifestPath         = Join-Path $ScriptDir 'manifest.json'
$PatcherScript        = Join-Path $ScriptDir 'core\asar-patcher.js'
$UpdaterScript        = Join-Path $ScriptDir 'core\updater.js'
$AutoHealTaskName     = 'AntigravityTheme-AutoHeal'
$LegacyAutoHealTask   = 'AntigravityCustomThemes-AutoHeal'

function Die([string]$msg)  { Write-Host "[X] $msg" -ForegroundColor Red; exit 1 }
function Ok([string]$msg)   { Write-Host "[OK] $msg" -ForegroundColor Green }
function Warn([string]$msg) { Write-Host "[!] $msg" -ForegroundColor Yellow }
function Info([string]$msg) { Write-Host "[*] $msg" -ForegroundColor Cyan }

function Get-Sha256Hex([string]$Path) {
    $sha = [System.Security.Cryptography.SHA256]::Create()
    $fs = [System.IO.File]::OpenRead($Path)
    try {
        return ([System.BitConverter]::ToString($sha.ComputeHash($fs))).Replace('-', '').ToLowerInvariant()
    } finally {
        $fs.Dispose()
        $sha.Dispose()
    }
}

function Test-IsSandboxPath([string]$PathValue) {
    if (-not $PathValue) { return $false }
    $norm = $PathValue.Replace('/', '\').ToLowerInvariant()
    $sysTemp = ([System.IO.Path]::GetTempPath()).TrimEnd('\').Replace('/', '\').ToLowerInvariant()
    if ($sysTemp -and $norm.StartsWith($sysTemp)) { return $true }
    if ($env:TEMP) {
        $envTemp = ($env:TEMP).TrimEnd('\').Replace('/', '\').ToLowerInvariant()
        if ($envTemp -and $norm.StartsWith($envTemp)) { return $true }
    }
    if ($norm -match '^[a-z]:\\(tmp|temp)\\' -or $norm.StartsWith('\tmp\')) { return $true }
    return $false
}

function Remove-ScheduledTaskIfExists([string]$TaskName) {
    $q = Invoke-ProcessCaptured -FilePath 'schtasks.exe' -Arguments @('/Query', '/TN', $TaskName)
    if ($q.ExitCode -eq 0) {
        $del = Invoke-ProcessCaptured -FilePath 'schtasks.exe' -Arguments @('/Delete', '/TN', $TaskName, '/F')
        return ($del.ExitCode -eq 0)
    }
    return $false
}

if (-not (Test-Path -LiteralPath $ManifestPath)) {
    Die "缺少清单文件 manifest.json —— 请在完整的主题包目录内运行本脚本。"
}
$Manifest = Get-Content -LiteralPath $ManifestPath -Raw -Encoding UTF8 | ConvertFrom-Json

$CurrentVersion = if ($Manifest.version)     { [string]$Manifest.version }     else { 'v0.2.0' }
$Repo           = if ($Manifest.repo)        { [string]$Manifest.repo }        else { 'Django9944/antigravity-theme' }
$HookVersion        = if ($Manifest.hookVersion) { [string]$Manifest.hookVersion } else { 'v2' }
$ExpectedPatchState = "PATCHED_$($HookVersion.ToUpperInvariant())"
$PayloadDir     = if ($Manifest.payloadDir)  { ([string]$Manifest.payloadDir) -replace '/', '\' } else { 'dist\runtime' }
$Payloads       = if ($Manifest.payloads)    { @($Manifest.payloads) }         else { @('current.css', 'current.js') }
$ReleasesUrl    = "https://github.com/$Repo/releases/latest"

function Resolve-PayloadFile([string]$FileName) {
    $candidates = @(
        (Join-Path $ScriptDir (Join-Path $PayloadDir $FileName)),
        (Join-Path $ScriptDir (Join-Path 'dist\runtime' $FileName)),
        (Join-Path $ScriptDir $FileName)
    )
    foreach ($p in $candidates) {
        if ($p -and (Test-Path -LiteralPath $p -PathType Leaf)) {
            return $p
        }
    }
    return $null
}

# ---------- 检查更新分支 ----------
if ($CheckUpdate) {
    Info "正在检测 GitHub 最新发行版 ($Repo)..."
    try {
        try {
            $proto = [Net.ServicePointManager]::SecurityProtocol
            if ($proto -ne [Net.SecurityProtocolType]::SystemDefault) {
                [Net.ServicePointManager]::SecurityProtocol = $proto -bor [Net.SecurityProtocolType]::Tls12
            }
        } catch { }

        $apiUrl  = "https://api.github.com/repos/$Repo/releases/latest"
        $headers = @{ 'User-Agent' = 'Antigravity-Theme-Updater' }
        $release = Invoke-RestMethod -Uri $apiUrl -Headers $headers -TimeoutSec 10 -ErrorAction Stop

        $remoteTag = [string]$release.tag_name
        $publishedAt = "近期"
        if ($release.published_at) {
            if ($release.published_at -is [datetime]) {
                $publishedAt = $release.published_at.ToString('yyyy-MM-dd')
            } else {
                $parsedDt = [datetime]::MinValue
                $rawPub = [string]$release.published_at
                if ([datetime]::TryParse($rawPub, [ref]$parsedDt)) {
                    $publishedAt = $parsedDt.ToString('yyyy-MM-dd')
                } elseif ($rawPub.Length -ge 10) {
                    $publishedAt = $rawPub.Substring(0, 10)
                }
            }
        }

        $htmlUrl = $ReleasesUrl
        if ($release.html_url -and ([string]$release.html_url -match '^https://github\.com/')) {
            $htmlUrl = [string]$release.html_url
        }

        $hasUpdate = $false
        if ($remoteTag) {
            $rClean = ($remoteTag.Trim().TrimStart('v', 'V') -split '-')[0]
            $cClean = ($CurrentVersion.Trim().TrimStart('v', 'V') -split '-')[0]
            $rVer = $null; $cVer = $null
            if ([version]::TryParse($rClean, [ref]$rVer) -and [version]::TryParse($cClean, [ref]$cVer)) {
                $hasUpdate = ($rVer -gt $cVer)
            } else {
                $hasUpdate = ($remoteTag.Trim().ToLower() -ne $CurrentVersion.Trim().ToLower())
            }
        }

        Write-Host ""
        if ($hasUpdate) {
            Write-Host "[!] 发现新版本：$remoteTag （当前版本：$CurrentVersion）" -ForegroundColor Green
            Write-Host "    发布时间：$publishedAt" -ForegroundColor Gray
            if ($release.body) {
                Write-Host "`n更新内容描述：" -ForegroundColor Yellow
                $summary = ($release.body -split "`r?`n" | Where-Object { $_ -match '^(?:###\s+(?!🚀|🔒)|[-*]\s+|\d+\.\s+)' -and $_ -notmatch '^\*\*Full Changelog\*\*' } | Select-Object -First 8) -join "`n"
                if ($summary) { Write-Host $summary -ForegroundColor Gray }
            }
            Write-Host ""
            if (-not $NonInteractive) {
                $open = Read-Host "是否立即自动下载校验并更新？(Y=自动更新 / B=仅打开浏览器 / N=取消) [默认 Y]"
                if ($open -eq '' -or $open -match '^[Yy]') {
                    $reArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $MyInvocation.MyCommand.Path, '-Update')
                    if ($AppPath) { $reArgs += @('-AppPath', $AppPath) }
                    & powershell.exe @reArgs
                    exit $LASTEXITCODE
                } elseif ($open -match '^[Bb]') {
                    Start-Process $htmlUrl
                    Ok "已调起默认浏览器打开发布页面。"
                }
            }
        } else {
            Ok "当前已是最新版本 ($CurrentVersion)，无需更新。"
        }
    } catch {
        Warn "检查更新失败（$($_.Exception.Message)）。"
        Write-Host "    您也可以随时直接在浏览器中访问：" -ForegroundColor Gray
        Write-Host "    $ReleasesUrl" -ForegroundColor Cyan
    }
    exit 0
}

if (-not (Test-Path -LiteralPath $PatcherScript)) {
    Die "缺少共享补丁引擎 core\asar-patcher.js —— 请在完整的主题包目录内运行本脚本。"
}

# ---------- 定位 Antigravity 客户端 ----------
function Resolve-CustomResources([string]$InputPath) {
    $clean = $InputPath.Trim().Trim('"').TrimEnd('\', '/')
    if (-not $clean) { return $null }
    if ((Test-Path -LiteralPath $clean -PathType Leaf) -and ((Split-Path -Leaf $clean) -ieq 'app.asar')) {
        return (Split-Path -Parent $clean)
    }
    if (Test-Path -LiteralPath (Join-Path $clean 'app.asar')) {
        return $clean
    }
    if (Test-Path -LiteralPath (Join-Path $clean 'resources\app.asar')) {
        return (Join-Path $clean 'resources')
    }
    return $null
}

function Get-ClientResources {
    if ($AppPath) {
        $resolved = Resolve-CustomResources $AppPath
        if ($resolved) { return @($resolved) }
        Die "指定的路径下未找到 resources\app.asar: $AppPath"
    }

    $found = @()
    $default = Join-Path $env:LOCALAPPDATA 'Programs\Antigravity\resources'
    if (Test-Path -LiteralPath (Join-Path $default 'app.asar')) { $found += $default }

    $regPaths = @(
        'HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\Software\Microsoft\Windows\CurrentVersion\Uninstall\*',
        'HKLM:\Software\WOW6432Node\Microsoft\Windows\CurrentVersion\Uninstall\*'
    )
    $props = Get-ItemProperty $regPaths -ErrorAction SilentlyContinue
    foreach ($prop in $props) {
        if (-not $prop.DisplayName -or $prop.DisplayName -notlike 'Antigravity*') { continue }
        if ($prop.DisplayName -like '*IDE*') { continue }
        try {
            $candidates = @()
            if ($prop.DisplayIcon) {
                $exe = (($prop.DisplayIcon -split ',')[0]).Trim().Trim('"')
                if ($exe) {
                    $parent = Split-Path -Parent $exe
                    if ($parent) { $candidates += (Join-Path $parent 'resources') }
                }
            }
            if ($prop.InstallLocation) {
                $loc = ([string]$prop.InstallLocation).Trim().Trim('"')
                if ($loc) { $candidates += (Join-Path $loc 'resources') }
            }
            foreach ($res in $candidates) {
                if ((Test-Path -LiteralPath (Join-Path $res 'app.asar')) -and ($found -notcontains $res)) {
                    $found += $res
                }
            }
        } catch {
            continue
        }
    }
    return $found
}

function Format-CmdArg([string]$Arg) {
    if ($null -eq $Arg) { return '""' }
    if ($Arg -notmatch '[\s"]') { return $Arg }
    return '"' + ($Arg -replace '(\\*)"', '$1$1\"' -replace '(\\+)$', '$1$1') + '"'
}

function Invoke-ProcessCaptured {
    param(
        [Parameter(Mandatory = $true)][string]$FilePath,
        [Parameter(Mandatory = $true)][string[]]$Arguments,
        [hashtable]$Environment = @{}
    )
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = $FilePath
    $psi.Arguments = (($Arguments | ForEach-Object { Format-CmdArg $_ }) -join ' ')
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $psi.RedirectStandardOutput = $true
    $psi.RedirectStandardError = $true
    $psi.StandardOutputEncoding = [System.Text.Encoding]::UTF8
    $psi.StandardErrorEncoding = [System.Text.Encoding]::UTF8
    foreach ($k in $Environment.Keys) {
        $psi.EnvironmentVariables[$k] = [string]$Environment[$k]
    }
    $proc = New-Object System.Diagnostics.Process
    $proc.StartInfo = $psi
    [void]$proc.Start()
    $stdoutTask = $proc.StandardOutput.ReadToEndAsync()
    $stderrTask = $proc.StandardError.ReadToEndAsync()
    $proc.WaitForExit()
    return [PSCustomObject]@{
        ExitCode = $proc.ExitCode
        Stdout   = $stdoutTask.GetAwaiter().GetResult().Trim()
        Stderr   = $stderrTask.GetAwaiter().GetResult().Trim()
    }
}

function Select-AsarRuntime([string]$ResourcesDir) {
    $appRoot = Split-Path -Parent $ResourcesDir
    $electronExe = Join-Path $appRoot 'Antigravity.exe'
    if (Test-Path -LiteralPath $electronExe) {
        $probe = Invoke-ProcessCaptured -FilePath $electronExe -Arguments @('-e', 'process.exit(0)') -Environment @{
            'ELECTRON_RUN_AS_NODE' = '1'
            'ELECTRON_NO_ASAR'     = '1'
        }
        if ($probe.ExitCode -eq 0) {
            return [PSCustomObject]@{
                Binary = $electronExe
                Env    = @{ 'ELECTRON_RUN_AS_NODE' = '1'; 'ELECTRON_NO_ASAR' = '1' }
            }
        }
    }

    $nodeCmd = Get-Command node -ErrorAction SilentlyContinue
    if ($nodeCmd -and $nodeCmd.Source) {
        return [PSCustomObject]@{
            Binary = $nodeCmd.Source
            Env    = @{ 'ELECTRON_NO_ASAR' = '1' }
        }
    }

    Die "未找到可用的 Node.js 运行时（Antigravity.exe / node），无法调用 core\asar-patcher.js。"
}

function Invoke-AsarEngine {
    param(
        [Parameter(Mandatory = $true)]$Runtime,
        [Parameter(Mandatory = $true)][string]$Action,
        [Parameter(Mandatory = $true)][string]$TargetAsar,
        [string]$OutputAsar = ''
    )
    $argList = @($PatcherScript, $Action, $TargetAsar)
    if ($OutputAsar) { $argList += $OutputAsar }
    return (Invoke-ProcessCaptured -FilePath $Runtime.Binary -Arguments $argList -Environment $Runtime.Env)
}

function Get-RunningClientProcesses([string]$ResourcesDir) {
    $appRoot = (Split-Path -Parent $ResourcesDir).TrimEnd('\') + '\'
    $matched = @()
    foreach ($p in (Get-Process -Name 'Antigravity' -ErrorAction SilentlyContinue)) {
        $exePath = $null
        try {
            $exePath = $p.MainModule.FileName
        } catch {
            try {
                $cim = Get-CimInstance Win32_Process -Filter "ProcessId=$($p.Id)" -ErrorAction SilentlyContinue
                if ($cim) { $exePath = $cim.ExecutablePath }
            } catch { }
        }
        if ($exePath -and $exePath.StartsWith($appRoot, [System.StringComparison]::OrdinalIgnoreCase)) {
            $matched += $p
        }
    }
    return $matched
}

function Wait-FileUnlocked([string]$FilePath, [int]$TimeoutMs = 5000) {
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    while ($sw.ElapsedMilliseconds -lt $TimeoutMs) {
        try {
            $fs = [System.IO.File]::Open($FilePath, [System.IO.FileMode]::Open, [System.IO.FileAccess]::ReadWrite, [System.IO.FileShare]::None)
            $fs.Dispose()
            return $true
        } catch {
            Start-Sleep -Milliseconds 250
        }
    }
    return $false
}

$locations = @(Get-ClientResources)
if ($locations.Count -eq 0) {
    Die "未找到 Antigravity 客户端。请确认已安装官方 Antigravity（默认位于 %LOCALAPPDATA%\Programs\Antigravity）。"
}
$ResDir      = $locations[0]
$AsarPath    = Join-Path $ResDir 'app.asar'
$BackupPath  = Join-Path $ResDir 'app.asar.stock-backup'
$UserDataDir = if ($env:AG_USER_DATA_DIR) { $env:AG_USER_DATA_DIR } else { Join-Path $env:APPDATA 'Antigravity' }
$ThemeDirs   = @(
    (Join-Path $ResDir 'custom-theme'),
    (Join-Path $UserDataDir 'custom-theme')
)
$IsSandbox = Test-IsSandboxPath $ResDir
Ok "已定位客户端：$ResDir"

$Runtime = Select-AsarRuntime -ResourcesDir $ResDir

# ---------- 停用宿主升级自动恢复 (-DisableAutoHeal) ----------
if ($DisableAutoHeal) {
    if ($IsSandbox) {
        Ok "沙盒测试模式：跳过真实计划任务停用。"
        exit 0
    }
    $removed = Remove-ScheduledTaskIfExists $AutoHealTaskName
    $removedLegacy = Remove-ScheduledTaskIfExists $LegacyAutoHealTask
    if ($removed -or $removedLegacy) {
        Ok "已停用并删除计划任务 ($AutoHealTaskName)"
    } else {
        Ok "当前未启用宿主升级自动恢复计划任务。"
    }
    exit 0
}

# ---------- 只读诊断模式 (-Doctor) ----------
if ($Doctor) {
    $appExe = Join-Path (Split-Path -Parent $ResDir) 'Antigravity.exe'
    $appVer = 'unknown'
    if (Test-Path -LiteralPath $appExe) {
        try { $appVer = (Get-Item -LiteralPath $appExe).VersionInfo.ProductVersion } catch { }
    }
    Info "Antigravity Version: $appVer | Runtime: $($Runtime.Binary)"
    $res = Invoke-AsarEngine -Runtime $Runtime -Action 'doctor' -TargetAsar $AsarPath
    if ($res.Stdout) { Write-Host $res.Stdout }
    if ($res.Stderr) { Write-Host $res.Stderr -ForegroundColor Yellow }
    exit $res.ExitCode
}

# ---------- 启用宿主升级自动恢复 (-EnableAutoHeal) ----------
if ($EnableAutoHeal) {
    if ($IsSandbox) {
        Ok "沙盒测试模式：跳过真实计划任务创建。"
        exit 0
    }
    $scriptPath = $MyInvocation.MyCommand.Path
    $taskCmd = "powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$scriptPath`" -AutoHeal"
    if ($AppPath) { $taskCmd += " -AppPath `"$AppPath`"" }
    $crt = Invoke-ProcessCaptured -FilePath 'schtasks.exe' -Arguments @('/Create', '/F', '/SC', 'ONLOGON', '/TN', $AutoHealTaskName, '/TR', $taskCmd)
    if ($crt.ExitCode -ne 0) {
        Die "创建计划任务失败：$($crt.Stderr) $($crt.Stdout)"
    }
    if (Remove-ScheduledTaskIfExists $LegacyAutoHealTask) {
        Ok "已清理旧版计划任务 ($LegacyAutoHealTask)"
    }
    Ok "已启用宿主升级自动恢复计划任务 ($AutoHealTaskName，用户登录时自动检测)"
    Write-Host "    停用命令：powershell -NoProfile -ExecutionPolicy Bypass -File install.ps1 -DisableAutoHeal" -ForegroundColor Gray
    exit 0
}

# ---------- 静默自愈模式 (-AutoHeal) ----------
if ($AutoHeal) {
    $NonInteractive = $true
    $ahCheck = Invoke-AsarEngine -Runtime $Runtime -Action 'inspect' -TargetAsar $AsarPath
    if ($ahCheck.ExitCode -eq 0 -and $ahCheck.Stdout -eq $ExpectedPatchState) {
        exit 0
    }
    if ($ahCheck.ExitCode -eq 2) {
        Warn "检测到 Antigravity 已升级且注入锚点发生变化，已安全跳过自动恢复。请运行 install.ps1 -Update 更新主题包。"
        exit 2
    }
    if ($ahCheck.ExitCode -ne 0) {
        Die "自愈检测异常：$($ahCheck.Stderr)"
    }
    Info "检测到宿主升级覆盖了 app.asar ($($ahCheck.Stdout))，正在静默恢复主题注入..."
}

# ---------- 一键在线自动更新 (-Update) ----------
if ($Update) {
    if (-not (Test-Path -LiteralPath $UpdaterScript)) {
        Die "缺少更新引擎 core\updater.js —— 请在完整的主题包目录内运行本脚本。"
    }
    Info "正在检查并拉取最新发行版 ($Repo)..."
    $chk = Invoke-ProcessCaptured -FilePath $Runtime.Binary -Arguments @($UpdaterScript, 'check', '--platform', 'windows') -Environment $Runtime.Env
    if ($chk.ExitCode -ne 0) {
        Die "检查更新失败：$($chk.Stderr)"
    }
    $chkObj = $chk.Stdout | ConvertFrom-Json
    if (-not $chkObj.hasUpdate) {
        Ok "当前已是最新版本 ($CurrentVersion)，无需更新。"
        exit 0
    }

    if ($chkObj.summary -and @($chkObj.summary).Count -gt 0) {
        Write-Host "`n本次版本更新描述 ($($chkObj.remoteTag))：" -ForegroundColor Yellow
        Write-Host ((@($chkObj.summary)) -join "`n") -ForegroundColor Gray
        Write-Host ""
    }

    Info "发现新版本 $($chkObj.remoteTag)，正在下载并校验 SHA256SUMS.txt..."
    $tmpUpdDir = Join-Path ([System.IO.Path]::GetTempPath()) ("ag-theme-update-" + [System.Guid]::NewGuid().ToString('N').Substring(0, 8))
    try {
        $dl = Invoke-ProcessCaptured -FilePath $Runtime.Binary -Arguments @($UpdaterScript, 'download', $tmpUpdDir, '--platform', 'windows') -Environment $Runtime.Env
        if ($dl.ExitCode -ne 0) {
            Die "下载或 SHA256 校验失败：$($dl.Stderr)"
        }
        $dlObj = $dl.Stdout | ConvertFrom-Json
        if (-not $dlObj.checksumVerified) {
            Die "下载包未通过 SHA256SUMS.txt 完整性校验，已终止更新。"
        }
        Ok "ZIP 完整性校验通过 (SHA256SUMS.txt)"

        $curStateRes = Invoke-AsarEngine -Runtime $Runtime -Action 'inspect' -TargetAsar $AsarPath
        $curState = if ($curStateRes.ExitCode -eq 0) { $curStateRes.Stdout } else { 'UNKNOWN' }

        if ((-not $dlObj.hookChanged) -and ($curState -eq $ExpectedPatchState)) {
            Info "Hook 无需变动，执行零中断热更新..."
            $applyArgs = @($UpdaterScript, 'apply', [string]$dlObj.stagingDir, $ScriptDir) + $ThemeDirs
            $ap = Invoke-ProcessCaptured -FilePath $Runtime.Binary -Arguments $applyArgs -Environment $Runtime.Env
            if ($ap.ExitCode -ne 0) {
                Die "热更新文件同步失败：$($ap.Stderr)"
            }
            Ok "热更新完成：$CurrentVersion -> $($dlObj.remoteTag)！在 Antigravity 窗口按 Ctrl + R 即可秒级生效。"
            exit 0
        } else {
            Info "检测到需要重新注入 app.asar (hookChanged=$($dlObj.hookChanged), state=$curState)，正在同步文件并重新安装..."
            $ap = Invoke-ProcessCaptured -FilePath $Runtime.Binary -Arguments @($UpdaterScript, 'apply', [string]$dlObj.stagingDir, $ScriptDir) -Environment $Runtime.Env
            if ($ap.ExitCode -ne 0) {
                Die "更新文件同步失败：$($ap.Stderr)"
            }
        }
    } finally {
        if (Test-Path -LiteralPath $tmpUpdDir) {
            Remove-Item -LiteralPath $tmpUpdDir -Recurse -Force -ErrorAction SilentlyContinue
        }
    }
    $reArgs = @('-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', $MyInvocation.MyCommand.Path, '-AppPath', (Split-Path -Parent $ResDir))
    if ($NonInteractive) { $reArgs += '-NonInteractive' }
    & powershell.exe @reArgs
    exit $LASTEXITCODE
}

if (-not $Uninstall) {
    foreach ($f in $Payloads) {
        if (-not (Resolve-PayloadFile $f)) {
            Die "缺少主题文件 $f —— 请确认 dist\runtime 或当前包目录完整，可先运行 pnpm build。"
        }
    }
}

$machineRoots = @($env:ProgramFiles, ${env:ProgramFiles(x86)}) | Where-Object { $_ }
$needsAdmin = $false
foreach ($root in $machineRoots) {
    $prefix = $root.TrimEnd('\') + '\'
    if ($ResDir.StartsWith($prefix, [System.StringComparison]::OrdinalIgnoreCase)) {
        $needsAdmin = $true
        break
    }
}
if ($needsAdmin) {
    $isAdmin = $false
    try {
        $identity  = [System.Security.Principal.WindowsIdentity]::GetCurrent()
        $principal = New-Object System.Security.Principal.WindowsPrincipal -ArgumentList $identity
        $isAdmin   = $principal.IsInRole([System.Security.Principal.WindowsBuiltInRole]::Administrator)
    } catch { }
    if (-not $isAdmin) {
        $launcherName = if ($Uninstall) { 'uninstall.bat' } else { 'install.bat' }
        Die "目标客户端位于受保护的 Program Files 目录（$ResDir）。请右键 $launcherName 选择「以管理员身份运行」后重试。"
    }
}

$running = @(Get-RunningClientProcesses -ResourcesDir $ResDir)
if ($running.Count -gt 0) {
    if ($NonInteractive) {
        Die "检测到 Antigravity 正在运行，非交互模式下无法自动关闭。请先关闭客户端后重试。"
    }
    Write-Host "检测到目标目录的 Antigravity 正在运行（$($running.Count) 个进程）。"
    $ans = Read-Host "自动关闭它并继续？(Y/N)"
    if ($ans -match '^[Yy]') {
        foreach ($p in $running) {
            try {
                if ($p.MainWindowHandle -ne [IntPtr]::Zero) {
                    $null = $p.CloseMainWindow()
                }
            } catch { }
        }
        $ids = @($running | ForEach-Object { $_.Id })
        $sw = [System.Diagnostics.Stopwatch]::StartNew()
        $alive = @($running)
        while ($sw.ElapsedMilliseconds -lt 5000) {
            $alive = @(Get-Process -Id $ids -ErrorAction SilentlyContinue)
            if ($alive.Count -eq 0) { break }
            Start-Sleep -Milliseconds 250
        }
        if ($alive.Count -gt 0) {
            $alive | Stop-Process -Force -ErrorAction SilentlyContinue
            $sw.Restart()
            while ($sw.ElapsedMilliseconds -lt 5000) {
                $alive = @(Get-Process -Id $ids -ErrorAction SilentlyContinue)
                if ($alive.Count -eq 0) { break }
                Start-Sleep -Milliseconds 250
            }
        }
        if ($alive.Count -gt 0) {
            foreach ($p in $alive) {
                try { & taskkill.exe /F /T /PID $p.Id 2>$null | Out-Null } catch { }
            }
            $sw.Restart()
            while ($sw.ElapsedMilliseconds -lt 3000) {
                $alive = @(Get-Process -Id $ids -ErrorAction SilentlyContinue)
                if ($alive.Count -eq 0) { break }
                Start-Sleep -Milliseconds 250
            }
        }
        $stillRunning = @(Get-RunningClientProcesses -ResourcesDir $ResDir)
        if ($stillRunning.Count -gt 0) {
            Die "关闭 Antigravity 失败（进程仍在运行，PID: $(($stillRunning | ForEach-Object { $_.Id }) -join ', ')），可能需要管理员权限或请手动关闭后重试。"
        }
        if (-not (Wait-FileUnlocked -FilePath $AsarPath -TimeoutMs 5000)) {
            Die "app.asar 文件句柄尚未释放，请稍后或手动关闭相关进程后重试。"
        }
        Ok "已关闭 Antigravity"
    } else {
        Die "请手动关闭 Antigravity 后重新运行本脚本。"
    }
}

# ---------- 卸载流程 ----------
if ($Uninstall) {
    $curInspect = Invoke-AsarEngine -Runtime $Runtime -Action 'inspect' -TargetAsar $AsarPath
    $asarState  = if ($curInspect.ExitCode -eq 0) { $curInspect.Stdout } else { 'ERROR' }

    if (Test-Path -LiteralPath $BackupPath) {
        $bakInspect = Invoke-AsarEngine -Runtime $Runtime -Action 'inspect' -TargetAsar $BackupPath
        $bakState   = if ($bakInspect.ExitCode -eq 0) { $bakInspect.Stdout } else { 'ERROR' }

        if ($asarState -eq 'CLEAN') {
            Warn "当前 app.asar 未检测到主题钩子（客户端可能已自动升级）。"
            Write-Host "    为避免把新版客户端回滚成旧版，已跳过还原，仅清理主题文件与旧备份。" -ForegroundColor Yellow
            Remove-Item -LiteralPath $BackupPath -Force -ErrorAction SilentlyContinue
        } elseif ($bakState -eq 'CLEAN') {
            $tmpRestore = "$AsarPath.restore.tmp"
            try {
                Copy-Item -LiteralPath $BackupPath -Destination $tmpRestore -Force
                $expectedHash = Get-Sha256Hex $BackupPath
                $vClean = Invoke-AsarEngine -Runtime $Runtime -Action 'verify-clean' -TargetAsar $tmpRestore
                if ($vClean.ExitCode -ne 0) {
                    throw "备份文件校验异常：$($vClean.Stderr)"
                }
                try {
                    [System.IO.File]::Replace($tmpRestore, $AsarPath, $null, $true)
                } catch {
                    Move-Item -LiteralPath $tmpRestore -Destination $AsarPath -Force
                }
                $restoredHash = Get-Sha256Hex $AsarPath
                if ($restoredHash -ne $expectedHash) {
                    throw "还原后 app.asar 哈希校验失败"
                }
                Remove-Item -LiteralPath $BackupPath -Force
                Ok "已还原原生 app.asar 并清理备份文件（app.asar.stock-backup）"
            } catch {
                if (Test-Path -LiteralPath $tmpRestore) { Remove-Item -LiteralPath $tmpRestore -Force -ErrorAction SilentlyContinue }
                Die "还原原生 app.asar 失败：$($_.Exception.Message)"
            }
        } else {
            Warn "备份文件含钩子或状态异常，正在通过逆向剥离引擎直接还原原厂 app.asar..."
            $tmpRestore = "$AsarPath.restore.tmp"
            $stripRes = Invoke-AsarEngine -Runtime $Runtime -Action 'strip' -TargetAsar $AsarPath -OutputAsar $tmpRestore
            if ($stripRes.ExitCode -ne 0) {
                if (Test-Path -LiteralPath $tmpRestore) { Remove-Item -LiteralPath $tmpRestore -Force -ErrorAction SilentlyContinue }
                Die "逆向剥离失败：$($stripRes.Stderr)"
            }
            try {
                [System.IO.File]::Replace($tmpRestore, $AsarPath, $null, $true)
            } catch {
                Move-Item -LiteralPath $tmpRestore -Destination $AsarPath -Force
            }
            Remove-Item -LiteralPath $BackupPath -Force -ErrorAction SilentlyContinue
            Ok "已通过逆向剥离引擎还原原厂 app.asar"
        }
    } else {
        if ($asarState -like 'PATCHED_*') {
            Info "未找到 app.asar.stock-backup，正在通过逆向剥离自愈引擎无损还原原厂 app.asar..."
            $tmpRestore = "$AsarPath.restore.tmp"
            $stripRes = Invoke-AsarEngine -Runtime $Runtime -Action 'strip' -TargetAsar $AsarPath -OutputAsar $tmpRestore
            if ($stripRes.ExitCode -ne 0) {
                if (Test-Path -LiteralPath $tmpRestore) { Remove-Item -LiteralPath $tmpRestore -Force -ErrorAction SilentlyContinue }
                Die "逆向剥离失败：$($stripRes.Stderr)"
            }
            try {
                [System.IO.File]::Replace($tmpRestore, $AsarPath, $null, $true)
            } catch {
                Move-Item -LiteralPath $tmpRestore -Destination $AsarPath -Force
            }
            Ok "已无损剥离主题钩子并恢复原厂 app.asar"
        } else {
            Ok "当前 app.asar 已是原厂纯净状态"
        }
    }

    foreach ($d in $ThemeDirs) {
        if (Test-Path -LiteralPath $d) { Remove-Item -LiteralPath $d -Recurse -Force; Ok "已删除 $d" }
    }
    if (-not $IsSandbox) {
        if (Remove-ScheduledTaskIfExists $AutoHealTaskName) {
            Ok "已停用并删除计划任务 ($AutoHealTaskName)"
        }
        if (Remove-ScheduledTaskIfExists $LegacyAutoHealTask) {
            Ok "已清理旧版计划任务 ($LegacyAutoHealTask)"
        }
    }
    Write-Host "`n卸载完成。重启 Antigravity 即恢复原版外观。"
    exit 0
}

# ---------- 安装流程：1) 预检 app.asar ----------
$inspectRes = Invoke-AsarEngine -Runtime $Runtime -Action 'inspect' -TargetAsar $AsarPath
if ($inspectRes.ExitCode -ne 0) {
    Die "解析 app.asar 失败或未找到注入锚点（可运行 install.ps1 -Doctor 查看诊断信息）：$($inspectRes.Stderr)"
}
$asarState = $inspectRes.Stdout

# ---------- 安装流程：2) 原厂备份与自愈 ----------
if ($asarState -eq 'CLEAN') {
    if (Test-Path -LiteralPath $BackupPath) {
        $currentHash = Get-Sha256Hex $AsarPath
        $backupHash  = Get-Sha256Hex $BackupPath
        if ($currentHash -ne $backupHash) {
            Copy-Item -LiteralPath $AsarPath -Destination $BackupPath -Force
            Ok "检测到客户端版本已升级，已自动更新原生备份：app.asar.stock-backup"
        }
    } else {
        Copy-Item -LiteralPath $AsarPath -Destination $BackupPath
        Ok "已备份原版 app.asar -> app.asar.stock-backup"
    }
} else {
    $needHeal = $false
    if (-not (Test-Path -LiteralPath $BackupPath)) {
        $needHeal = $true
    } else {
        $bakCheck = Invoke-AsarEngine -Runtime $Runtime -Action 'inspect' -TargetAsar $BackupPath
        if ($bakCheck.ExitCode -ne 0 -or $bakCheck.Stdout -ne 'CLEAN') {
            $needHeal = $true
        }
    }
    if ($needHeal) {
        Info "检测到 app.asar 已含钩子但原生备份缺失，正在通过逆向剥离引擎自愈重建备份..."
        $tmpStock = "$BackupPath.tmp"
        $healRes = Invoke-AsarEngine -Runtime $Runtime -Action 'strip' -TargetAsar $AsarPath -OutputAsar $tmpStock
        if ($healRes.ExitCode -eq 0) {
            Move-Item -LiteralPath $tmpStock -Destination $BackupPath -Force
            Ok "已重建原厂纯净备份 -> app.asar.stock-backup"
        } else {
            if (Test-Path -LiteralPath $tmpStock) { Remove-Item -LiteralPath $tmpStock -Force -ErrorAction SilentlyContinue }
            Warn "重建原厂备份跳过（$($healRes.Stderr)），继续执行主题更新。"
        }
    }
}

# ---------- 安装流程：3) 分发主题文件 ----------
foreach ($d in $ThemeDirs) {
    if (-not (Test-Path -LiteralPath $d)) { New-Item -ItemType Directory -Path $d -Force | Out-Null }
    foreach ($f in $Payloads) {
        $srcFile = Resolve-PayloadFile $f
        if (-not $srcFile) {
            Die "缺少主题文件 $f —— 无法复制载荷。"
        }
        Copy-Item -LiteralPath $srcFile -Destination (Join-Path $d $f) -Force
    }
}
Ok ("主题文件已安装到 {0} 个位置" -f $ThemeDirs.Count)

if (-not $IsSandbox) {
    if (Remove-ScheduledTaskIfExists $LegacyAutoHealTask) {
        Ok "已清理旧版计划任务 ($LegacyAutoHealTask)"
    }
}

# ---------- 安装流程：4) 注入跨平台 Hook ----------
$TmpPath = "$AsarPath.tmp"
if (Test-Path -LiteralPath $TmpPath) { Remove-Item -LiteralPath $TmpPath -Force }

$asarTouched = $false
try {
    $injectRes = Invoke-AsarEngine -Runtime $Runtime -Action 'inject' -TargetAsar $AsarPath -OutputAsar $TmpPath
    if ($injectRes.ExitCode -ne 0) {
        throw "注入构建失败：$($injectRes.Stderr)"
    }
    $verifyTmp = Invoke-AsarEngine -Runtime $Runtime -Action 'verify-patched' -TargetAsar $TmpPath
    if ($verifyTmp.ExitCode -ne 0) {
        throw "临时文件完整性校验失败：$($verifyTmp.Stderr)"
    }
    $asarTouched = $true
    try {
        [System.IO.File]::Replace($TmpPath, $AsarPath, $null, $true)
    } catch {
        Move-Item -LiteralPath $TmpPath -Destination $AsarPath -Force
    }
    $deltaBytes = $injectRes.Stdout -replace '^INJECT_OK:', ''
    Ok "app.asar 补丁完成（净增 $deltaBytes 字节，钩子版本 $HookVersion）"
} catch {
    if ($asarTouched -and (Test-Path -LiteralPath $BackupPath)) {
        try {
            Copy-Item -LiteralPath $BackupPath -Destination $AsarPath -Force
            Warn "已从 app.asar.stock-backup 自动回滚 app.asar。"
        } catch {
            Write-Host "[X] 自动回滚失败，请手动用 app.asar.stock-backup 覆盖 app.asar。" -ForegroundColor Red
        }
    }
    Die "写入或校验 app.asar 失败：$($_.Exception.Message)"
} finally {
    if (Test-Path -LiteralPath $TmpPath) {
        Remove-Item -LiteralPath $TmpPath -Force -ErrorAction SilentlyContinue
    }
}

# ---------- 安装流程：5) 最终线上只读自检 ----------
$finalVerify = Invoke-AsarEngine -Runtime $Runtime -Action 'verify-patched' -TargetAsar $AsarPath
if ($finalVerify.ExitCode -ne 0) {
    if (Test-Path -LiteralPath $BackupPath) {
        Copy-Item -LiteralPath $BackupPath -Destination $AsarPath -Force -ErrorAction SilentlyContinue
    }
    Die "自检失败：$($finalVerify.Stderr)（已尝试回滚，可运行 uninstall.bat 后重试）"
}
Ok "自检通过：钩子已注入且整包与分块 integrity 一致"

Write-Host ""
Write-Host "================ 安装完成 ================" -ForegroundColor Cyan
Write-Host " 启动 Antigravity，点击右上角主题按钮即可切换 14 款极光主题（7 大色系 × Dark/Light）与原版外观。"
Write-Host " 自愈守护：powershell -ExecutionPolicy Bypass -File install.ps1 -EnableAutoHeal"
Write-Host " 卸载：powershell -ExecutionPolicy Bypass -File install.ps1 -Uninstall"
Write-Host " 诊断：powershell -ExecutionPolicy Bypass -File install.ps1 -Doctor"
Write-Host "=========================================="

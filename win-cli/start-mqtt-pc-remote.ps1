$myLog = "$PSScriptRoot\mqtt-pc-remote.log"
$stdErrLog = "$PSScriptRoot\stderr.log"
$stdOutLog = "$PSScriptRoot\stdout.log"
$pidFile = "$PSScriptRoot\pid.log"

# Make sure it's not running already
if (Test-Path $pidFile) {
    $procid = Get-Content $pidFile
    $p = Get-Process -Id $procid -ErrorAction SilentlyContinue
    if ($p) {
        $a = Read-Host "Process is running already. Do you want to stop it? [y/n]"
        if ($a -like "y") {
            Stop-Process -Id $procid
        }
        exit
    }
}

# Since "std*" siles will be overwritten we append the content to the main file
@($stdErrLog, $stdOutLog) | % {
    if (Test-Path $_) {
        Get-Content $_ | Out-File $myLog -Append
        Remove-Item -Path $_
    }
}

# Start process with hidden window
$p = Start-Process "C:\Program Files\nodejs\node.exe" `
    -ArgumentList "index.js" `
    -WorkingDirectory "D:\Projects\mqtt-pc-remote" `
    -WindowStyle Hidden `
    -RedirectStandardOutput $stdOutLog `
    -RedirectStandardError $stdErrLog `
    -PassThru

# Log process ID
$p.Id | Set-Content -Path $pidFile -NoNewLine
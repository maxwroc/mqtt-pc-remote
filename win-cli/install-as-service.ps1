
# Dummy service without registration in ServiceControlManager (errors when try to start but works)
New-Service `
    -Name "MqttPcRemote" `
    -DisplayName "MQTT client for PC remote control" `
    -BinaryPathName "C:\Windows\System32\cmd.exe /k $PSScriptRoot\start.cmd" `
    -Description "Allows to shutdown PC via MQTT message"
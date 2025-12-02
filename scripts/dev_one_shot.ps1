$ErrorActionPreference = 'Stop'
$mobileApp = Split-Path $PSScriptRoot -Parent
$javaRoot = 'D:\Program Files\Java'
$jdk = Get-ChildItem -Directory $javaRoot | Where-Object {$_.Name -like 'jdk-*'} | Sort-Object Name -Descending | Select-Object -First 1
if ($jdk) { $env:JAVA_HOME = $jdk.FullName } else { $env:JAVA_HOME = $javaRoot }
$env:ANDROID_HOME = 'D:\AndroidSDK'
$env:ANDROID_SDK_ROOT = 'D:\AndroidSDK'
Push-Location (Join-Path $mobileApp 'android')
./gradlew.bat clean app:assembleDebug --stacktrace --info
Pop-Location
& 'D:\AndroidSDK\platform-tools\adb.exe' start-server
& 'D:\AndroidSDK\platform-tools\adb.exe' devices
& 'D:\AndroidSDK\platform-tools\adb.exe' install -r (Join-Path $mobileApp 'android\app\build\outputs\apk\debug\app-debug.apk')
Start-Process -FilePath 'cmd.exe' -ArgumentList '/c','npx expo start --dev-client --port 8081' -WorkingDirectory $mobileApp
Start-Sleep -Seconds 5
& 'D:\AndroidSDK\platform-tools\adb.exe' reverse tcp:8081 tcp:8081
& 'D:\AndroidSDK\platform-tools\adb.exe' shell am start -a android.intent.action.VIEW -d "exp+yalla-chant://expo-development-client/?url=http%3A%2F%2F10.0.2.2%3A8081"

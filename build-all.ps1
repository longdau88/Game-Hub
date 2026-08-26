Write-Host "Bắt đầu quy trình Build Đa Nền Tảng..."
Write-Host "================================================"

Set-Location frontend

# Build Next.js (Dành cho PC) & Sync Capacitor
Write-Host "[1/3] Build Next.js & Đồng bộ Capacitor..."
npm run build
npx cap sync

# --- ANDROID APK ---
Write-Host ""
Write-Host "[2/3] Building Android APK..."
Set-Location android
./gradlew assembleDebug
Set-Location ..

New-Item -ItemType Directory -Force -Path "../build_outputs/android" | Out-Null
Copy-Item "android/app/build/outputs/apk/debug/app-debug.apk" `
    -Destination "../build_outputs/android/GameHub-v0.1.0-debug.apk" -Force
Write-Host "OK Android APK -> build_outputs/android/GameHub-v0.1.0-debug.apk"

# --- WINDOWS .EXE ---
Write-Host ""
Write-Host "[3/3] Building Windows Installer..."
npm run electron:build

New-Item -ItemType Directory -Force -Path "../build_outputs/windows" | Out-Null
$exeFile = Get-ChildItem "electron-dist" -Filter "*.exe" | Where-Object { $_.Name -like "*Setup*" -or $_.Name -like "*Install*" } | Select-Object -First 1
if ($exeFile) {
    Copy-Item $exeFile.FullName -Destination "../build_outputs/windows/GameHub-Setup-v0.1.0.exe" -Force
    Write-Host "OK Windows Installer -> build_outputs/windows/GameHub-Setup-v0.1.0.exe"
} else {
    $exeFile = Get-ChildItem "electron-dist" -Filter "*.exe" | Select-Object -First 1
    if ($exeFile) {
        Copy-Item $exeFile.FullName -Destination "../build_outputs/windows/GameHub-Setup-v0.1.0.exe" -Force
        Write-Host "OK Windows Installer -> build_outputs/windows/GameHub-Setup-v0.1.0.exe"
    } else {
        Write-Host "WARN: Khong tim thay file .exe trong electron-dist/"
    }
}

Set-Location ..

Write-Host ""
Write-Host "================================================"
Write-Host "XONG! Ket qua build:"
Write-Host "  - Android : build_outputs/android/GameHub-v0.1.0-debug.apk"
Write-Host "  - Windows : build_outputs/windows/GameHub-Setup-v0.1.0.exe"
Write-Host "================================================"

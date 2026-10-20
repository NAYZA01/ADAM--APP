@echo off
setlocal
cd /d "%~dp0"

echo ============================================
echo Lingo Frekans - Android APK Build
 echo ============================================

where node >nul 2>nul
if errorlevel 1 (
  echo [HATA] Node.js bulunamadi. Node.js 20.19.4+ kurun.
  pause
  exit /b 1
)

for /f "delims=" %%v in ('node -p "process.versions.node"') do set NODE_VERSION=%%v
 echo Node.js: %NODE_VERSION%

if not exist node_modules (
  echo [1/4] npm paketleri kuruluyor...
  call npm ci
  if errorlevel 1 goto :error
) else (
  echo [1/4] node_modules mevcut, npm ci atlaniyor.
)

echo [2/4] Expo bagimliliklari kontrol ediliyor...
call npx expo install --check
if errorlevel 1 (
  echo [UYARI] Bagimlilik kontrolu uyumsuzluk bildirdi.
  echo npx expo install --fix komutunu calistirip tekrar deneyin.
)

echo [3/4] Android native proje temiz prebuild ile yenileniyor...
call npx expo prebuild --platform android --clean
if errorlevel 1 goto :error

echo [4/4] Release APK olusturuluyor...
call .\android\gradlew.bat :app:assembleRelease
if errorlevel 1 goto :error

echo.
echo ============================================
echo BASARILI
 echo APK: android\app\build\outputs\apk\release\app-release.apk
 echo ============================================
pause
exit /b 0

:error
echo.
echo ============================================
echo BUILD BASARISIZ
 echo Yukaridaki hata mesajini kontrol edin.
echo ============================================
pause
exit /b 1

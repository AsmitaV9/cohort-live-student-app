$ErrorActionPreference="Stop"
Write-Host "Installing Cohort Live Student dependencies..." -ForegroundColor Cyan
npm.cmd install
Write-Host "Rebuilding Android native project..." -ForegroundColor Cyan
npx.cmd expo prebuild --platform android --clean
$java="C:\Program Files\Eclipse Adoptium\jdk-17.0.20.101-hotspot"
if(Test-Path $java){$env:JAVA_HOME=$java;$env:Path="$env:JAVA_HOME\bin;$env:Path"}
if(Test-Path "android\local.properties"){Remove-Item "android\local.properties" -Force}
$sdk=Join-Path $env:LOCALAPPDATA "Android\Sdk"
"sdk.dir=$($sdk.Replace('\','\\'))" | Set-Content "android\local.properties"
npx.cmd expo run:android

$ErrorActionPreference='Stop'
$target = Read-Host 'Paste the full path of your current student app folder'
if (!(Test-Path $target)) { throw "Folder not found: $target" }
Copy-Item "$PSScriptRoot\app\(app)\meeting.tsx" "$target\app\(app)\meeting.tsx" -Force
Copy-Item "$PSScriptRoot\app\(app)\assignments.tsx" "$target\app\(app)\assignments.tsx" -Force
Copy-Item "$PSScriptRoot\app.json" "$target\app.json" -Force
Write-Host 'Student source files updated successfully. Your existing .env, node_modules and android folder were not touched.' -ForegroundColor Green

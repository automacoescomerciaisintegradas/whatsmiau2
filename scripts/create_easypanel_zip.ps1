
# Create directory for deployment artifacts
$deployDir = "deploy_easypanel_temp"
if (Test-Path $deployDir) {
    Remove-Item -Path $deployDir -Recurse -Force
}
New-Item -ItemType Directory -Path $deployDir

# Copy Source Files
Write-Host "Copying core files..."
Copy-Item -Path "package.json" -Destination $deployDir
Copy-Item -Path "package-lock.json" -Destination $deployDir
Copy-Item -Path "server.js" -Destination $deployDir
Copy-Item -Path ".env" -Destination $deployDir

# Copy Directories
Write-Host "Copying directories..."
Copy-Item -Path "public" -Destination $deployDir -Recurse
Copy-Item -Path "services" -Destination $deployDir -Recurse
if (Test-Path "data") {
    Copy-Item -Path "data" -Destination $deployDir -Recurse
}

# Setup Dockerfile for Node.js (EasyPanel uses 'Dockerfile' by default)
# We use Dockerfile.web as the base since we are deploying the Node frontend/dashboard
Write-Host "Configuring Dockerfile..."
$dockerContent = Get-Content "Dockerfile.web"
# Update Port to 3000 to match EasyPanel default/user request
$dockerContent = $dockerContent -replace "ENV PORT=3002", "ENV PORT=3000"
$dockerContent = $dockerContent -replace "EXPOSE 3002", "EXPOSE 3000"
$dockerContent | Set-Content "$deployDir/Dockerfile"

# Create Zip
Write-Host "Creating zip archive..."
$zipName = "whatsmiau2-production-deploy.zip"
if (Test-Path $zipName) {
    Remove-Item $zipName
}
Compress-Archive -Path "$deployDir/*" -DestinationPath $zipName

# Cleanup
Remove-Item -Path $deployDir -Recurse -Force

Write-Host "--------------------------------------------------------"
Write-Host "Deploy Package Created: $zipName"
Write-Host "Ready for upload to EasyPanel (Project Source -> Upload)."
Write-Host "Ensure the app listens on Port 3000 (configured in Dockerfile)."
Write-Host "--------------------------------------------------------"

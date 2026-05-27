# Deploy-Utils.ps1 - Utility module for deployment scripts

# Enforce strict mode for all scripts that import this module
Set-StrictMode -Version Latest

#--------------------------
# Logging helper
#--------------------------
function Write-Log {
    param (
        [Parameter(Mandatory=$true)][string]$Message,
        [ValidateSet('Info','Warning','Error')][string]$Level = 'Info'
    )
    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $color = switch ($Level) {
        'Info'    { 'Cyan' }
        'Warning' { 'Yellow' }
        'Error'   { 'Red' }
    }
    $logLine = "[$timestamp] [$Level] $Message"
    # Write to console with colour
    Write-Host $logLine -ForegroundColor $color
    # Append to persistent log file
    $logDir = Join-Path $PSScriptRoot "logs"
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
    $logFile = Join-Path $logDir "deploy_$(Get-Date -Format 'yyyyMMdd').log"
    Add-Content -Path $logFile -Value $logLine
}

#--------------------------
# Ensure Posh-SSH module is available
#--------------------------
function Ensure-PoshSSH {
    if (-not (Get-Module -ListAvailable -Name Posh-SSH)) {
        Write-Log -Message "Posh-SSH module not found. Attempting installation..." -Level Info
        try {
            Install-Module -Name Posh-SSH -Scope CurrentUser -Force -ErrorAction Stop
            Write-Log -Message "Posh-SSH installed successfully." -Level Info
        } catch {
            Write-Log -Message "Failed to install Posh-SSH: $_" -Level Error
            throw "Posh-SSH required but could not be installed."
        }
    }
    Import-Module Posh-SSH -ErrorAction Stop
}

#--------------------------
# Validate required files exist before deployment
#--------------------------
function Validate-FileList {
    param (
        [Parameter(Mandatory=$true)][array]$FileArray
    )
    $missing = @()
    foreach ($item in $FileArray) {
        $localPath = $item.Local
        if (-not (Test-Path $localPath)) {
            $missing += $item
            Write-Log -Message "Missing required file: $localPath" -Level Warning
        } else {
            Write-Log -Message "Found required file: $localPath" -Level Info
        }
    }
    if ($missing.Count -gt 0) {
        throw "Validation failed: $($missing.Count) required files missing."
    }
}

#--------------------------
# Obtain SSH credentials (interactive or key based)
#--------------------------
function Get-SSHCredential {
    param (
        [string]$User,
        [string]$Host,
        [string]$KeyPath = $null
    )
    if ($KeyPath -and (Test-Path $KeyPath)) {
        Write-Log -Message "Using SSH key file: $KeyPath" -Level Info
        $secureKey = Get-Content $KeyPath -Raw | ConvertTo-SecureString -AsPlainText -Force
        $credential = New-Object System.Management.Automation.PSCredential($User, $secureKey)
        return $credential
    } else {
        Write-Log -Message "Prompting for SSH password for $User@$Host" -Level Info
        return Get-Credential -Message "Enter SSH password for $User@$Host"
    }
}

#--------------------------
# Cleanup SSH/SFTP sessions safely
#--------------------------
function Cleanup-Session {
    param (
        [Parameter(Mandatory=$true)]$SSHSession,
        [Parameter()]$SFTPSession = $null
    )
    if ($SFTPSession) {
        try { Remove-SFTPSession -SessionId $SFTPSession.SessionId -ErrorAction SilentlyContinue } catch {}
    }
    if ($SSHSession) {
        try { Remove-SSHSession -SessionId $SSHSession.SessionId -ErrorAction SilentlyContinue } catch {}
    }
    Write-Log -Message "SSH/SFTP sessions cleaned up." -Level Info
}

# Export functions for import
Export-ModuleMember -Function Write-Log, Ensure-PoshSSH, Validate-FileList, Get-SSHCredential, Cleanup-Session

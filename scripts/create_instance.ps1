$headers = @{ "apikey" = "your-api-key-here" }
$body = @{ "instanceName" = "minha-instancia" }
try {
    $response = Invoke-RestMethod -Uri "http://localhost:8085/v1/instance/create" -Method Post -Headers $headers -Body ($body | ConvertTo-Json) -ContentType "application/json"
    Write-Host "Success: $($response | ConvertTo-Json)"
}
catch {
    Write-Host "Error: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Response Body: $($reader.ReadToEnd())"
    }
}

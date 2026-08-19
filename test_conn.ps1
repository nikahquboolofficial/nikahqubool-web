$cs1 = "Server=115.124.106.149;Database=pakiza-rishte;User Id=pakiza-rishte;Password=Mylovemanshu@0256;Encrypt=False;TrustServerCertificate=True;Timeout=15;"
$cs2 = "Server=115.124.106.149,1433;Database=pakiza-rishte;User Id=pakiza-rishte;Password=Mylovemanshu@0256;Encrypt=False;TrustServerCertificate=True;Timeout=15;"

Write-Host "--- Test 1 (115.124.106.149 with Encrypt=False) ---"
try {
    $conn = New-Object System.Data.SqlClient.SqlConnection($cs1)
    $conn.Open()
    Write-Host "✅ SUCCESS: CONNECTED TO SQL SERVER 115.124.106.149!" -ForegroundColor Green
    $conn.Close()
} catch {
    Write-Host "❌ ERROR 1: $_" -ForegroundColor Red
}

Write-Host "--- Test 2 (115.124.106.149,1433 with Encrypt=False) ---"
try {
    $conn = New-Object System.Data.SqlClient.SqlConnection($cs2)
    $conn.Open()
    Write-Host "✅ SUCCESS: CONNECTED TO SQL SERVER 115.124.106.149,1433!" -ForegroundColor Green
    $conn.Close()
} catch {
    Write-Host "❌ ERROR 2: $_" -ForegroundColor Red
}

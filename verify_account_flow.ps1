$email = "testuser_bank_$(Get-Random)@example.com"
$password = "password123"
$name = "Bank Test User"

Write-Host "Registering user $email..."
$registerUrl = "http://localhost:3000/api/auth/register"
$registerBody = @{
    email = $email
    password = $password
    name = $name
} | ConvertTo-Json

try {
    $registerResponse = Invoke-RestMethod -Uri $registerUrl -Method Post -ContentType "application/json" -Body $registerBody
    Write-Host "User Registered Successfully!"
    Write-Host "User ID: $($registerResponse.user._id)"
    Write-Host "Token: $($registerResponse.token)"

    $token = $registerResponse.token

    Write-Host "Creating Bank Account..."
    $accountUrl = "http://localhost:3000/api/account"
    $headers = @{
        Authorization = "Bearer $token"
    }
    
    # Account creation doesn't need body based on controller (uses defaults), but let's check controller again.
    # account.controller.js: const account = await accountModel.create({ userId: user._id })
    # It takes userId from req.user (from token). 
    # It doesn't seem to read req.body for status or currency?
    # Let's check account.controller.js again.
    
    $accountResponse = Invoke-RestMethod -Uri $accountUrl -Method Post -Headers $headers -ContentType "application/json"
    Write-Host "Bank Account Created Successfully!"
    Write-Host "Account: $($accountResponse.account | ConvertTo-Json -Depth 5)"

} catch {
    Write-Host "Error: $_"
    Write-Host "Exception Message: $($_.Exception.Message)"
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        Write-Host "Server Response: $($reader.ReadToEnd())"
    }
    exit 1
}

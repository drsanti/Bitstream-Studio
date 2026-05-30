TESAIOT_DIGITAL_TWIN_APIKEY:
pdms_hjPQR0j4RQErymgwFutEmtPAhjPQR0j4

TESAIOT_BASE_URL:
https://admin.tesaiot.com

---

Host:
~~mqtt.tesaiot.com~~
mqtt.tesaiot.dev

Port:
8085

MQTT Credentials

Username (Device ID)
~~e91ba637-e32f-4eb8-8551-b0505ec43a02~~
e91ba637-e32f-4eb8-8551-b0505ec43a02

Password
~~j$FQaXceqBra8xYK1lLo!Aw%Ih#K9R@A~~
G02N4b5mZS#5O@9&

HTTPs API Credentials
Device ID
e91ba637-e32f-4eb8-8551-b0505ec43a02

API Key
tesa_dak_e91ba637_256c8c7bc50e4d49eb15b57d161e4212

# HTTPs API Credentials for Device: santi-testing1

Device ID: e91ba637-e32f-4eb8-8551-b0505ec43a02
API Key: tesa_dak_e91ba637_256c8c7bc50e4d49eb15b57d161e4212

API Endpoint: https://your-api-endpoint/api/v1/devices/e91ba637-e32f-4eb8-8551-b0505ec43a02/telemetry
Authentication: Bearer Token (use API key as bearer token)

Example curl command:
curl -X POST https://your-api-endpoint/api/v1/devices/e91ba637-e32f-4eb8-8551-b0505ec43a02/telemetry \
 -H "Authorization: Bearer tesa_dak_e91ba637_256c8c7bc50e4d49eb15b57d161e4212" \
 -H "Content-Type: application/json" \
 -d '{"temperature": 25.5, "humidity": 60}'

Note: This API key is shown only once during device creation.
Please store it securely.

---

C:\Windows\System32>certutil -addstore -f Root "D:\CODE\2026\ternion-t3d\t3d-extension\docs\ca-chain.pem"
Root "Trusted Root Certification Authorities"
Certificate "TESAIoT Intermediate CA" added to store.
CertUtil: -addstore command completed successfully.

C:\Windows\System32>certutil -addstore -f CA "D:\CODE\2026\ternion-t3d\t3d-extension\docs\ca-chain.pem"
CA "Intermediate Certification Authorities"
Certificate "TESAIoT Intermediate CA" added to store.
CertUtil: -addstore command completed successfully.

Get-ChildItem Cert:\LocalMachine\Root | Where-Object { $_.Subject -match "TESAIoT" -or $_.Issuer -match "TESAIoT" } | Select-Object Subject,Thumbprint,NotAfter | Format-Table -AutoSize

Get-ChildItem Cert:\LocalMachine\CA | Where-Object { $_.Subject -match "TESAIoT" -or $_.Issuer -match "TESAIoT" } | Select-Object Subject,Thumbprint,NotAfter | Format-Table -AutoSize

## Ternion webview assets

Quick Action **Free GitHub assets loader** opens the free assets dashboard. Command Palette **Configure Base URL** (`ternion-digital-twin.configBaseUrl`) still sets `ternion-base-url` if you prefer that path.

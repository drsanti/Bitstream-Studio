TESA IoT Platform — Server‑TLS Complete Bundle

Files included:
- ca-chain.pem — CA chain for TLS validation (intermediate + root)
- mqtt-credentials.txt — MQTT username/password and broker address
- https-api-credentials.txt — HTTPS endpoint and API key
- endpoints.json — Service endpoint configuration
- mqtt_client_config.h — PSoC/embedded MQTT client configuration header
- telemetry/ — Auto-generated C code for telemetry serialization
  - data_telemetry.h — Struct definitions and function prototypes
  - data_telemetry.c — JSON serialization implementation
  - README.md — Usage documentation

Notes:
- Passwords/API keys may be shown only once. Use reset/regenerate in Credentials tab if needed.
- Broker: mqtts://mqtt.tesaiot.com:8884 (Server‑TLS)
- mqtt_client_config.h is pre-configured for Server-TLS mode (password-based authentication)
- telemetry/ contains portable C code generated from your device's Data Schema

Evidence & Logging:
- Bundle generated at (UTC): 2026-03-18T12:44:02.554884Z
- Requested by: santi.inc.kmutt@gmail.com (role: organization_admin, org: bdh-corporation)
- Include Password: false
- Include API Key: false

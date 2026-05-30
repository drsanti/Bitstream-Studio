TESA IoT Platform — MQTT over QUIC Server-TLS Bundle
========================================================

Files included:
- ca-chain.pem — CA certificate chain for server verification (intermediate + root)
- mqtt-quic-config.json — MQTT-QUIC connection configuration
- endpoints.json — MQTT-QUIC endpoint information
- README-MQTT-QUIC.txt — This file (setup instructions)

Connection Details:
-------------------
Endpoint: mqtts://mqtt.tesaiot.com:14567
Transport: QUIC (UDP-based)
TLS Version: 1.3 (mandatory, built into QUIC)
Authentication: Username/Password (Server-TLS mode)

Device Credentials:
-------------------
Username (Device ID): e91ba637-e32f-4eb8-8551-b0505ec43a02
Password: <Use password reset in Credentials tab>

Important Notes:
----------------
1. MQTT over QUIC uses UDP port 14567, not TCP
2. TLS 1.3 is mandatory and built into QUIC protocol (RFC 9001)
3. This is Server-TLS mode (NOT mTLS):
   - Server presents certificate (verified by ca-chain.pem)
   - Client authenticates with username/password
   - No client certificate required
4. For mTLS authentication, use MQTTS bundle (port 8883) instead

Performance Benefits:
---------------------
- 50% faster initial connection (1-RTT vs 2-RTT)
- 90% faster reconnection (0-RTT session resumption)
- Connection migration (survives IP address changes)
- Better performance on weak/intermittent networks
- No head-of-line blocking (independent stream multiplexing)

Use Cases:
----------
- Internet of Vehicles (IoV) — seamless connectivity while moving
- Mobile IoT devices — weak/intermittent cellular networks
- Low-latency applications — real-time control systems
- High-density deployments — resource-efficient connections

Network Requirements:
---------------------
- Firewall must allow UDP port 14567 outbound
- Some corporate firewalls may block UDP traffic
- If QUIC unavailable, use MQTTS (TCP port 8884) as alternative

Security:
---------
- TLS 1.3 encryption (mandatory)
- Server identity verified via CA certificate chain
- Credentials transmitted securely
- Password should be stored securely on device (encrypted storage recommended)

Setup Instructions:
-------------------

1. Extract this bundle to your device
2. Embed ca-chain.pem in your device firmware
3. Use mqtt-quic-config.json for connection parameters
4. Implement MQTT client with QUIC support (e.g., NanoSDK, Paho MQTT-QUIC)

Example Client Libraries:
-------------------------
- C/C++: NanoSDK (https://github.com/nanomq/NanoSDK)
- Python: paho-mqtt with QUIC support
- Rust: rumqtt with QUIC backend
- Go: paho.mqtt.golang with QUIC transport

Code Examples:
--------------
See tutorial/examples/mqtt_quic-connectivity/ for:
- C/C++ example using NanoSDK
- Python example using paho-mqtt
- Connection error handling
- Reconnection logic

Troubleshooting:
----------------
- Connection timeout: Check firewall allows UDP 14567
- Certificate error: Verify ca-chain.pem is loaded correctly
- Authentication failed: Reset password in Credentials tab
- QUIC not available: Check if client library supports QUIC transport

Support:
--------
- Documentation: https://docs.tesaiot.com/mqtt-quic
- Contact: support@tesaiot.com

Evidence & Logging:
-------------------
- Bundle generated at (UTC): 2026-03-18T12:39:37.539038Z
- Requested by: santi.inc.kmutt@gmail.com (role: organization_admin, org: bdh-corporation)
- Include Password: false

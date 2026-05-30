/******************************************************************************
* File Name: mqtt_client_config.h
*
* Description: MQTT client configuration for TESAIoT Platform - SERVER-ONLY TLS
* Device ID: e91ba637-e32f-4eb8-8551-b0505ec43a02
* Generated: 2026-03-18T12:44:02.557142+00:00
* Algorithm: N/A (Server TLS)
*
* Instructions:
* 1. Replace the content in your mqtt_client_config.h with this configuration
* 2. This uses server-only TLS mode (server authenticates to client)
* 3. Client certificates are NOT required - uses username/password authentication
* 4. The device must trust the TESA IoT Platform CA certificate
*
* Related Document: https://tesaiot.github.io/developer-hub
*******************************************************************************
* Copyright 2024-2025, TESA IoT Platform
* Managed by: Thai Embedded Systems Association (TESA)
*******************************************************************************/

#ifndef MQTT_CLIENT_CONFIG_H_
#define MQTT_CLIENT_CONFIG_H_

#ifndef CY_MQTT_MAX_OUTGOING_PUBLISHES
#define CY_MQTT_MAX_OUTGOING_PUBLISHES ( 5U )
#endif

#include "cy_mqtt_api.h"

/*******************************************************************************
* Debug Controls (Moved to Makefile for global scope)
*******************************************************************************/
/* TESAIOT_MQTT_DEBUG_ENABLED is now defined in Makefile via DEFINES variable.
 * This ensures ALL .c files (project + library code like cy_mqtt_api.c) see
 * the same debug flag without requiring #include of this header.
 * Professional MCU practice: Use -D compiler flag, not header-based defines.
 *
 * To enable: Add DEFINES+=TESAIOT_MQTT_DEBUG_ENABLED=1 in Makefile
 * To disable: Remove or change to TESAIOT_MQTT_DEBUG_ENABLED=0 in Makefile
 */

/*******************************************************************************
* Debug Level System - Conditional Compilation
*******************************************************************************/
/* Fine-grained debug control to reduce production binary size by 15-20%.
 *
 * USAGE:
 * Production build: #define TESAIOT_DEBUG_LEVEL TESAIOT_DEBUG_LEVEL_ERROR
 * Development build: #define TESAIOT_DEBUG_LEVEL TESAIOT_DEBUG_LEVEL_VERBOSE
 *
 * BENEFITS:
 * - Production: Smaller binary, faster execution (no printf overhead)
 * - Development: Full debug output (same as before)
 * - Zero functional changes - only affects debug output
 *
 * DEBUG LEVELS:
 * NONE (0): No debug output at all (absolute minimum)
 * ERROR (1): Errors only (recommended for production)
 * WARNING (2): Errors + warnings
 * INFO (3): Errors + warnings + info messages
 * VERBOSE (4): All debug messages (recommended for development)
 */

/* Define debug levels */
#define TESAIOT_DEBUG_LEVEL_NONE 0
#define TESAIOT_DEBUG_LEVEL_ERROR 1
#define TESAIOT_DEBUG_LEVEL_WARNING 2
#define TESAIOT_DEBUG_LEVEL_INFO 3
#define TESAIOT_DEBUG_LEVEL_VERBOSE 4

/* Set current debug level (can be overridden in Makefile with -DTESAIOT_DEBUG_LEVEL=x) */
#ifndef TESAIOT_DEBUG_LEVEL
#define TESAIOT_DEBUG_LEVEL TESAIOT_DEBUG_LEVEL_VERBOSE /* Default: Full debug (development) */
#endif

/* Component-specific debug flags (derived from TESAIOT_DEBUG_LEVEL) */
#define TESAIOT_DEBUG_MQTT_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_INFO)
#define TESAIOT_DEBUG_TRUSTM_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_VERBOSE)
#define TESAIOT_DEBUG_CERTIFICATE_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_VERBOSE)
#define TESAIOT_DEBUG_CSR_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_VERBOSE)
#define TESAIOT_DEBUG_PROTECTED_UPDATE_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_VERBOSE)
#define TESAIOT_DEBUG_SUBSCRIBER_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_INFO)
#define TESAIOT_DEBUG_PUBLISHER_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_INFO)
#define TESAIOT_DEBUG_MENU_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_INFO)

/* Always-enabled critical messages (errors, warnings) */
#ifndef TESAIOT_DEBUG_ERROR_ENABLED
#define TESAIOT_DEBUG_ERROR_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_ERROR)
#endif
#ifndef TESAIOT_DEBUG_WARNING_ENABLED
#define TESAIOT_DEBUG_WARNING_ENABLED (TESAIOT_DEBUG_LEVEL >= TESAIOT_DEBUG_LEVEL_WARNING)
#endif

/*******************************************************************************
* Macros
********************************************************************************/

/***************** DEVICE IDENTIFICATION *****************/
/* Primary device identifier - change this single macro to update all topics
 * For standard devices: Use device_id (typically UUID, 36 characters)
 * Server-TLS mode uses username/password authentication, not client certificates
 */
#define DEVICE_ID                         "e91ba637-e32f-4eb8-8551-b0505ec43a02"

/***************** MQTT CLIENT CONNECTION CONFIGURATION MACROS *****************/
/* MQTT Broker/Server address and port used for the MQTT connection. */
#define MQTT_BROKER_ADDRESS               "mqtt.tesaiot.com"
#define MQTT_PORT                         8884  /* Server-TLS port (password-based auth) */

/* Set this macro to 1 if a secure (TLS) connection to the MQTT Broker is
 * required to be established, else 0.
 */
#define MQTT_SECURE_CONNECTION            ( 1 )

/*
 * SERVER-ONLY TLS MODE: Configured for server-only authentication
 * - Using port 8884 (MQTTs) with server TLS authentication
 * - Device configured in platform with auth_mode: "server_tls"
 * - Client certificates NOT required
 * - Primary authentication is via username/password
 * - Server validates itself to the device using the CA certificate
 */
#define MQTT_ENABLE_MUTUAL_AUTH           ( 0 )  /* Disabled for Server-TLS */

/* Configure the user credentials to be sent as part of MQTT CONNECT packet
 * For Server-TLS: Username is device_id, password is set via Platform UI
 * Uses DEVICE_ID macro defined above
 */
#define MQTT_USERNAME                     DEVICE_ID
#define MQTT_PASSWORD                     ""  /* Set via Platform credentials reset */


/********************* MQTT MESSAGE CONFIGURATION MACROS **********************/
/* Base topics for commands and telemetry
 * Uses C string literal concatenation: "device/" DEVICE_ID "/commands"
 * Compiler combines adjacent string literals automatically
 */
#define MQTT_COMMAND_TOPIC_BASE           "device/" DEVICE_ID "/commands"
#define MQTT_TELEMETRY_TOPIC_BASE         "device/" DEVICE_ID "/telemetry"

/* The MQTT topics to be used by the publisher and subscriber. */
#define MQTT_PUB_TOPIC                    MQTT_TELEMETRY_TOPIC_BASE
#define MQTT_PUB_TOPIC_SENSOR             MQTT_TELEMETRY_TOPIC_BASE "/sensor"

/*
 * Default subscription topic listens for device-specific commands. If you need
 * broader coverage (for example, to capture config or firmware broadcasts),
 * switch MQTT_SUB_TOPIC to one of the wildcard variants below.
 */
#define MQTT_SUB_TOPIC_COMMAND            MQTT_COMMAND_TOPIC_BASE "/#"
#define MQTT_SUB_TOPIC_DEVICE_ALL         "device/" DEVICE_ID "/#"
#define MQTT_SUB_TOPIC_LEGACY_ALL         DEVICE_ID "/#"

/* Active subscription topic (default to commands channel with wildcard). */
#define MQTT_SUB_TOPIC                    MQTT_SUB_TOPIC_COMMAND

/* Command publish topics (Device -> Platform) */
#define MQTT_PUB_TOPIC_COMMAND_CSR        MQTT_COMMAND_TOPIC_BASE "/csr"
#define MQTT_PUB_TOPIC_COMMAND_REQUEST    MQTT_COMMAND_TOPIC_BASE "/request"
#define MQTT_PUB_TOPIC_COMMAND_STATUS     MQTT_COMMAND_TOPIC_BASE "/status"
#define MQTT_PUB_TOPIC_COMMAND_ACK        MQTT_COMMAND_TOPIC_BASE "/ack"

/* Command subscription topics (Platform -> Device) */
#define MQTT_SUB_TOPIC_COMMAND_PROTECTED_UPDATE MQTT_COMMAND_TOPIC_BASE "/protected_update"
#define MQTT_SUB_TOPIC_COMMAND_CERT       MQTT_COMMAND_TOPIC_BASE "/certificate"
#define MQTT_SUB_TOPIC_COMMAND_CONFIG     MQTT_COMMAND_TOPIC_BASE "/config"
#define MQTT_SUB_TOPIC_COMMAND_FIRMWARE   MQTT_COMMAND_TOPIC_BASE "/firmware"

/* Smart Auto-Fallback response topics */
#define MQTT_SUB_TOPIC_COMMAND_CHECK_CERT_RESPONSE  MQTT_COMMAND_TOPIC_BASE "/check_certificate_response"
#define MQTT_SUB_TOPIC_COMMAND_UPLOAD_CERT_RESPONSE MQTT_COMMAND_TOPIC_BASE "/upload_certificate_response"
#define MQTT_SUB_TOPIC_COMMAND_SYNC_CERT_RESPONSE   MQTT_COMMAND_TOPIC_BASE "/sync_certificate_response"

/* DEPRECATED topics (kept for reference, will be removed in future) */
#define MQTT_SUB_TOPIC_COMMAND_MANIFEST   MQTT_COMMAND_TOPIC_BASE "/manifest"
#define MQTT_SUB_TOPIC_COMMAND_FRAGMENT   MQTT_COMMAND_TOPIC_BASE "/fragment"
#define MQTT_SUB_TOPIC_COMMAND_PUB_KEY    MQTT_COMMAND_TOPIC_BASE "/pubkey"

/* Set the QoS that is associated with the MQTT publish, and subscribe messages.
 * Valid choices are 0, 1, and 2. Other values should not be used in this macro.
 */
#define MQTT_MESSAGES_QOS                 ( 1 )

/* Configuration for the 'Last Will and Testament (LWT)'. It is an MQTT message
 * that will be published by the MQTT broker if the MQTT connection is
 * unexpectedly closed. This configuration is sent to the MQTT broker during
 * MQTT connect operation and the MQTT broker will publish the Will message on
 * the Will topic when it recognizes an unexpected disconnection from the client.
 *
 * If you want to use the last will message, set this macro to 1 and configure
 * the topic and will message, else 0.
 */
#define ENABLE_LWT_MESSAGE                ( 0 )
#if ENABLE_LWT_MESSAGE
 #define MQTT_WILL_TOPIC_NAME             MQTT_TELEMETRY_TOPIC_BASE "/will"
 #define MQTT_WILL_MESSAGE                ("MQTT client unexpectedly disconnected!")
#endif

/* MQTT messages which are published on the MQTT_PUB_TOPIC that control the
 * device (user LED in this example) state in this code example.
 */
#define MQTT_DEVICE_ON_MESSAGE            "TURN ON"
#define MQTT_DEVICE_OFF_MESSAGE           "TURN OFF"


/******************* OTHER MQTT CLIENT CONFIGURATION MACROS *******************/
/* A unique client identifier to be used for every MQTT connection.
 * Uses DEVICE_ID macro defined above - change DEVICE_ID to update everywhere
 */
#define MQTT_CLIENT_IDENTIFIER            DEVICE_ID

/* The timeout in milliseconds for MQTT operations in this example. */
#define MQTT_TIMEOUT_MS                   ( 10000 ) /* Increased to 10s for QoS 1 PUBACK wait */

/* The keep-alive interval in seconds used for MQTT ping request. */
#define MQTT_KEEP_ALIVE_SECONDS           ( 180 )

/* Every active MQTT connection must have a unique client identifier. If you
 * are using the above 'MQTT_CLIENT_IDENTIFIER' as client ID for multiple MQTT
 * connections simultaneously, set this macro to 1. The device will then
 * generate a unique client identifier by appending a timestamp to the
 * 'MQTT_CLIENT_IDENTIFIER' string. Example: 'psoc6-mqtt-client5927'
 */
#define GENERATE_UNIQUE_CLIENT_ID         ( 0 ) /* Disabled - device_id is already unique */

/* The longest client identifier that an MQTT server must accept (as defined
 * by the MQTT 3.1.1 spec) is 23 characters. However some MQTT brokers support
 * longer client IDs. Configure this macro as per the MQTT broker specification.
 * For Trust M UID (54 hex chars): Set to 64 for buffer safety
 */
#define MQTT_CLIENT_IDENTIFIER_MAX_LEN    ( 64 )

/* Server Name Indication (SNI) hostname to be sent as part of the Client Hello
 * during TLS handshake as specified by the MQTT Broker.
 */
#define MQTT_SNI_HOSTNAME                 "mqtt.tesaiot.com"

/* A Network buffer is allocated for sending and receiving MQTT packets over
 * the network. Specify the size of this buffer using this macro.
 *
 * Note: The minimum buffer size is defined by 'CY_MQTT_MIN_NETWORK_BUFFER_SIZE'
 * macro in the MQTT library. Please ensure this macro value is larger than
 * 'CY_MQTT_MIN_NETWORK_BUFFER_SIZE'.
 *
 * CSR Workflow requires larger buffer:
 * - CSR JSON payload: ~3100 bytes (Base64 CSR + metadata)
 * - Protected Update manifest: ~2500 bytes
 * - Protected Update fragment: ~1500 bytes per chunk
 * Set to 5KB to accommodate CSR workflow and Protected Update safely.
 */
#define MQTT_NETWORK_BUFFER_SIZE          ( 5120 )

/* Maximum MQTT connection re-connection limit. */
#define MAX_MQTT_CONN_RETRIES             (150u)

/* MQTT re-connection time interval in milliseconds. */
#define MQTT_CONN_RETRY_INTERVAL_MS       (2000)

/* Optional ALPN (for example, when tunnelling MQTT over HTTPS/port 443). */
// #define MQTT_ALPN_PROTOCOL_NAME         "x-amzn-mqtt-ca"


/**************** MQTT CLIENT CERTIFICATE CONFIGURATION MACROS ****************/
/* Configure the below credentials in case of a secure MQTT connection. */

/* PEM-encoded Root CA certificate (TESAIoT Platform CA chain)
 * This certificate is required for server authentication
 * The device uses this to verify the MQTT broker's certificate
 */
#define ROOT_CA_CERTIFICATE \
"-----BEGIN CERTIFICATE-----\n" \
"MIIFGTCCAwGgAwIBAgIUQyPdoywMvhynALmoOkaVRjRxdgMwDQYJKoZIhvcNAQEL\n" \
"BQAwgYcxCzAJBgNVBAYTAlRIMRAwDgYDVQQIEwdCYW5na29rMRAwDgYDVQQHEwdC\n" \
"YW5na29rMRowGAYDVQQKExFURVNBIElvVCBQbGF0Zm9ybTEeMBwGA1UECxMVQ2Vy\n" \
"dGlmaWNhdGUgQXV0aG9yaXR5MRgwFgYDVQQDEw9URVNBSW9UIFJvb3QgQ0EwHhcN\n" \
"MjUwOTA2MTE1NDUyWhcNMzAwOTA1MTE1NTIyWjAiMSAwHgYDVQQDExdURVNBSW9U\n" \
"IEludGVybWVkaWF0ZSBDQTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEB\n" \
"AMkIdY3CwBaqRtQkugeRMgXOT8maywvc56zHil/nBsbrfD1c4WdF1sUKnALiKlOz\n" \
"6PER5lQRKOloVxRsXfA3/5JnRXipoPpjh0wSxzdec8rmOAB2zOjPx9ZC4OFS1Oc5\n" \
"3nfE015dCM3qmt5YU+0fMrOkdHg84cG3mqwlEPCiyR2q6Q90eEe6oDAbdZf/VP/8\n" \
"m6Nto+h5q9HskeLb+Q597I/1mGxVfuQ44dLEhjIi4xXsVoYEP/huPd6QKNMfiYyd\n" \
"UggGzIOxOWXvpbAaERzMV4ORCBQLP0GT+ErzthjOoDdsYCn524vPVHUnDaKaNr2e\n" \
"DdQYL+9FQJuJKILJx/yDx30CAwEAAaOB4DCB3TAOBgNVHQ8BAf8EBAMCAQYwDwYD\n" \
"VR0TAQH/BAUwAwEB/zAdBgNVHQ4EFgQUYOv9VE15yidpsZ6fT0RhYwXVuJgwHwYD\n" \
"VR0jBBgwFoAUzeeXC4tRrrEdw4RCROaPjfMtVhkwQQYIKwYBBQUHAQEENTAzMDEG\n" \
"CCsGAQUFBzAChiVodHRwOi8vdGVzYS12YXVsdDo4MjAwL3YxL3BraS1yb290L2Nh\n" \
"MDcGA1UdHwQwMC4wLKAqoCiGJmh0dHA6Ly90ZXNhLXZhdWx0OjgyMDAvdjEvcGtp\n" \
"LXJvb3QvY3JsMA0GCSqGSIb3DQEBCwUAA4ICAQBlpS+p+VHNBoNZoyx+tYwPn/QK\n" \
"WYsmd6m4RL7Tdb+MQ1w3STDrcQBXZvpgn1V00cKoEnOrw2obtW/zIdAjXm3XGh9g\n" \
"ODna7olj/lRZa5OxyN4Yy2HdWLI6vomMF24GJz0Ve+aeNbLAU7TET2wzUiOpi15E\n" \
"wsByAXpsud7bYPnyuQ+QF2Aiau0ZVB5sMmylvHVRewXeGSb6mnQHsadtMEDJHkMr\n" \
"uhY/1WZmafjETo7uOQi2BNv2X7taOam9NCIluXNLQxrQyljyrF7tkeeJQfRp0vJc\n" \
"cP1AKmbu5wQJyDtLfJD6IbyyOkth5yyVnWHLZkOXjJ3sgXN6/mtMEv7y0wItOSVd\n" \
"e7N/O5CK+BOYYrqQXdHF5Vd0fuCaUrVVC2nXWZPXTtet4ShN6uHQKJY+Bx1IU2/U\n" \
"yBVj6vk1fQM5P1ixL44xNd3tanNX3n9Z/rVToo8iuHSVQkjuFqbc3puFpoWjMZr6\n" \
"uOEUkamOryx4wC/dC0Y5IO8M/MqGZWocwf4YuAJF5ApkyNbXTscnJYZmi3F31+6p\n" \
"rKzG2CUpNm2b5FxU9zefBe8ASoMF/h6+yqrnohHTtAWmvhh1IcJDpDiYOWu2E21c\n" \
"KRVacmR6J4vQOSL9sj1HVw+zntFPNBQo7pu3ISQgBMBmknR9vWXCy4/tXo+2pgDI\n" \
"xhdvQh0uPlE5Luai0A==\n" \
"-----END CERTIFICATE-----\n" \
"\n" \
"-----BEGIN CERTIFICATE-----\n" \
"MIIGATCCA+mgAwIBAgIUeSB82qv/64u3Ud+oZXUOdDZ0cx0wDQYJKoZIhvcNAQEL\n" \
"BQAwgYcxCzAJBgNVBAYTAlRIMRAwDgYDVQQIEwdCYW5na29rMRAwDgYDVQQHEwdC\n" \
"YW5na29rMRowGAYDVQQKExFURVNBIElvVCBQbGF0Zm9ybTEeMBwGA1UECxMVQ2Vy\n" \
"dGlmaWNhdGUgQXV0aG9yaXR5MRgwFgYDVQQDEw9URVNBSW9UIFJvb3QgQ0EwHhcN\n" \
"MjUwOTA2MTE1NDMyWhcNMzUwOTA0MTE1NDU5WjCBhzELMAkGA1UEBhMCVEgxEDAO\n" \
"BgNVBAgTB0Jhbmdrb2sxEDAOBgNVBAcTB0Jhbmdrb2sxGjAYBgNVBAoTEVRFU0Eg\n" \
"SW9UIFBsYXRmb3JtMR4wHAYDVQQLExVDZXJ0aWZpY2F0ZSBBdXRob3JpdHkxGDAW\n" \
"BgNVBAMTD1RFU0FJb1QgUm9vdCBDQTCCAiIwDQYJKoZIhvcNAQEBBQADggIPADCC\n" \
"AgoCggIBAJhC+0WyByj85dlnI/v1W78cspV3lrAnshVmmoLVWelgaNKyfU2uO6Tc\n" \
"sNUX2V8qty0J8jJwK2sdHY1V7CmN/GAi2DinhX0My1NyFxfs7MS1TQhNmqTqgf70\n" \
"N1FpqB4QsG2dAbrPPDRaCkQyuSxwkldXSTJz1NA8vCNq54gc4O0g6ZwWHAJaWyqy\n" \
"4U89i6+fW167IwElqr5Pcz2Jal62he8fafFcRPpPoRfDMecvlTeK2cUmH50ivO9N\n" \
"GaYGPmmip/2DawT8fZXDR4rKVry66ZGzUD2tmKtzuWGLHLAUHKGnTrVGNCodwWAY\n" \
"lkT99uqcyNBWvO0XPfcQ3NSvO4pYJ6Pwt+BhuQyRnRNbNd2oHdSsNhZLZjtgLMUP\n" \
"0p3b5Rvt4JEkb3MiDaRVfIfm0mkoKoKIKn573hagiiB53DM2k4S7ZjSwmZh7z5h0\n" \
"sdXdC7zIL5kjhrW/Q9cIX2dj67LXOuhDU/Ve3UyIlHRW+RbIFHOy/bsDZWYoldkE\n" \
"dGmb+edcWtGfO8oPhQFFspUk+MzSwkfCpRpP3tremNnmTbom4ppIBxAFNjesFsfO\n" \
"OOVyxKsH+esHrTZLoFpQQ+Jwb/y4NufHuZ9x1AENLXLLbLF0oonWrdjC7Lk96GOs\n" \
"AWSHUDSefoAQzPtwJUumf5Dxrc5y4jOZ8tNqrLo/c2Cf5kHZgCw3AgMBAAGjYzBh\n" \
"MA4GA1UdDwEB/wQEAwIBBjAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBTN55cL\n" \
"i1GusR3DhEJE5o+N8y1WGTAfBgNVHSMEGDAWgBTN55cLi1GusR3DhEJE5o+N8y1W\n" \
"GTANBgkqhkiG9w0BAQsFAAOCAgEAOEP6PUFE7CZvr5L/HvD81roekDMtxRZlyS7U\n" \
"9+a4LJOZlqLKuwaN3h3yh47TdFV3OAtsmwX+BqqDtjvlXEv9zPeLrVIC/+2MwKri\n" \
"8EO0ZjnL1LPiVoMqImh6p4OOuorDilCQs6OCGKJeWDazY2Rosc4UdosB0ESjJcbA\n" \
"BJgNThO+ZaJFFoTcxdu19L4J7jRqN4/pFQa+/W9ZZkGlZCRUIz9FMhRhi4NwKE+V\n" \
"KbOK02KqJ6MUjhQjqhWLVcKfKxBfHo65HigEm4s8E+mJrWxw+xbr9ZRbyDE8Kr8C\n" \
"TJrZczDP7bCaJkq5aZN+e7kO6zLjxIlPo2fG+lfJU1uy4nL/8Mvd2Bm/VdYQqEsG\n" \
"t7soEI6oKQ8PDm2XA0ojNnkdgQunw9ikCpodVZeeVbMB41MAfHVBeE76H5RnOrkD\n" \
"pvbANmCUgQ1r3/uDmXfIwuTrMw1aUSodQIhr7VdyqtOIDSJPIloPe58ponCJmSgg\n" \
"GQ5zxhCZwj8yzv4ZJeVX1BrRb9DMePrihIjJMBKhVw9nWv2OFujHFm2lc+W4GzCM\n" \
"7yBpMQBw3aPad+QE0YEVTk3B9cpBIsXbEr3u3Qmf6VQY92XgaEk7HhIGjjDexL/5\n" \
"eQzdinKseYWGQ2OcSPabIlPfAMxKpAmeIJzTg9bkITCJcV0aXrhk62wOZzOt/Ioo\n" \
"iAfI2Ao=\n" \
"-----END CERTIFICATE-----\n"

/* Server-Only TLS Mode - Client Certificates Optional
 * While this is configured for server-only TLS authentication, placeholders
 * for client certificates are included for the following reasons:
 * 1. Maintains code compatibility across all authentication modes
 * 2. Allows seamless upgrade to mTLS if needed in the future
 * 3. The server ignores these certificates when configured for server-only mode
 *
 * NOTE: In server-only TLS mode, the server validates itself to the device
 * using the CA certificate, but does NOT require or validate client certificates.
 * Authentication is done via username/password in the MQTT CONNECT packet.
 */
/* Server-Only TLS Mode - Client Certificates Not Required */
#define CLIENT_CERTIFICATE ""  // not required
#define CLIENT_PRIVATE_KEY ""  // not required


/******************************************************************************
* Global Variables
*******************************************************************************/
extern cy_mqtt_broker_info_t broker_info;
extern cy_awsport_ssl_credentials_t *security_info;
extern cy_mqtt_connect_info_t connection_info;

#endif /* MQTT_CLIENT_CONFIG_H_ */

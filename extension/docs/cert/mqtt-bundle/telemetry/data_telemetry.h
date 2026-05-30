/**
 * @file data_telemetry.h
 * @brief Auto-generated telemetry data structures for TESAIoT Platform
 * @device santi-testing1
 * @device_id e91ba637-e32f-4eb8-8551-b0505ec43a02
 * @schema_version 1.0
 * @generated 2026-03-18T12:44:02Z
 *
 * WARNING: This file is auto-generated. Do not modify manually.
 * Regenerate using TESAIoT Platform bundle download.
 *
 * TESAIoT Platform - https://tesaiot.com
 * Copyright (c) 2024-2025 Wiroon Sriborrirux
 * Licensed under TESA Collaboration License
 */

#ifndef DATA_TELEMETRY_H
#define DATA_TELEMETRY_H

#ifdef __cplusplus
extern "C" {
#endif

#include <stdint.h>
#include <stdbool.h>
#include <stddef.h>
#include <string.h>

/* ============================================================
 * Schema Metadata
 * ============================================================ */
#define TELEMETRY_SCHEMA_VERSION    "1.0"
#define TELEMETRY_DEVICE_ID         "e91ba637-e32f-4eb8-8551-b0505ec43a02"
#define TELEMETRY_DEVICE_NAME       "santi-testing1"
#define TELEMETRY_MAX_JSON_SIZE     (256U)
#define TELEMETRY_FIELD_COUNT       (2U)

/* ============================================================
 * Field Constraints
 * ============================================================ */
#define TIMESTAMP_MAX_LEN        (32U)

/* ============================================================
 * Result Codes
 * ============================================================ */

/**
 * @brief Telemetry operation result codes
 */
typedef enum {
    TELEMETRY_OK = 0,                        /**< Success */
    TELEMETRY_ERR_NULL_POINTER = -1,         /**< NULL pointer passed */
    TELEMETRY_ERR_REQUIRED_MISSING = -2,     /**< Required field not set */
    TELEMETRY_ERR_VALUE_OUT_OF_RANGE = -3,   /**< Value exceeds constraints */
    TELEMETRY_ERR_BUFFER_TOO_SMALL = -4,     /**< Output buffer too small */
    TELEMETRY_ERR_INVALID_FORMAT = -5        /**< Invalid data format */
} telemetry_result_t;

/* ============================================================
 * Telemetry Data Structure
 * ============================================================ */

/**
 * @brief Telemetry data structure
 *
 * This struct matches the device's JSON Schema exactly.
 * All required fields must be set before serialization.
 *
 * Required fields: timestamp
 */
typedef struct {
    /** Timestamp [REQUIRED] */
    char timestamp[TIMESTAMP_MAX_LEN];

    /** Sensor Value (TODO: customize) */
    float value;

    /**
     * @brief Field presence flags
     *
     * Set to 1 when field is assigned. Use TELEMETRY_SET_* macros
     * to automatically set these flags.
     */
    struct {
        uint8_t timestamp : 1;
        uint8_t value : 1;
    } _has;
} telemetry_data_t;

/* ============================================================
 * Function Prototypes
 * ============================================================ */

/**
 * @brief Initialize telemetry data structure with default values
 *
 * Must be called before using the structure. Sets all fields to
 * zero/default values and clears all presence flags.
 *
 * @param data Pointer to telemetry structure to initialize
 */
void telemetry_init(telemetry_data_t *data);

/**
 * @brief Validate telemetry data against schema constraints
 *
 * Checks:
 * - All required fields are set (presence flags)
 * - Numeric values are within min/max constraints
 * - String fields are not empty (if required)
 *
 * @param data Pointer to telemetry structure to validate
 * @return TELEMETRY_OK if valid, error code otherwise
 */
telemetry_result_t telemetry_validate(const telemetry_data_t *data);

/**
 * @brief Serialize telemetry data to JSON string
 *
 * Converts the telemetry structure to a JSON string suitable
 * for publishing to MQTT. Only includes fields with presence
 * flags set.
 *
 * @param data Pointer to telemetry structure to serialize
 * @param buffer Output buffer for JSON string (null-terminated)
 * @param buffer_size Size of output buffer in bytes
 * @return Number of bytes written (excluding null), or negative error code
 */
int32_t telemetry_to_json(const telemetry_data_t *data,
                          char *buffer,
                          size_t buffer_size);

/**
 * @brief Get human-readable error message for result code
 *
 * @param result Result code from validation or serialization
 * @return Static string describing the error (do not free)
 */
const char* telemetry_error_string(telemetry_result_t result);

/* ============================================================
 * Field Setter Macros
 *
 * Use these macros to set field values. They automatically
 * set the presence flag so validation knows the field is set.
 * ============================================================ */

/**
 * @brief Set timestamp field (string)
 * @param data Pointer to telemetry_data_t
 * @param value String value to copy (will be truncated if too long)
 */
#define TELEMETRY_SET_TIMESTAMP(data, value) \
    do { \
        strncpy((data)->timestamp, (value), TIMESTAMP_MAX_LEN - 1U); \
        (data)->timestamp[TIMESTAMP_MAX_LEN - 1U] = '\0'; \
        (data)->_has.timestamp = 1U; \
    } while(0)

/**
 * @brief Set value field
 * @param data Pointer to telemetry_data_t
 * @param value Value to set
 */
#define TELEMETRY_SET_VALUE(data, value) \
    do { \
        (data)->value = (value); \
        (data)->_has.value = 1U; \
    } while(0)


/* ============================================================
 * Field Getter Macros
 * ============================================================ */

/**
 * @brief Check if timestamp field is set
 * @param data Pointer to telemetry_data_t
 * @return true if field is set, false otherwise
 */
#define TELEMETRY_HAS_TIMESTAMP(data) ((data)->_has.timestamp != 0U)

/**
 * @brief Check if value field is set
 * @param data Pointer to telemetry_data_t
 * @return true if field is set, false otherwise
 */
#define TELEMETRY_HAS_VALUE(data) ((data)->_has.value != 0U)


#ifdef __cplusplus
}
#endif

#endif /* DATA_TELEMETRY_H */
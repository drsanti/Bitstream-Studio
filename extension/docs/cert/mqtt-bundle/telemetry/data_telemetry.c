/**
 * @file data_telemetry.c
 * @brief Auto-generated telemetry serialization for TESAIoT Platform
 * @device santi-testing1
 * @device_id e91ba637-e32f-4eb8-8551-b0505ec43a02
 * @generated 2026-03-18T12:44:02Z
 *
 * WARNING: This file is auto-generated. Do not modify manually.
 *
 * TESAIoT Platform - https://tesaiot.com
 * Copyright (c) 2024-2025 Wiroon Sriborrirux
 */

#include "data_telemetry.h"
#include <stdio.h>
#include <string.h>

/* ============================================================
 * Private Helper Functions
 * ============================================================ */

/**
 * @brief Safely append string to buffer with overflow check
 */
static int safe_append(char *buffer, size_t buffer_size, size_t *offset,
                       const char *str, size_t str_len)
{
    if (*offset + str_len >= buffer_size) {
        return -1;  /* Buffer overflow */
    }
    memcpy(buffer + *offset, str, str_len);
    *offset += str_len;
    return 0;
}

/* ============================================================
 * Public Functions
 * ============================================================ */

void telemetry_init(telemetry_data_t *data)
{
    if (data == NULL) {
        return;
    }

    /* Zero entire structure */
    memset(data, 0, sizeof(telemetry_data_t));

    /* Set default values */
    data->timestamp[0] = '\0';
    data->value = 0.0f;
}

telemetry_result_t telemetry_validate(const telemetry_data_t *data)
{
    if (data == NULL) {
        return TELEMETRY_ERR_NULL_POINTER;
    }

    /* Check required fields are set */
    if (data->_has.timestamp == 0U || data->timestamp[0] == '\0') {
        return TELEMETRY_ERR_REQUIRED_MISSING;  /* timestamp required */
    }

    /* Validate numeric ranges */

    return TELEMETRY_OK;
}

int32_t telemetry_to_json(const telemetry_data_t *data,
                          char *buffer,
                          size_t buffer_size)
{
    telemetry_result_t result;
    size_t offset = 0U;
    int first_field = 1;
    char temp[64];
    int temp_len;

    /* Parameter validation */
    if (data == NULL || buffer == NULL) {
        return (int32_t)TELEMETRY_ERR_NULL_POINTER;
    }

    if (buffer_size < 3U) {
        return (int32_t)TELEMETRY_ERR_BUFFER_TOO_SMALL;
    }

    /* Validate data before serialization */
    result = telemetry_validate(data);
    if (result != TELEMETRY_OK) {
        return (int32_t)result;
    }

    /* Start JSON object */
    buffer[offset++] = '{';

    /* Serialize timestamp */
    if (data->_has.timestamp != 0U) {
        if (first_field == 0) {
            if (offset + 1U >= buffer_size) {
                return (int32_t)TELEMETRY_ERR_BUFFER_TOO_SMALL;
            }
            buffer[offset++] = ',';
        }
        first_field = 0;

        /* String field: timestamp */
        temp_len = snprintf(temp, sizeof(temp), "\"timestamp\":\"%s\"", data->timestamp);

        if (temp_len < 0 || (size_t)temp_len >= sizeof(temp)) {
            return (int32_t)TELEMETRY_ERR_BUFFER_TOO_SMALL;
        }
        if (safe_append(buffer, buffer_size, &offset, temp, (size_t)temp_len) != 0) {
            return (int32_t)TELEMETRY_ERR_BUFFER_TOO_SMALL;
        }
    }

    /* Serialize value */
    if (data->_has.value != 0U) {
        if (first_field == 0) {
            if (offset + 1U >= buffer_size) {
                return (int32_t)TELEMETRY_ERR_BUFFER_TOO_SMALL;
            }
            buffer[offset++] = ',';
        }
        first_field = 0;

        /* Float field: value */
        temp_len = snprintf(temp, sizeof(temp), "\"value\":%.6f",
                           (double)data->value);

        if (temp_len < 0 || (size_t)temp_len >= sizeof(temp)) {
            return (int32_t)TELEMETRY_ERR_BUFFER_TOO_SMALL;
        }
        if (safe_append(buffer, buffer_size, &offset, temp, (size_t)temp_len) != 0) {
            return (int32_t)TELEMETRY_ERR_BUFFER_TOO_SMALL;
        }
    }

    /* End JSON object */
    if (offset + 2U >= buffer_size) {
        return (int32_t)TELEMETRY_ERR_BUFFER_TOO_SMALL;
    }
    buffer[offset++] = '}';
    buffer[offset] = '\0';

    return (int32_t)offset;
}

const char* telemetry_error_string(telemetry_result_t result)
{
    switch (result) {
        case TELEMETRY_OK:
            return "Success";
        case TELEMETRY_ERR_NULL_POINTER:
            return "NULL pointer argument";
        case TELEMETRY_ERR_REQUIRED_MISSING:
            return "Required field missing or not set";
        case TELEMETRY_ERR_VALUE_OUT_OF_RANGE:
            return "Value out of valid range";
        case TELEMETRY_ERR_BUFFER_TOO_SMALL:
            return "Output buffer too small";
        case TELEMETRY_ERR_INVALID_FORMAT:
            return "Invalid data format";
        default:
            return "Unknown error";
    }
}
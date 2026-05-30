# TESAIoT Product Model Store — Sample Scripts

Sample scripts demonstrating how to interact with the **TESAIoT Product Model Store API** to list, inspect, and download 3D product models programmatically.

Two implementations are provided — pick whichever matches your stack:

| File | Language | Dependencies |
|------|----------|--------------|
| `download_model_python.py` | Python 3 | `requests`, `python-dotenv` |
| `download_model_nodejs.js` | Node.js | `dotenv` (optional) |

---

## Quick Start

### 1. Install dependencies

**Python**

```bash
pip install requests python-dotenv
```

**Node.js**

```bash
npm install dotenv
```

### 2. Configure API Key

Edit the `.env` file in this directory:

```dotenv
TESAIOT_DIGITAL_TWIN_APIKEY=pdms_<your_api_key_here>
```

> **How to obtain an API key:** Request one from the TESAIoT Platform administrator.
> The key must have `read_models` and `download_models` permissions.

### 3. Run

```bash
# Python — list all models
python download_model_python.py --list

# Node.js — list all models
node download_model_nodejs.js --list
```

---

## Usage

Both scripts share the same CLI interface:

### List all models

```bash
python download_model_python.py --list
node   download_model_nodejs.js --list
```

### Show model details

```bash
python download_model_python.py --id PDM-EVM-682847 -i
node   download_model_nodejs.js --id PDM-EVM-682847 -i
```

### Download all files (thumbnail, 3D model, ZIP archive)

```bash
python download_model_python.py --id PDM-EVM-682847 -d
node   download_model_nodejs.js --id PDM-EVM-682847 -d
```

### Download to a specific directory

```bash
python download_model_python.py --id PDM-EVM-682847 -d -o ./downloads
node   download_model_nodejs.js --id PDM-EVM-682847 -d -o ./downloads
```

### CLI Reference

| Flag | Description |
|------|-------------|
| `--list` | List all available product models |
| `--id <PRODUCT_ID>` | Specify a product model (e.g. `PDM-EVM-682847`) |
| `-i`, `--info` | Show detailed information (requires `--id`) |
| `-d`, `--download` | Download all files for the model (requires `--id`) |
| `-o`, `--output <DIR>` | Output directory for downloads (default: `.`) |

---

## Authentication

These scripts use **API Key** authentication only. No login or user credentials required.

The API key is sent in the `Authorization` header:

```
Authorization: Bearer pdms_<your_api_key>
```

> **Note:** The Product Model Store UI uses JWT tokens obtained from the main TESAIoT Platform login (`/api/v1/auth/login`). The sample scripts do **not** use JWT — they use API keys exclusively.

---

## API Endpoints

Base URL: `https://admin.tesaiot.com/api/v1/product-models`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/models/list` | List all public models (supports `?page=` and `?limit=`) |
| GET | `/models/{product_id}/details` | Get full details for a specific model |
| GET | `/models/{product_id}/download` | Download 3D model file (`.glb`) |
| GET | `/models/{product_id}/download/thumbnail` | Download thumbnail image (`.webp`) |
| GET | `/models/{product_id}/download/zip` | Download source archive (`.zip`) |

All endpoints require the `Authorization: Bearer <api_key>` header.

---

## Downloaded File Types

| File | Format | Typical Size |
|------|--------|-------------|
| 3D Model | `.glb` (glTF Binary) | 2 – 12 MB |
| Thumbnail | `.webp` | 8 – 36 KB |
| Source Archive | `.zip` | 4 – 82 MB |

> Not all models have a ZIP archive. The scripts will show `⊘ Not available` for missing files.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TESAIOT_DIGITAL_TWIN_APIKEY` | Yes | — | API key (`pdms_...` format) |
| `TESAIOT_BASE_URL` | No | `https://admin.tesaiot.com` | Platform base URL |

---

## Example Output

```
$ python download_model_python.py --id PDM-EVM-731468 -d -o ./downloads

Downloading all files for PDM-EVM-731468...

Downloading Thumbnail...
Progress: 100.0%
✓ Thumbnail: ./downloads/PDM-EVM-731468_thumbnail.webp (15.50 KB)

Downloading 3D Model...
Progress: 100.0%
✓ 3D Model: ./downloads/PDM-EVM-731468_model.glb (2.57 MB)

Downloading ZIP Archive...
Progress: 100.0%
✓ ZIP Archive: ./downloads/PDM-EVM-731468_source.zip (4.35 MB)

==================================================
Download Summary
==================================================
Files downloaded: 3
Total size: 6.94 MB
Location: /path/to/downloads
```

---

## Troubleshooting

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` / `Invalid API key` | API key missing, expired, or revoked | Check `TESAIOT_DIGITAL_TWIN_APIKEY` in `.env` |
| `404 Not Found` | Invalid product ID | Verify ID with `--list` first |
| `ConnectionError` / `ECONNREFUSED` | Platform unreachable | Check network and `TESAIOT_BASE_URL` |

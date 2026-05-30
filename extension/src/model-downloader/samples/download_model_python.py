#!/usr/bin/env python3
"""
TESAIoT Product Model Store - Python Sample Script

This script demonstrates how to interact with the TESAIoT Product Model Store API
using API Key authentication.

Requirements:
    pip install requests python-dotenv

Usage:
    python download_model_python.py --list                      # List all models
    python download_model_python.py --id PDM-EVM-682847 -i      # Show model info
    python download_model_python.py --id PDM-EVM-682847 -d      # Download all files
    python download_model_python.py --id PDM-EVM-682847 -d -o ./downloads  # Download to specific dir

Environment Variables:
    TESAIOT_DIGITAL_TWIN_APIKEY - API key for authentication
    TESAIOT_BASE_URL - Base URL (default: https://admin.tesaiot.com)
"""

import os
import sys
import argparse
import requests
from pathlib import Path
from datetime import datetime

# Load environment variables from .env file
try:
    from dotenv import load_dotenv
    load_dotenv()
except ImportError:
    pass

# Configuration
BASE_URL = os.environ.get("TESAIOT_BASE_URL", "https://admin.tesaiot.com") + "/api/v1/product-models"
API_KEY = os.environ.get("TESAIOT_DIGITAL_TWIN_APIKEY", "pdms_hjPQR0j4RQErymgwFutEmtPAhjPQR0j4")

if not API_KEY:
    print("Error: TESAIOT_DIGITAL_TWIN_APIKEY environment variable is not set")
    print("Please set it in .env file or export it")
    sys.exit(1)

# SSL Certificate verification
CA_CERT_PATH = os.environ.get("TESAIOT_CA_CERT_PATH", None)


def format_size(size_bytes: int, unknown_text: str = "Unknown size") -> str:
    """Format file size in human readable format."""
    if not size_bytes or size_bytes == 0:
        return unknown_text

    units = ['B', 'KB', 'MB', 'GB']
    unit_index = 0
    size = float(size_bytes)

    while size >= 1024 and unit_index < len(units) - 1:
        size /= 1024
        unit_index += 1

    return f"{size:.2f} {units[unit_index]}"


def format_date(date_str: str) -> str:
    """Format date string to readable format."""
    if not date_str:
        return "N/A"
    try:
        dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
        return dt.strftime('%Y-%m-%d %H:%M:%S UTC')
    except:
        return date_str


def get_auth_headers() -> dict:
    """Get authentication headers with API key."""
    return {
        "Authorization": f"Bearer {API_KEY}",
        "Content-Type": "application/json"
    }


def get_verify():
    """Get SSL verification setting."""
    if CA_CERT_PATH and os.path.exists(CA_CERT_PATH):
        return CA_CERT_PATH
    return True


def list_models(page: int = 1, limit: int = 100) -> dict:
    """List available product models."""
    url = f"{BASE_URL}/models/list"
    params = {"page": page, "limit": limit}
    response = requests.get(url, headers=get_auth_headers(), params=params, verify=get_verify())
    response.raise_for_status()
    return response.json()


def get_model_info(product_id: str) -> dict:
    """Get product model information by Product ID."""
    url = f"{BASE_URL}/models/{product_id}/details"
    response = requests.get(url, headers=get_auth_headers(), verify=get_verify())
    response.raise_for_status()
    return response.json()


def download_file_direct(product_id: str, file_type: str, output_path: str) -> int:
    """Download file directly from API endpoint (streaming)."""
    if file_type == 'model':
        url = f"{BASE_URL}/models/{product_id}/download"
    elif file_type == 'thumbnail':
        url = f"{BASE_URL}/models/{product_id}/download/thumbnail"
    elif file_type == 'zip':
        url = f"{BASE_URL}/models/{product_id}/download/zip"
    else:
        raise ValueError(f"Invalid file_type: {file_type}")

    response = requests.get(url, headers=get_auth_headers(), stream=True, verify=get_verify())
    response.raise_for_status()

    total_size = int(response.headers.get("content-length", 0))
    downloaded = 0

    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    progress = (downloaded / total_size) * 100
                    print(f"\rProgress: {progress:.1f}%", end="", flush=True)

    print()
    return downloaded


def download_file(download_url: str, output_path: str) -> int:
    """Download file from presigned URL."""
    response = requests.get(download_url, stream=True, verify=False)
    response.raise_for_status()

    total_size = int(response.headers.get("content-length", 0))
    downloaded = 0

    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=8192):
            if chunk:
                f.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    progress = (downloaded / total_size) * 100
                    print(f"\rProgress: {progress:.1f}%", end="", flush=True)

    print()
    return downloaded


def print_model_details(model: dict, show_download_links: bool = False):
    """Print model details in formatted output."""
    print("\n" + "=" * 70)
    print(f"Product ID: {model.get('product_id', 'N/A')}")
    print("=" * 70)

    # Basic Info
    print(f"\nName:        {model.get('name', 'N/A')}")
    print(f"Description: {model.get('description', 'N/A')}")
    print(f"Category:    {model.get('category', 'N/A')}")
    print(f"Tags:        {', '.join(model.get('tags', [])) or 'None'}")

    # Creator Info
    print(f"\nCreator:     {model.get('created_by_name', model.get('created_by', 'N/A'))}")
    print(f"Created:     {format_date(model.get('created_at'))}")

    # Statistics
    stats = model.get('stats', {})
    print(f"\nView Count:     {stats.get('view_count', 0)}")
    print(f"Download Count: {stats.get('download_count', 0)}")

    # File Information
    print("\n--- Files ---")
    files = model.get('files', {})
    base_url = os.environ.get("TESAIOT_BASE_URL", "https://admin.tesaiot.com")

    # Thumbnail
    thumbnail = files.get('thumbnail', {})
    if thumbnail.get('url'):
        thumb_url = base_url + thumbnail['url'] if thumbnail['url'].startswith('/') else thumbnail['url']
        thumb_size = format_size(thumbnail.get('size', 0))
        print(f"Thumbnail:   {thumb_size}")
        if show_download_links:
            print(f"  Link: {thumb_url}")
    else:
        print(f"Thumbnail:   Not available")

    # 3D Model (Original)
    original = files.get('original', {})
    if original.get('url'):
        model_url = base_url + original['url'] if original['url'].startswith('/') else original['url']
        model_size = format_size(original.get('size', 0))
        # Get file extension
        ext = original['url'].split('.')[-1].upper() if '.' in original['url'] else 'N/A'
        print(f"3D Model:    {model_size} ({ext})")
        if show_download_links:
            print(f"  Link: {model_url}")
    else:
        print(f"3D Model:    Not available")

    # Source Archive (ZIP)
    source_archive = files.get('source_archive', {})
    if source_archive.get('url'):
        zip_url = base_url + source_archive['url'] if source_archive['url'].startswith('/') else source_archive['url']
        zip_size = format_size(source_archive.get('size', 0))
        print(f"ZIP Archive: {zip_size}")
        if show_download_links:
            print(f"  Link: {zip_url}")
    else:
        print(f"ZIP Archive: Not available")


def cmd_list():
    """List all product models with full details."""
    print("Fetching all product models...")
    result = list_models()

    models = result.get('data', [])
    pagination = result.get('pagination', {})

    print(f"\nTotal Models: {pagination.get('total', len(models))}")
    print(f"Page {pagination.get('page', 1)} of {pagination.get('total_pages', 1)}")

    if not models:
        print("\nNo models found.")
        return

    for model in models:
        print_model_details(model, show_download_links=True)

    print("\n" + "=" * 70)


def cmd_info(product_id: str):
    """Show detailed information for a specific model."""
    print(f"Fetching details for {product_id}...")

    try:
        model = get_model_info(product_id)
        print_model_details(model, show_download_links=True)
        print("\n" + "=" * 70)
    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"Error: Model '{product_id}' not found")
        elif e.response.status_code == 401:
            print("Error: Invalid API key or unauthorized")
        else:
            print(f"Error: {e}")
        sys.exit(1)


def cmd_download(product_id: str, output_dir: str = "."):
    """Download all 3 files for a specific model."""
    print(f"Downloading all files for {product_id}...\n")

    try:
        # Get model info first
        model = get_model_info(product_id)
        files = model.get('files', {})

        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        downloaded_files = []

        # Download Thumbnail
        if files.get('thumbnail', {}).get('url'):
            try:
                print("Downloading Thumbnail...")
                filepath = output_path / f"{product_id}_thumbnail.webp"
                size = download_file_direct(product_id, 'thumbnail', str(filepath))
                print(f"✓ Thumbnail: {filepath} ({format_size(size)})")
                downloaded_files.append(('Thumbnail', filepath, size))
            except Exception as e:
                print(f"✗ Thumbnail: {e}")
        else:
            print("⊘ Thumbnail: Not available")

        # Download 3D Model
        if files.get('original', {}).get('url'):
            try:
                print("\nDownloading 3D Model...")
                ext = files['original']['url'].split('.')[-1] if '.' in files['original']['url'] else 'glb'
                filepath = output_path / f"{product_id}_model.{ext}"
                size = download_file_direct(product_id, 'model', str(filepath))
                print(f"✓ 3D Model: {filepath} ({format_size(size)})")
                downloaded_files.append(('3D Model', filepath, size))
            except Exception as e:
                print(f"✗ 3D Model: {e}")
        else:
            print("⊘ 3D Model: Not available")

        # Download ZIP
        if files.get('source_archive', {}).get('url'):
            try:
                print("\nDownloading ZIP Archive...")
                filepath = output_path / f"{product_id}_source.zip"
                size = download_file_direct(product_id, 'zip', str(filepath))
                print(f"✓ ZIP Archive: {filepath} ({format_size(size)})")
                downloaded_files.append(('ZIP Archive', filepath, size))
            except Exception as e:
                print(f"✗ ZIP Archive: {e}")
        else:
            print("⊘ ZIP Archive: Not available")

        # Summary
        print("\n" + "=" * 50)
        print("Download Summary")
        print("=" * 50)
        total_size = sum(f[2] for f in downloaded_files)
        print(f"Files downloaded: {len(downloaded_files)}")
        print(f"Total size: {format_size(total_size)}")
        print(f"Location: {output_path.absolute()}")

    except requests.exceptions.HTTPError as e:
        if e.response.status_code == 404:
            print(f"Error: Model '{product_id}' not found")
        elif e.response.status_code == 401:
            print("Error: Invalid API key or unauthorized")
        else:
            print(f"Error: {e}")
        sys.exit(1)


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description='TESAIoT Product Model Store - Sample Script',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  %(prog)s --list                    List all models with details
  %(prog)s --id PDM-EVM-682847 -i    Show details for specific model
  %(prog)s --id PDM-EVM-682847 -d    Download all files for model
  %(prog)s --id PDM-EVM-682847 -d -o ./downloads
        """
    )

    parser.add_argument('--list', action='store_true',
                        help='List all product models with full details')
    parser.add_argument('--id', metavar='PRODUCT_ID',
                        help='Product Model ID (e.g., PDM-EVM-682847)')
    parser.add_argument('-i', '--info', action='store_true',
                        help='Show detailed information for the model')
    parser.add_argument('-d', '--download', action='store_true',
                        help='Download all 3 files (thumbnail, 3D model, ZIP)')
    parser.add_argument('-o', '--output', metavar='DIR', default='.',
                        help='Output directory for downloads (default: current directory)')

    args = parser.parse_args()

    # Validate arguments
    if not any([args.list, args.id]):
        parser.print_help()
        sys.exit(1)

    if args.id and not any([args.info, args.download]):
        parser.error("--id requires either -i (info) or -d (download)")

    try:
        if args.list:
            cmd_list()
        elif args.id:
            if args.info:
                cmd_info(args.id)
            elif args.download:
                cmd_download(args.id, args.output)
    except KeyboardInterrupt:
        print("\nOperation cancelled.")
        sys.exit(1)
    except Exception as e:
        print(f"Error: {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()

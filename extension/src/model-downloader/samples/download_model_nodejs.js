#!/usr/bin/env node
/**
 * TESAIoT Product Model Store - Node.js Sample Script
 *
 * This script demonstrates how to interact with the TESAIoT Product Model Store API
 * using API Key authentication.
 *
 * Requirements:
 *     npm install axios dotenv
 *
 * Usage:
 *     node download_model_nodejs.js --list                      # List all models
 *     node download_model_nodejs.js --id PDM-EVM-682847 -i      # Show model info
 *     node download_model_nodejs.js --id PDM-EVM-682847 -d      # Download all files
 *     node download_model_nodejs.js --id PDM-EVM-682847 -d -o ./downloads  # Download to specific dir
 *
 * Environment Variables:
 *     TESAIOT_DIGITAL_TWIN_APIKEY - API key for authentication
 *     TESAIOT_BASE_URL - Base URL (default: https://admin.tesaiot.com)
 */

import https from 'https';
import http from 'http';
import fs from 'fs';
import path from 'path';

// Load environment variables from .env file if available
try {
  const dotenv = await import('dotenv');
  dotenv.config();
} catch (e) {
  // dotenv not installed, use process.env directly
}

// Configuration
const BASE_URL =
  (process.env.TESAIOT_BASE_URL || 'https://admin.tesaiot.com') +
  '/api/v1/product-models';
const API_KEY =
  process.env.TESAIOT_DIGITAL_TWIN_APIKEY ||
  'pdms_hjPQR0j4RQErymgwFutEmtPAhjPQR0j4';

if (!API_KEY) {
  console.error(
    'Error: TESAIOT_DIGITAL_TWIN_APIKEY environment variable is not set'
  );
  console.error('Please set it in .env file or export it');
  process.exit(1);
}

// SSL Certificate verification
const CA_CERT_PATH = process.env.TESAIOT_CA_CERT_PATH || null;

/**
 * Format file size in human readable format
 */
function formatSize(sizeBytes) {
  if (!sizeBytes || sizeBytes === 0) return 'N/A';

  const units = ['B', 'KB', 'MB', 'GB'];
  let unitIndex = 0;
  let size = parseFloat(sizeBytes);

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(2)} ${units[unitIndex]}`;
}

/**
 * Format date string to readable format
 */
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  try {
    const dt = new Date(dateStr);
    return dt.toISOString().replace('T', ' ').slice(0, 19) + ' UTC';
  } catch (e) {
    return dateStr;
  }
}

/**
 * Get authentication headers
 */
function getAuthHeaders() {
  return {
    Authorization: `Bearer ${API_KEY}`,
    'Content-Type': 'application/json',
  };
}

/**
 * Create HTTPS agent
 */
function createHttpsAgent() {
  const options = {};
  if (CA_CERT_PATH && fs.existsSync(CA_CERT_PATH)) {
    options.ca = fs.readFileSync(CA_CERT_PATH);
  }
  return new https.Agent(options);
}

/**
 * Make HTTP request
 */
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: options.method || 'GET',
      headers: options.headers || {},
      agent: isHttps ? createHttpsAgent() : undefined,
    };

    const req = httpModule.request(reqOptions, (res) => {
      let data = '';
      res.on('data', (chunk) => (data += chunk));
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            resolve(data);
          }
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * List available product models
 */
async function listModels(page = 1, limit = 100) {
  const url = `${BASE_URL}/models/list?page=${page}&limit=${limit}`;
  return makeRequest(url, { headers: getAuthHeaders() });
}

/**
 * Get product model information by Product ID
 */
async function getModelInfo(productId) {
  const url = `${BASE_URL}/models/${productId}/details`;
  return makeRequest(url, { headers: getAuthHeaders() });
}

/**
 * Download file directly from API endpoint (streaming)
 */
function downloadFileDirect(productId, fileType, outputPath) {
  return new Promise((resolve, reject) => {
    let url;
    if (fileType === 'model') {
      url = `${BASE_URL}/models/${productId}/download`;
    } else if (fileType === 'thumbnail') {
      url = `${BASE_URL}/models/${productId}/download/thumbnail`;
    } else if (fileType === 'zip') {
      url = `${BASE_URL}/models/${productId}/download/zip`;
    } else {
      reject(new Error(`Invalid file_type: ${fileType}`));
      return;
    }

    const urlObj = new URL(url);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: getAuthHeaders(),
      agent: isHttps ? createHttpsAgent() : undefined,
    };

    const req = httpModule.request(reqOptions, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const totalSize = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;

      const file = fs.createWriteStream(outputPath);

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        if (totalSize > 0) {
          const progress = ((downloaded / totalSize) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${progress}%`);
        }
      });

      res.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log();
        resolve(downloaded);
      });

      file.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Download file from presigned URL
 */
function downloadFile(downloadUrl, outputPath) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(downloadUrl);
    const isHttps = urlObj.protocol === 'https:';
    const httpModule = isHttps ? https : http;

    const reqOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port || (isHttps ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      rejectUnauthorized: false,
    };

    const req = httpModule.request(reqOptions, (res) => {
      if (res.statusCode !== 200) {
        reject(new Error(`HTTP ${res.statusCode}`));
        return;
      }

      const totalSize = parseInt(res.headers['content-length'] || '0', 10);
      let downloaded = 0;

      const file = fs.createWriteStream(outputPath);

      res.on('data', (chunk) => {
        downloaded += chunk.length;
        if (totalSize > 0) {
          const progress = ((downloaded / totalSize) * 100).toFixed(1);
          process.stdout.write(`\rProgress: ${progress}%`);
        }
      });

      res.pipe(file);

      file.on('finish', () => {
        file.close();
        console.log();
        resolve(downloaded);
      });

      file.on('error', (err) => {
        fs.unlink(outputPath, () => {});
        reject(err);
      });
    });

    req.on('error', reject);
    req.end();
  });
}

/**
 * Print model details in formatted output
 */
function printModelDetails(model, showDownloadLinks = false) {
  const baseUrl = process.env.TESAIOT_BASE_URL || 'https://admin.tesaiot.com';

  console.log('\n' + '='.repeat(70));
  console.log(`Product ID: ${model.product_id || 'N/A'}`);
  console.log('='.repeat(70));

  // Basic Info
  console.log(`\nName:        ${model.name || 'N/A'}`);
  console.log(`Description: ${model.description || 'N/A'}`);
  console.log(`Category:    ${model.category || 'N/A'}`);
  console.log(`Tags:        ${(model.tags || []).join(', ') || 'None'}`);

  // Creator Info
  console.log(
    `\nCreator:     ${model.created_by_name || model.created_by || 'N/A'}`
  );
  console.log(`Created:     ${formatDate(model.created_at)}`);

  // Statistics
  const viewCount = model.stats?.view_count || model.view_count || 0;
  const downloadCount =
    model.stats?.download_count || model.download_count || 0;
  console.log(`\nView Count:     ${viewCount}`);
  console.log(`Download Count: ${downloadCount}`);

  // File Information
  console.log('\n--- Files ---');
  const files = model.files || {};

  // Thumbnail
  const thumbnail = files.thumbnail || {};
  if (thumbnail.url) {
    const thumbUrl = thumbnail.url.startsWith('/')
      ? baseUrl + thumbnail.url
      : thumbnail.url;
    const thumbSize = formatSize(thumbnail.size || 0);
    console.log(`Thumbnail:   ${thumbSize}`);
    if (showDownloadLinks) {
      console.log(`  Link: ${thumbUrl}`);
    }
  } else {
    console.log(`Thumbnail:   Not available`);
  }

  // 3D Model (Original)
  const original = files.original || {};
  if (original.url) {
    const modelUrl = original.url.startsWith('/')
      ? baseUrl + original.url
      : original.url;
    const modelSize = formatSize(original.size || 0);
    const ext = original.url.includes('.')
      ? original.url.split('.').pop().toUpperCase()
      : 'N/A';
    console.log(`3D Model:    ${modelSize} (${ext})`);
    if (showDownloadLinks) {
      console.log(`  Link: ${modelUrl}`);
    }
  } else {
    console.log(`3D Model:    Not available`);
  }

  // Source Archive (ZIP)
  const sourceArchive = files.source_archive || {};
  if (sourceArchive.url) {
    const zipUrl = sourceArchive.url.startsWith('/')
      ? baseUrl + sourceArchive.url
      : sourceArchive.url;
    const zipSize = formatSize(sourceArchive.size || 0);
    console.log(`ZIP Archive: ${zipSize}`);
    if (showDownloadLinks) {
      console.log(`  Link: ${zipUrl}`);
    }
  } else {
    console.log(`ZIP Archive: Not available`);
  }
}

/**
 * Command: List all models
 */
async function cmdList() {
  console.log('Fetching all product models...');
  const result = await listModels();

  const models = result.data || [];
  const pagination = result.pagination || {};

  console.log(`\nTotal Models: ${pagination.total || models.length}`);
  console.log(`Page ${pagination.page || 1} of ${pagination.total_pages || 1}`);

  if (models.length === 0) {
    console.log('\nNo models found.');
    return;
  }

  for (const model of models) {
    printModelDetails(model, true);
  }

  console.log('\n' + '='.repeat(70));
}

/**
 * Command: Show model info
 */
async function cmdInfo(productId) {
  console.log(`Fetching details for ${productId}...`);

  try {
    const model = await getModelInfo(productId);
    printModelDetails(model, true);
    console.log('\n' + '='.repeat(70));
  } catch (error) {
    if (error.message.includes('404')) {
      console.error(`Error: Model '${productId}' not found`);
    } else if (error.message.includes('401')) {
      console.error('Error: Invalid API key or unauthorized');
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Command: Download all files
 */
async function cmdDownload(productId, outputDir = '.') {
  console.log(`Downloading all files for ${productId}...\n`);

  try {
    // Get model info first
    const model = await getModelInfo(productId);
    const files = model.files || {};

    // Create output directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const downloadedFiles = [];

    // Download Thumbnail
    if (files.thumbnail && files.thumbnail.url) {
      try {
        console.log('Downloading Thumbnail...');
        const filepath = path.join(outputDir, `${productId}_thumbnail.webp`);
        const size = await downloadFileDirect(productId, 'thumbnail', filepath);
        console.log(`✓ Thumbnail: ${filepath} (${formatSize(size)})`);
        downloadedFiles.push(['Thumbnail', filepath, size]);
      } catch (e) {
        console.log(`✗ Thumbnail: ${e.message}`);
      }
    } else {
      console.log('⊘ Thumbnail: Not available');
    }

    // Download 3D Model
    if (files.original && files.original.url) {
      try {
        console.log('\nDownloading 3D Model...');
        const ext = files.original.url.includes('.')
          ? files.original.url.split('.').pop()
          : 'glb';
        const filepath = path.join(outputDir, `${productId}_model.${ext}`);
        const size = await downloadFileDirect(productId, 'model', filepath);
        console.log(`✓ 3D Model: ${filepath} (${formatSize(size)})`);
        downloadedFiles.push(['3D Model', filepath, size]);
      } catch (e) {
        console.log(`✗ 3D Model: ${e.message}`);
      }
    } else {
      console.log('⊘ 3D Model: Not available');
    }

    // Download ZIP
    if (files.source_archive && files.source_archive.url) {
      try {
        console.log('\nDownloading ZIP Archive...');
        const filepath = path.join(outputDir, `${productId}_source.zip`);
        const size = await downloadFileDirect(productId, 'zip', filepath);
        console.log(`✓ ZIP Archive: ${filepath} (${formatSize(size)})`);
        downloadedFiles.push(['ZIP Archive', filepath, size]);
      } catch (e) {
        console.log(`✗ ZIP Archive: ${e.message}`);
      }
    } else {
      console.log('⊘ ZIP Archive: Not available');
    }

    // Summary
    console.log('\n' + '='.repeat(50));
    console.log('Download Summary');
    console.log('='.repeat(50));
    const totalSize = downloadedFiles.reduce((sum, f) => sum + f[2], 0);
    console.log(`Files downloaded: ${downloadedFiles.length}`);
    console.log(`Total size: ${formatSize(totalSize)}`);
    console.log(`Location: ${path.resolve(outputDir)}`);
  } catch (error) {
    if (error.message.includes('404')) {
      console.error(`Error: Model '${productId}' not found`);
    } else if (error.message.includes('401')) {
      console.error('Error: Invalid API key or unauthorized');
    } else {
      console.error(`Error: ${error.message}`);
    }
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs(args) {
  const result = {
    list: false,
    id: null,
    info: false,
    download: false,
    output: '.',
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--list') {
      result.list = true;
    } else if (arg === '--id') {
      result.id = args[++i];
    } else if (arg === '-i' || arg === '--info') {
      result.info = true;
    } else if (arg === '-d' || arg === '--download') {
      result.download = true;
    } else if (arg === '-o' || arg === '--output') {
      result.output = args[++i];
    }
  }

  return result;
}

/**
 * Print help
 */
function printHelp() {
  console.log('TESAIoT Product Model Store - Sample Script\n');
  console.log('Usage:');
  console.log(
    '  node download_model_nodejs.js --list                    List all models with details'
  );
  console.log(
    '  node download_model_nodejs.js --id PDM-EVM-682847 -i    Show details for specific model'
  );
  console.log(
    '  node download_model_nodejs.js --id PDM-EVM-682847 -d    Download all files for model'
  );
  console.log(
    '  node download_model_nodejs.js --id PDM-EVM-682847 -d -o ./downloads'
  );
  process.exit(1);
}

/**
 * Main entry point
 */
async function main() {
  const args = parseArgs(process.argv.slice(2));

  // Validate arguments
  if (!args.list && !args.id) {
    printHelp();
  }

  if (args.id && !args.info && !args.download) {
    console.error('--id requires either -i (info) or -d (download)');
    printHelp();
  }

  try {
    if (args.list) {
      await cmdList();
    } else if (args.id) {
      if (args.info) {
        await cmdInfo(args.id);
      } else if (args.download) {
        await cmdDownload(args.id, args.output);
      }
    }
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
}

main();

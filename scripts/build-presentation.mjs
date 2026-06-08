#!/usr/bin/env node
/**
 * build-presentation.mjs
 *
 * Builds the BMI270 presentation Vite app and places the output in
 * extension/out/presentation/ so PresentationPanel.ts can serve it.
 *
 * Usage (from repo root):
 *   node scripts/build-presentation.mjs
 *
 * Or via npm script (add to root package.json):
 *   "build:presentation": "node scripts/build-presentation.mjs"
 */

import { execSync } from 'child_process'
import { existsSync, mkdirSync } from 'fs'
import { resolve, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = fileURLToPath(new URL('.', import.meta.url))
const ROOT = resolve(__dirname, '..')
const PRESENTATION_DIR = join(ROOT, 'presentation')
const OUT_DIR = join(ROOT, 'out', 'presentation')

console.log('🔨 Building BMI270 Presentation…')
console.log(`   Source: ${PRESENTATION_DIR}`)
console.log(`   Output: ${OUT_DIR}`)

// Install if needed
if (!existsSync(join(PRESENTATION_DIR, 'node_modules'))) {
  console.log('\n📦 Installing dependencies…')
  execSync('npm install', { cwd: PRESENTATION_DIR, stdio: 'inherit' })
}

// Build (Vite config outputs to ../out/presentation)
console.log('\n⚙️  Running Vite build…')
execSync('npm run build', { cwd: PRESENTATION_DIR, stdio: 'inherit' })

console.log('\n✅ Presentation built successfully.')
console.log(`   Reload the "BMI270 Presentation" panel in VS Code to see changes.`)

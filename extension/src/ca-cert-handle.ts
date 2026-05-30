import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { tmpdir, platform } from 'os';
import { execSync } from 'child_process';
import { WebviewMessage } from './types';

/**
 * Handle CA certificate installation request from webview
 * @param panel - The webview panel to send messages to
 * @param message - The message containing certificate content
 */
export async function handleCaCertInstall(
  panel: vscode.WebviewPanel,
  message: WebviewMessage
): Promise<void> {
  const { certContent, certPath } = message;

  if (!certContent) {
    panel.webview.postMessage({
      type: 'ca-cert-install-result',
      success: false,
      message: 'Certificate content is required',
    });
    return;
  }

  // Validate certificate content looks like PEM
  if (!certContent.includes('-----BEGIN CERTIFICATE-----')) {
    panel.webview.postMessage({
      type: 'ca-cert-install-result',
      success: false,
      message: 'Invalid certificate format. Expected PEM format.',
    });
    return;
  }

  let tempFilePath: string | null = null;

  try {
    // Create temporary file for certificate
    const tempDir = tmpdir();
    const tempFileName = `t3d-ca-cert-${Date.now()}.pem`;
    tempFilePath = path.join(tempDir, tempFileName);

    // Write certificate content to temporary file
    await fs.promises.writeFile(tempFilePath, certContent, 'utf8');

    // Install certificate using platform-specific commands
    // This implements the same logic as T3D/tools/ca/install-ca.ts
    const currentPlatform = platform();
    const DEFAULT_LINUX_DEST =
      '/usr/local/share/ca-certificates/dev-root-ca.crt';

    const runCommand = (cmd: string): void => {
      console.log(`> ${cmd}`);
      execSync(cmd, {
        stdio: 'inherit',
        shell: process.platform === 'win32' ? 'cmd.exe' : '/bin/bash',
      });
    };

    console.log(`Detected platform: ${currentPlatform}`);

    try {
      if (currentPlatform === 'win32') {
        console.log(
          '🔧 Installing CA on Windows (Trusted Root Certification Authorities)...'
        );
        // NOTE: `ca-chain.pem` often contains BOTH the Root CA and Intermediate CA(s).
        // Some servers do not reliably send the intermediate during TLS handshake, and
        // Chromium (VS Code webview) may fail to build the chain unless the intermediate
        // is present in the Intermediate Certification Authorities store.
        //
        // To be robust, install into BOTH:
        // - Root (Trusted Root Certification Authorities)
        // - CA   (Intermediate Certification Authorities)
        //
        // `certutil` will ignore/skip any certs that don't apply.
        runCommand(`certutil -addstore -f Root "${tempFilePath}"`);
        runCommand(`certutil -addstore -f CA "${tempFilePath}"`);
      } else if (currentPlatform === 'darwin') {
        console.log('🔧 Installing CA on macOS System keychain...');
        runCommand(
          `sudo security add-trusted-cert -d -r trustRoot -k /Library/Keychains/System.keychain "${tempFilePath}"`
        );
      } else if (currentPlatform === 'linux') {
        console.log('🔧 Installing CA on Linux system trust store...');
        runCommand(`sudo cp "${tempFilePath}" "${DEFAULT_LINUX_DEST}"`);
        runCommand(`sudo update-ca-certificates`);
      } else {
        throw new Error('Unsupported platform for automatic CA install.');
      }

      console.log('\n✅ CA installation commands executed.');
      console.log('   Restart your browsers / VS Code to pick it up.');
    } catch (cmdError) {
      const errorMessage =
        cmdError instanceof Error ? cmdError.message : String(cmdError);

      // Provide platform-specific guidance
      let userGuidance = '';
      if (currentPlatform === 'win32') {
        userGuidance =
          ' This operation requires administrator privileges. Please close VS Code and run it as Administrator (right-click VS Code → Run as administrator), then try again.';
      } else if (currentPlatform === 'darwin' || currentPlatform === 'linux') {
        userGuidance =
          ' This operation requires administrator privileges. Please enter your password when prompted by sudo.';
      }

      throw new Error(
        `Certificate installation command failed: ${errorMessage}.${userGuidance}`
      );
    }

    // Send success response
    panel.webview.postMessage({
      type: 'ca-cert-install-result',
      success: true,
      message:
        'Certificate installed successfully. Please restart your browser/VSCode for changes to take effect.',
    });

    // Cleanup temporary file after a short delay to ensure install completed
    setTimeout(async () => {
      if (tempFilePath) {
        try {
          await fs.promises.unlink(tempFilePath);
        } catch (error) {
          console.warn('Failed to cleanup temporary certificate file:', error);
        }
      }
    }, 2000);
  } catch (error) {
    // Send error response
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to install certificate';
    panel.webview.postMessage({
      type: 'ca-cert-install-result',
      success: false,
      message: `Certificate installation failed: ${errorMessage}`,
    });

    // Cleanup temporary file on error
    if (tempFilePath) {
      try {
        await fs.promises.unlink(tempFilePath);
      } catch (cleanupError) {
        console.warn(
          'Failed to cleanup temporary certificate file:',
          cleanupError
        );
      }
    }
  }
}

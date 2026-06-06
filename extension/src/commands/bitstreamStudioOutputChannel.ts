import * as vscode from "vscode";

const OUTPUT_CHANNEL_NAME = "Bitstream Studio";

let outputChannel: vscode.OutputChannel | undefined;

export function getBitstreamStudioOutputChannel(): vscode.OutputChannel {
  if (!outputChannel) {
    outputChannel = vscode.window.createOutputChannel(OUTPUT_CHANNEL_NAME);
  }
  return outputChannel;
}

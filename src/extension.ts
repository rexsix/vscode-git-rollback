import * as vscode from 'vscode';
import { exec } from 'child_process';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    let disposable = vscode.commands.registerCommand('git-rollback.rollback', async (uri: vscode.Uri) => {
        // Get the file path
        const filePath = uri.fsPath;
        const fileName = path.basename(filePath);
        const dirPath = path.dirname(filePath);

        // Check if git is installed and if we're in a git repository
        exec('git rev-parse --is-inside-work-tree', { cwd: dirPath }, async (error, stdout, stderr) => {
            if (error) {
                if (stderr.includes("not a git repository")) {
                    vscode.window.showWarningMessage('The current project is not under Git control. ');
                } else {
                    vscode.window.showErrorMessage('Git is not installed or not in the PATH.');
                }
                return;
            }

            if (stdout.trim() !== 'true') {
                vscode.window.showWarningMessage('The current project is not under Git control. Git Rollback cannot be performed.');
                return;
            }

            // Check if the file has changes
            exec(`git status --porcelain "${fileName}"`, { cwd: dirPath }, async (error, stdout, stderr) => {
                if (error) {
                    vscode.window.showErrorMessage(`Error: ${error.message}`);
                    return;
                }

                if (stderr) {
                    vscode.window.showErrorMessage(`Error: ${stderr}`);
                    return;
                }

                if (stdout.trim() === '') {
                    // No changes
                    vscode.window.showInformationMessage(`The file "${fileName}" has no changes. No rollback needed.`);
                } else {
                    // Changes detected, ask for confirmation
                    const confirmation = await vscode.window.showWarningMessage(
                        `Are you sure you want to rollback changes in "${fileName}"?`,
                        'Confirm',
                        'Cancel'
                    );

                    if (confirmation === 'Confirm') {
                        // Execute git restore command
                        exec(`git restore "${fileName}"`, { cwd: dirPath }, (error, stdout, stderr) => {
                            if (error) {
                                vscode.window.showErrorMessage(`Error: ${error.message}`);
                                return;
                            }
                            if (stderr) {
                                vscode.window.showErrorMessage(`Error: ${stderr}`);
                                return;
                            }
                            vscode.window.showInformationMessage(`Successfully rolled back changes in "${fileName}"`);
                        });
                    }
                }
            });
        });
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
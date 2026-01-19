
import { spawn } from 'child_process';

/**
 * Executes a PowerShell script and returns the result.
 * @param script The PowerShell script to execute.
 * @param timeoutMs Maximum time to wait for execution in milliseconds.
 * @returns Result object containing exit code, stdout, and stderr.
 */
export function runPowerShell(script: string, timeoutMs = 30000): Promise<{ code: number | null; stdout: string; stderr: string }> {
    return new Promise((resolve) => {
        let stdout = '';
        let stderr = '';
        let killed = false;

        // IMPORTANT: do NOT use `shell: true` here for PowerShell commands with complex parameters.
        const child = spawn('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', script], { windowsHide: true });

        const t = setTimeout(() => {
            killed = true;
            try {
                child.kill();
            } catch (error) {
                // Ignore kill errors
            }
        }, Math.max(500, timeoutMs));

        child.stdout.on('data', (d) => {
            stdout += d.toString();
        });

        child.stderr.on('data', (d) => {
            stderr += d.toString();
        });

        child.on('close', (code) => {
            clearTimeout(t);
            resolve({
                code: killed ? null : code,
                stdout,
                stderr,
            });
        });

        child.on('error', (err) => {
            clearTimeout(t);
            resolve({
                code: 1,
                stdout,
                stderr: stderr + (err.message || String(err)),
            });
        });
    });
}

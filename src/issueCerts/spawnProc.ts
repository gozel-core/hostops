import { spawn } from "node:child_process";
import process from "node:process";

export async function spawnProc(
    cmd: string,
    args: string[],
    opts?: Record<string, unknown>,
) {
    return new Promise((resolve, reject) => {
        const defaultOpts = {
            cwd: process.cwd(),
            env: process.env,
            timeout: 1000 * 60 * 5,
        };
        const finalOpts = Object.assign({}, defaultOpts, opts || {});

        const proc = spawn(cmd, args, finalOpts);

        proc.stdout.on("data", (data) => {
            process.stdout.write(`subprocess/stdout: ${data}`);
        });

        proc.stderr.on("data", (data) => {
            process.stderr.write(`subprocess/stderr: ${data}`);
        });

        proc.on("error", (err) => {
            return reject(err);
        });

        proc.on("close", (code: number) => {
            return resolve(code);
        });
    });
}

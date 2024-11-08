import * as path from "node:path";
import { verifyDnsEnv } from "./verifyDnsEnv";
import { parseHostname } from "../lib/parseHostname";
import { spawnProc } from "./spawnProc";
import { getAcmeShExec } from "../lib/getAcmeShExec";

export async function issueCerts(options: CmdIssueCertsOpts) {
    console.log("Issue certs began...");

    console.log("Verifying env vars...");
    verifyDnsEnv(options.dns);
    console.log("Verifying env vars... Done.");

    const acme = getAcmeShExec();
    const parsedHost = parseHostname(options.host);
    if (!parsedHost.primary) throw new Error(`Failed to parse host.`);

    const issueArgs: string[] = ["--issue", "-d", parsedHost.primary];
    if (parsedHost.secondary) issueArgs.push("-d", parsedHost.secondary);
    issueArgs.push(
        "--dns",
        options.dns === "cloudflare" ? "dns_gandi_livedns" : "dns_cf",
    );
    if (options.test) issueArgs.push("--test");
    if (options.debug) issueArgs.push("--debug");

    console.log("Obtaining ssl certs...");

    // obtain certs
    try {
        const exitCode = await spawnProc(acme, issueArgs);

        if (exitCode !== 0) return;
    } catch (e) {
        throw new Error("Subprocess error.", { cause: e });
    }

    console.log("Obtaining ssl certs... Done.");

    const certDestPath = path.join(options.sslCertsRoot, parsedHost.primary);
    const certFullchainPath = path.join(certDestPath, "fullchain.pem");
    const certKeyPath = path.join(certDestPath, "key.pem");

    console.log("Creating certs destination path...");

    try {
        await spawnProc("mkdir", ["-p", certDestPath]);
    } catch (e) {
        throw new Error("Subprocess error.", { cause: e });
    }

    console.log("Creating certs destination path... Done.");

    const installArgs = [
        "--install-cert",
        "-d",
        parsedHost.primary,
        "--key-file",
        certKeyPath,
        "--fullchain-file",
        certFullchainPath,
    ];
    if (options.cmdOnRenew) installArgs.push("--reloadcmd", options.cmdOnRenew);
    if (options.test) installArgs.push("--test");
    if (options.debug) installArgs.push("--debug");

    try {
        const exitCode2 = await spawnProc(acme, installArgs);

        if (exitCode2 !== 0) return;
    } catch (e) {
        throw new Error("Subprocess error.", { cause: e });
    }

    console.log("Issue certs began... Done.");
}

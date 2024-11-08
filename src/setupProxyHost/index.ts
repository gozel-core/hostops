import { parseHostname } from "../lib/parseHostname";
import path from "node:path";
import { getHostConf } from "../lib/hostConf";
import { writeFile } from "node:fs/promises";
import { spawnProc } from "../issueCerts/spawnProc";

export async function setupProxyHost(options: CmdSetupProxyHost) {
    console.log("Setting up proxy host...");

    const parsedHost = parseHostname(options.host);
    if (!parsedHost.primary) throw new Error(`Failed to parse host.`);

    console.log("Generating nginx conf file...");

    const confsRoot = "/etc/nginx/conf.d";
    const confPath = path.join(confsRoot, parsedHost.primary + ".conf");
    const serverNames = [parsedHost.primary];
    if (parsedHost.secondary) serverNames.push(parsedHost.secondary);
    const sslCertPath = path.join(
        options.sslCertsRoot,
        parsedHost.primary,
        "fullchain.pem",
    );
    const sslCertKeyPath = path.join(
        options.sslCertsRoot,
        parsedHost.primary,
        "key.pem",
    );
    const hostConfContent = getHostConf({
        template: "standardProxy",
        serverName: serverNames.join(" "),
        sslCert: sslCertPath,
        sslCertKey: sslCertKeyPath,
        proxyPass: options.proxyPass,
    });

    try {
        await writeFile(confPath, hostConfContent);
    } catch (e) {
        throw new Error("Failed to write nginx conf file.", { cause: e });
    }

    console.log("Generating nginx conf file... Done.");

    console.log("Test nginx conf...");

    try {
        const exitCode = await spawnProc("service", ["nginx", "configtest"]);
        if (exitCode !== 0) return;
    } catch (e) {
        throw new Error("Subprocess error.", { cause: e });
    }

    console.log("Test nginx conf... Done.");

    console.log("Reload nginx file...");

    try {
        const exitCode = await spawnProc("service", ["nginx", "force-reload"]);
        if (exitCode !== 0) return;
    } catch (e) {
        throw new Error("Subprocess error.", { cause: e });
    }

    console.log("Reload nginx file... Done.");

    console.log("Setting up proxy host... Done.");
}

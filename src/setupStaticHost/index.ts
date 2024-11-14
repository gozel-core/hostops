import { parseHostname } from "../lib/parseHostname";
import { fsUtil } from "@gozel-core/standard-js-backend";
import path from "node:path";
import { spawnProc } from "../issueCerts/spawnProc";
import { getHostConf } from "../lib/hostConf";
import { writeFile } from "node:fs/promises";

export async function setupStaticHost(options: CmdSetupStaticHost) {
    console.log("Setting up static host...");

    const parsedHost = parseHostname(options.host);
    if (!parsedHost.primary) throw new Error(`Failed to parse host.`);

    console.log("Verifying host path...");
    const hostsRoot = options.hostsRoot;
    const hostPath = options.env
        ? path.join(hostsRoot, parsedHost.primary, options.env)
        : path.join(hostsRoot, parsedHost.primary);

    await fsUtil.verifyDir(hostPath, true);

    console.log("Verifying host path... Done.");

    console.log("Verifying host path ownership & permissions...");

    if (options.user) {
        try {
            const exitCode = await spawnProc("chown", [options.user, hostPath]);
            if (exitCode !== 0) return;
        } catch (e) {
            throw new Error("Subprocess error.", { cause: e });
        }
    }

    if (options.group) {
        try {
            const exitCode = await spawnProc("chgrp", [
                options.group,
                hostPath,
            ]);
            if (exitCode !== 0) return;
        } catch (e) {
            throw new Error("Subprocess error.", { cause: e });
        }
    }

    if (options.chmod) {
        try {
            const exitCode = await spawnProc("chmod", [
                options.chmod,
                hostPath,
            ]);
            if (exitCode !== 0) return;
        } catch (e) {
            throw new Error("Subprocess error.", { cause: e });
        }
    }

    console.log("Verifying host path ownership & permissions... Done.");

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
        template: "standardStatic",
        serverName: serverNames.join(" "),
        sslCert: sslCertPath,
        sslCertKey: sslCertKeyPath,
        locationRoot: hostPath,
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

    console.log("Setting up static host... Done.");
}

import { parseHostname } from "../lib/parseHostname";
import { fsUtil } from "@gozel/backend";
import path from "node:path";
import { spawnProc } from "../issueCerts/spawnProc";
import prompts from "prompts";
import { rmdir } from "node:fs/promises";
import { getAcmeShExec } from "../lib/getAcmeShExec";

export async function removeHost(options: CmdRemoveHost) {
    console.log("Removing host...");

    const parsedHost = parseHostname(options.host);
    if (!parsedHost.primary) throw new Error(`Failed to parse host.`);

    console.log("Removing static host path...");
    const hostsRoot = options.hostsRoot;
    const hostPath = path.join(hostsRoot, parsedHost.primary);
    const hasHostDir = await fsUtil.isFileExists(hostPath);
    if (hasHostDir) {
        const res = options.interactive
            ? await prompts({
                  type: "confirm",
                  name: "value",
                  message: `Do you approve removing "${hostPath}"?`,
                  initial: true,
              })
            : { value: false };
        if (res.value) {
            try {
                const exitCode = await spawnProc("rm", ["-rf", hostPath]);
                if (exitCode !== 0) return;
            } catch (e) {
                throw new Error("Subprocess error.", { cause: e });
            }
        }
    }
    console.log("Removing static host path... Done.");

    console.log("Removing nginx conf...");
    const confsRoot = "/etc/nginx/conf.d";
    const confPath = path.join(confsRoot, parsedHost.primary + ".conf");
    const hasConfFile = await fsUtil.isFileExists(confPath);
    if (hasConfFile) {
        const res2 = options.interactive
            ? await prompts({
                  type: "confirm",
                  name: "value",
                  message: `Do you approve removing "${confPath}"?`,
                  initial: true,
              })
            : { value: false };
        if (res2.value) {
            try {
                const exitCode = await spawnProc("rm", [confPath]);
                if (exitCode !== 0) return;
            } catch (e) {
                throw new Error("Subprocess error.", { cause: e });
            }
        }
    }
    console.log("Removing nginx conf... Done.");

    if (hasConfFile) {
        console.log("Test nginx conf...");

        try {
            const exitCode = await spawnProc("service", [
                "nginx",
                "configtest",
            ]);
            if (exitCode !== 0) return;
        } catch (e) {
            throw new Error("Subprocess error.", { cause: e });
        }

        console.log("Test nginx conf... Done.");

        console.log("Reload nginx file...");

        try {
            const exitCode = await spawnProc("service", [
                "nginx",
                "force-reload",
            ]);
            if (exitCode !== 0) return;
        } catch (e) {
            throw new Error("Subprocess error.", { cause: e });
        }

        console.log("Reload nginx file... Done.");
    }

    const res3 = options.interactive
        ? await prompts({
              type: "confirm",
              name: "value",
              message: `Do you approve revoking + removing ssl certs too?`,
              initial: true,
          })
        : { value: false };
    if (res3.value) {
        console.log("Removing ssl certs...");

        const acme = getAcmeShExec();

        try {
            const exitCode = await spawnProc(acme, [
                "--revoke",
                "-d",
                parsedHost.primary,
            ]);
            if (exitCode !== 0) return;
        } catch (e) {
            throw new Error("Subprocess error.", { cause: e });
        }

        try {
            const exitCode = await spawnProc(acme, [
                "--remove",
                "-d",
                parsedHost.primary,
            ]);
            if (exitCode !== 0) return;
        } catch (e) {
            throw new Error("Subprocess error.", { cause: e });
        }

        const acmeDomainDir = path.join(
            path.dirname(acme),
            parsedHost.primary + "_ecc",
        );
        const isAcmeDomainDirExists = await fsUtil.isFileExists(acmeDomainDir);
        if (isAcmeDomainDirExists) {
            const res4 = options.interactive
                ? await prompts({
                      type: "confirm",
                      name: "value",
                      message: `Do you approve removing "${acmeDomainDir}"?`,
                      initial: true,
                  })
                : { value: false };
            if (res4.value) {
                await rmdir(acmeDomainDir);
            }
        } else {
            console.log("Acme domain directory not found.");
        }

        const hostSslPath = path.join(options.sslCertsRoot, parsedHost.primary);
        const isHostSslDirExists = await fsUtil.isFileExists(hostSslPath);
        if (isHostSslDirExists) {
            await rmdir(hostSslPath);
        }

        console.log("Removing ssl certs... Done.");
    }

    console.log("Removing host... Done.");
}

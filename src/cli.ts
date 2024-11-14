#!/usr/bin/env node

import { Command } from "commander";
import { getExecName } from "./getExecName";
import pkg from "../package.json";
import { setupStaticHost } from "./setupStaticHost/index";
import { setupProxyHost } from "./setupProxyHost/index";
import { removeHost } from "./removeHost/index";

const program = new Command();

program.name(getExecName()).description(pkg.description).version(pkg.version);

program
    .command("static-host")
    .requiredOption(
        "-h, --host <string>",
        "Hostname. (www will be added if necessary)",
    )
    .option(
        "-e, --env <string>",
        "Deploy environment. This will be a subpath for nginx location root.",
        "latest",
    )
    .option("--user <string>", "Owner of the host directory.", "nginx")
    .option("--group <string>", "Group owner of the host directory.", "nginx")
    .option("--chmod <string>", "Specify chmod command for the host directory.")
    .option(
        "--hosts-root <string>",
        "The absolute path that the host folder will be stored.",
        "/usr/share/nginx",
    )
    .option(
        "--ssl-certs-root <string>",
        "The absolute path that the cert folder will be stored.",
        "/etc/nginx/ssl",
    )
    .action(async (options: CmdSetupStaticHost) => {
        await setupStaticHost(options);
    });

program
    .command("proxy-host")
    .requiredOption(
        "-h, --host <string>",
        "Hostname. (www will be added if necessary)",
    )
    .requiredOption(
        "--proxy-pass <string>",
        "The absolute path for the host folder.",
    )
    .option(
        "--ssl-certs-root <string>",
        "The absolute path for the cert folder.",
        "/etc/nginx/ssl",
    )
    .action(async (options: CmdSetupProxyHost) => {
        await setupProxyHost(options);
    });

program
    .command("remove-host")
    .requiredOption(
        "-h, --host <string>",
        "Hostname. (www will be added if necessary)",
    )
    .option(
        "--hosts-root <string>",
        "The absolute path for the host folder.",
        "/usr/share/nginx",
    )
    .option("--no-interactive", "Disable file and folder removal prompts.")
    .option(
        "--ssl-certs-root <string>",
        "The absolute path for the cert folder.",
        "/etc/nginx/ssl",
    )
    .action(async (options: CmdRemoveHost) => {
        await removeHost(options);
    });

/*
program
    .command("issue-certs")
    .requiredOption(
        "-h, --host <string>",
        "Host name to issue certs. (www will be added if necessary)",
    )
    .requiredOption(
        "-d, --dns <string>",
        "DNS provider of the Host. Either cloudflare or gandi.",
    )
    .option(
        "--ssl-certs-root <string>",
        "The absolute path that the cert folder will be stored.",
        "/etc/nginx/ssl",
    )
    .option(
        "--cmd-on-renew <string>",
        "Command to execute cert renewal.",
        "service nginx force-reload",
    )
    .option("--test", "Test your command.", false)
    .option("--debug", "Enable debugging.", false)
    .action(async (options: CmdIssueCertsOpts) => {
        await issueCerts(options);
    });
*/

program.parse();

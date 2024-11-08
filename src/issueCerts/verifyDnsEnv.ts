export function verifyDnsEnv(dns: string) {
    if (dns === "cloudflare") {
        if (process.env.CF_Email && process.env.CF_Key) return true;

        throw new Error(
            `Failed to verify env vars. ` +
                `The dns:cloudflare needs CF_Email and CF_Key to be set.`,
        );
    }

    if (dns === "gandi") {
        if (process.env.GANDI_LIVEDNS_KEY) return true;

        throw new Error(
            `Failed to verify env vars. ` +
                `The dns:gandi needs GANDI_LIVEDNS_KEY to be set.`,
        );
    }

    throw new Error(
        `Failed to verify env vars. ` +
            `Only cloudflare and gandi supported as dns options.`,
    );
}

import { parse } from "tldts";

export function parseHostname(host: string): ParsedHostname {
    const result = parse(host) as ParseResult;

    if (result.subdomain === "www")
        return { primary: result.domain, secondary: result.hostname };
    else if (result.subdomain)
        return { primary: result.hostname, secondary: null };
    else
        return {
            primary: result.hostname,
            secondary: `www.${result.hostname}`,
        };
}

export interface ParsedHostname {
    primary: string | null;
    secondary: string | null;
}

export interface ParseResult {
    domain: string | null;
    domainWithoutSuffix: string | null;
    hostname: string | null;
    isIcann: boolean | null;
    isIp: boolean | null;
    isPrivate: boolean | null;
    publicSuffix: string | null;
    subdomain: string | null;
}

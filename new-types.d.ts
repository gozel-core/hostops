declare global {
    namespace NodeJS {
        interface ProcessEnv {
            CF_Key?: string
            CF_Email?: string
            GANDI_LIVEDNS_KEY?: string
        }
    }

    interface CmdIssueCertsOpts {
        host: string
        dns: string
        sslCertsRoot: string
        cmdOnRenew: string
        test: boolean
        debug: boolean
    }

    interface CmdSetupStaticHost {
        host: string
        user: string
        group: string
        chmod: string
        hostsRoot: string
        sslCertsRoot: string
    }

    interface CmdSetupProxyHost {
        host: string
        proxyPass: string
        sslCertsRoot: string
    }

    interface CmdRemoveHost {
        host: string
        hostsRoot: string
        interactive: boolean
        sslCertsRoot: string
    }
}

export {}

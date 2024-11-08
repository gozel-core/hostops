import * as path from "node:path";
import * as os from "node:os";

export function getAcmeShExec() {
    return path.join(os.homedir(), ".acme.sh", "acme.sh");
}

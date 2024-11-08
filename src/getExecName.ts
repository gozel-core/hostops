import pkg from "../package.json";

export function getExecName() {
    return Object.keys(pkg.bin)[0]!;
}

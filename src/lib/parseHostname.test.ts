import { test, expect } from "vitest";
import { parseHostname } from "./parseHostname";

test("hostname with www", () => {
    const result = parseHostname("www.abc.com");
    expect(result.primary).toBe("abc.com");
    expect(result.secondary).toBe("www.abc.com");
});

test("hostname sub.abc.com", () => {
    const result = parseHostname("sub.abc.com");
    expect(result.primary).toBe("sub.abc.com");
    expect(result.secondary).toBe(null);
});

test("hostname abc.com", () => {
    const result = parseHostname("abc.com");
    expect(result.primary).toBe("abc.com");
    expect(result.secondary).toBe("www.abc.com");
});

test("hostname sub.abc.com.tr", () => {
    const result = parseHostname("sub.abc.com.tr");
    expect(result.primary).toBe("sub.abc.com.tr");
    expect(result.secondary).toBe(null);
});

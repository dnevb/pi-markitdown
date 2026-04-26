import { describe, expect, it } from "vitest";
import { truncateOutput } from "./output";

const MAX_SIZE = 50 * 1024;

describe("truncateOutput", () => {
	it("returns text unchanged when under limit", () => {
		const text = "small output";
		expect(truncateOutput(text)).toBe(text);
	});

	it("returns text unchanged at exact limit", () => {
		const text = "a".repeat(MAX_SIZE);
		expect(truncateOutput(text)).toBe(text);
	});

	it("truncates text over limit and appends warning", () => {
		const text = "b".repeat(MAX_SIZE + 100);
		const result = truncateOutput(text);
		expect(result.length).toBeLessThan(text.length);
		expect(result).toContain("[Output truncated");
		expect(result.startsWith("b".repeat(MAX_SIZE))).toBe(true);
	});
});

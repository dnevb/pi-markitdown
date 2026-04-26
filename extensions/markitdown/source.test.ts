import { describe, expect, it } from "vitest";
import { isUrl, resolveSource } from "./source";

describe("isUrl", () => {
	it("returns true for http URLs", () => {
		expect(isUrl("http://example.com")).toBe(true);
	});

	it("returns true for https URLs", () => {
		expect(isUrl("https://example.com/doc.pdf")).toBe(true);
	});

	it("returns false for file paths", () => {
		expect(isUrl("/path/to/file.pdf")).toBe(false);
		expect(isUrl("./relative.pdf")).toBe(false);
	});
});

describe("resolveSource", () => {
	it("passes URLs through unchanged", () => {
		expect(resolveSource("https://example.com/doc.pdf", "/home/user")).toBe(
			"https://example.com/doc.pdf",
		);
		expect(resolveSource("http://localhost:8080/file.html", "/home/user")).toBe(
			"http://localhost:8080/file.html",
		);
	});

	it("resolves relative paths against cwd", () => {
		expect(resolveSource("./doc.pdf", "/home/user")).toBe("/home/user/doc.pdf");
		expect(resolveSource("../doc.pdf", "/home/user/dir")).toBe("/home/user/doc.pdf");
	});

	it("passes absolute paths unchanged", () => {
		expect(resolveSource("/absolute/path.pdf", "/home/user")).toBe("/absolute/path.pdf");
	});
});

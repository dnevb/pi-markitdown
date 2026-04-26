import { describe, expect, it, vi } from "vitest";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { resolveSource, buildArgs, detectBinary } from "./index";

function createMockPI(
	results: Map<string, { code: number; stdout: string; stderr: string }>,
): ExtensionAPI {
	return {
		exec: vi.fn(async (binary: string, args: string[]) => {
			const key = `${binary} ${args.join(" ")}`;
			const result = results.get(key);
			if (!result) throw new Error("ENOENT");
			return result;
		}),
	} as unknown as ExtensionAPI;
}

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

describe("buildArgs", () => {
	it("builds minimal args with source only", () => {
		expect(buildArgs({ source: "doc.pdf" })).toEqual(["doc.pdf"]);
	});

	it("adds --use-plugins flag", () => {
		expect(buildArgs({ source: "doc.pdf", use_plugins: true })).toEqual([
			"--use-plugins",
			"doc.pdf",
		]);
	});

	it("adds docintel flags", () => {
		expect(
			buildArgs({ source: "doc.pdf", docintel_endpoint: "https://endpoint.com" }),
		).toEqual(["-d", "-e", "https://endpoint.com", "doc.pdf"]);
	});

	it("adds output path", () => {
		expect(buildArgs({ source: "doc.pdf", output_path: "out.md" })).toEqual([
			"doc.pdf",
			"-o",
			"out.md",
		]);
	});

	it("combines all flags", () => {
		expect(
			buildArgs({
				source: "doc.pdf",
				use_plugins: true,
				docintel_endpoint: "https://endpoint.com",
				output_path: "out.md",
			}),
		).toEqual([
			"--use-plugins",
			"-d",
			"-e",
			"https://endpoint.com",
			"doc.pdf",
			"-o",
			"out.md",
		]);
	});
});

describe("detectBinary", () => {
	it("uses MARKITDOWN_PATH when set", async () => {
		process.env.MARKITDOWN_PATH = "/custom/markitdown";
		const pi = createMockPI(new Map());
		const config = await detectBinary(pi);
		expect(config.binary).toBe("/custom/markitdown");
		expect(config.prefixArgs).toEqual([]);
		delete process.env.MARKITDOWN_PATH;
	});

	it("prefers direct markitdown binary", async () => {
		const results = new Map([
			["markitdown --version", { code: 0, stdout: "1.0.0", stderr: "" }],
		]);
		const pi = createMockPI(results);
		const config = await detectBinary(pi);
		expect(config.binary).toBe("markitdown");
		expect(config.prefixArgs).toEqual([]);
	});

	it("falls back to pipx when direct markitdown missing", async () => {
		const results = new Map([
			["pipx run markitdown --version", { code: 0, stdout: "1.0.0", stderr: "" }],
		]);
		const pi = createMockPI(results);
		const config = await detectBinary(pi);
		expect(config.binary).toBe("pipx");
		expect(config.prefixArgs).toEqual(["run", "markitdown"]);
	});

	it("falls back to uvx when pipx missing", async () => {
		const results = new Map([
			["uvx markitdown --version", { code: 0, stdout: "1.0.0", stderr: "" }],
		]);
		const pi = createMockPI(results);
		const config = await detectBinary(pi);
		expect(config.binary).toBe("uvx");
		expect(config.prefixArgs).toEqual(["markitdown"]);
	});

	it("falls back to mise when uvx missing", async () => {
		const results = new Map([
			["mise exec -- markitdown --version", { code: 0, stdout: "1.0.0", stderr: "" }],
		]);
		const pi = createMockPI(results);
		const config = await detectBinary(pi);
		expect(config.binary).toBe("mise");
		expect(config.prefixArgs).toEqual(["exec", "--", "markitdown"]);
	});

	it("throws with install instructions when all runners missing", async () => {
		const pi = createMockPI(new Map());
		await expect(detectBinary(pi)).rejects.toThrow("markitdown CLI not found");
	});
});

import { describe, expect, it, vi } from "vitest";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { executeMarkitdown } from "./index";

function createMockPI(
	execImpl: (binary: string, args: string[], options?: { signal?: AbortSignal; timeout?: number }) => Promise<{ code: number; stdout: string; stderr: string }>,
): ExtensionAPI {
	return {
		exec: vi.fn(execImpl),
	} as unknown as ExtensionAPI;
}

describe("executeMarkitdown", () => {
	it("returns markdown output on success", async () => {
		const pi = createMockPI(async (_binary, args) => {
			if (args.includes("--version")) {
				return { code: 0, stdout: "1.0.0", stderr: "" };
			}
			return {
				code: 0,
				stdout: "# Hello World\n\nThis is markdown.",
				stderr: "",
			};
		});

		const result = await executeMarkitdown(pi, { source: "doc.pdf" }, undefined, "/home/user");

		expect(result.isError).toBeUndefined();
		expect(result.content).toHaveLength(1);
		expect(result.content[0].text).toBe("# Hello World\n\nThis is markdown.");
	});

	it("returns isError with stderr on non-zero exit code (V5)", async () => {
		const pi = createMockPI(async (_binary, args) => {
			if (args.includes("--version")) {
				return { code: 0, stdout: "1.0.0", stderr: "" };
			}
			return {
				code: 1,
				stdout: "",
				stderr: "Error: unsupported file format",
			};
		});

		const result = await executeMarkitdown(pi, { source: "bad.xyz" }, undefined, "/home/user");

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("markitdown exited with code 1");
		expect(result.content[0].text).toContain("Error: unsupported file format");
		expect(result.details).toEqual({ code: 1 });
	});

	it("returns install instructions when binary missing (V2)", async () => {
		const pi = createMockPI(async () => {
			throw new Error("ENOENT");
		});

		const result = await executeMarkitdown(pi, { source: "doc.pdf" }, undefined, "/home/user");

		expect(result.isError).toBe(true);
		expect(result.content[0].text).toContain("markitdown CLI not found");
		expect(result.content[0].text).toContain("pipx install markitdown");
	});

	it("passes use_plugins flag through to exec", async () => {
		const pi = createMockPI(async (_binary, args) => {
			if (args.includes("--version")) {
				return { code: 0, stdout: "1.0.0", stderr: "" };
			}
			expect(args).toContain("--use-plugins");
			return { code: 0, stdout: "# Markdown", stderr: "" };
		});

		await executeMarkitdown(pi, { source: "doc.pdf", use_plugins: true }, undefined, "/home/user");
		expect(pi.exec).toHaveBeenCalled();
	});

	it("passes docintel_endpoint flag through to exec", async () => {
		const pi = createMockPI(async (_binary, args) => {
			if (args.includes("--version")) {
				return { code: 0, stdout: "1.0.0", stderr: "" };
			}
			expect(args).toContain("-d");
			expect(args).toContain("-e");
			expect(args).toContain("https://endpoint.com");
			return { code: 0, stdout: "# Markdown", stderr: "" };
		});

		await executeMarkitdown(pi, { source: "doc.pdf", docintel_endpoint: "https://endpoint.com" }, undefined, "/home/user");
		expect(pi.exec).toHaveBeenCalled();
	});

	it("resolves relative source paths against cwd", async () => {
		const pi = createMockPI(async (_binary, args) => {
			if (args.includes("--version")) {
				return { code: 0, stdout: "1.0.0", stderr: "" };
			}
			expect(args).toContain("/home/user/docs/doc.pdf");
			return { code: 0, stdout: "# Markdown", stderr: "" };
		});

		await executeMarkitdown(pi, { source: "./docs/doc.pdf" }, undefined, "/home/user");
		expect(pi.exec).toHaveBeenCalled();
	});

	it("passes URLs unchanged to exec", async () => {
		const pi = createMockPI(async (_binary, args) => {
			if (args.includes("--version")) {
				return { code: 0, stdout: "1.0.0", stderr: "" };
			}
			expect(args).toContain("https://example.com/doc.pdf");
			return { code: 0, stdout: "# Markdown", stderr: "" };
		});

		await executeMarkitdown(pi, { source: "https://example.com/doc.pdf" }, undefined, "/home/user");
		expect(pi.exec).toHaveBeenCalled();
	});
});

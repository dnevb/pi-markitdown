import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";
import { resolve } from "node:path";

const INSTALL_INSTRUCTIONS = `markitdown CLI not found.

Install via one of:
  pipx install markitdown
  uv tool install markitdown
  mise use -g markitdown

Or set MARKITDOWN_PATH environment variable.`;

function isUrl(source: string): boolean {
	return source.startsWith("http://") || source.startsWith("https://");
}

export function resolveSource(source: string, cwd: string): string {
	if (isUrl(source)) return source;
	return resolve(cwd, source);
}

export function buildArgs(params: {
	source: string;
	output_path?: string;
	use_plugins?: boolean;
	docintel_endpoint?: string;
}): string[] {
	const args: string[] = [];
	if (params.use_plugins) args.push("--use-plugins");
	if (params.docintel_endpoint) args.push("-d", "-e", params.docintel_endpoint);
	args.push(params.source);
	if (params.output_path) args.push("-o", params.output_path);
	return args;
}

type BinaryConfig = {
	binary: string;
	prefixArgs: string[];
};

export async function detectBinary(pi: ExtensionAPI): Promise<BinaryConfig> {
	const envPath = process.env.MARKITDOWN_PATH;
	if (envPath) {
		return { binary: envPath, prefixArgs: [] };
	}

	const runners: { binary: string; prefixArgs: string[]; probeArgs: string[] }[] = [
		{ binary: "markitdown", prefixArgs: [], probeArgs: ["--version"] },
		{ binary: "pipx", prefixArgs: ["run", "markitdown"], probeArgs: ["run", "markitdown", "--version"] },
		{ binary: "uvx", prefixArgs: ["markitdown"], probeArgs: ["markitdown", "--version"] },
		{ binary: "mise", prefixArgs: ["exec", "--", "markitdown"], probeArgs: ["exec", "--", "markitdown", "--version"] },
	];

	for (const runner of runners) {
		try {
			const result = await pi.exec(runner.binary, runner.probeArgs, { timeout: 5000 });
			if (result.code === 0) {
				return { binary: runner.binary, prefixArgs: runner.prefixArgs };
			}
		} catch {
			continue;
		}
	}

	throw new Error(INSTALL_INSTRUCTIONS);
}

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "markitdown",
		label: "MarkItDown",
		description: "Convert files (PDF, DOCX, PPTX, XLSX, images, audio, HTML, etc.) or URLs to markdown via the markitdown CLI.",
		parameters: Type.Object({
			source: Type.String({ description: "Path to file or URL to convert." }),
			output_path: Type.Optional(Type.String({ description: "Write markdown to this file path instead of returning it." })),
			use_plugins: Type.Optional(Type.Boolean({ description: "Enable markitdown plugins via --use-plugins." })),
			docintel_endpoint: Type.Optional(Type.String({ description: "Document Intelligence endpoint URL, passed as -d -e <endpoint>." })),
		}),

		async execute(_toolCallId, params, signal, _onUpdate, ctx) {
			try {
				const { binary, prefixArgs } = await detectBinary(pi);
				const source = resolveSource(params.source, ctx.cwd);
				const outputPath = params.output_path ? resolve(ctx.cwd, params.output_path) : undefined;

				const args = [...prefixArgs, ...buildArgs({
					...params,
					source,
					output_path: outputPath,
				})];

				const result = await pi.exec(binary, args, { signal });

				if (result.code !== 0) {
					return {
						isError: true,
						content: [{
							type: "text",
							text: `markitdown exited with code ${result.code}:\n${result.stderr || result.stdout || ""}`,
						}],
						details: { code: result.code },
					};
				}

				return {
					content: [{ type: "text", text: result.stdout }],
					details: {},
				};
			} catch (err) {
				return {
					isError: true,
					content: [{
						type: "text",
						text: err instanceof Error ? err.message : String(err),
					}],
					details: {},
				};
			}
		},
	});
}

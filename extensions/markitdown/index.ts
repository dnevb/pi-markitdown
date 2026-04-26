import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";
import { resolve } from "node:path";
import { resolveSource } from "./source";
import { buildArgs } from "./args";
import { detectBinary } from "./binary";
import { truncateOutput } from "./output";

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
					content: [{ type: "text", text: truncateOutput(result.stdout) }],
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

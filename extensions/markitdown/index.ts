import type { ExtensionAPI, ExtensionContext } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";
import { resolve } from "node:path";

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

	if (params.use_plugins) {
		args.push("--use-plugins");
	}

	if (params.docintel_endpoint) {
		args.push("-d", "-e", params.docintel_endpoint);
	}

	args.push(params.source);

	if (params.output_path) {
		args.push("-o", params.output_path);
	}

	return args;
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
			const binary = process.env.MARKITDOWN_PATH ?? "markitdown";
			const source = resolveSource(params.source, ctx.cwd);
			const outputPath = params.output_path
				? resolve(ctx.cwd, params.output_path)
				: undefined;

			const args = buildArgs({
				...params,
				source,
				output_path: outputPath,
			});

			const result = await pi.exec(binary, args, { signal });

			if (result.code !== 0) {
				return {
					isError: true,
					content: [
						{
							type: "text",
							text: `markitdown exited with code ${result.code}:\n${result.stderr || result.stdout || ""}`,
						},
					],
					details: { code: result.code },
				};
			}

			return {
				content: [{ type: "text", text: result.stdout }],
				details: {},
			};
		},
	});
}

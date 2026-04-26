import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "typebox";

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
		async execute(_toolCallId, params, _signal, _onUpdate, _ctx) {
			return {
				content: [{ type: "text", text: "markitdown tool registered — shell-out logic not yet implemented." }],
				details: {},
			};
		},
	});
}

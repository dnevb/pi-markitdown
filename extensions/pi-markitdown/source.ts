import { resolve } from "node:path";

export function isUrl(source: string): boolean {
	return source.startsWith("http://") || source.startsWith("https://");
}

export function resolveSource(source: string, cwd: string): string {
	if (isUrl(source)) return source;
	return resolve(cwd, source);
}

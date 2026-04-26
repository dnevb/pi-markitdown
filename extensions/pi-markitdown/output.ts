const MAX_OUTPUT_SIZE = 50 * 1024;
const TRUNCATION_WARNING =
  '\n\n[Output truncated: exceeded 50KB limit. Use output_path param to write full content to file.]';

export function truncateOutput(text: string): string {
  if (text.length <= MAX_OUTPUT_SIZE) return text;
  return text.slice(0, MAX_OUTPUT_SIZE) + TRUNCATION_WARNING;
}

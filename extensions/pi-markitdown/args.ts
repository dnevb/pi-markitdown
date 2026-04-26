export function buildArgs(params: {
  source: string;
  output_path?: string;
  use_plugins?: boolean;
  docintel_endpoint?: string;
}): string[] {
  const args: string[] = [];
  if (params.use_plugins) args.push('--use-plugins');
  if (params.docintel_endpoint) args.push('-d', '-e', params.docintel_endpoint);
  args.push(params.source);
  if (params.output_path) args.push('-o', params.output_path);
  return args;
}

import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';

export const INSTALL_INSTRUCTIONS = `markitdown CLI not found.

Install via one of:
  pipx install 'markitdown[all]'
  uv tool install markitdown --with 'markitdown[all]'

Or set MARKITDOWN_PATH environment variable.`;

export type BinaryConfig = {
  binary: string;
  prefixArgs: string[];
};

export async function detectBinary(pi: ExtensionAPI): Promise<BinaryConfig> {
  const envPath = process.env.MARKITDOWN_PATH;
  if (envPath) {
    return { binary: envPath, prefixArgs: [] };
  }

  const runners: { binary: string; prefixArgs: string[]; probeArgs: string[] }[] = [
    { binary: 'markitdown', prefixArgs: [], probeArgs: ['--version'] },
    {
      binary: 'pipx',
      prefixArgs: ['run', 'markitdown'],
      probeArgs: ['run', 'markitdown', '--version'],
    },
    { binary: 'uvx', prefixArgs: ['markitdown'], probeArgs: ['markitdown', '--version'] },
  ];

  for (const runner of runners) {
    try {
      const result = await pi.exec(runner.binary, runner.probeArgs, { timeout: 5000 });
      if (result.code === 0) {
        return { binary: runner.binary, prefixArgs: runner.prefixArgs };
      }
    } catch {}
  }

  throw new Error(INSTALL_INSTRUCTIONS);
}

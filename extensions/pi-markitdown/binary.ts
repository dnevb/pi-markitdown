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

  const runners: { binary: string; prefixArgs: string[]; probeArgs: string[]; timeout: number }[] =
    [
      { binary: 'markitdown', prefixArgs: [], probeArgs: ['--version'], timeout: 5000 },
      {
        binary: 'pipx',
        prefixArgs: ['run', '--spec', 'markitdown[all]', 'markitdown'],
        probeArgs: ['run', '--spec', 'markitdown[all]', 'markitdown', '--version'],
        timeout: 40000,
      },
      {
        binary: 'uvx',
        prefixArgs: ['--from', 'markitdown[all]', 'markitdown'],
        probeArgs: ['--from', 'markitdown[all]', 'markitdown', '--version'],
        timeout: 40000,
      },
    ];

  for (const runner of runners) {
    try {
      const result = await pi.exec(runner.binary, runner.probeArgs, { timeout: runner.timeout });
      if (result.code === 0) {
        return { binary: runner.binary, prefixArgs: runner.prefixArgs };
      }
    } catch {}
  }

  throw new Error(INSTALL_INSTRUCTIONS);
}

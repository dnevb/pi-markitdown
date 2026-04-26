import type { ExtensionAPI } from '@mariozechner/pi-coding-agent';
import { describe, expect, it, vi } from 'vitest';
import { detectBinary } from './binary';

function createMockPI(
  results: Map<string, { code: number; stdout: string; stderr: string }>,
): ExtensionAPI {
  return {
    exec: vi.fn(async (binary: string, args: string[]) => {
      const key = `${binary} ${args.join(' ')}`;
      const result = results.get(key);
      if (!result) throw new Error('ENOENT');
      return result;
    }),
  } as unknown as ExtensionAPI;
}

describe('detectBinary', () => {
  it('uses MARKITDOWN_PATH when set', async () => {
    process.env.MARKITDOWN_PATH = '/custom/markitdown';
    const pi = createMockPI(new Map());
    const config = await detectBinary(pi);
    expect(config.binary).toBe('/custom/markitdown');
    expect(config.prefixArgs).toEqual([]);
    delete process.env.MARKITDOWN_PATH;
  });

  it('prefers direct markitdown binary', async () => {
    const results = new Map([['markitdown --version', { code: 0, stdout: '1.0.0', stderr: '' }]]);
    const pi = createMockPI(results);
    const config = await detectBinary(pi);
    expect(config.binary).toBe('markitdown');
    expect(config.prefixArgs).toEqual([]);
  });

  it('falls back to pipx when direct markitdown missing', async () => {
    const results = new Map([
      ['pipx run --spec markitdown[all] markitdown --version', { code: 0, stdout: '1.0.0', stderr: '' }],
    ]);
    const pi = createMockPI(results);
    const config = await detectBinary(pi);
    expect(config.binary).toBe('pipx');
    expect(config.prefixArgs).toEqual(['run', '--spec', 'markitdown[all]', 'markitdown']);
  });

  it('falls back to uvx when pipx missing', async () => {
    const results = new Map([
      ['uvx --with markitdown[all] markitdown --version', { code: 0, stdout: '1.0.0', stderr: '' }],
    ]);
    const pi = createMockPI(results);
    const config = await detectBinary(pi);
    expect(config.binary).toBe('uvx');
    expect(config.prefixArgs).toEqual(['--with', 'markitdown[all]', 'markitdown']);
  });

  it('throws with install instructions when all runners missing', async () => {
    const pi = createMockPI(new Map());
    await expect(detectBinary(pi)).rejects.toThrow('markitdown CLI not found');
  });
});

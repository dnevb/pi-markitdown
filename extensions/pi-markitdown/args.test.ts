import { describe, expect, it } from 'vitest';
import { buildArgs } from './args';

describe('buildArgs', () => {
  it('builds minimal args with source only', () => {
    expect(buildArgs({ source: 'doc.pdf' })).toEqual(['doc.pdf']);
  });

  it('adds --use-plugins flag', () => {
    expect(buildArgs({ source: 'doc.pdf', use_plugins: true })).toEqual([
      '--use-plugins',
      'doc.pdf',
    ]);
  });

  it('adds docintel flags', () => {
    expect(buildArgs({ source: 'doc.pdf', docintel_endpoint: 'https://endpoint.com' })).toEqual([
      '-d',
      '-e',
      'https://endpoint.com',
      'doc.pdf',
    ]);
  });

  it('adds output path', () => {
    expect(buildArgs({ source: 'doc.pdf', output_path: 'out.md' })).toEqual([
      'doc.pdf',
      '-o',
      'out.md',
    ]);
  });

  it('combines all flags', () => {
    expect(
      buildArgs({
        source: 'doc.pdf',
        use_plugins: true,
        docintel_endpoint: 'https://endpoint.com',
        output_path: 'out.md',
      }),
    ).toEqual(['--use-plugins', '-d', '-e', 'https://endpoint.com', 'doc.pdf', '-o', 'out.md']);
  });
});

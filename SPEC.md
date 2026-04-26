# SPEC

## §G GOAL
pi extension wrapping `markitdown` CLI. converts files (PDF, DOCX, PPTX, XLSX, images, audio, HTML, etc.) → markdown via tool call. enables LLM to ingest arbitrary documents.

## §C CONSTRAINTS
- TypeScript. pi extension API `@mariozechner/pi-coding-agent`.
- `markitdown` CLI ! required at runtime. extension detects absence & guides install.
- No Python-in-TS bundling. shell out to `markitdown` binary only.
- Supports local files & URLs (markitdown handles URLs natively).
- Extension file: `index.ts`. installs to `~/.pi/agent/extensions/markitdown/`.
- Test + lint via `vitest` & `@biomejs/biome`.

## §I INTERFACES
- tool: `markitdown` → converts file/URL to markdown.
  - param `source`: string — path or URL. required.
  - param `output_path`: string? — write markdown to file instead of returning.
  - param `use_plugins`: boolean? — pass `--use-plugins`.
  - param `docintel_endpoint`: string? — pass `-d -e <endpoint>`.
  - param `llm_client`: ⊥ — not supported (CLI lacks direct LLM flags).
- cmd: `/markitdown-install` — checks `markitdown` presence, prints install instructions.
- env: `MARKITDOWN_PATH`? — override binary path (default `markitdown`).
- event: `session_start` — auto-detects missing binary, prompts once per session to install. cancel = silent, no repeat prompt until new session.

## §V INVARIANTS
V1: tool execution → shell out to `markitdown` binary. never embed Python interpreter.
V2: binary missing → tool returns error with install instructions, ! crash.
V3: `source` path resolved relative to `ctx.cwd` before passing to CLI.
V4: output > 50KB → truncate with warning (markitdown can emit large docs).
V5: non-zero exit code → `isError: true` with stderr in content.

## §T TASKS
id|status|task|cites
T1|x|scaffold `index.ts` with extension boilerplate|I.tool
T2|x|register `markitdown` tool with typebox schema|V1,I.tool
T3|x|impl shell-out logic with `pi.exec` or `Bun.spawn`|V1,V3
T4|.|handle missing binary gracefully (V2)|V2
T5|.|add output truncation (V4)|V4
T6|.|register `/markitdown-install` command|I.cmd
T7|.|test with sample PDF/DOCX files|V5

## §B BUGS
id|date|cause|fix

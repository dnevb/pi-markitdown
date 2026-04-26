# pi-markitdown

pi extension wrapping [markitdown](https://github.com/microsoft/markitdown) CLI. Converts PDF, DOCX, PPTX, XLSX, images, audio, HTML, and URLs → markdown so the LLM can ingest arbitrary documents.

## Requirements

```bash
pipx install 'markitdown[all]'
uv tool install markitdown --with 'markitdown[all]'
# or just have pipx or uvx installed
```
## Install

```bash
pi install git:github.com/dnevb/pi-markitdown
pi install npm:pi-markitdown
```

## Tool: `markitdown`

| param | type | description |
|---|---|---|
| `source` | string | Path to file or URL to convert |
| `output_path` | string? | Write markdown to file instead of returning it |
| `use_plugins` | boolean? | Enable markitdown plugins (`--use-plugins`) |
| `docintel_endpoint` | string? | Document Intelligence endpoint (`-d -e <endpoint>`) |

## Behavior

- Missing binary → error message with install instructions
- Output > 50 KB → truncated with warning
- Non-zero exit code → `isError: true` with stderr

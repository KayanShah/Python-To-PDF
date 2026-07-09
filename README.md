# py2pdf-idle

Convert Python source files to clean, syntax-highlighted PDFs (IDLE colour style) from the terminal or browser.

## Install / run

Use with no install:

```bash
npx py2pdf-idle /path/to/script.py
```

Example:

```bash
npx py2pdf-idle ./main.py ./main.pdf --paper letter --no-line-nums
```

Or install globally:

```bash
npm i -g py2pdf-idle
py2pdf-idle /path/to/script.py
```

## CLI formula (copy/paste template)

**npx formula**

```bash
npx py2pdf-idle <python-file-path> [output-file-name.pdf] [options]
```

**local repo formula**

```bash
npm run cli -- <python-file-path> [output-file-name.pdf] [options]
```

Example:

```bash
npx py2pdf-idle ./examples/main.py ./exports/main.pdf --paper letter --orientation landscape --no-line-nums --no-header
```

If `output-file-name.pdf` is omitted, the output defaults to the input filename with `.pdf`.

Not sure what flags you need? The website has a **CLI builder** — fill in your file path and options and it generates the exact command to copy/paste.

## CLI options

| Option | Description | Default |
|---|---|---|
| `--paper <a4\|letter>` | Page size | `a4` |
| `--orientation <portrait\|landscape>` | Page orientation | `portrait` |
| `--no-line-nums` | Hide line numbers | line numbers on |
| `--no-header` | Hide filename header/footer | header/footer on |
| `-h`, `--help` | Show help | — |

## Features

- IDLE-style syntax colours
- A4 and Letter output
- Optional line numbers
- Optional filename header/footer
- Browser preview + export

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run CLI locally:

```bash
npm run cli -- ./TestPyWebsite.py
```

## For maintainers: publish to npm

```bash
npm login
npm pack --dry-run
npm publish
```

If publish fails with a 2FA/permissions `E403`, enable npm write protection in account settings and re-authenticate:

```bash
npm logout
npm login
npm publish
```

## Deploy web app to Vercel

```bash
npm i -g vercel
vercel
```

## IDLE colour reference

| Token type | Colour | Examples |
|---|---|---|
| keyword | `#ff7700` | `def`, `class`, `if`, `return` |
| builtin | `#900090` | `print`, `len`, `range`, `self` |
| string | `#00aa00` | `"hello"`, f-strings, docstrings |
| comment | `#dd0000` | `# this is a comment` |
| defname | `#0000ff` | function/class names after `def`/`class` |
| number | `#000000` | `42`, `3.14`, `0xFF` |

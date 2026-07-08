# py2pdf-idle

Convert Python source files to beautifully formatted PDFs with authentic IDLE syntax highlighting — in the browser or from a Node.js CLI.

## Run from terminal (no Python required)

Run directly with npx:

```bash
npx py2pdf-idle script.py
```

Or pass output/options:

```bash
npx py2pdf-idle script.py output.pdf --paper letter --orientation landscape --no-line-nums --no-header
```

CLI help:

```bash
npx py2pdf-idle --help
```

The package is published on npm as `py2pdf-idle`.

## Install globally (optional)

```bash
npm i -g py2pdf-idle
py2pdf-idle script.py
```

## Features

- IDLE-accurate colour scheme (orange keywords, purple builtins, green strings, red comments, blue function/class names)
- Live in-browser preview before generating
- Optional line numbers and filename header/footer
- A4 and Letter paper sizes
- 100% client-side — your code never leaves your machine
- Vercel Analytics included

## Stack

- Next.js 14
- jsPDF (client-side PDF generation)
- Custom Python tokeniser (no external dependencies)
- JetBrains Mono font
- @vercel/analytics

## Local development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Run the CLI locally from this repo:

```bash
npm run cli -- ./TestPyWebsite.py
```

## Publish to npm

### First publish setup

1. Ensure `package.json` has the final name:
   - `"name": "py2pdf-idle"`
2. Log in:
   ```bash
   npm login
   ```
3. Confirm package preview:
   ```bash
   npm pack --dry-run
   ```
4. Confirm name availability (404 means available):
   ```bash
   npm view py2pdf-idle
   ```

### Publish command

```bash
npm publish
```

If npm prompts:

```text
Authenticate your account at:
https://www.npmjs.com/auth/cli/...
```

open the link and complete browser auth, then publish completes.

### 2FA / security requirements

If you get:

```text
E403 ... Two-factor authentication or granular access token with bypass 2fa enabled is required ...
```

go to npm account settings and enable:
- **Manage Two-Factor Authentication**
- **Require two-factor authentication for write actions**

Then run:

```bash
npm logout
npm login
npm publish
```

### Verify published package

```bash
cd ~
npx py2pdf-idle --help
npx py2pdf-idle /path/to/script.py
```

## Deploy to Vercel

### Option 1 — Vercel CLI

```bash
npm i -g vercel
vercel
```

### Option 2 — GitHub + Vercel dashboard

1. Push this repo to GitHub
2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your repository
4. Framework preset: **Next.js** (auto-detected)
5. Click **Deploy**

No environment variables needed.

## IDLE colour reference

| Token type | Colour  | Examples                          |
|------------|---------|-----------------------------------|
| keyword    | #ff7700 | `def`, `class`, `if`, `return`    |
| builtin    | #900090 | `print`, `len`, `range`, `self`   |
| string     | #00aa00 | `"hello"`, f-strings, docstrings  |
| comment    | #dd0000 | `# this is a comment`             |
| defname    | #0000ff | function/class names after def    |
| number     | #000000 | `42`, `3.14`, `0xFF`              |

# py2pdf

Convert Python source files to beautifully formatted PDFs with authentic IDLE syntax highlighting — entirely in the browser.

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

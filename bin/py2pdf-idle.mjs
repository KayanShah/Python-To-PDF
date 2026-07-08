#!/usr/bin/env node

import fs from 'node:fs/promises';
import path from 'node:path';
import { generatePDFBuffer } from '../cli/pdfgen.mjs';

function printHelp() {
  console.log(`py2pdf-idle

Usage:
  py2pdf-idle <input.py> [output.pdf] [options]

Options:
  --no-line-nums       Hide line numbers
  --no-header          Hide filename header/footer
  --paper <a4|letter>  Paper size (default: a4)
  --orientation <portrait|landscape>
  -h, --help           Show this help
`);
}

function parseArgs(argv) {
  const args = [...argv];
  let showLineNums = true;
  let showHeader = true;
  let paperSize = 'a4';
  let orientation = 'portrait';
  const positional = [];

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '-h' || arg === '--help') return { help: true };
    if (arg === '--no-line-nums') {
      showLineNums = false;
      continue;
    }
    if (arg === '--no-header') {
      showHeader = false;
      continue;
    }
    if (arg === '--paper') {
      paperSize = args[++i];
      continue;
    }
    if (arg === '--orientation') {
      orientation = args[++i];
      continue;
    }
    positional.push(arg);
  }

  const [inputFile, outputFile] = positional;
  return { inputFile, outputFile, showLineNums, showHeader, paperSize, orientation };
}

async function main() {
  const opts = parseArgs(process.argv.slice(2));

  if (opts.help || !opts.inputFile) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  if (!['a4', 'letter'].includes(opts.paperSize)) {
    throw new Error(`Invalid paper size "${opts.paperSize}". Use a4 or letter.`);
  }
  if (!['portrait', 'landscape'].includes(opts.orientation)) {
    throw new Error(`Invalid orientation "${opts.orientation}". Use portrait or landscape.`);
  }

  const inputPath = path.resolve(process.cwd(), opts.inputFile);
  const outputPath = path.resolve(
    process.cwd(),
    opts.outputFile || `${path.basename(inputPath, path.extname(inputPath))}.pdf`
  );

  const source = await fs.readFile(inputPath, 'utf8');
  const pdf = await generatePDFBuffer(source, {
    filename: path.basename(inputPath),
    showLineNums: opts.showLineNums,
    showHeader: opts.showHeader,
    paperSize: opts.paperSize,
    orientation: opts.orientation,
  });

  await fs.writeFile(outputPath, pdf);
  console.log(`Saved ${outputPath}`);
}

main().catch((err) => {
  console.error(`py2pdf-idle: ${err.message}`);
  process.exit(1);
});

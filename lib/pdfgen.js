// PDF generation with IDLE-accurate colours using jsPDF
import { tokenisePython, IDLE_COLOURS } from './tokeniser';

const FONT_SIZE = 10;
const LINE_HEIGHT = 5.5;
const PAGE_MARGIN = 15;
const LINE_NUM_WIDTH = 12;
const CODE_LEFT = PAGE_MARGIN + LINE_NUM_WIDTH;

export async function generatePDF(source, opts = {}) {
  const { jsPDF } = await import('jspdf');

  const {
    filename = 'script.py',
    showLineNums = true,
    showHeader = true,
    paperSize = 'a4',
    orientation = 'portrait',
  } = opts;

  const doc = new jsPDF({ orientation, unit: 'mm', format: paperSize });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();

  const headerH = showHeader ? 12 : 0;
  const footerH = 8;
  const contentTop = PAGE_MARGIN + headerH;
  const contentBottom = pageH - footerH - PAGE_MARGIN;
  const linesPerPage = Math.floor((contentBottom - contentTop) / LINE_HEIGHT);
  const RIGHT_MARGIN = pageW - PAGE_MARGIN;
  const WRAP_INDENT = CODE_LEFT + 4;

  const tokenisedLines = tokenisePython(source);

  let currentPage = 1;

  doc.setFontSize(FONT_SIZE);
  doc.setFont('courier', 'normal');
  const CHAR_W = doc.getTextWidth('m');

  const splitToken = (text, startX) => {
    const segments = [];
    let remaining = text;
    let x = startX;
    while (remaining.length > 0) {
      const availW = RIGHT_MARGIN - x;
      const maxChars = Math.max(1, Math.floor(availW / CHAR_W));
      if (remaining.length <= maxChars) {
        segments.push({ text: remaining, x });
        break;
      }
      let breakAt = maxChars;
      const spaceIdx = remaining.lastIndexOf(' ', maxChars);
      if (spaceIdx > maxChars * 0.5) breakAt = spaceIdx + 1;
      segments.push({ text: remaining.slice(0, breakAt), x });
      remaining = remaining.slice(breakAt);
      x = WRAP_INDENT;
    }
    return segments;
  };

  const visualRows = [];

  for (let li = 0; li < tokenisedLines.length; li++) {
    doc.setFontSize(FONT_SIZE);
    const toks = tokenisedLines[li];
    let x = CODE_LEFT;
    let currentRowSegments = [];
    let isFirstRow = true;
    const rowsForLine = [];

    for (const tok of toks) {
      if (!tok.text) continue;
      const colour = IDLE_COLOURS[tok.type] || '#000000';
      const isBold = tok.type === 'keyword';
      doc.setFont('courier', isBold ? 'bold' : 'normal');
      const tw = doc.getTextWidth(tok.text);

      if (x + tw <= RIGHT_MARGIN) {
        currentRowSegments.push({ text: tok.text, x, colour, isBold });
        x += tw;
      } else {
        const splits = splitToken(tok.text, x);
        for (let si = 0; si < splits.length; si++) {
          const seg = splits[si];
          if (si === 0) {
            currentRowSegments.push({ text: seg.text, x: seg.x, colour, isBold });
            rowsForLine.push({ segments: currentRowSegments, isFirstRow });
            isFirstRow = false;
            currentRowSegments = [];
          } else if (si < splits.length - 1) {
            rowsForLine.push({ segments: [{ text: seg.text, x: seg.x, colour, isBold }], isFirstRow: false });
          } else {
            currentRowSegments.push({ text: seg.text, x: seg.x, colour, isBold });
            x = seg.x + doc.getTextWidth(seg.text);
          }
        }
      }
    }

    rowsForLine.push({ segments: currentRowSegments, isFirstRow });
    for (const row of rowsForLine) {
      visualRows.push({ sourceLineNum: li + 1, ...row });
    }
  }

  const totalPagesActual = Math.ceil(visualRows.length / linesPerPage);

  const drawChrome = (page) => {
    if (showHeader) {
      doc.setFontSize(8);
      doc.setTextColor(120, 140, 170);
      doc.setFont('courier', 'normal');
      doc.text(filename, PAGE_MARGIN, PAGE_MARGIN + 5);
      const linkText = 'py2pdf';
      const linkTextWidth = doc.getTextWidth(linkText);
      const linkX = pageW - PAGE_MARGIN - linkTextWidth;
      const linkY = PAGE_MARGIN + 5;
      doc.text(linkText, pageW - PAGE_MARGIN, linkY, { align: 'right' });
      doc.link(linkX, linkY - 3.5, linkTextWidth, 4.5, { url: 'https://python-to-pdf.vercel.app' });
      doc.setDrawColor(200, 210, 225);
      doc.setLineWidth(0.3);
      doc.line(PAGE_MARGIN, PAGE_MARGIN + 8, pageW - PAGE_MARGIN, PAGE_MARGIN + 8);
    }
    doc.setFontSize(8);
    doc.setTextColor(150, 165, 185);
    doc.setFont('courier', 'normal');
    doc.line(PAGE_MARGIN, pageH - PAGE_MARGIN - 5, pageW - PAGE_MARGIN, pageH - PAGE_MARGIN - 5);
    doc.text(`page ${page} / ${totalPagesActual}`, pageW / 2, pageH - PAGE_MARGIN - 1, { align: 'center' });
    const siteText = 'python-to-pdf.vercel.app';
    const siteW = doc.getTextWidth(siteText);
    const siteX = pageW - PAGE_MARGIN;
    const siteY = pageH - PAGE_MARGIN - 1;
    doc.setTextColor(26, 111, 219);
    doc.text(siteText, siteX, siteY, { align: 'right' });
    doc.link(siteX - siteW, siteY - 3.5, siteW, 4.5, { url: 'https://python-to-pdf.vercel.app' });
    if (showLineNums) {
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.2);
      doc.line(PAGE_MARGIN + LINE_NUM_WIDTH - 1, contentTop, PAGE_MARGIN + LINE_NUM_WIDTH - 1, contentBottom);
    }
  };

  drawChrome(currentPage);

  for (let vi = 0; vi < visualRows.length; vi++) {
    const pageLineIndex = vi % linesPerPage;

    if (vi > 0 && pageLineIndex === 0) {
      doc.addPage();
      currentPage++;
      drawChrome(currentPage);
    }

    const y = contentTop + pageLineIndex * LINE_HEIGHT + LINE_HEIGHT * 0.8;
    const row = visualRows[vi];

    if (showLineNums && row.isFirstRow) {
      doc.setFontSize(FONT_SIZE - 1);
      doc.setTextColor(160, 170, 190);
      doc.setFont('courier', 'normal');
      doc.text(String(row.sourceLineNum), PAGE_MARGIN + LINE_NUM_WIDTH - 3, y, { align: 'right' });
    }

    if (!row.isFirstRow) {
      doc.setFontSize(FONT_SIZE - 2);
      doc.setTextColor(180, 190, 210);
      doc.setFont('courier', 'normal');
      doc.text('↳', CODE_LEFT - 2, y, { align: 'right' });
    }

    doc.setFontSize(FONT_SIZE);
    for (const seg of row.segments) {
      if (!seg.text) continue;
      const r = parseInt(seg.colour.slice(1, 3), 16);
      const g = parseInt(seg.colour.slice(3, 5), 16);
      const b = parseInt(seg.colour.slice(5, 7), 16);
      doc.setTextColor(r, g, b);
      doc.setFont('courier', seg.isBold ? 'bold' : 'normal');
      doc.text(seg.text, seg.x, y);
    }
  }

  return doc.output('blob');
}

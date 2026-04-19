// PDF generation with IDLE-accurate colours using jsPDF
import { tokenisePython, IDLE_COLOURS } from './tokeniser';

const FONT_SIZE = 10; // pt
const LINE_HEIGHT = 5.5; // mm per line
const PAGE_MARGIN = 15; // mm
const LINE_NUM_WIDTH = 12; // mm
const CODE_LEFT = PAGE_MARGIN + LINE_NUM_WIDTH;

/**
 * Generate a PDF blob from Python source with IDLE colours.
 * @param {string} source - Python source code
 * @param {object} opts
 * @param {string} opts.filename - Original filename for header
 * @param {boolean} opts.showLineNums - Show line numbers
 * @param {boolean} opts.showHeader - Show filename header on each page
 * @param {string} opts.paperSize - 'a4' | 'letter'
 * @returns {Blob} PDF blob
 */
export async function generatePDF(source, opts = {}) {
  const { jsPDF } = await import('jspdf');

  const {
    filename = 'script.py',
    showLineNums = true,
    showHeader = true,
    paperSize = 'a4',
  } = opts;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: paperSize,
  });

  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const codeWidth = pageW - PAGE_MARGIN - CODE_LEFT;

  // Header height
  const headerH = showHeader ? 12 : 0;
  const footerH = 8;
  const contentTop = PAGE_MARGIN + headerH;
  const contentBottom = pageH - footerH - PAGE_MARGIN;
  const linesPerPage = Math.floor((contentBottom - contentTop) / LINE_HEIGHT);

  // Tokenise
  const tokenisedLines = tokenisePython(source);

  let currentPage = 1;
  const totalPages = Math.ceil(tokenisedLines.length / linesPerPage);

  const drawPageChrome = (page) => {
    // Header
    if (showHeader) {
      doc.setFontSize(8);
      doc.setTextColor(120, 140, 170);
      doc.setFont('courier', 'normal');
      doc.text(filename, PAGE_MARGIN, PAGE_MARGIN + 5);
      doc.text(`py2pdf`, pageW - PAGE_MARGIN, PAGE_MARGIN + 5, { align: 'right' });
      // Header line
      doc.setDrawColor(200, 210, 225);
      doc.setLineWidth(0.3);
      doc.line(PAGE_MARGIN, PAGE_MARGIN + 8, pageW - PAGE_MARGIN, PAGE_MARGIN + 8);
    }

    // Footer
    doc.setFontSize(8);
    doc.setTextColor(150, 165, 185);
    doc.setFont('courier', 'normal');
    doc.line(PAGE_MARGIN, pageH - PAGE_MARGIN - 5, pageW - PAGE_MARGIN, pageH - PAGE_MARGIN - 5);
    doc.text(
      `page ${page} / ${totalPages}`,
      pageW / 2, pageH - PAGE_MARGIN - 1,
      { align: 'center' }
    );

    // Line num separator
    if (showLineNums) {
      doc.setDrawColor(220, 225, 235);
      doc.setLineWidth(0.2);
      doc.line(
        PAGE_MARGIN + LINE_NUM_WIDTH - 1, contentTop,
        PAGE_MARGIN + LINE_NUM_WIDTH - 1, contentBottom
      );
    }
  };

  drawPageChrome(currentPage);

  for (let li = 0; li < tokenisedLines.length; li++) {
    const pageLineIndex = li % linesPerPage;

    if (li > 0 && pageLineIndex === 0) {
      doc.addPage();
      currentPage++;
      drawPageChrome(currentPage);
    }

    const y = contentTop + pageLineIndex * LINE_HEIGHT + LINE_HEIGHT * 0.8;

    // Line number
    if (showLineNums) {
      doc.setFontSize(FONT_SIZE - 1);
      doc.setTextColor(160, 170, 190);
      doc.setFont('courier', 'normal');
      doc.text(String(li + 1), PAGE_MARGIN + LINE_NUM_WIDTH - 3, y, { align: 'right' });
    }

    // Tokens
    doc.setFontSize(FONT_SIZE);
    const toks = tokenisedLines[li];
    let x = CODE_LEFT;

    for (const tok of toks) {
      if (!tok.text) continue;

      const colour = IDLE_COLOURS[tok.type] || '#000000';
      const r = parseInt(colour.slice(1, 3), 16);
      const g = parseInt(colour.slice(3, 5), 16);
      const b = parseInt(colour.slice(5, 7), 16);

      doc.setTextColor(r, g, b);

      const isBold = tok.type === 'keyword';
      doc.setFont('courier', isBold ? 'bold' : 'normal');

      // Measure text width in mm
      // jsPDF uses pt for font, 1pt ≈ 0.3528mm, courier is monospace ~0.6 em per char
      // We use getTextWidth from doc
      doc.text(tok.text, x, y);
      const tw = doc.getTextWidth(tok.text);
      x += tw;

      // Clip to right margin (don't let long lines overflow — jsPDF clips naturally)
      if (x > pageW - PAGE_MARGIN + 5) break;
    }
  }

  return doc.output('blob');
}

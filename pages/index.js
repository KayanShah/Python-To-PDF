import { useState, useRef, useEffect, useCallback } from 'react';
import Head from 'next/head';
import { tokenisePython, tokensToHTML } from '../lib/tokeniser';
import { generatePDF } from '../lib/pdfgen';

const ASCII = `
██████╗ ██╗   ██╗██████╗ ██████╗ ██████╗ ███████╗
██╔══██╗╚██╗ ██╔╝╚════██╗██╔══██╗██╔══██╗██╔════╝
██████╔╝ ╚████╔╝  █████╔╝██████╔╝██║  ██║█████╗  
██╔═══╝   ╚██╔╝  ██╔═══╝ ██╔═══╝ ██║  ██║██╔══╝  
██║        ██║   ███████╗██║     ██████╔╝██║     
╚═╝        ╚═╝   ╚══════╝╚═╝     ╚═════╝ ╚═╝     
`.trim();

const IDLE_COLOUR_TABLE = [
  { type: 'keyword',  colour: '#ff7700', example: 'def, class, if, for, return' },
  { type: 'builtin',  colour: '#900090', example: 'print, len, range, self' },
  { type: 'string',   colour: '#00aa00', example: '"hello", f-strings, triple-quoted' },
  { type: 'comment',  colour: '#dd0000', example: '# this is a comment' },
  { type: 'defname',  colour: '#0000ff', example: 'function / class names after def/class' },
  { type: 'number',   colour: '#000000', example: '42, 3.14, 0xFF, 0b1010' },
];

const SAMPLE_PY = `# py2pdf — Python to PDF converter
# Preserves IDLE colour scheme

import os
import sys
from pathlib import Path


class FileConverter:
    """Convert Python source files to styled PDFs."""

    SUPPORTED = ['.py', '.pyw']

    def __init__(self, theme='idle'):
        self.theme = theme
        self._cache = {}

    def convert(self, filepath: str, output: str = None) -> Path:
        """Convert a .py file to PDF with syntax highlighting."""
        src = Path(filepath)
        if src.suffix not in self.SUPPORTED:
            raise ValueError(f"Unsupported file type: {src.suffix}")

        out = Path(output) if output else src.with_suffix('.pdf')
        source = src.read_text(encoding='utf-8')

        tokens = self._tokenise(source)
        self._render_pdf(tokens, out)
        return out

    def _tokenise(self, source: str) -> list:
        lines = source.splitlines()
        return [line for line in lines if line.strip()]

    def _render_pdf(self, tokens, out: Path):
        print(f"Rendering {len(tokens)} lines to {out}")
        # PDF generation logic here


def main():
    if len(sys.argv) < 2:
        print("Usage: py2pdf <file.py>")
        sys.exit(1)

    converter = FileConverter()
    result = converter.convert(sys.argv[1])
    print(f"Done! Saved to {result}")


if __name__ == '__main__':
    main()
`;

export default function Home() {
  const [file, setFile] = useState(null);
  const [source, setSource] = useState('');
  const [tokenisedLines, setTokenisedLines] = useState([]);
  const [htmlLines, setHtmlLines] = useState([]);
  const [status, setStatus] = useState({ type: 'idle', msg: 'ready — drop a .py file to start' });
  const [dragOver, setDragOver] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeSection, setActiveSection] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [scrollPct, setScrollPct] = useState(0);
  const [opts, setOpts] = useState({
    showLineNums: true,
    showHeader: true,
    paperSize: 'a4',
    orientation: 'portrait',
    fontSize: '10',
  });

  const fileInputRef = useRef();
  const previewRef = useRef();
  const mainRef = useRef();

  // Scroll progress
  useEffect(() => {
    const onScroll = () => {
      const el = document.documentElement;
      const pct = (el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100;
      setScrollPct(isNaN(pct) ? 0 : pct);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Active section tracker
  useEffect(() => {
    const sections = ['home', 'convert', 'colours', 'about'];
    const onScroll = () => {
      for (const id of sections.reverse()) {
        const el = document.getElementById(id);
        if (el && el.getBoundingClientRect().top <= 120) {
          setActiveSection(id);
          break;
        }
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const processFile = useCallback((f) => {
    if (!f) return;
    if (!f.name.endsWith('.py') && !f.name.endsWith('.pyw')) {
      setStatus({ type: 'error', msg: `error: "${f.name}" is not a Python file` });
      return;
    }
    if (f.size > 2 * 1024 * 1024) {
      setStatus({ type: 'error', msg: 'error: file too large (max 2 MB)' });
      return;
    }

    setFile(f);
    setStatus({ type: 'active', msg: `reading ${f.name}...` });

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      setSource(text);
      const tLines = tokenisePython(text);
      setTokenisedLines(tLines);
      setHtmlLines(tokensToHTML(tLines));
      setStatus({ type: 'ready', msg: `${f.name} — ${tLines.length} lines — ready to convert` });

      // Scroll to convert section
      setTimeout(() => {
        document.getElementById('convert')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    };
    reader.onerror = () => setStatus({ type: 'error', msg: 'error: could not read file' });
    reader.readAsText(f);
  }, []);

  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    processFile(f);
  }, [processFile]);

  const onFileChange = (e) => processFile(e.target.files[0]);

  const handleGenerate = async () => {
    if (!source) return;
    setGenerating(true);
    setStatus({ type: 'active', msg: 'generating PDF...' });
    try {
      const blob = await generatePDF(source, {
        filename: file?.name || 'script.py',
        showLineNums: opts.showLineNums,
        showHeader: opts.showHeader,
        paperSize: opts.paperSize,
        orientation: opts.orientation,
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = (file?.name || 'script').replace(/\.pyw?$/, '') + '.pdf';
      a.click();
      URL.revokeObjectURL(url);
      setStatus({ type: 'ready', msg: 'PDF downloaded successfully' });
    } catch (err) {
      console.error(err);
      setStatus({ type: 'error', msg: `error: ${err.message}` });
    }
    setGenerating(false);
  };

  const loadSample = () => {
    const fakeFile = new File([SAMPLE_PY], 'sample.py', { type: 'text/plain' });
    processFile(fakeFile);
  };

  const navTo = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
    setSidebarOpen(false);
  };

  return (
    <>
      <Head>
        <title>py2pdf — Python to PDF with IDLE colours</title>
        <meta name="description" content="Convert Python source files to beautifully formatted PDFs with authentic IDLE syntax highlighting." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <button className="mobile-nav-btn" onClick={() => setSidebarOpen(v => !v)}>
        {sidebarOpen ? '[x]' : '[=]'}
      </button>

      <div className="scroll-track">
        <div className="scroll-progress" style={{ height: `${scrollPct}%` }} />
      </div>

      <div className="site-wrap">
        {/* Sidebar */}
        <aside className={`sidebar${sidebarOpen ? ' open' : ''}`}>
          <div className="sidebar-logo">
            <span>py</span>2pdf<span>/</span>v1.0
          </div>

          {['home', 'convert', 'colours', 'about'].map(id => (
            <button
              key={id}
              className={`nav-link${activeSection === id ? ' active' : ''}`}
              onClick={() => navTo(id)}
            >
              {id}
            </button>
          ))}

          <div className="sidebar-footer">
            created by{' '}
            <a href="https://github.com/KayanShah" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--accent)' }}>
              Kayan Shah
            </a>
          </div>
        </aside>

        {/* Main content */}
        <main className="main" ref={mainRef}>

          {/* ── HOME ── */}
          <section id="home" style={{ marginBottom: '5rem' }}>
            <pre className="ascii-block">{ASCII}</pre>
            <div className="section-label">home</div>

            <div className="hero-name">py2pdf</div>
            <div className="hero-sub">Python source → PDF with IDLE-accurate syntax highlighting</div>

            <div className="stat-row">
              <div className="stat-pill"><span>6</span>token types</div>
              <div className="stat-pill"><span>100%</span>client-side</div>
              <div className="stat-pill"><span>A4 / letter</span>paper sizes</div>
              <div className="stat-pill"><span>0</span>server uploads</div>
            </div>

            <p className="bq">
              Drop any .py file and get back a PDF that looks exactly like Python IDLE — orange keywords, purple builtins, green strings, red comments, blue function names. Everything runs in your browser; your code never leaves your machine.
            </p>

            <div className="btn-row">
              <button className="cta" onClick={() => navTo('convert')}>
                &gt; get started
              </button>
              <button className="cta ghost" onClick={loadSample}>
                load sample file
              </button>
            </div>
          </section>

          {/* ── CONVERT ── */}
          <section id="convert" style={{ marginBottom: '5rem' }}>
            <div className="section-label">convert</div>

            {/* Status bar */}
            <div className="status-bar">
              <div className={`status-dot ${status.type === 'ready' ? 'ready' : status.type === 'error' ? 'error' : status.type === 'active' ? 'active' : ''}`} />
              <span>{status.msg}</span>
            </div>

            {/* Upload zone */}
            <div
              className={`upload-zone${dragOver ? ' drag-over' : ''}`}
              onDrop={onDrop}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".py,.pyw"
                onChange={onFileChange}
                style={{ display: 'none' }}
              />
              <div className="upload-icon">[ ⇡ ]</div>
              <div style={{ color: 'var(--dim)', fontSize: '13px' }}>
                {file ? file.name : 'click or drag & drop a .py file'}
              </div>
              <div className="upload-hint">max 2 MB — processed entirely in your browser</div>
            </div>

            {/* Options */}
            <div style={{ marginTop: '1.5rem', marginBottom: '0.5rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                &gt;&gt; options
              </div>
              <div className="options-grid">
                <div className="opt-group">
                  <label className="opt-label">paper size</label>
                  <select
                    className="opt-select"
                    value={opts.paperSize}
                    onChange={e => setOpts(o => ({ ...o, paperSize: e.target.value }))}
                  >
                    <option value="a4">A4 (210 × 297 mm)</option>
                    <option value="letter">Letter (216 × 279 mm)</option>
                  </select>
                </div>

                <div className="opt-group">
                  <label className="opt-label">orientation</label>
                  <select
                    className="opt-select"
                    value={opts.orientation}
                    onChange={e => setOpts(o => ({ ...o, orientation: e.target.value }))}
                  >
                    <option value="portrait">Portrait</option>
                    <option value="landscape">Landscape</option>
                  </select>
                </div>

                <div className="opt-group">
                  <label className="opt-label">options</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div className="toggle-row">
                      <button
                        className={`toggle${opts.showLineNums ? ' on' : ''}`}
                        onClick={() => setOpts(o => ({ ...o, showLineNums: !o.showLineNums }))}
                        aria-label="Toggle line numbers"
                      />
                      <span className="toggle-label">line numbers</span>
                    </div>
                    <div className="toggle-row">
                      <button
                        className={`toggle${opts.showHeader ? ' on' : ''}`}
                        onClick={() => setOpts(o => ({ ...o, showHeader: !o.showHeader }))}
                        aria-label="Toggle header"
                      />
                      <span className="toggle-label">filename header & footer</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Generate button */}
            <div className="btn-row">
              <button
                className="cta"
                onClick={handleGenerate}
                disabled={!source || generating}
              >
                {generating ? '[ generating... ]' : '[ download PDF ]'}
              </button>
              {source && (
                <button className="cta ghost" onClick={() => {
                  setFile(null); setSource(''); setHtmlLines([]); setTokenisedLines([]);
                  setStatus({ type: 'idle', msg: 'ready — drop a .py file to start' });
                }}>
                  clear
                </button>
              )}
            </div>

            {/* Preview */}
            {htmlLines.length > 0 && (
              <div style={{ marginTop: '2rem' }}>
                <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '0.75rem' }}>
                  &gt;&gt; preview — {tokenisedLines.length} lines
                </div>
                <div className="preview-wrap" ref={previewRef}>
                  {htmlLines.map(({ lineNum, content }) => (
                    <div className="code-line" key={lineNum}>
                      <span className="line-num">{opts.showLineNums ? lineNum : ''}</span>
                      <span
                        className="line-content"
                        dangerouslySetInnerHTML={{ __html: content || '\u00a0' }}
                      />
                    </div>
                  ))}
                </div>
                <div style={{ fontSize: '11px', color: 'var(--muted)', marginTop: '0.5rem' }}>
                  preview is representative — PDF output uses Courier monospace at 10pt
                </div>
              </div>
            )}
          </section>

          {/* ── COLOURS ── */}
          <section id="colours" style={{ marginBottom: '5rem' }}>
            <div className="section-label">colour reference</div>

            <p className="bq" style={{ marginBottom: '1.5rem' }}>
              py2pdf uses the exact colour scheme from Python IDLE — the editor that ships with every Python installation. These colours have been the Python standard since the early 2000s.
            </p>

            {IDLE_COLOUR_TABLE.map(row => (
              <div className="entry" key={row.type}>
                <div className="entry-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: 14, height: 14,
                      background: row.colour,
                      border: '1px solid var(--border2)',
                      flexShrink: 0,
                    }} />
                    <span className={`tok-${row.type}`} style={{ fontSize: '14px', fontWeight: 500 }}>
                      {row.type}
                    </span>
                  </div>
                  <span className="entry-meta" style={{ color: row.colour, fontWeight: 600 }}>
                    {row.colour}
                  </span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--muted)', marginTop: '0.4rem' }}>
                  {row.example}
                </div>
              </div>
            ))}

            <div style={{ marginTop: '1.5rem' }}>
              <div style={{ fontSize: '11px', color: 'var(--muted)', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '1rem' }}>
                &gt;&gt; live example
              </div>
              <div className="preview-wrap" style={{ maxHeight: '280px' }}>
                {tokensToHTML(tokenisePython(`def greet(name: str) -> str:
    """Return a greeting string."""  # docstring
    count = 42
    prefix = f"Hello, {name}!"
    numbers = [1, 2, 0xFF, 3.14]
    result = ", ".join(str(n) for n in numbers)
    print(prefix, result)
    return prefix

class Greeter:
    def __init__(self, lang='en'):
        self.lang = lang
    
    def say(self, name):
        if self.lang == 'en':
            return greet(name)
        raise ValueError(f"Unknown lang: {self.lang}")

if __name__ == '__main__':
    g = Greeter()
    print(g.say('world'))
`)).map(({ lineNum, content }) => (
                  <div className="code-line" key={lineNum}>
                    <span className="line-num">{lineNum}</span>
                    <span className="line-content" dangerouslySetInnerHTML={{ __html: content || '\u00a0' }} />
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* ── ABOUT ── */}
          <section id="about" style={{ marginBottom: '5rem' }}>
            <div className="section-label">about</div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              <div className="steps">
                <div className="step">
                  <div className="step-num">1</div>
                  <div className="step-body"><strong>drop your file</strong> — drag a .py file onto the upload zone or click to browse</div>
                </div>
                <div className="step">
                  <div className="step-num">2</div>
                  <div className="step-body"><strong>preview it</strong> — the tokeniser runs instantly in your browser and shows a live preview with IDLE colours</div>
                </div>
                <div className="step">
                  <div className="step-num">3</div>
                  <div className="step-body"><strong>configure options</strong> — toggle line numbers, header/footer, and choose paper size</div>
                </div>
                <div className="step">
                  <div className="step-num">4</div>
                  <div className="step-body"><strong>download</strong> — click "download PDF" and get a beautifully formatted file, generated entirely client-side</div>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '2rem' }}>
              <div className="entry">
                <div className="entry-header">
                  <span style={{ color: 'var(--title)', fontSize: '14px', fontWeight: 500 }}>
                    &gt; privacy
                  </span>
                </div>
                <p style={{ marginTop: '0.5rem' }}>
                  Your code never leaves your machine. Tokenisation and PDF generation both run in the browser using JavaScript. No files are uploaded to any server.
                </p>
              </div>

              <div className="entry">
                <div className="entry-header">
                  <span style={{ color: 'var(--title)', fontSize: '14px', fontWeight: 500 }}>
                    &gt; tech stack
                  </span>
                </div>
                <div className="badge-row" style={{ marginTop: '0.75rem' }}>
                  {['Next.js 14', 'jsPDF', 'JetBrains Mono', 'Vercel Analytics', 'custom tokeniser'].map(b => (
                    <span className="badge" key={b}>{b}</span>
                  ))}
                </div>
              </div>

              <div className="entry">
                <div className="entry-header">
                  <span style={{ color: 'var(--title)', fontSize: '14px', fontWeight: 500 }}>
                    &gt; limitations
                  </span>
                </div>
                <ul style={{ marginTop: '0.75rem', paddingLeft: '1.25rem', fontSize: '13px', color: 'var(--dim)' }}>
                  <li>Multi-line strings spanning more than one page may not wrap perfectly</li>
                  <li>Very long lines are clipped at the right margin</li>
                  <li>Max file size 2 MB (roughly 40,000 lines)</li>
                  <li>PDF uses Courier — matching IDLE's default monospace font</li>
                </ul>
              </div>
            </div>
          </section>

          <div style={{ borderTop: '1px solid var(--border)', paddingTop: '1.5rem', marginTop: '2rem', fontSize: '12px', color: 'var(--muted)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
            <span>made by <a href="https://github.com/KayanShah" target="_blank" rel="noopener noreferrer">Kayan Shah</a></span>
            <span><a href="https://github.com/KayanShah/Python-To-PDF" target="_blank" rel="noopener noreferrer">view source</a></span>
          </div>

        </main>
      </div>
    </>
  );
}

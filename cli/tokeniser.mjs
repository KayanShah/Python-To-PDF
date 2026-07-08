const KEYWORDS = new Set([
  'False', 'None', 'True', 'and', 'as', 'assert', 'async', 'await',
  'break', 'class', 'continue', 'def', 'del', 'elif', 'else', 'except',
  'finally', 'for', 'from', 'global', 'if', 'import', 'in', 'is',
  'lambda', 'nonlocal', 'not', 'or', 'pass', 'raise', 'return',
  'try', 'while', 'with', 'yield',
]);

const BUILTINS = new Set([
  'abs', 'all', 'any', 'ascii', 'bin', 'bool', 'breakpoint', 'bytearray',
  'bytes', 'callable', 'chr', 'classmethod', 'compile', 'complex',
  'copyright', 'credits', 'delattr', 'dict', 'dir', 'divmod', 'enumerate',
  'eval', 'exec', 'exit', 'filter', 'float', 'format', 'frozenset',
  'getattr', 'globals', 'hasattr', 'hash', 'help', 'hex', 'id', 'input',
  'int', 'isinstance', 'issubclass', 'iter', 'len', 'license', 'list',
  'locals', 'map', 'max', 'memoryview', 'min', 'next', 'object', 'oct',
  'open', 'ord', 'pow', 'print', 'property', 'quit', 'range', 'repr',
  'reversed', 'round', 'set', 'setattr', 'slice', 'sorted', 'staticmethod',
  'str', 'sum', 'super', 'tuple', 'type', 'vars', 'zip',
  '__name__', '__file__', '__doc__', '__package__', '__spec__',
  '__loader__', '__builtins__', 'self', 'cls',
]);

export function tokeniseLine(line) {
  const tokens = [];
  let i = 0;
  const len = line.length;

  while (i < len) {
    if (line[i] === '#') {
      tokens.push({ type: 'comment', text: line.slice(i) });
      break;
    }

    const strMatch = line.slice(i).match(
      /^([fFrRbBuU]{0,2})("""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/
    );
    if (strMatch) {
      tokens.push({ type: 'string', text: strMatch[0] });
      i += strMatch[0].length;
      continue;
    }

    const numMatch = line
      .slice(i)
      .match(
        /^(?:0[xX][0-9a-fA-F_]+|0[oO][0-7_]+|0[bB][01_]+|\d[\d_]*\.?[\d_]*(?:[eE][+-]?\d[\d_]*)?[jJ]?|\.\d[\d_]*(?:[eE][+-]?\d[\d_]*)?[jJ]?)/
      );
    if (numMatch && (i === 0 || !/[a-zA-Z_]/.test(line[i - 1]))) {
      tokens.push({ type: 'number', text: numMatch[0] });
      i += numMatch[0].length;
      continue;
    }

    const idMatch = line.slice(i).match(/^[a-zA-Z_]\w*/);
    if (idMatch) {
      const word = idMatch[0];
      const lastTok = tokens[tokens.length - 1];
      if (lastTok && lastTok.type === 'keyword' && (lastTok.text === 'def' || lastTok.text === 'class')) {
        tokens.push({ type: 'defname', text: word });
      } else if (KEYWORDS.has(word)) {
        tokens.push({ type: 'keyword', text: word });
      } else if (BUILTINS.has(word)) {
        tokens.push({ type: 'builtin', text: word });
      } else {
        tokens.push({ type: 'default', text: word });
      }
      i += word.length;
      continue;
    }

    const chunk = line.slice(i).match(/^[^a-zA-Z_0-9'"#\s]+|^\s+/);
    if (chunk) {
      tokens.push({ type: 'default', text: chunk[0] });
      i += chunk[0].length;
    } else {
      tokens.push({ type: 'default', text: line[i] });
      i++;
    }
  }

  return tokens;
}

export function tokenisePython(source) {
  const lines = source.split('\n');
  const result = [];
  let inTriple = null;

  for (let li = 0; li < lines.length; li++) {
    const line = lines[li];

    if (inTriple) {
      const end = line.indexOf(inTriple);
      if (end === -1) {
        result.push([{ type: 'string', text: line }]);
      } else {
        const text = line.slice(0, end + 3);
        const rest = line.slice(end + 3);
        const lineToks = [{ type: 'string', text }];
        if (rest) lineToks.push(...tokeniseLine(rest));
        result.push(lineToks);
        inTriple = null;
      }
      continue;
    }

    const toks = tokeniseLine(line);

    for (const tok of toks) {
      if (tok.type === 'string') {
        const t = tok.text.replace(/^[fFrRbBuU]{0,2}/, '');
        if ((t.startsWith('"""') || t.startsWith("'''")) && !t.endsWith(t.slice(0, 3)) || (t.startsWith('"""') && t.length < 6)) {
          inTriple = t.slice(0, 3);
        }
      }
    }

    result.push(toks);
  }

  return result;
}

export const IDLE_COLOURS = {
  keyword: '#ff7700',
  builtin: '#900090',
  string: '#00aa00',
  comment: '#dd0000',
  defname: '#0000ff',
  number: '#000000',
  default: '#000000',
};

import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { parse } = require('@babel/parser');
const root = process.cwd();

function graph(revision) {
  const visited = new Map();
  const read = file => {
    try { return revision ? execFileSync('git', ['show', `${revision}:${file}`], { cwd: root, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }) : readFileSync(path.join(root, file), 'utf8'); } catch { return null; }
  };
  const visit = file => {
    if (visited.has(file)) return;
    const source = read(file);
    if (source === null) return;
    visited.set(file, Buffer.byteLength(source));
    if (file.endsWith('.json')) return;
    const ast = parse(source, { sourceType: 'unambiguous', plugins: ['jsx'] });
    const dependencies = [];
    for (const node of ast.program.body) {
      if ((node.type === 'ImportDeclaration' || node.type === 'ExportNamedDeclaration' || node.type === 'ExportAllDeclaration') && node.source) dependencies.push(node.source.value);
      if (node.type === 'VariableDeclaration') for (const declarator of node.declarations) if (declarator.init?.type === 'CallExpression' && declarator.init.callee.name === 'require' && declarator.init.arguments[0]?.type === 'StringLiteral') dependencies.push(declarator.init.arguments[0].value);
    }
    for (const dependency of dependencies.filter(value => value.startsWith('.'))) {
      const base = path.posix.normalize(path.posix.join(path.posix.dirname(file), dependency));
      const resolved = [base, `${base}.js`, `${base}.json`, `${base}/index.js`].find(candidate => /\.(js|json)$/.test(candidate) && read(candidate) !== null);
      if (resolved) visit(resolved);
    }
  };
  visit('App.js');
  return { modules: visited.size, sourceBytes: [...visited.values()].reduce((sum, size) => sum + size, 0), wordBankAtStartup: visited.has('src/data/wordBank.json') };
}
const before = graph(process.argv[2] || '2b04314'), after = graph(null);
console.log(JSON.stringify({ scope: 'Static local import graph from App.js; excludes dependencies/assets/dynamic imports. Source bytes are not RAM or iPhone startup time.', before, after, reductionPercent: Math.round((1 - after.sourceBytes / before.sourceBytes) * 100) }, null, 2));

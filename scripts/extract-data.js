// Extract static data constants from the original index.html into JSON
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync('/home/z/my-project/aptunita_work_v2/index.html', 'utf8');

// Bracket-matched extractor: find "const NAME=" then match balanced brackets
function extractConst(name) {
  const idx = html.indexOf('const ' + name + '=');
  if (idx === -1) throw new Error('Not found: ' + name);
  let start = idx + ('const ' + name + '=').length;
  const openCh = html[start];
  const closeCh = { '{': '}', '[': ']', '"': '"' }[openCh];
  if (!closeCh) throw new Error('Unsupported start for ' + name + ': ' + openCh);
  let depth = 0, i = start, inStr = false, strCh = '';
  for (; i < html.length; i++) {
    const c = html[i];
    if (inStr) {
      if (c === '\\') { i++; continue; }
      if (c === strCh) inStr = false;
      continue;
    }
    if (c === '"' || c === "'" || c === '`') { inStr = true; strCh = c; continue; }
    if (c === openCh) depth++;
    else if (c === closeCh) { depth--; if (depth === 0) { i++; break; } }
  }
  return html.slice(start, i);
}

const names = ['KR', 'ST', 'BLN', 'BUKTI', 'INS', 'LKPT', 'NASKAH', 'IDN'];
const out = {};
for (const n of names) {
  const src = extractConst(n);
  // eslint-disable-next-line no-eval
  out[n] = eval('(' + src + ')');
  console.log(n, 'OK, type:', Array.isArray(out[n]) ? 'array[' + out[n].length + ']' : typeof out[n], Object.keys(out[n] || {}).length ? '(' + Object.keys(out[n]).length + ' keys)' : '');
}

// UNCOUNTED set (new Set([...]) — grab the bracketed list)
{
  const idx = html.indexOf('const UNCOUNTED');
  const open = html.indexOf('[', idx);
  let depth = 0, i = open;
  for (; i < html.length; i++) {
    if (html[i] === '[') depth++;
    else if (html[i] === ']') { depth--; if (depth === 0) { i++; break; } }
  }
  out.UNCOUNTED = eval('(' + html.slice(open, i) + ')');
}

// NK_KR object
out.NK_KR = eval('(' + extractConst('NK_KR') + ')');

// ACCOUNTS (structure only; passwords will be re-seeded server-side with bcrypt)
const accRaw = eval('(' + extractConst('ACCOUNTS') + ')');
out.ACCOUNTS = Object.fromEntries(Object.entries(accRaw).map(([u, a]) => [u, { role: a.role, kr: a.kr || '', label: a.label }]));

// Default JADWAL from goLocal
const jIdx = html.indexOf('"j01"');
let depth = 0, start = html.lastIndexOf('{', jIdx), i = start, inStr = false, strCh = '';
for (; i < html.length; i++) {
  const c = html[i];
  if (inStr) { if (c === '\\') { i++; continue; } if (c === strCh) inStr = false; continue; }
  if (c === '"' || c === "'") { inStr = true; strCh = c; continue; }
  if (c === '{') depth++;
  else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
}
out.JADWAL_DEFAULT = JSON.parse(html.slice(start, i));
console.log('JADWAL_DEFAULT OK, entries:', Object.keys(out.JADWAL_DEFAULT).length);

// Sanity checks
console.log('\n=== SANITY ===');
console.log('INS count:', out.INS.length, '(expect 65)');
console.log('INS sample keys:', Object.keys(out.INS[0]).join(', '));
console.log('LKPT count:', out.LKPT.length, '(expect 24)');
console.log('NASKAH count:', out.NASKAH.length, '(expect 14)');
console.log('KR count:', out.KR.length);
console.log('ACCOUNTS:', Object.keys(out.ACCOUNTS).join(', '));
console.log('ST:', out.ST.join(' | '));

const dest = '/home/z/my-project/scripts/accreditation-data.json';
fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.writeFileSync(dest, JSON.stringify(out, null, 1));
console.log('\nSaved to', dest, (fs.statSync(dest).size / 1024).toFixed(1) + ' KB');

const fs = require('fs');
let c = fs.readFileSync('Frontend/src/styles/page.css', 'utf8');
const delim = '/* ---------- right-side scroll container ---------- */';
if (c.includes(delim)) c = c.substring(0, c.indexOf(delim));
fs.writeFileSync('Frontend/src/styles/page.css', c, 'utf8');

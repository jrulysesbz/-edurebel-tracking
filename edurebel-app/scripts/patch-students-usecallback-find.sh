#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."

# find a students/page.tsx under src/app
FILE="$(find src -type f -path "*/app/students/page.tsx" -o -path "*/app/*/students/*/page.tsx" | head -n1 || true)"
if [[ -z "${FILE:-}" ]]; then
  echo "❌ Could not find students/page.tsx under src/app"
  exit 0
fi
echo "➡️  Patching: $FILE"

TARGET="$FILE" node - <<'JS'
const fs = require('fs');
const p = process.env.TARGET;
if (!p) { console.error('No TARGET provided'); process.exit(1); }
let src = fs.readFileSync(p, 'utf8');
let changed = false;

// Ensure useCallback import (works for default/named imports)
src = src
  .replace(/import\s+React\s*,\s*\{\s*([^}]*)\}\s*from\s*['"]react['"]\s*;/, (m, inside)=>{
    const set = new Set(inside.split(',').map(s=>s.trim()).filter(Boolean));
    if (!set.has('useCallback')) { set.add('useCallback'); changed = true; }
    return `import React, { ${[...set].join(', ')} } from 'react';`;
  })
  .replace(/import\s*\{\s*([^}]*)\}\s*from\s*['"]react['"]\s*;/, (m, inside)=>{
    const set = new Set(inside.split(',').map(s=>s.trim()).filter(Boolean));
    if (!set.has('useCallback')) { set.add('useCallback'); changed = true; }
    return `import { ${[...set].join(', ')} } from 'react';`;
  })
  .replace(/import\s+React\s+from\s*['"]react['"]\s*;/, (m)=>{
    if (!/useCallback/.test(src)) { changed = true; return "import React, { useCallback } from 'react';"; }
    return m;
  });

// Wrap a simple arrow-form loadAll = (...) => { ... }
src = src.replace(
  /const\s+loadAll\s*=\s*\(([^)]*)\)\s*=>\s*\{/,
  (m, params) => { changed = true; return `const loadAll = useCallback((${params}) => {`; }
);

// Append deps array if missing
src = src.replace(
  /const\s+loadAll\s*=\s*useCallback\(([\s\S]*?)\)\s*;/,
  (m, inner) => /,\s*\[.*\]\s*\)\s*;/.test(m) ? m : (changed = true, `const loadAll = useCallback(${inner}, []);`)
);

// Ensure useEffect includes loadAll in deps
src = src.replace(
  /useEffect\s*\(\s*\(\)\s*=>\s*\{\s*([\s\S]*?)\}\s*,\s*\[([\s\S]*?)\]\s*\)/g,
  (m, body, deps) => {
    const parts = new Set(deps.split(',').map(s=>s.trim()).filter(Boolean));
    if (!parts.has('loadAll')) { parts.add('loadAll'); changed = true; }
    return `useEffect(() => { ${body} }, [${[...parts].join(', ')}])`;
  }
);

if (changed) {
  fs.writeFileSync(p, src, 'utf8');
  console.log('✅ Patched', p);
} else {
  console.log('ℹ️ No changes needed', p);
}
JS

npm run -s ci:build

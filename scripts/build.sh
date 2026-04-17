#!/bin/bash
set -e

bun build src/cli.ts src/mcp.ts --outdir dist --target node

for f in dist/cli.js dist/mcp.js; do
  if ! head -1 "$f" | grep -q "#!/usr/bin/env node"; then
    {
      echo "#!/usr/bin/env node"
      cat "$f"
    } > "$f.tmp" && mv "$f.tmp" "$f"
  fi
  chmod +x "$f"
done

echo "Build complete"

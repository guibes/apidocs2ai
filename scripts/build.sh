#!/bin/bash
set -e

bun build src/cli.ts --outdir dist --target node

if ! head -1 dist/cli.js | grep -q "#!/usr/bin/env node"; then
  {
    echo "#!/usr/bin/env node"
    cat dist/cli.js
  } > dist/cli.js.tmp && mv dist/cli.js.tmp dist/cli.js
fi

chmod +x dist/cli.js
echo "Build complete"

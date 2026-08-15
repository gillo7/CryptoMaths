#!/usr/bin/env bash
set -euo pipefail

# Pinned commit, not "latest" - reproducible even if upstream changes or
# disappears. Bump deliberately if you ever want a newer version.
MD5COLLGEN_COMMIT=19592490cf62d2168e2c2fd8ec4a288236dd9238

cd "$(dirname "$0")"
rm -rf vendor/md5collgen
mkdir -p vendor
git clone https://github.com/zhijieshi/md5collgen.git vendor/md5collgen
(cd vendor/md5collgen && git checkout "$MD5COLLGEN_COMMIT" && make)
echo "Built vendor/md5collgen/md5collgen @ $MD5COLLGEN_COMMIT"

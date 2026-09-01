#!/usr/bin/env bash
set -euo pipefail

# Pinned commit, not "latest" - reproducible even if upstream changes.
# Bump deliberately if you ever want a newer liboqs.
LIBOQS_COMMIT=6985bb4b413aa6e74e803c8a581e41c7d69ff0fc

cd "$(dirname "$0")"
rm -rf vendor/liboqs vendor/liboqs-install
mkdir -p vendor/liboqs
# Shallow-fetch just the pinned commit rather than the whole history -
# `clone --depth 1` alone would only work if that commit still happened
# to be the branch tip, which won't stay true as upstream moves on.
(cd vendor/liboqs && git init -q && \
  git fetch --depth 1 https://github.com/open-quantum-safe/liboqs.git "$LIBOQS_COMMIT" && \
  git checkout -q FETCH_HEAD)

# Scoped to just HQC's three parameter sets - a full liboqs build
# compiles dozens of algorithms this service never uses.
cmake -S vendor/liboqs -B vendor/liboqs/build \
  -DCMAKE_INSTALL_PREFIX="$(pwd)/vendor/liboqs-install" \
  -DCMAKE_BUILD_TYPE=Release \
  -DBUILD_SHARED_LIBS=ON \
  -DOQS_MINIMAL_BUILD='KEM_hqc_1;KEM_hqc_3;KEM_hqc_5' \
  -DOQS_BUILD_ONLY_LIB=ON
cmake --build vendor/liboqs/build --parallel "$(nproc)"
cmake --build vendor/liboqs/build --target install

gcc -O2 -Wall -Wextra \
  -I vendor/liboqs-install/include \
  -L vendor/liboqs-install/lib \
  hqc-tool.c -loqs -o vendor/hqc-tool

echo "Built vendor/hqc-tool @ liboqs $LIBOQS_COMMIT"

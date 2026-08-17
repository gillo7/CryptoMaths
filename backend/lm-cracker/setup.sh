#!/usr/bin/env bash
set -euo pipefail

# Installs John the Ripper (core, from Debian's repo) and adds a
# demo-specific incremental-mode section to the real user's john.conf.
#
# Important: John looks up the config at the account's actual home
# directory (via the password database), NOT via the $HOME environment
# variable - so this has to land in ~/.john/john.conf for the account
# that will actually run the service, not a sandboxed/overridden path.

sudo apt-get install -y john

JOHN_CONF="$HOME/.john/john.conf"
mkdir -p "$HOME/.john"

if [ ! -f "$JOHN_CONF" ]; then
  cp /etc/john/john.conf "$JOHN_CONF"
fi

if ! grep -q '\[Incremental:CryptoMathsLM\]' "$JOHN_CONF"; then
  cat >> "$JOHN_CONF" << 'EOF'

[Incremental:CryptoMathsLM]
File = $JOHN/uppernum.chr
MinLen = 1
MaxLen = 5
CharCount = 36
EOF
  echo "Added [Incremental:CryptoMathsLM] to $JOHN_CONF"
else
  echo "[Incremental:CryptoMathsLM] already present in $JOHN_CONF"
fi

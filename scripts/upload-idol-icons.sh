#!/usr/bin/env bash
#
# Mirror the 52 idol icons from the upstream CDN into your own R2 bucket so
# the site can serve them from the same edge network as everything else.
#
# Prereqs:
#   - wrangler installed and authenticated (`npx wrangler login`)
#
# Usage:
#   BUCKET=your-bucket-name ./scripts/upload-idol-icons.sh
#
# After running, the objects live at  <bucket>/idol_icons/<id>.png  and the
# worker's existing path remap / your CDN route should expose them at
#   https://<your-cdn>/idol_icons/<id>.png
#
# Notes:
#   - `--remote` targets the real bucket (omit and wrangler writes to the
#     local dev simulation instead).
#   - Icons are immutable, so we cache them for a year.

set -euo pipefail

: "${BUCKET:=mltd-border-predict}"

SRC_BASE="https://storage.matsurihi.me/mltd/idol_icon"
KEY_PREFIX="idol_icons"
TOTAL=52
TMP_DIR="$(mktemp -d)"
trap 'rm -rf "$TMP_DIR"' EXIT

echo "Mirroring $TOTAL idol icons into R2 bucket '$BUCKET' under '$KEY_PREFIX/'..."

for id in $(seq 1 "$TOTAL"); do
    src="$SRC_BASE/${id}.png"
    file="$TMP_DIR/${id}.png"

    # Download (fail loudly on a bad status so we don't upload empty files).
    if ! curl -fsSL "$src" -o "$file"; then
        echo "  ✗ idol ${id}: download failed from $src" >&2
        exit 1
    fi

    # Upload to R2 with an immutable, long-lived cache policy.
    npx wrangler r2 object put \
        "${BUCKET}/${KEY_PREFIX}/${id}.png" \
        --file "$file" \
        --content-type "image/png" \
        --cache-control "public, max-age=31536000, immutable" \
        --remote

    echo "  ✓ idol ${id} -> ${KEY_PREFIX}/${id}.png"
done

echo "Done. Verify one: https://cdn.yuenimillion.live/data/${KEY_PREFIX}/1.png"

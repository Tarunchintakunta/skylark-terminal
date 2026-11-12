#!/usr/bin/env bash
# Hero frame sequence (one chain: cg-depart-1 -> cg-depart-2 -> cg-depart-3 -> cg-port), from the graded masters in the
# source repo (skylark-exim-v3: masters/<id>/master.mp4 2560x1440, phone.mp4 810x1440, both 24 fps, 121 frames).
# Same approach as the source repo's scripts/clip-frames.sh (ffmpeg extract, lanczos downscale, light unsharp, WebP),
# trimmed to one tier per device. Chained shots share their joining frame, so shots 2-4 drop their first frame.
#   SRC=~/Desktop/skylark/wt-story scripts/hero-frames.sh
# -> public/hero/d_NNN.webp (1280x720) and public/hero/m_NNN.webp (540x960)
set -euo pipefail
SRC=${SRC:-$HOME/Desktop/skylark/wt-story}
Q_D=${Q_D:-62}; Q_M=${Q_M:-55}
cd "$(dirname "$0")/.."
out=public/hero; rm -rf "$out"; mkdir -p "$out"
tmp=$(mktemp -d "${TMPDIR:-/tmp}/hf.XXXXXX")
# id:step:first  (every <step>th master frame, starting at frame <first>)
SHOTS="cg-depart-1:3:0 cg-depart-2:3:3 cg-depart-3:3:3 cg-port:5:5"
n=0
for s in $SHOTS; do
  IFS=: read -r id step first <<<"$s"
  for kind in d m; do
    if [ $kind = d ]; then in="$SRC/masters/$id/master.mp4"; vf="scale=1280:720:flags=lanczos,unsharp=5:5:0.5"
    else in="$SRC/masters/$id/phone.mp4"; vf="scale=540:960:flags=lanczos,unsharp=5:5:0.4"; fi
    rm -rf "$tmp/$kind"; mkdir -p "$tmp/$kind"
    ffmpeg -v error -i "$in" -vf "select='gte(n\,$first)*not(mod(n-$first\,$step))',$vf" -vsync vfr "$tmp/$kind/%03d.png"
  done
  for f in "$tmp"/d/*.png; do
    b=$(basename "$f" .png); i=$(printf %03d $n)
    cwebp -quiet -q "$Q_D" -m 6 "$f" -o "$out/d_$i.webp"
    cwebp -quiet -q "$Q_M" -m 6 "$tmp/m/$b.png" -o "$out/m_$i.webp"
    n=$((n+1))
  done
  echo "$id -> frames up to $n"
done
echo "FRAMES=$n"
du -ch "$out"/d_*.webp | tail -1; du -ch "$out"/m_*.webp | tail -1
rm -rf "$tmp"

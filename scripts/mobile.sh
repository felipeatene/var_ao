#!/usr/bin/env bash
set -euo pipefail
project_root="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
tooling_dir="$(dirname "$project_root")/.tooling"
if [[ -d "$tooling_dir" ]]; then tooling_dir="$(cd "$tooling_dir" && pwd -P)"; fi
if [[ -n "${FLUTTER_BIN:-}" ]]; then
  flutter_bin="$FLUTTER_BIN"
elif [[ -x "$tooling_dir/flutter/bin/flutter" ]]; then
  flutter_bin="$tooling_dir/flutter/bin/flutter"
else
  flutter_bin="$(command -v flutter || true)"
fi
if [[ ! -x "$flutter_bin" ]]; then
  printf '%s\n' 'Flutter não encontrado. Defina FLUTTER_BIN para o executável instalado.' >&2
  exit 1
fi
if [[ -d "$tooling_dir/jdk/Contents/Home" ]]; then export JAVA_HOME="$tooling_dir/jdk/Contents/Home"; fi
if [[ -d "$tooling_dir/android-sdk" ]]; then export ANDROID_HOME="$tooling_dir/android-sdk"; fi
export PATH="$(dirname "$flutter_bin"):${JAVA_HOME:-/usr}/bin:${ANDROID_HOME:-/tmp}/platform-tools:$PATH"
cd "$project_root/apps/mobile"
if [[ "${1:-}" == analyze ]]; then
  # Flutter 3.47's LSP client miscounts UTF-8 Content-Length for an accented path.
  alias_path="${TMPDIR:-/tmp}/outro-angulo-analyze-$UID"
  if [[ -e "$alias_path" || -L "$alias_path" ]]; then
    if [[ ! -L "$alias_path" || "$(readlink "$alias_path")" != "$project_root/apps/mobile" ]]; then
      printf '%s\n' "Caminho temporário já ocupado: $alias_path" >&2; exit 1
    fi
  else ln -s "$project_root/apps/mobile" "$alias_path"; fi
  shift
  exec "$(dirname "$flutter_bin")/dart" analyze "$alias_path" "$@"
fi
exec "$flutter_bin" "$@"

#!/usr/bin/env bash
#
# 새 플러그인 스캐폴딩
#
#   ./scripts/new-plugin.sh <plugin-name>
#
# plugins/<plugin-name>/ 아래에 plugin.json, README.md, skills/<plugin-name>/SKILL.md
# 골격을 만듭니다. 마켓플레이스 등록(.claude-plugin/marketplace.json)은 수동입니다.
# 자세한 절차는 CONTRIBUTING.md 를 보세요.

set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

usage() {
  cat >&2 <<'EOF'
사용법: ./scripts/new-plugin.sh <plugin-name>

  <plugin-name>  소문자·숫자·하이픈만. 예: hankookilbo-memo

예시:
  ./scripts/new-plugin.sh hankookilbo-memo
EOF
  exit 1
}

[ $# -eq 1 ] || usage

NAME="$1"

if ! printf '%s' "$NAME" | grep -Eq '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'; then
  echo "오류: 플러그인 이름은 소문자·숫자·하이픈만 쓸 수 있습니다 (받은 값: '$NAME')" >&2
  exit 1
fi

PLUGIN_DIR="$REPO_ROOT/plugins/$NAME"

if [ -e "$PLUGIN_DIR" ]; then
  echo "오류: plugins/$NAME 이 이미 있습니다. 다른 이름을 쓰거나 기존 폴더를 확인하세요." >&2
  exit 1
fi

if grep -q "\"name\": \"$NAME\"" "$REPO_ROOT/.claude-plugin/marketplace.json" 2>/dev/null; then
  echo "오류: '$NAME' 이 이미 marketplace.json 에 등록돼 있습니다." >&2
  exit 1
fi

mkdir -p "$PLUGIN_DIR/.claude-plugin" "$PLUGIN_DIR/skills/$NAME"

cat > "$PLUGIN_DIR/.claude-plugin/plugin.json" <<EOF
{
  "name": "$NAME",
  "version": "0.1.0",
  "description": "TODO: 사용자가 목록에서 보고 설치를 결정할 한 문장.",
  "author": {
    "name": "TODO: 이름"
  },
  "keywords": [],
  "license": "MIT",
  "homepage": "https://github.com/hkilbo/claude-plugins/tree/main/plugins/$NAME"
}
EOF

cat > "$PLUGIN_DIR/skills/$NAME/SKILL.md" <<EOF
---
name: $NAME
description: TODO — 이 스킬을 언제 쓰는지 구체적으로 적습니다. 실제 사용자가 쓰는 표현("OO 만들어줘", "OO 점검해줘")을 함께 넣고, 언제 쓰지 *않는지*도 적으면 오작동이 줄어듭니다.
---

# TODO — 제목

## 언제 쓰나

TODO

## 절차

TODO

## 규격

TODO
EOF

cat > "$PLUGIN_DIR/README.md" <<EOF
# $NAME

TODO: 이 플러그인이 무엇을 해 주는지 한두 문장.

## 무엇을 할 수 있나

TODO: 사용자가 실제로 쓰는 요청 예시와 그때 벌어지는 일.

## 설치

\`\`\`bash
/plugin marketplace add hkilbo/claude-plugins
\`\`\`

\`\`\`bash
/plugin install $NAME@hankookilbo
\`\`\`

## 만든 사람

TODO
EOF

cat <<EOF
생성 완료: plugins/$NAME/

  plugins/$NAME/.claude-plugin/plugin.json
  plugins/$NAME/README.md
  plugins/$NAME/skills/$NAME/SKILL.md

다음 단계:
  1. 위 세 파일의 TODO 를 채웁니다.
  2. .claude-plugin/marketplace.json 의 plugins 배열에 항목을 추가합니다:

     {
       "name": "$NAME",
       "description": "plugin.json 과 같은 설명.",
       "version": "0.1.0",
       "source": "./plugins/$NAME",
       "author": { "name": "이름" },
       "category": "productivity",
       "homepage": "https://github.com/hkilbo/claude-plugins/tree/main/plugins/$NAME"
     }

  3. claude plugin validate .
  4. 로컬 설치로 발동 확인 (CONTRIBUTING.md 6번 참고)
EOF

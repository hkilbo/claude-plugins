# 플러그인·스킬 추가 가이드

이 저장소는 **플러그인 하나 = 폴더 하나** 구조입니다. 사용자는 마켓플레이스를 한 번 등록해 두고 필요한 플러그인만 골라 설치하므로, 새 플러그인을 추가해도 기존 사용자의 설치 상태는 영향을 받지 않습니다.

## 새 플러그인으로 만들까, 기존 플러그인에 스킬을 더할까

설치·제거가 플러그인 단위로 일어난다는 점이 판단 기준입니다.

**새 플러그인으로 분리** — 이 스킬만 쓰고 싶은 사람이 있을 때

- 다루는 주제가 기존 플러그인과 다르다 (슬라이드 서식 ↔ 커밋 규약)
- 쓰는 팀이 다르다 (편집국만 / 개발팀만)
- 무거운 에셋을 들고 있어서, 안 쓰는 사람에게까지 내려보내고 싶지 않다

**기존 플러그인에 스킬 추가** — 따로 떼면 오히려 불편할 때

- 같은 규격·같은 에셋을 공유한다
- 한 흐름의 단계다 (만들기 → 변환 → 점검)
- 하나만 설치하면 반쪽만 쓰는 셈이 된다

`hankookilbo-slides`가 두 번째 경우입니다. 만들기·변환·점검 세 스킬이 같은 템플릿과 색상 규격을 쓰기 때문에 한 플러그인에 묶여 있습니다.

> 판단이 애매하면 **분리**를 택하세요. 나중에 합치는 것보다 쪼개는 게 어렵습니다. 이미 배포된 플러그인을 쪼개면 사용자가 다시 설치해야 합니다.

## 새 플러그인 만들기

### 1. 스캐폴딩

```bash
./scripts/new-plugin.sh my-plugin
```

아래 구조가 생성됩니다.

```
plugins/my-plugin/
├── .claude-plugin/
│   └── plugin.json
├── README.md
└── skills/
    └── my-plugin/
        └── SKILL.md
```

### 2. `plugin.json` 채우기

```json
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "사용자가 목록에서 보고 설치를 결정할 한 문장.",
  "author": { "name": "이름" },
  "keywords": ["키워드"],
  "license": "MIT",
  "homepage": "https://github.com/hkilbo/claude-plugins/tree/main/plugins/my-plugin"
}
```

`name`은 폴더명과 같아야 하고, 마켓플레이스 전체에서 유일해야 합니다.

### 3. `SKILL.md` 작성

프론트매터의 `description`이 **스킬이 언제 발동할지를 결정합니다.** 여기에 적힌 상황과 사용자의 요청이 맞아떨어져야 스킬이 불려 옵니다. 추상적인 소개가 아니라 실제로 사람들이 쓰는 표현을 넣으세요.

```markdown
---
name: my-plugin
description: 이 스킬을 언제 쓰는지 구체적으로. "OO 만들어줘", "OO 점검해줘" 처럼 실제 사용자가 쓰는 표현을 함께 적습니다. 언제 쓰지 *않는지*도 적으면 오작동이 줄어듭니다.
---

# 제목

## 언제 쓰나

## 절차

## 규격
```

> **YAML 함정** — `description` 값 안에 `콜론+공백`(`: `)이 들어가면 YAML이 중첩 키로 읽어 프론트매터 전체가 조용히 버려집니다. 스킬이 아예 발동하지 않는데 원인이 안 보이는 흔한 경우입니다. 콜론 대신 `—`를 쓰거나 값 전체를 따옴표로 감싸세요. `claude plugin validate`가 잡아 줍니다.

에셋과 참고 문서는 스킬 폴더 아래로 넣습니다.

```
skills/my-plugin/
├── SKILL.md
├── assets/          # 템플릿, 이미지, 스크립트
└── references/      # SKILL.md가 필요할 때 읽어 들이는 상세 규격
```

`SKILL.md`는 항상 컨텍스트에 올라가고 `references/`는 필요할 때만 읽힙니다. 긴 규격표·예제 코드는 `references/`로 빼면 평소 토큰 소모를 줄일 수 있습니다.

### 4. 마켓플레이스에 등록

`.claude-plugin/marketplace.json`의 `plugins` 배열에 항목을 추가합니다. 등록하지 않으면 폴더가 있어도 설치되지 않습니다.

```json
{
  "name": "my-plugin",
  "description": "plugin.json과 같은 설명.",
  "version": "0.1.0",
  "source": "./plugins/my-plugin",
  "author": { "name": "이름" },
  "category": "productivity",
  "keywords": ["키워드"],
  "homepage": "https://github.com/hkilbo/claude-plugins/tree/main/plugins/my-plugin"
}
```

`version`은 `plugin.json`과 **일치해야 합니다.** 어긋나면 `claude plugin tag`가 릴리스를 거부합니다.

`category`는 마켓플레이스 목록에서 분류에 쓰입니다: `productivity`, `development`, `design`, `security`, `testing`, `automation`, `monitoring`, `database`, `deployment`, `learning`.

### 5. 검증

```bash
claude plugin validate .
```

마켓플레이스와 등록된 모든 플러그인 매니페스트를 함께 확인합니다.

### 6. 실제로 설치해서 확인

머지하기 전에 로컬 경로로 등록해 스킬이 의도한 요청에서 발동하는지 확인하세요.

```bash
claude plugin marketplace add ./
```

```bash
claude plugin install my-plugin@hankookilbo
```

새 세션을 열어 실제 표현으로 요청해 봅니다. 발동하지 않으면 대부분 `SKILL.md`의 `description`이 실제 사용자의 말과 어긋난 경우입니다.

담고 있는 스킬과 예상 토큰 비용을 확인하려면:

```bash
claude plugin details my-plugin@hankookilbo
```

확인이 끝나면 로컬 등록을 지우고 공개 마켓플레이스로 되돌립니다.

```bash
claude plugin marketplace remove hankookilbo
```

```bash
claude plugin marketplace add hkilbo/claude-plugins
```

## 기존 플러그인 수정

1. `plugins/<플러그인>/skills/**/SKILL.md` 등을 수정
2. `plugins/<플러그인>/.claude-plugin/plugin.json`의 `version` 상향
3. `.claude-plugin/marketplace.json`의 해당 항목 `version`도 **같은 값으로** 상향
4. `claude plugin validate .`
5. commit & push

버전은 [유의적 버전](https://semver.org/lang/ko/)을 따릅니다.

| 변경                                         | 올릴 자리 | 예            |
| -------------------------------------------- | --------- | ------------- |
| 오타·문구 수정, 규격 수치 정정               | PATCH     | 0.3.1 → 0.3.2 |
| 스킬 추가, 새 장표·에셋 추가                 | MINOR     | 0.3.1 → 0.4.0 |
| 스킬 이름 변경·삭제, 호환되지 않는 규격 개편 | MAJOR     | 0.3.1 → 1.0.0 |

사용자는 `/plugin marketplace update hankookilbo` 후 `/plugin update <플러그인>`으로 최신 버전을 받습니다.

### 릴리스 태그 (선택)

플러그인별로 버전을 고정해 배포하려면:

```bash
claude plugin tag plugins/my-plugin
```

`my-plugin--v0.1.0` 형태의 git 태그를 만들고, `plugin.json`과 마켓플레이스 항목의 버전이 일치하는지 검증합니다. 플러그인마다 독립적으로 태그가 붙으므로 릴리스 주기를 따로 가도 됩니다.

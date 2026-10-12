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

| 변경 | 올릴 자리 | 예 |
|---|---|---|
| 오타·문구 수정, 규격 수치 정정 | PATCH | 0.3.1 → 0.3.2 |
| 스킬 추가, 새 장표·에셋 추가 | MINOR | 0.3.1 → 0.4.0 |
| 스킬 이름 변경·삭제, 호환되지 않는 규격 개편 | MAJOR | 0.3.1 → 1.0.0 |

사용자는 `/plugin marketplace update hankookilbo` 후 `/plugin update <플러그인>`으로 최신 버전을 받습니다.

### 릴리스 태그 (선택)

플러그인별로 버전을 고정해 배포하려면:

```bash
claude plugin tag plugins/my-plugin
```

`my-plugin--v0.1.0` 형태의 git 태그를 만들고, `plugin.json`과 마켓플레이스 항목의 버전이 일치하는지 검증합니다. 플러그인마다 독립적으로 태그가 붙으므로 릴리스 주기를 따로 가도 됩니다.

## CDN 업로드 (HERB 스킬 목록)

GitHub Actions `Publish claude-plugins {dev,stg,prd}`를 **수동 실행**하면 목록과 zip이 사내 CDN의 `/claude-plugins/`에 올라갑니다. HERB의 인터랙티브 > Claude 스킬 화면이 이걸 읽어 목록·`SKILL.md` 보기·다운로드를 보여 주므로, **HERB 쪽은 다시 배포할 필요가 없습니다.**

push 에 자동으로 돌지 않습니다 — 게시 = 라이브이므로 실행 시점을 사람이 정합니다. 롤백은 되돌릴 커밋을 ref 로 골라 같은 워크플로를 다시 실행하면 됩니다.

올라가는 것은 로컬에서 미리 확인할 수 있습니다.

```bash
node scripts/build-assets.mjs
```

`build/claude-plugins/` 아래에 `index.json`, 플러그인 zip, 스킬별 zip, `SKILL.md`가 생깁니다 (커밋 대상 아님).

### 동작 방식

호출자 워크플로 3개(`.github/workflows/publish-claude-plugins-{dev,stg,prd}.yml`)가 공통 워크플로 `hkilbo/hk-frontend/.github/workflows/reusable-s3-mutable-publish.yml`을 호출합니다. dev·stg 는 이동 태그 `@v1`, prd 는 불변 태그 `@v1.x.x`를 참조합니다.

업로드 규칙: zip → `SKILL.md` → `index.json` 순서로 올리고(목록이 아직 없는 파일을 가리키지 않도록 진입점이 마지막), 마켓플레이스에서 뺀 플러그인의 zip·`SKILL.md`는 `/claude-plugins/` 안에서만 삭제합니다. 끝나면 `/claude-plugins/*` 를 CloudFront 에서 무효화합니다.

### 처음 한 번 — AWS 역할과 저장소 변수

인증은 GitHub OIDC로 합니다. 공개 저장소라 장기 액세스 키는 쓰지 않고, 계정·역할·버킷·배포 ID 같은 값도 코드에 적지 않습니다.

1. AWS IAM에 GitHub OIDC 공급자(`token.actions.githubusercontent.com`, 대상 `sts.amazonaws.com`)가 없으면 추가
2. 환경마다 역할을 만들고 **신뢰 정책**을 이 저장소의 `main` + 공통 워크플로 경유로 한정. `sub`는 문서 형식(`repo:<owner>/<repo>:…`)이 아니라 `GET /repos/<owner>/<repo>/actions/oidc/customization/sub`의 `sub_claim_prefix`를 씁니다 (근거: hk-frontend `docs/oidc-claims.md`)

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Effect": "Allow",
    "Action": "sts:AssumeRoleWithWebIdentity",
    "Principal": { "Federated": "arn:aws:iam::<계정ID>:oidc-provider/token.actions.githubusercontent.com" },
    "Condition": {
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com",
        "token.actions.githubusercontent.com:sub": "<sub_claim_prefix>:ref:refs/heads/main",
        "token.actions.githubusercontent.com:repository_id": "<저장소ID>",
        "token.actions.githubusercontent.com:ref": "refs/heads/main"
      },
      "StringLike": {
        "token.actions.githubusercontent.com:job_workflow_ref": "hkilbo/hk-frontend/.github/workflows/reusable-s3-mutable-publish.yml@refs/tags/v1"
      }
    }
  }]
}
```

prd 는 `job_workflow_ref` 끝을 `@refs/tags/v1.*`로 바꿉니다 (불변 태그만 허용).

3. **권한 정책**은 버킷의 `claude-plugins/` 경로와 해당 CloudFront 배포만 (환경마다 반복)

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "s3:GetBucketLocation", "Resource": "arn:aws:s3:::<버킷>" },
    { "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::<버킷>",
      "Condition": { "StringLike": { "s3:prefix": ["claude-plugins/*"] } } },
    { "Effect": "Allow", "Action": ["s3:GetObject", "s3:PutObject", "s3:DeleteObject"], "Resource": "arn:aws:s3:::<버킷>/claude-plugins/*" },
    { "Effect": "Allow", "Action": "cloudfront:CreateInvalidation", "Resource": "arn:aws:cloudfront::<계정ID>:distribution/<배포ID>" }
  ]
}
```

4. 저장소 Settings > Secrets and variables > Actions > **Variables**에 등록 (환경마다 3개)

| 변수 | 값 |
|---|---|
| `AWS_ROLE_ARN_DEV` · `_STG` · `_PRD` | 위 역할 ARN |
| `ASSETS_BUCKET_DEV` · `_STG` · `_PRD` | assets 버킷 이름 |
| `ASSETS_DISTRIBUTION_DEV` · `_STG` · `_PRD` | 그 버킷 앞 CloudFront 배포 ID |

변수가 비어 있으면 공통 워크플로의 입력 검증 단계에서 바로 실패합니다.

등록 후 Actions 탭에서 `Publish claude-plugins dev`를 수동 실행(Run workflow)해 첫 업로드를 합니다. 실패하면 Job Summary 의 "OIDC claims" 표를 신뢰 정책과 한 줄씩 대조하세요.

## 브랜드 자산을 포함할 때

로고·공식 템플릿처럼 회사 저작물을 새로 추가하면 [NOTICE](NOTICE)의 파일 목록에도 함께 추가하세요. 이 저장소는 공개 저장소이므로, 올리기 전에 다음을 확인합니다.

- 외부에 공개해도 되는 자산인가 — 미공개 자료·계약서 서식·개인정보가 담긴 예제는 올리지 않습니다
- 사내 전용이어야 한다면 이 저장소가 아니라 사내 비공개 저장소(`company-skills`)로 갑니다
- 예제 데이터에 실제 사내 수치가 들어가 있지 않은가

## 커밋

커밋 메시지는 사내 커밋 규약(`fe-commit-convention`)을 따릅니다.

# 한국일보 Claude Code 플러그인

한국일보가 사내에서 쓰는 업무 자동화 스킬을 [Claude Code](https://claude.com/claude-code) 플러그인으로 공개한 마켓플레이스입니다.

각 플러그인은 **독립적으로 설치·제거**할 수 있습니다. 마켓플레이스를 한 번 등록해 두면 필요한 것만 골라 쓰면 되고, 새 플러그인이 추가돼도 쓰지 않는 것은 내려오지 않습니다.

## 포함된 플러그인

| 플러그인 | 버전 | 설명 |
|---|---|---|
| [`hankookilbo-slides`](plugins/hankookilbo-slides) | 0.3.1 | 한국일보 공식 슬라이드 서식으로 보고 자료를 만들고, 기존 문서를 공식 서식으로 바꾸고, 서식 준수 여부를 점검합니다. 템플릿과 로고가 함께 들어 있습니다. |
| [`hankookilbo-interactives`](plugins/hankookilbo-interactives) | 0.2.0 | 한국일보 인터랙티브 기사 페이지(Astro + React)를 공식 템플릿으로 만듭니다. 기획부터 자체 점검·전달용 zip 패키징까지 진행하고, 캐러셀·스크롤·지도에 쓸 라이브러리를 규칙대로 고릅니다. 외주 제작사와 공용. |

## 설치

Claude Code 세션에서 마켓플레이스를 먼저 등록합니다.

```bash
/plugin marketplace add hkilbo/claude-plugins
```

그다음 필요한 플러그인만 설치합니다.

```bash
/plugin install hankookilbo-slides@hankookilbo
```

설치 후 **새 세션부터** 스킬이 인식됩니다. 터미널에서 바로 설치하려면:

```bash
claude plugin marketplace add hkilbo/claude-plugins
```

```bash
claude plugin install hankookilbo-slides@hankookilbo
```

### 어떤 플러그인이 있는지 먼저 둘러보려면

```bash
/plugin
```

등록된 마켓플레이스의 플러그인 목록을 훑어보고 설치·해제할 수 있습니다.

설치한 플러그인이 어떤 스킬을 담고 있고 컨텍스트를 얼마나 쓰는지 확인하려면:

```bash
claude plugin details hankookilbo-slides@hankookilbo
```

## 사용

플러그인을 설치하면 스킬이 자동으로 인식됩니다. 별도 명령을 외울 필요 없이 평소처럼 요청하면 됩니다.

> "2026년 상반기 사업계획 슬라이드 만들어줘"
> "이 PPT 한국일보 공식 서식으로 바꿔줘"
> "이 덱 서식 맞는지 점검해줘"

플러그인별 자세한 사용법은 각 플러그인 폴더의 README를 확인하세요.

## 업데이트

```bash
/plugin marketplace update hankookilbo
```

```bash
/plugin update hankookilbo-slides
```

## 제거

```bash
/plugin uninstall hankookilbo-slides
```

마켓플레이스 등록까지 지우려면:

```bash
/plugin marketplace remove hankookilbo
```

## 저장소 구조

```
claude-plugins/
├── .claude-plugin/
│   └── marketplace.json          # 마켓플레이스 정의 — 플러그인 목록
├── plugins/                      # 플러그인 하나당 폴더 하나
│   └── hankookilbo-slides/
│       ├── .claude-plugin/
│       │   └── plugin.json       # 플러그인 매니페스트
│       ├── README.md             # 플러그인 사용법
│       └── skills/               # 이 플러그인이 제공하는 스킬들
│           ├── hankookilbo-slides/
│           │   ├── SKILL.md
│           │   ├── assets/
│           │   └── references/
│           ├── hankookilbo-slides-check/
│           └── hankookilbo-slides-convert/
├── scripts/
│   └── new-plugin.sh             # 새 플러그인 스캐폴딩
├── CONTRIBUTING.md               # 플러그인·스킬 추가 방법
├── LICENSE                       # MIT (코드·문서)
└── NOTICE                        # 브랜드 자산 이용 조건
```

플러그인이 `plugins/` 아래 개별 폴더로 나뉘어 있고 `marketplace.json`이 각각을 따로 가리키기 때문에, 사용자는 저장소 전체를 받지 않고 **원하는 플러그인만** 설치합니다. 새 플러그인을 추가해도 기존 사용자의 설치 상태는 영향을 받지 않습니다.

## 새 플러그인·스킬 추가

[CONTRIBUTING.md](CONTRIBUTING.md)에 스캐폴딩부터 검증·배포까지 정리해 두었습니다. 요약하면:

```bash
./scripts/new-plugin.sh my-plugin
```

생성된 `plugin.json`과 `SKILL.md`를 채우고, `.claude-plugin/marketplace.json`의 `plugins` 배열에 항목을 추가한 뒤 검증합니다.

```bash
claude plugin validate .
```

## 공개 범위

이 저장소에는 **외부에 공개해도 되는 플러그인만** 올립니다. 사내 전용 스킬은 별도 비공개 저장소에서 관리합니다.

## 라이선스

소스 코드와 문서는 [MIT 라이선스](LICENSE)를 따릅니다.

한국일보 로고·공식 템플릿·표지 아트워크는 **MIT 적용 대상이 아닙니다.** 다른 조직에서 이 저장소를 참고해 자체 서식 플러그인을 만드는 것은 환영하지만, 브랜드 자산 파일은 자체 자산으로 교체해야 합니다. 자세한 조건은 [NOTICE](NOTICE)를 확인하세요.

# 상태 공유: zustand

React 아일랜드는 **각각 별개의 React 루트**다. `useContext`는 아일랜드를 넘지 못한다.
두 개 이상의 아일랜드가 같은 값을 읽거나 바꿔야 하면 zustand 스토어 하나를 두고 양쪽에서 구독한다.

## 설치

```bash
npm i zustand
```

`package.json`에 `zustand`가 있으면 건너뛴다.

> **게임 타이머 일시정지는 여기가 아니다.** 로고 버튼 메뉴·"화면이 너무 작아요" 동안 멈추는 것은 템플릿의
> `hkCommon.createPause()`가 맡는다(본 스킬 `references/patterns.md` 패턴 E). React 게임이면 스토어 액션에서
> `pause.paused`를 확인하거나 `createPause({ onChange: (p) => useGame.setState({ paused: p }) })`로 연결한다.

## 언제 쓰나

| 상황 | 선택 |
| --- | --- |
| 컴포넌트 하나 안에서만 쓰는 값 | `useState`. 스토어를 만들지 않는다 |
| 컴포넌트 둘 이상이 같은 값을 읽고 쓴다 (퀴즈 진행, 필터, 계산기 입력, 현재 챕터) | zustand 스토어 하나 |
| Astro `<script>`가 감지한 "어느 섹션이 보이는가"를 컴포넌트에 알림 | `section-change` CustomEvent (scroll.md). 스토어로 바꾸지 않는다 |
| Astro `<script>`가 스토어 값을 바꿔야 함 | `useXxxStore.getState().setXxx(...)` |
| 새로고침 후에도 남아야 하는 값 | `persist` 미들웨어 + `sessionStorage` |

## 위치와 이름

- `src/stores/<이름>Store.ts` — 스토어 하나에 파일 하나. 훅 이름은 `use<이름>Store`.
- 상태와 액션을 한 스토어에 둔다. 액션 이름은 `set*`, `reset`, 동사형(`answer`, `next`).
- 상수·타입은 스토어 파일 상단 또는 `src/data/*.ts`에 둔다.

## 기본 패턴

```ts
// src/stores/quizStore.ts
import { create } from "zustand";

export type Answer = number | null;

interface QuizState {
  step: number;
  answers: Answer[];
  answer: (step: number, value: number) => void;
  next: () => void;
  prev: () => void;
  reset: () => void;
}

const QUESTION_COUNT = 10;

export const useQuizStore = create<QuizState>((set) => ({
  step: 0,
  answers: Array(QUESTION_COUNT).fill(null),
  answer: (step, value) =>
    set((s) => {
      const answers = [...s.answers];
      answers[step] = value;
      return { answers };
    }),
  next: () => set((s) => ({ step: Math.min(s.step + 1, QUESTION_COUNT - 1) })),
  prev: () => set((s) => ({ step: Math.max(s.step - 1, 0) })),
  reset: () => set({ step: 0, answers: Array(QUESTION_COUNT).fill(null) }),
}));
```

```tsx
// src/components/QuizProgress.tsx
import { useQuizStore } from "../stores/quizStore";

export default function QuizProgress() {
  // 필요한 값만 선택한다. 스토어 전체를 구독하면 무관한 변경에도 리렌더된다
  const step = useQuizStore((s) => s.step);
  const total = useQuizStore((s) => s.answers.length);
  return (
    <div className="quiz-progress" role="progressbar" aria-valuenow={step + 1} aria-valuemax={total}>
      {/* 인접한 표현식 둘({a} / {b})을 나란히 쓰지 않는다. astro-compress가 React SSR의 텍스트 구분 주석을 지워
          hydration 오류(#418)가 난다. 템플릿 리터럴 하나로 합친다 */}
      {`${step + 1} / ${total}`}
    </div>
  );
}
```

```tsx
// src/components/QuizQuestion.tsx
import { useQuizStore } from "../stores/quizStore";
import { questions } from "../data/questions";

export default function QuizQuestion() {
  const step = useQuizStore((s) => s.step);
  const selected = useQuizStore((s) => s.answers[step]);
  const answer = useQuizStore((s) => s.answer);
  const next = useQuizStore((s) => s.next);
  const q = questions[step];

  return (
    <section className="quiz-question">
      <h2>{q.title}</h2>
      {q.options.map((opt, i) => (
        <button type="button" key={opt} aria-pressed={selected === i} onClick={() => answer(step, i)}>
          {opt}
        </button>
      ))}
      <button type="button" disabled={selected === null} onClick={next}>
        다음
      </button>
    </section>
  );
}
```

## Astro에서 마운트

```astro
---
import QuizProgress from "../components/QuizProgress";
import QuizQuestion from "../components/QuizQuestion";
---
<QuizProgress client:load />
<QuizQuestion client:load />
```

같은 페이지의 컴포넌트는 같은 스토어를 본다. 별도 설정 없음.

## Astro `<script>`에서 스토어 쓰기

```astro
<script>
  import { useQuizStore } from "../stores/quizStore";

  // 컴포넌트 밖에서는 훅이 아니라 getState() / setState() / subscribe()
  document.querySelector(".reset-btn")?.addEventListener("click", () => {
    useQuizStore.getState().reset();
  });

  // 값이 바뀔 때 Astro 쪽 DOM을 갱신. 반환값은 해제 함수
  const unsubscribe = useQuizStore.subscribe((s) => {
    document.body.classList.toggle("quiz-done", s.step === s.answers.length - 1);
  });
</script>
```

## 새로고침 유지

```ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useQuizStore = create<QuizState>()(
  persist(
    (set) => ({
      /* 위와 동일 */
    }),
    {
      name: "everest-1977-quiz", // 저장 키. FOLDER_NAME을 접두어로 붙여 다른 인터랙티브와 충돌을 막는다
      storage: createJSONStorage(() => sessionStorage), // 탭을 닫으면 지워진다. 영구 저장은 localStorage
    }
  )
);
```

`persist`를 쓰는 컴포넌트는 `client:only="react"`로 마운트한다.

## 자주 하는 실수

- 스토어에 DOM 요소, 지도 인스턴스, GSAP 타임라인을 넣는다. 직렬화 가능한 값만 둔다. 그런 것은 `useRef`.
- 파생값(정답 수, 완료 여부)을 스토어에 따로 저장한다. 선택자에서 계산한다: `useQuizStore((s) => s.answers.filter((a) => a !== null).length)`.
- 스토어 하나에 화면 전체 상태를 다 넣는다. 관심사별로 나눈다 (`quizStore`, `filterStore`).
- `useQuizStore()`처럼 선택자 없이 통째로 구독한다. 값이 하나 바뀔 때마다 전부 리렌더된다.
- QA 때 값 확인은 브라우저 콘솔에서 `useQuizStore.getState()`.

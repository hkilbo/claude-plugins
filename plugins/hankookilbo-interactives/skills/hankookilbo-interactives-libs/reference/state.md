# 상태 공유: 일반 객체 + subscribe

빌드가 없으므로 상태 라이브러리를 쓰지 않는다. 위젯 둘 이상이 같은 값을 읽거나 바꿔야 할 때만
프로젝트 스크립트 최상위(블록 밖)에 객체 하나와 `subscribe` 함수를 둔다.

## 언제 쓰나

| 상황 | 선택 |
| --- | --- |
| 위젯 하나 안에서만 쓰는 값 | 그 위젯 블록의 지역 변수(`let`). 공유 객체를 만들지 않는다 |
| 위젯 둘 이상이 같은 값을 읽고 쓴다 (퀴즈 진행, 필터, 계산기 입력) | 공유 객체 하나 + `subscribe` |
| "어느 섹션이 보이는가"를 지도·차트 코드에 알림 | `section-change` CustomEvent (scroll.md). 공유 객체로 바꾸지 않는다 |
| 새로고침 후에도 남아야 하는 값 | 구독자 하나가 `sessionStorage`에 저장 |
| 게임 타이머를 멈출 이유 (피드백 화면 등) | `hkCommon.createPause()` (아래) |

## 기본 패턴

```js
// 공유 상태. 직렬화 가능한 값만 둔다
const QUESTION_COUNT = 10;
const quiz = { step: 0, answers: Array(QUESTION_COUNT).fill(null) };
const quizListeners = new Set();
/** 값이 바뀔 때마다 fn(quiz). 등록 즉시 한 번 부른다. 해제 함수를 돌려준다 */
function subscribeQuiz(fn) {
  quizListeners.add(fn);
  fn(quiz);
  return () => quizListeners.delete(fn);
}
/** 값은 이 함수로만 바꾼다 */
function setQuiz(patch) {
  Object.assign(quiz, patch);
  quizListeners.forEach((fn) => fn(quiz));
}
```

위젯은 `subscribeQuiz`로 읽고 `setQuiz`로 쓴다. 위젯끼리 서로의 DOM을 직접 건드리지 않는다.

```html
<div class="quiz-progress" role="progressbar" aria-valuemin="1" aria-valuemax="10"></div>
<section class="quiz-question">
  <h2>문항 제목</h2>
  <button type="button" data-option="0">보기 1</button>
  <button type="button" data-option="1">보기 2</button>
  <button type="button" class="quiz-next">다음</button>
</section>
```

```js
{
  // 위젯 A: 진행 표시
  const progress = document.querySelector(".quiz-progress");
  subscribeQuiz(({ step }) => {
    progress.textContent = `${step + 1} / ${QUESTION_COUNT}`;
    progress.setAttribute("aria-valuenow", step + 1);
  });
}
{
  // 위젯 B: 문항
  const question = document.querySelector(".quiz-question");
  const nextButton = question.querySelector(".quiz-next");
  question.addEventListener("click", (e) => {
    const option = e.target.closest("[data-option]");
    if (option) {
      const answers = [...quiz.answers];
      answers[quiz.step] = Number(option.dataset.option);
      setQuiz({ answers });
    } else if (e.target === nextButton) {
      setQuiz({ step: Math.min(quiz.step + 1, QUESTION_COUNT - 1) });
    }
  });
  subscribeQuiz(({ step, answers }) => {
    question.querySelectorAll("[data-option]").forEach((el) => {
      el.setAttribute("aria-pressed", String(answers[step] === Number(el.dataset.option)));
    });
    nextButton.disabled = answers[step] === null;
  });
}
```

## 새로고침 유지

공유 객체 선언 바로 아래, 다른 `subscribeQuiz`보다 앞에 둔다. 저장소가 막힌 브라우저(시크릿 모드, 일부 인앱)에서도 페이지가 멈추지 않게 `try`로 감싼다.

```js
// 저장 키. FOLDER_NAME 을 접두어로 붙여 다른 인터랙티브와 충돌을 막는다
const QUIZ_STORAGE_KEY = "everest-1977-quiz";
try { Object.assign(quiz, JSON.parse(sessionStorage.getItem(QUIZ_STORAGE_KEY))); } catch {}
subscribeQuiz((s) => { try { sessionStorage.setItem(QUIZ_STORAGE_KEY, JSON.stringify(s)); } catch {} });
```

`sessionStorage`는 탭을 닫으면 지워진다. 영구 저장은 `localStorage`.

## 게임 일시정지: hkCommon.createPause()

타이머·애니메이션 루프가 있는 게임만 쓴다. 멈출 이유를 모으는 것은 템플릿의 `hkCommon.createPause()`가 맡는다. 자동으로 걸리는 이유는 없다 — 게임이 `pause.hold(이유, on)`으로 직접 걸고 푼다.

```js
const TICK_MS = 100;
// onChange 는 멈춤/재개 순간에 한 번씩 불린다 (영상·오디오 일시정지에 쓴다)
const pause = hkCommon.createPause({ onChange: (paused) => (paused ? bgm.pause() : bgm.play()) });

setInterval(() => {
  if (pause.paused) return; // 이유가 하나라도 걸려 있으면 true
  tick();
}, TICK_MS);

pause.hold("feedback", true);  // 피드백 화면을 띄울 때
pause.hold("feedback", false); // 닫을 때
```

일시정지 여부를 공유 객체에 따로 복사하지 않는다. `pause.paused`가 원본이다.

## 자주 하는 실수

- 공유 객체에 DOM 요소, 지도 인스턴스, GSAP 타임라인을 넣는다. 직렬화 가능한 값만 둔다. 그런 것은 그 위젯 블록의 `const`.
- 파생값(정답 수, 완료 여부)을 공유 객체에 따로 저장한다. 구독자 안에서 계산한다: `answers.filter((a) => a !== null).length`.
- `quiz.step = 3`처럼 직접 대입한다. 구독자가 불리지 않아 화면이 그대로다. `setQuiz`로만 바꾼다.
- 공유 객체 하나에 화면 전체 상태를 다 넣는다. 관심사별로 나눈다 (`quiz`, `filter`).
- `window.quiz = ...`처럼 전역에 붙인다. 프로젝트 스크립트 최상위 `const`면 충분하다.
- QA 때 값 확인은 브라우저 콘솔에서 `quiz`.

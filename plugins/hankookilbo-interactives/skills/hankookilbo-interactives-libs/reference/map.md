# 지도: mapbox-gl + deck.gl

## 태그

CSS `<link>`는 프로젝트 스타일 바로 앞, `<script src>`는 프로젝트 스크립트 바로 앞에 둔다. 전역 `mapboxgl`이 생긴다. 마지막 줄(deck.gl)은 지도 위 데이터가 있을 때만 넣는다 — 전역 `deck`이 생긴다.

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mapbox-gl@3.35.2/dist/mapbox-gl.css" />

<script src="https://cdn.jsdelivr.net/npm/mapbox-gl@3.35.2/dist/mapbox-gl.js"></script>
<script src="https://cdn.jsdelivr.net/npm/deck.gl@9.4.2/dist.min.js"></script>
```

이미 로드돼 있으면 건너뛴다. deck.gl 전역 빌드 하나에 `MapboxOverlay`와 모든 레이어가 들어 있다. 압축 전 2MB이므로 mapbox 네이티브 레이어로 되면 로드하지 않는다.

## 토큰

토큰은 프로젝트 스크립트의 블록 밖, 이 한 곳에만 적는다.

```js
const MAPBOX_TOKEN = "pk.xxxxx";
```

- 공개 토큰(`pk.`)만 쓴다. 비밀 토큰(`sk.`)은 페이지에 넣지 않는다.
- 빌드가 없어 토큰이 페이지 소스에 그대로 보인다. Mapbox 대시보드에서 토큰 URL 제한을 서비스 주소(`https://www.hankookilbo.com/interactive/*`)로 걸고, 개발용 토큰은 별도로 만들어 `localhost`만 허용한다. 개발용 토큰을 넣은 채 전달하지 않는다.
- 지도 우하단의 Mapbox 로고와 attribution은 이용 약관상 가려서는 안 된다. `attributionControl: false`로 끄지 않는다.

## 1. mapbox-gl 기본 패턴 (스크롤 연동 배경 지도)

지도가 `position: sticky` 배경이고 스크롤에 따라 카메라가 이동하는 가장 흔한 구성이다. 섹션 감지는 `reference/scroll.md`의 IO가 하고, 지도는 `section-change` 이벤트만 듣는다.

`scroll.md`의 `.scrolly` 구조에서 배경 자리에 지도를 넣는다. `.content-overlay` 안에는 `scroll.md`의 `.story-section`들이 들어간다. `.scrolly`·`.bg-container`·`.content-overlay`의 CSS는 `scroll.md` 그대로 쓰고, `100vh`는 폴백이다.

```html
<div class="scrolly">
  <div class="bg-container">
    <div id="story-map" class="story-map" role="img" aria-label="본문 내용을 따라 이동하는 지도"></div>
  </div>
  <div class="content-overlay">…</div>
</div>
```

```css
.story-map{width:100%;height:100vh;height:100dvh}
```

```js
{
  const FLY_DURATION_MS = 1500;
  // 순서 = .story-section 순서
  const MAP_CHAPTERS = [
    { center: [126.978, 37.5665], zoom: 10 }, // 서울시청
    { center: [129.0756, 35.1796], zoom: 11, pitch: 45 },
  ];

  mapboxgl.accessToken = MAPBOX_TOKEN;
  const map = new mapboxgl.Map({
    container: "story-map",
    style: "mapbox://styles/mapbox/light-v11",
    ...MAP_CHAPTERS[0],
    // 배경 지도는 페이지 스크롤을 가로채면 안 된다
    interactive: false,
  });

  const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

  window.addEventListener("section-change", (event) => {
    const chapter = MAP_CHAPTERS[event.detail];
    if (!chapter) return;
    if (reduceMotion) map.jumpTo(chapter);
    else map.flyTo({ ...chapter, duration: FLY_DURATION_MS, essential: true });
  });

  // 스타일 로드 뒤 크기를 한 번 다시 계산
  map.once("load", () => map.resize());
}
```

지도가 sticky 스크롤 배경이 아니라 스크롤 없는 페이지를 채운다면 `100dvh` 대신 `height: var(--screen-h)`를 쓴다 — `100dvh`는 GNB 높이만큼 넘쳐 스크롤이 생기고, 그 스크롤에 GNB가 숨는다.

### 지도가 배경이 아니라 사용자가 직접 조작하는 경우

`interactive: false`를 빼고 대신 `cooperativeGestures: true`를 켠다. 휠은 Ctrl/⌘와 함께 눌러야 줌이 되고, 모바일은 두 손가락으로만 이동하므로 페이지 스크롤이 막히지 않는다.

```js
new mapboxgl.Map({ container, style, center, zoom, cooperativeGestures: true });
```

### 데이터가 적을 때: mapbox 네이티브 레이어

지점 수백 개 이하이거나 행정구역 채색이면 deck.gl 없이 끝낸다. `map`을 쓰므로 위 지도 블록 안에 넣는다.

```js
map.on("load", () => {
  map.addSource("districts", { type: "geojson", data: "./data/districts.geojson" });
  map.addLayer({
    id: "districts-fill",
    type: "fill",
    source: "districts",
    paint: {
      // 속성값(value)에 따라 색을 보간
      "fill-color": ["interpolate", ["linear"], ["get", "value"], 0, "#f1eef6", 50, "#bdc9e1", 100, "#045a8d"],
      "fill-opacity": 0.75,
    },
  });
});
```

경로는 항상 `./data/...` 상대 경로다. 파일은 `index.html` 옆 `data/` 폴더에 둔다.

## 2. deck.gl: 지도 위 데이터

수천 개 이상의 지점, 값에 따라 크기와 색이 바뀌는 인코딩, 아크·히트맵·격자 집계, 원본 데이터를 툴팁으로 보여주는 경우다. mapbox-gl 인스턴스 위에 `MapboxOverlay`로 얹는다.

```html
<div id="data-map" class="data-map" role="img" aria-label="지역별 건수 분포 지도"></div>
```

```js
{
  const RADIUS_SCALE_METERS = 200;
  const LAYER_TRANSITION_MS = 600;
  const POINT_FILL_RGBA = [230, 57, 70, 180];

  // data: [{ lng, lat, value, name }] 배열 또는 그 JSON 의 URL
  const buildLayers = (data) => [
    new deck.ScatterplotLayer({
      id: "points", // id 가 같으면 deck.gl 이 diff 해서 갱신한다
      data, // URL 문자열을 넘기면 deck.gl 이 직접 fetch 한다: "./data/points.json"
      getPosition: (d) => [d.lng, d.lat],
      getRadius: (d) => Math.sqrt(d.value) * RADIUS_SCALE_METERS,
      radiusUnits: "meters",
      radiusMinPixels: 2,
      getFillColor: POINT_FILL_RGBA,
      pickable: true,
      transitions: { getRadius: LAYER_TRANSITION_MS },
    }),
  ];

  mapboxgl.accessToken = MAPBOX_TOKEN;
  const map = new mapboxgl.Map({
    container: "data-map",
    style: "mapbox://styles/mapbox/dark-v11",
    center: [127.5, 36.5],
    zoom: 6.5,
    cooperativeGestures: true,
  });

  const overlay = new deck.MapboxOverlay({
    interleaved: false, // 지도 위에 캔버스를 얹는 기본 모드. 라벨 아래로 넣어야 할 때만 true
    layers: buildLayers("./data/points.json"),
    // 원본 데이터를 그대로 보여 주므로 html 이 아니라 text 로 넘긴다
    getTooltip: ({ object }) => object && { text: `${object.name}\n${object.value.toLocaleString()}건` },
  });
  map.addControl(overlay);
}
```

### 스크롤에 따라 레이어를 바꿀 때

`section-change`에서 `overlay.setProps({ layers })`만 호출한다. 레이어 `id`를 유지하면 `transitions`에 적은 값이 보간된다. `overlay`·`buildLayers`를 쓰므로 위 블록 안에 넣는다.

```js
window.addEventListener("section-change", (event) => {
  const data = pointsByChapter[event.detail];
  if (data) overlay.setProps({ layers: buildLayers(data) });
});
```

### 레이어 선택

| 표현 | 레이어 |
| --- | --- |
| 지점, 버블 | `deck.ScatterplotLayer` |
| GeoJSON 폴리곤·라인 (수천 개 이상) | `deck.GeoJsonLayer` |
| 출발→도착 흐름 | `deck.ArcLayer` |
| 밀도 | `deck.HeatmapLayer` |
| 육각 격자 집계 | `deck.HexagonLayer` |

## 3. 함정

- mapbox-gl CSS `<link>`를 빼먹으면 지도 컨트롤과 attribution이 깨진다. `<script src>`가 프로젝트 스크립트보다 뒤에 있으면 `mapboxgl is not defined`.
- 컨테이너 높이가 없으면 지도가 0px로 그려진다. `.story-map`, `.data-map`에 명시적 높이를 준다.
- 지도를 다시 만들 때 `overlay.finalize()`와 `map.remove()` 없이 새로 만들면 WebGL 컨텍스트가 누적되어 몇 번 만에 "Too many active WebGL contexts" 에러가 난다.
- 큰 JSON을 프로젝트 스크립트에 붙여 넣지 않는다. `index.html` 옆 `data/`에 두고 URL로 넘긴다. 5MB를 넘으면 좌표 소수점을 5자리로 줄이거나 필드를 정리한다.
- URL로 넘긴 데이터는 `file://`로 열면 읽히지 않는다. 로컬 서버로 열어 확인한다.
- 배경 지도에 `interactive: true`를 두면 모바일에서 손가락 스크롤이 지도에 먹혀 페이지가 멈춘다. 배경은 `interactive: false`, 조작형은 `cooperativeGestures: true`.
- `flyTo`를 `scrub` 진행률 콜백에서 호출하면 매 프레임 애니메이션이 재시작된다. 카메라 이동은 `section-change`에서만.

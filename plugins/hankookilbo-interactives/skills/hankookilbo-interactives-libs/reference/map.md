# 지도: mapbox-gl + deck.gl

## 설치

```bash
# 지도만
npm i mapbox-gl

# 지도 위 데이터까지
npm i @deck.gl/core @deck.gl/layers @deck.gl/mapbox
```

`@deck.gl/mapbox`는 `mapbox-gl`을 peer dependency로 쓴다. 둘 다 v3 mapbox-gl, v9 deck.gl 기준이다. 설치 후 `package.json`에서 실제 설치된 메이저 버전을 확인한다.

## 토큰

```bash
# .env  (gitignore에 이미 포함되어 있는지 확인)
PUBLIC_MAPBOX_TOKEN=pk.xxxxx
```

- 코드에서는 `import.meta.env.PUBLIC_MAPBOX_TOKEN`으로만 읽는다. 문자열 하드코딩 금지.
- 정적 빌드라 토큰이 `dist`에 그대로 들어간다. Mapbox 대시보드에서 토큰 URL 제한을 `https://interactive.hankookilbo.com/*`로 걸고, 개발용 토큰은 별도로 만들어 `localhost`만 허용한다.
- 지도 우하단의 Mapbox 로고와 attribution은 이용 약관상 가려서는 안 된다. `attributionControl: false`로 끄지 않는다.

## 1. mapbox-gl 기본 패턴 (스크롤 연동 배경 지도)

지도가 `position: sticky` 배경이고 스크롤에 따라 카메라가 이동하는 가장 흔한 구성이다. 섹션 감지는 `reference/scroll.md`의 IO가 하고, 지도는 `section-change` 이벤트만 듣는다.

```tsx
// src/components/StoryMap.tsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

const FLY_DURATION_MS = 1500;
const INITIAL_CENTER: [number, number] = [126.978, 37.5665]; // 서울시청
const INITIAL_ZOOM = 10;

export type MapChapter = {
  center: [number, number];
  zoom: number;
  pitch?: number;
  bearing?: number;
};

type Props = { chapters: MapChapter[]; mapStyle?: string };

const StoryMap = ({ chapters, mapStyle = "mapbox://styles/mapbox/light-v11" }: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_TOKEN;

    const map = new mapboxgl.Map({
      container,
      style: mapStyle,
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      // 배경 지도는 페이지 스크롤을 가로채면 안 된다
      interactive: false,
    });

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const onSectionChange = (event: Event) => {
      const index = (event as CustomEvent<number>).detail;
      const chapter = chapters[index];
      if (!chapter) return;
      if (prefersReducedMotion) {
        map.jumpTo(chapter);
        return;
      }
      map.flyTo({ ...chapter, duration: FLY_DURATION_MS, essential: true });
    };

    // 로더가 사라진 뒤 컨테이너 크기가 바뀌므로 한 번 다시 계산
    map.once("load", () => map.resize());
    window.addEventListener("section-change", onSectionChange);

    return () => {
      window.removeEventListener("section-change", onSectionChange);
      map.remove();
    };
  }, [chapters, mapStyle]);

  return <div ref={containerRef} className="story-map" role="img" aria-label="본문 내용을 따라 이동하는 지도" />;
};

export default StoryMap;
```

```astro
<!-- Astro: mapbox-gl은 import 시점에 window를 읽으므로 client:only 필수 -->
<div class="bg-container">
  <StoryMap client:only="react" chapters={mapChapters} />
</div>
```

```scss
.story-map {
  width: 100%;
  height: 100vh;
  height: 100dvh; // 폴백 다음 줄에 한 번 더
}
```

### 지도가 배경이 아니라 사용자가 직접 조작하는 경우

`interactive: false`를 빼고 대신 `cooperativeGestures: true`를 켠다. 휠은 Ctrl/⌘와 함께 눌러야 줌이 되고, 모바일은 두 손가락으로만 이동하므로 페이지 스크롤이 막히지 않는다.

```ts
new mapboxgl.Map({ container, style, center, zoom, cooperativeGestures: true });
```

### 데이터가 적을 때: mapbox 네이티브 레이어

지점 수백 개 이하이거나 행정구역 채색이면 deck.gl 없이 끝낸다.

```ts
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

경로는 항상 `./data/...` 상대 경로다. 파일은 `public/data/`에 둔다.

## 2. deck.gl: 지도 위 데이터

수천 개 이상의 지점, 값에 따라 크기와 색이 바뀌는 인코딩, 아크·히트맵·격자 집계, 원본 데이터를 툴팁으로 보여주는 경우다. mapbox-gl 인스턴스 위에 `MapboxOverlay`로 얹는다.

```tsx
// src/components/DataMap.tsx
import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { MapboxOverlay } from "@deck.gl/mapbox";
import { ScatterplotLayer } from "@deck.gl/layers";

const INITIAL_CENTER: [number, number] = [127.5, 36.5];
const INITIAL_ZOOM = 6.5;
const RADIUS_SCALE_METERS = 200;
const POINT_FILL_RGBA: [number, number, number, number] = [230, 57, 70, 180];

type Point = { lng: number; lat: number; value: number; name: string };

const buildLayers = (data: string | Point[]) => [
  new ScatterplotLayer<Point>({
    id: "points",
    data, // URL 문자열을 넘기면 deck.gl이 직접 fetch한다: "./data/points.json"
    getPosition: (d) => [d.lng, d.lat],
    getRadius: (d) => Math.sqrt(d.value) * RADIUS_SCALE_METERS,
    radiusUnits: "meters",
    radiusMinPixels: 2,
    getFillColor: POINT_FILL_RGBA,
    pickable: true,
  }),
];

const DataMap = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    mapboxgl.accessToken = import.meta.env.PUBLIC_MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container,
      style: "mapbox://styles/mapbox/dark-v11",
      center: INITIAL_CENTER,
      zoom: INITIAL_ZOOM,
      cooperativeGestures: true,
    });

    const overlay = new MapboxOverlay({
      interleaved: false, // 지도 위에 캔버스를 얹는 기본 모드. 라벨 아래로 넣어야 할 때만 true
      layers: buildLayers("./data/points.json"),
      getTooltip: ({ object }) => {
        if (!object) return null;
        const point = object as Point;
        return { html: `<strong>${point.name}</strong><br/>${point.value.toLocaleString()}건` };
      },
    });
    map.addControl(overlay);

    return () => {
      overlay.finalize();
      map.remove();
    };
  }, []);

  return <div ref={containerRef} className="data-map" role="img" aria-label="지역별 건수 분포 지도" />;
};

export default DataMap;
```

### 스크롤에 따라 레이어를 바꿀 때

`section-change`에서 `overlay.setProps({ layers })`만 호출한다. 레이어 `id`가 같으면 deck.gl이 diff해서 갱신하고, `transitions`를 주면 값이 보간된다.

```ts
const LAYER_TRANSITION_MS = 600;

const onSectionChange = (event: Event) => {
  const index = (event as CustomEvent<number>).detail;
  overlay.setProps({
    layers: [
      new ScatterplotLayer<Point>({
        id: "points", // id 유지가 핵심
        data: pointsByChapter[index],
        getPosition: (d) => [d.lng, d.lat],
        getRadius: (d) => Math.sqrt(d.value) * RADIUS_SCALE_METERS,
        getFillColor: POINT_FILL_RGBA,
        transitions: { getRadius: LAYER_TRANSITION_MS, getFillColor: LAYER_TRANSITION_MS },
      }),
    ],
  });
};
```

### 레이어 선택

| 표현 | 레이어 | 패키지 |
| --- | --- | --- |
| 지점, 버블 | `ScatterplotLayer` | `@deck.gl/layers` |
| GeoJSON 폴리곤·라인 (수천 개 이상) | `GeoJsonLayer` | `@deck.gl/layers` |
| 출발→도착 흐름 | `ArcLayer` | `@deck.gl/layers` |
| 밀도 | `HeatmapLayer` | `@deck.gl/aggregation-layers` |
| 육각 격자 집계 | `HexagonLayer` | `@deck.gl/aggregation-layers` |

`aggregation-layers`는 필요한 경우에만 추가 설치한다.

## 3. 함정

- mapbox-gl, deck.gl 컴포넌트를 `client:load`나 `client:visible`로 마운트하면 빌드 시 `window is not defined`가 난다. **`client:only="react"`** 만 쓴다.
- 컨테이너 높이가 없으면 지도가 0px로 그려진다. `.story-map`, `.data-map`에 명시적 높이를 준다.
- `map.remove()` 없이 언마운트하면 WebGL 컨텍스트가 누적되어 몇 번 만에 "Too many active WebGL contexts" 에러가 난다.
- deck.gl `data`에 큰 JSON을 `import`로 번들에 넣지 않는다. `public/data/`에 두고 URL로 넘긴다. 5MB를 넘으면 좌표 소수점을 5자리로 줄이거나 필드를 정리한다.
- 배경 지도에 `interactive: true`를 두면 모바일에서 손가락 스크롤이 지도에 먹혀 페이지가 멈춘다. 배경은 `interactive: false`, 조작형은 `cooperativeGestures: true`.
- `flyTo`를 `scrub` 진행률 콜백에서 호출하면 매 프레임 애니메이션이 재시작된다. 카메라 이동은 `section-change`에서만.

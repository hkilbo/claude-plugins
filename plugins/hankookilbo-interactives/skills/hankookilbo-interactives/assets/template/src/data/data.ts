export interface Story {
  /** 문단 배열. HTML 문자열 허용 (set:html) */
  description: string[];
  align?: "left" | "right" | "center";
  title?: string;
  subtitle?: string;
  /** ./img/... 상대 경로 */
  image?: string;
  imageMaxWidth?: string;
  /** 타임라인 스텝 라벨 (있으면 스텝퍼 표시) */
  stepLabel?: string;
}

export interface Chapter {
  id: string;
  title: string;
  subtitle?: string;
  /** 배경 이미지 ./img/... */
  bg?: string;
  /** 상단 챕터 내비에 노출 여부 */
  showNav?: boolean;
  stories: Story[];
}

export const chapters: Chapter[] = [
  {
    id: "ch1",
    title: "1장 제목",
    bg: "./img/bgs/ch1.jpg",
    showNav: true,
    stories: [
      {
        description: [
          "첫 문단입니다.",
          "두 번째 문단입니다. <strong>강조</strong> 가능.",
        ],
      },
    ],
  },
];

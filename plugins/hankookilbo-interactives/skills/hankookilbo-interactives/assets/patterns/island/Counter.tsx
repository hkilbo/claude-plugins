// src/components/Counter.tsx
import { useEffect, useState } from "react";
import "../styles/counter.scss";

const SECTION_CHANGE_EVENT = "section-change";

export default function Counter() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const onSectionChange = (e: Event) => {
      setActiveIndex((e as CustomEvent<number>).detail);
    };
    window.addEventListener(SECTION_CHANGE_EVENT, onSectionChange);
    return () =>
      window.removeEventListener(SECTION_CHANGE_EVENT, onSectionChange);
  }, []);

  return (
    <div className="counter" role="status" aria-live="polite">
      현재 챕터 {activeIndex + 1}
    </div>
  );
}

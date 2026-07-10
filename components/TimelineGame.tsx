"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { timelineEvents } from "@/data/timeline-events";
import { dayKey, shuffleDaily } from "@/lib/daily";
import { SiteBrand } from "@/components/SiteBrand";
import { useLanguage } from "@/components/LanguageProvider";

export default function TimelineGame() {
  const { lang, t } = useLanguage();
  const events = useMemo(() => shuffleDaily(timelineEvents, "timeline-pool").slice(0, 5), []);
  const shuffled = useMemo(() => shuffleDaily(events, "timeline-order"), [events]);
  const [selected, setSelected] = useState<typeof events>([]);
  const [message, setMessage] = useState("");
  const completed = selected.length === events.length;
  const correct = completed && selected.every((event, index, array) => index === 0 || array[index - 1].year <= event.year);
  const remaining = shuffled.filter((event) => !selected.includes(event));

  function choose(event: typeof events[number]) {
    if (completed) return;
    const next = [...selected, event];
    setSelected(next);
    if (next.length === events.length) {
      const ok = next.every((item, index, array) => index === 0 || array[index - 1].year <= item.year);
      setMessage(ok ? (lang === "es" ? "Cronología perfecta." : "Perfect timeline.") : (lang === "es" ? "Hay algún evento fuera de orden." : "Something is out of order."));
    }
  }

  function reset() {
    setSelected([]);
    setMessage("");
  }

  return (
    <main className="mini-shell">
      <nav className="site-nav"><SiteBrand /><Link href="/" className="back-link">← {t("games")}</Link></nav>
      <section className="mini-game">
        <header className="mini-head"><span>{dayKey()}</span><h1>TIMELINE</h1><p>{lang === "es" ? "Toca los eventos en orden cronológico, del más antiguo al más reciente." : "Tap the events in chronological order, oldest to newest."}</p></header>
        <div className="timeline-build">
          {Array.from({ length: events.length }).map((_, index) => {
            const event = selected[index];
            return <article className={event ? "filled" : ""} key={index}><strong>{String(index + 1).padStart(2, "0")}</strong>{event ? <><b>{lang === "es" ? event.title : event.titleEn}</b>{completed && <span>{event.year}</span>}</> : <b>?</b>}</article>;
          })}
        </div>
        {!completed && <div className="timeline-options">{remaining.map((event) => <button key={event.title} onClick={() => choose(event)}>{lang === "es" ? event.title : event.titleEn}</button>)}</div>}
        {completed && <div className={`mini-answer compact ${correct ? "success" : ""}`}><div><span>{message}</span><h2>{correct ? "5/5" : lang === "es" ? "ORDEN REAL" : "REAL ORDER"}</h2><p>{[...events].sort((a, b) => a.year - b.year).map((event) => `${event.year} · ${lang === "es" ? event.title : event.titleEn}`).join(" / ")}</p><button onClick={reset}>{lang === "es" ? "REINTENTAR" : "TRY AGAIN"}</button></div></div>}
      </section>
    </main>
  );
}

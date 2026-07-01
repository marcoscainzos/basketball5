import Link from "next/link";
import credits from "@/data/image-credits.json";

export default function CreditsPage() {
  const entries = Object.entries(credits).filter(([, credit]) => credit.imageUrl);
  return (
    <main className="credits-page">
      <nav className="site-nav"><Link className="wordmark" href="/"><span className="mark">CI</span><b>COURT INSIDE</b></Link><Link href="/" className="back-link">← HOME</Link></nav>
      <section className="credits-content">
        <span>IMAGE ATTRIBUTION</span><h1>CRÉDITOS</h1>
        <p>Fotografías enlazadas desde Wikimedia Commons o Wikipedia. Cada obra conserva su autoría y licencia original.</p>
        <div className="credits-list">{entries.map(([name, credit]) => <article key={name}><strong>{name}</strong><span>{credit.author || "Autor indicado en la fuente"}</span><a href={credit.source} target="_blank" rel="noreferrer">{credit.license || "Ver licencia"} ↗</a></article>)}</div>
      </section>
    </main>
  );
}

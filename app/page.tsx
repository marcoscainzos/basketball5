import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <nav className="site-nav home-nav">
        <Link className="wordmark" href="/"><span className="mark">CI</span><b>COURT INSIDE</b></Link>
        <span className="nav-note">DAILY HOOPS</span>
      </nav>
      <header className="home-title"><span>DAILY BASKETBALL GAMES</span><h1>COURT INSIDE</h1></header>
      <section className="game-picker" aria-label="Juegos">
        <Link href="/1vs1" className="compact-game red-game"><span>01</span><div className="compact-art one-v-one-logo"><b>1</b><i>VS</i><b>1</b></div><h2>1VS1</h2></Link>
        <Link href="/top5" className="compact-game blue-game"><span>02</span><div className="compact-art top-five-art"><b>5</b><i>TOP</i></div><h2>TOP 5</h2></Link>
        <div className="compact-game dark-game unavailable"><span>03</span><div className="compact-art"><b>?</b></div><h2>WHO AM I?</h2><small>PRÓXIMAMENTE</small></div>
      </section>
      <Link className="credits-link" href="/credits">CRÉDITOS DE IMÁGENES ↗</Link>
    </main>
  );
}

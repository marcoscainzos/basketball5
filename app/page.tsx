import Link from "next/link";

export default function Home() {
  return (
    <main className="home-shell">
      <nav className="site-nav home-nav">
        <Link className="wordmark" href="/"><span className="mark">CI</span><b>COURT INSIDE</b></Link>
        <span className="nav-note">DAILY HOOPS</span>
      </nav>
      <header className="home-title"><span>DAILY BASKETBALL GAMES</span><h1>COURT INSIDE</h1></header>
      <nav className="play-type-switch" aria-label="Modo de juego">
        <Link className="active" href="/" scroll={false} aria-current="page"><span>01</span><div><b>INDIVIDUAL</b><i>JUEGOS DIARIOS</i></div></Link>
        <Link href="/leagues" scroll={false}><span>02</span><div><b>LIGAS</b><i>COMPITE CON AMIGOS</i></div></Link>
      </nav>
      <section className="game-picker" aria-label="Juegos">
        <Link href="/1vs1" className="compact-game red-game"><span>01</span><div className="compact-art one-v-one-logo"><b>1</b><i>VS</i><b>1</b></div><h2>1VS1</h2></Link>
        <Link href="/top5" className="compact-game blue-game"><span>02</span><div className="compact-art top-five-art"><b>5</b><i>TOP</i></div><h2>TOP 5</h2></Link>
        <Link href="/who-am-i" className="compact-game dark-game"><span>03</span><div className="compact-art who-art"><b>?</b></div><h2>WHO AM I?</h2></Link>
        <Link href="/draft" className="compact-game gold-game"><span>04</span><div className="compact-art draft-art"><b>5</b><i>TEAM</i></div><h2>DRAFT</h2></Link>
      </section>
      <Link className="credits-link" href="/credits">CRÉDITOS DE IMÁGENES ↗</Link>
    </main>
  );
}

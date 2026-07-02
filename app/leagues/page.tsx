import Link from "next/link";

export default function LeaguesPage() {
  return (
    <main className="home-shell leagues-shell">
      <nav className="site-nav home-nav">
        <Link className="wordmark" href="/"><span className="mark">CI</span><b>COURT INSIDE</b></Link>
        <span className="nav-note">DAILY HOOPS</span>
      </nav>
      <header className="home-title"><span>DAILY BASKETBALL GAMES</span><h1>COURT INSIDE</h1></header>

      <nav className="play-type-switch leagues-switch" aria-label="Modo de juego">
        <Link href="/" scroll={false}><span>01</span><div><b>INDIVIDUAL</b><i>JUEGOS DIARIOS</i></div></Link>
        <Link className="active" href="/leagues" scroll={false} aria-current="page"><span>02</span><div><b>LIGAS</b><i>COMPITE CON AMIGOS</i></div></Link>
      </nav>

      <header className="league-section-heading">
        <div><span>COURT INSIDE LEAGUES</span><h2>Compite con tu grupo</h2></div>
        <p>Tres retos diarios para todos. La clasificación dura hasta final de año.</p>
      </header>

      <section className="league-actions">
        <article className="league-action create-league">
          <div><h2>CREAR<br />LIGA</h2></div>
          <p>Elige un nombre y comparte el enlace con tu grupo.</p>
          <button type="button">CREAR LIGA <b>→</b></button>
        </article>

        <article className="league-action join-league">
          <div><h2>UNIRME A<br />UNA LIGA</h2></div>
          <p>Pega el código de invitación para entrar en la clasificación.</p>
          <form>
            <label htmlFor="league-code">CÓDIGO DE LIGA</label>
            <div><input id="league-code" name="league-code" placeholder="EJ. CI-23MJ" autoComplete="off" /><button type="button">ENTRAR →</button></div>
          </form>
        </article>
      </section>
    </main>
  );
}

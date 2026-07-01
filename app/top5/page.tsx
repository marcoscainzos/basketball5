import Link from "next/link";
import TopFiveGame from "@/components/TopFiveGame";

export default function TopFivePage() {
  return <main className="top5-shell"><nav className="site-nav"><Link className="wordmark" href="/"><span className="mark">CI</span><b>COURT INSIDE</b></Link><Link href="/" className="back-link">← GAMES</Link></nav><TopFiveGame/></main>;
}

import Link from "next/link";
import DraftGame from "@/components/DraftGame";

export default function DraftPage() {
  return <main className="draft-shell"><nav className="site-nav"><Link className="wordmark" href="/"><span className="mark">CI</span><b>COURT INSIDE</b></Link><Link href="/" className="back-link">← GAMES</Link></nav><DraftGame /></main>;
}

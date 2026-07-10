import { PlayerSeason, StatKey } from "@/data/players";
import { jerseyNumber } from "@/lib/jerseyNumbers";
import { useLanguage } from "@/components/LanguageProvider";

type Props = { player: PlayerSeason; hiddenStat: StatKey; onClick: () => void; disabled?: boolean; revealed?: boolean; result?: "winner" | "loser" };

export default function PlayerCard({ player, hiddenStat, onClick, disabled, revealed, result }: Props) {
  const { lang, t } = useLanguage();
  const stats = [{ key: "pts", label: "PTS", value: player.pts }, { key: "reb", label: "REB", value: player.reb }, { key: "ast", label: "AST", value: player.ast }, { key: "stl", label: lang === "es" ? "ROB" : "STL", value: player.stl }, { key: "blk", label: lang === "es" ? "TAP" : "BLK", value: player.blk }] as const;
  const initials = player.name.split(" ").map((word) => word[0]).join("").slice(0, 2);
  const number = jerseyNumber(player.name, player.pool, player.number);

  return (
    <button type="button" className={`season-card ${result ? `is-${result}` : ""}`} style={{ "--club": player.accent } as React.CSSProperties} onClick={onClick} disabled={disabled} aria-label={lang === "es" ? `Elegir a ${player.name}, temporada ${player.season}` : `Pick ${player.name}, ${player.season} season`}>
      <div className="card-head"><div><strong>{number || (number === 0 ? "0" : "—")}</strong><span>{t("jersey")} · {player.position}</span></div><b>{player.team}</b></div>
      <div className="portrait">
        {player.imageUrl ? <img src={player.imageUrl} alt="" /* eslint-disable-line @next/next/no-img-element */ /> : <div className="portrait-placeholder"><span>{initials}</span><small>{t("pendingPhoto")}</small></div>}
      </div>
      <div className="card-name"><h2>{player.name}</h2><p>{player.season} · {player.team}</p></div>
      <div className="card-stats">{stats.map((stat) => <div className={stat.key === hiddenStat ? "is-target" : ""} key={stat.key}><span>{stat.label}</span><strong>{stat.key === hiddenStat && !revealed ? "?" : stat.value.toFixed(1)}</strong></div>)}</div>
    </button>
  );
}

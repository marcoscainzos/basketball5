#!/usr/bin/env python3
"""Update the current NBA season card data from stats.nba.com via nba_api.

This script is intentionally used at build/update time, not by the live app.
The website reads the generated JSON so gameplay stays fast and reliable.
"""

from __future__ import annotations

import argparse
import json
import math
import pathlib
import sys
from typing import Any


TEAM_CODE = {
    "ATL": "ATL",
    "BOS": "BOS",
    "BKN": "BRK",
    "BRK": "BRK",
    "CHA": "CHO",
    "CHI": "CHI",
    "CLE": "CLE",
    "DAL": "DAL",
    "DEN": "DEN",
    "DET": "DET",
    "GSW": "GSW",
    "HOU": "HOU",
    "IND": "IND",
    "LAC": "LAC",
    "LAL": "LAL",
    "MEM": "MEM",
    "MIA": "MIA",
    "MIL": "MIL",
    "MIN": "MIN",
    "NOP": "NOP",
    "NYK": "NYK",
    "OKC": "OKC",
    "ORL": "ORL",
    "PHI": "PHI",
    "PHX": "PHO",
    "PHO": "PHO",
    "POR": "POR",
    "SAC": "SAC",
    "SAS": "SAS",
    "TOR": "TOR",
    "UTA": "UTA",
    "WAS": "WAS",
}

TEAM_COLORS = ["#17408b", "#c9082a", "#552583", "#006bb6", "#007a33", "#e56020", "#0e2240"]


def number(value: Any) -> float:
    try:
        parsed = float(value)
    except (TypeError, ValueError):
        return 0.0
    return parsed if math.isfinite(parsed) else 0.0


def one_decimal(value: Any) -> float:
    return round(number(value), 1)


def accent(team: str) -> str:
    result = 0
    for char in team:
        result = (result * 31 + ord(char)) & 0xFFFFFFFF
    return TEAM_COLORS[result % len(TEAM_COLORS)]


def row_get(row: dict[str, Any], *keys: str, fallback: Any = 0) -> Any:
    for key in keys:
        if key in row and row[key] not in (None, ""):
            return row[key]
    return fallback


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--season", default="2025-26")
    parser.add_argument("--output", default="data/current-season-2025-26.json")
    parser.add_argument("--min-games", type=int, default=1)
    args = parser.parse_args()

    try:
        from nba_api.stats.endpoints import leaguedashplayerstats
    except Exception as exc:  # pragma: no cover - exercised in CI only
        print(f"nba_api import failed: {exc}", file=sys.stderr)
        return 2

    try:
        frame = leaguedashplayerstats.LeagueDashPlayerStats(
            season=args.season,
            season_type_all_star="Regular Season",
            per_mode_detailed="PerGame",
            measure_type_detailed_defense="Base",
            timeout=90,
        ).get_data_frames()[0]
    except Exception as exc:  # pragma: no cover - depends on stats.nba.com
        print(f"nba_api request failed: {exc}", file=sys.stderr)
        return 3

    cards = []
    for row in frame.to_dict("records"):
        games = int(number(row_get(row, "GP", "G")))
        if games < args.min_games:
            continue
        team = TEAM_CODE.get(str(row_get(row, "TEAM_ABBREVIATION", fallback="NBA")).upper(), "NBA")
        player_id = str(row_get(row, "PLAYER_ID", "PERSON_ID", fallback=""))
        name = str(row_get(row, "PLAYER_NAME", "PLAYER", fallback="")).strip()
        if not player_id or not name:
            continue
        cards.append(
            {
                "name": name,
                "season": args.season,
                "team": team,
                "position": "SF",
                "number": 0,
                "accent": accent(team),
                "games": games,
                "imageUrl": f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png",
                "pts": one_decimal(row_get(row, "PTS")),
                "reb": one_decimal(row_get(row, "REB")),
                "ast": one_decimal(row_get(row, "AST")),
                "stl": one_decimal(row_get(row, "STL")),
                "blk": one_decimal(row_get(row, "BLK")),
                "pool": "current",
            }
        )

    if len(cards) < 250:
        print(f"nba_api returned only {len(cards)} players; refusing to overwrite", file=sys.stderr)
        return 4

    cards.sort(key=lambda item: item["name"])
    output = pathlib.Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps(cards, indent=2) + "\n")
    print(f"{args.season}: wrote {len(cards)} current players to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

"use client";

import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from "react";

export type Lang = "es" | "en";

type LanguageContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (key: keyof typeof translations.es) => string;
};

const translations = {
  es: {
    dailyHoops: "DAILY HOOPS",
    dailyBasketballGames: "DAILY BASKETBALL GAMES",
    games: "GAMES",
    home: "HOME",
    modes: "MODES",
    reset: "RESET",
    individual: "INDIVIDUAL",
    dailyGames: "JUEGOS DIARIOS",
    leagues: "LIGAS",
    competeFriends: "COMPITE CON AMIGOS",
    selectGame: "SELECT GAME",
    comingSoon: "PRÓXIMAMENTE",
    historical: "HISTÓRICO",
    current: "ACTUAL",
    easy: "FÁCIL",
    medium: "MEDIO",
    hard: "DIFÍCIL",
    locked: "BLOQUEADO",
    attempt: "INTENTO",
    attempts: "INTENTOS",
    try: "TRY",
    streak: "STREAK",
    best: "BEST",
    whoHasMore: "WHO HAS MORE",
    runOver: "RUN OVER",
    inARow: "IN A ROW",
    useNextTry: "USE NEXT TRY →",
    openingGym: "OPENING THE GYM…",
    oneVsOneIntro: "1vs1 enfrenta a dos jugadores en una estadística desconocida. Tú decides quién gana entre historia NBA y temporada actual.",
    teammates: "COMPAÑEROS",
    journey: "TRAYECTORIA",
    whoIntro: "Adivina al jugador. Cada fallo descubre automáticamente una pista nueva.",
    correct: "CORRECTO",
    was: "ERA",
    guessOne: "intento",
    guesses: "intentos",
    searchPlayer: "BUSCA UN JUGADOR",
    typeName: "Escribe un nombre…",
    typePlayer: "Escribe un jugador…",
    test: "PROBAR",
    surrender: "Rendirse",
    todayChallenge: "RETO DE HOY",
    add: "AÑADIR",
    revealedAnswers: "RESPUESTAS REVELADAS",
    rankingCompleted: "RANKING COMPLETADO",
    preparingRanking: "PREPARANDO EL RANKING…",
    alreadyPlaced: "Ese jugador ya está colocado.",
    completedTop5: "Top 5 completado.",
    right: "Correcto.",
    missingTop5Prefix: "",
    missingTop5Suffix: " no está en este Top 5.",
    missingLeft: "Te faltaban",
    missingRight: "Mañana hay un Top 5 nuevo.",
    buildIntro: "Escoge cinco jugadores. Nosotros calculamos cuántos partidos ganaría tu equipo en una temporada de 82.",
    career: "CARRERA",
    careerDetail: "EL JUGADOR EN GENERAL",
    seasons: "TEMPORADAS",
    seasonsDetail: "VERSIONES CONCRETAS",
    preparingDraft: "PREPARANDO EL DRAFT…",
    addYourPlayer: "AÑADE TU",
    playerOrdinalSuffix: ".º JUGADOR",
    playerOrSeason: "Jugador o temporada…",
    todayRestriction: "RESTRICCIÓN DE HOY",
    estimatedWins: "VICTORIAS ESTIMADAS",
    estimatedRecord: "Récord estimado:",
    attemptClosed: "Tu intento de hoy queda cerrado.",
    comeTomorrow: "VUELVE MAÑANA",
    pointGuard: "BASE",
    shootingGuard: "ESCOLTA",
    smallForward: "ALERO",
    powerForward: "ALA-PÍVOT",
    center: "PÍVOT",
    notOnBoard: "No está en el tablero.",
    chooseMarkedCell: "ELIGE UNA CASILLA MARCADA",
    blueWins: "AZUL GANA",
    redWins: "ROJO GANA",
    draw: "EMPATE",
    blueTurn: "TURNO AZUL",
    redTurn: "TURNO ROJO",
    ticIntro: "Te damos equipos NBA y tú tienes que encontrar jugadores que hayan pasado por los dos equipos de cada casilla.",
    competitive: "COMPETITIVO",
    courtInsideLeagues: "COURT INSIDE LEAGUES",
    competeGroup: "Compite con tu grupo",
    leagueIntro: "Tres retos diarios para todos. La clasificación dura hasta final de año.",
    createLeague: "CREAR LIGA",
    createLeagueTitle: "CREAR\nLIGA",
    createLeagueText: "Elige un nombre y comparte el enlace con tu grupo.",
    joinLeagueTitle: "UNIRME A\nUNA LIGA",
    joinLeagueText: "Pega el código de invitación para entrar en la clasificación.",
    leagueCode: "CÓDIGO DE LIGA",
    enter: "ENTRAR →",
    creditsTitle: "CRÉDITOS",
    imageAttribution: "IMAGE ATTRIBUTION",
    creditsText: "Fotografías enlazadas desde Wikimedia Commons o Wikipedia. Cada obra conserva su autoría y licencia original.",
    authorFallback: "Autor indicado en la fuente",
    licenseFallback: "Ver licencia",
    jersey: "DORSAL",
    pendingPhoto: "FOTO PENDIENTE",
  },
  en: {
    dailyHoops: "DAILY HOOPS",
    dailyBasketballGames: "DAILY BASKETBALL GAMES",
    games: "GAMES",
    home: "HOME",
    modes: "MODES",
    reset: "RESET",
    individual: "INDIVIDUAL",
    dailyGames: "DAILY GAMES",
    leagues: "LEAGUES",
    competeFriends: "PLAY WITH FRIENDS",
    selectGame: "SELECT GAME",
    comingSoon: "COMING SOON",
    historical: "HISTORICAL",
    current: "CURRENT",
    easy: "EASY",
    medium: "MEDIUM",
    hard: "HARD",
    locked: "LOCKED",
    attempt: "TRY",
    attempts: "TRIES",
    try: "TRY",
    streak: "STREAK",
    best: "BEST",
    whoHasMore: "WHO HAS MORE",
    runOver: "RUN OVER",
    inARow: "IN A ROW",
    useNextTry: "USE NEXT TRY →",
    openingGym: "OPENING THE GYM…",
    oneVsOneIntro: "1vs1 puts two players head-to-head in a hidden stat. You pick who wins between NBA history and the current season.",
    teammates: "TEAMMATES",
    journey: "JOURNEY",
    whoIntro: "Guess the player. Every miss reveals the next clue automatically.",
    correct: "CORRECT",
    was: "IT WAS",
    guessOne: "guess",
    guesses: "guesses",
    searchPlayer: "SEARCH PLAYER",
    typeName: "Type a name…",
    typePlayer: "Type a player…",
    test: "TRY",
    surrender: "Give up",
    todayChallenge: "TODAY'S CHALLENGE",
    add: "ADD",
    revealedAnswers: "ANSWERS REVEALED",
    rankingCompleted: "RANKING COMPLETE",
    preparingRanking: "BUILDING THE RANKING…",
    alreadyPlaced: "That player is already placed.",
    completedTop5: "Top 5 complete.",
    right: "Correct.",
    missingTop5Prefix: "",
    missingTop5Suffix: " is not in this Top 5.",
    missingLeft: "You were missing",
    missingRight: "A new Top 5 lands tomorrow.",
    buildIntro: "Pick five players. We estimate how many games your team would win in an 82-game season.",
    career: "CAREER",
    careerDetail: "THE PLAYER OVERALL",
    seasons: "SEASONS",
    seasonsDetail: "SPECIFIC VERSIONS",
    preparingDraft: "PREPARING THE DRAFT…",
    addYourPlayer: "ADD YOUR",
    playerOrdinalSuffix: " PLAYER",
    playerOrSeason: "Player or season…",
    todayRestriction: "TODAY'S RESTRICTION",
    estimatedWins: "ESTIMATED WINS",
    estimatedRecord: "Estimated record:",
    attemptClosed: "Your daily attempt is locked.",
    comeTomorrow: "COME BACK TOMORROW",
    pointGuard: "POINT GUARD",
    shootingGuard: "SHOOTING GUARD",
    smallForward: "SMALL FORWARD",
    powerForward: "POWER FORWARD",
    center: "CENTER",
    notOnBoard: "Not on the board.",
    chooseMarkedCell: "CHOOSE A MARKED CELL",
    blueWins: "BLUE WINS",
    redWins: "RED WINS",
    draw: "DRAW",
    blueTurn: "BLUE TURN",
    redTurn: "RED TURN",
    ticIntro: "We give you NBA teams. You find players who played for both teams in each square.",
    competitive: "COMPETITIVE",
    courtInsideLeagues: "COURT INSIDE LEAGUES",
    competeGroup: "Compete with your group",
    leagueIntro: "Three daily challenges for everyone. The standings run through the end of the year.",
    createLeague: "CREATE LEAGUE",
    createLeagueTitle: "CREATE\nLEAGUE",
    createLeagueText: "Pick a name and share the invite link with your group.",
    joinLeagueTitle: "JOIN\nA LEAGUE",
    joinLeagueText: "Paste the invite code to enter the standings.",
    leagueCode: "LEAGUE CODE",
    enter: "ENTER →",
    creditsTitle: "CREDITS",
    imageAttribution: "IMAGE ATTRIBUTION",
    creditsText: "Photos are linked from Wikimedia Commons or Wikipedia. Each work keeps its original author and license.",
    authorFallback: "Author listed at source",
    licenseFallback: "View license",
    jersey: "JERSEY",
    pendingPhoto: "PHOTO PENDING",
  },
} as const;

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("es");

  useEffect(() => {
    const saved = localStorage.getItem("court-inside-lang");
    if (saved === "es" || saved === "en") setLangState(saved);
  }, []);

  const setLang = (next: Lang) => {
    setLangState(next);
    localStorage.setItem("court-inside-lang", next);
    document.documentElement.lang = next;
  };

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const value = useMemo<LanguageContextValue>(() => ({
    lang,
    setLang,
    t: (key) => translations[lang][key],
  }), [lang]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used inside LanguageProvider");
  return context;
}

export function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();
  return (
    <div className="language-switch" aria-label="Language selector">
      <button type="button" className={lang === "es" ? "active" : ""} onClick={() => setLang("es")} aria-label="Español">🇪🇸</button>
      <button type="button" className={lang === "en" ? "active" : ""} onClick={() => setLang("en")} aria-label="English">🇬🇧</button>
    </div>
  );
}

export function tx(lang: Lang, key: keyof typeof translations.es) {
  return translations[lang][key];
}

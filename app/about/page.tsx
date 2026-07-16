import { LegalPage } from "@/components/LegalPage";

export default function AboutPage() {
  return (
    <LegalPage
      es={{
        kicker: "COURT INSIDE",
        title: "Sobre el proyecto",
        intro: "Court Inside es una web independiente de minijuegos diarios de baloncesto: retos rápidos, visuales y pensados para medir memoria NBA sin perder el flow.",
        badge: "Un gimnasio diario para enfermos sanos del basket.",
        layout: "accordion",
        sections: [
          {
            title: "¿Qué es Court Inside?",
            body: "Esto es una plataforma de juegos diarios donde poder poner a prueba cada día tus conocimientos sobre la NBA con diversos juegos interactivos como 1vs1, Top 5, Who Am I, 3 en raya, Stat Line o Pyramid. La idea es que cada reto sea rápido, visual y con ese punto de pique que hace que quieras volver mañana.",
          },
          {
            title: "¿Cómo funciona?",
            body: "Cada día la web se reinicia a las 00:00 con nuevos juegos. Además, se actualiza internamente con las nuevas estadísticas de los partidos disputados para que los retos puedan ir reflejando la evolución real de la temporada.",
          },
          {
            title: "¿Somos independientes?",
            body: "No pertenecemos a ninguna organización externa ni oficial. Court Inside no está afiliada, patrocinada ni avalada por la NBA, sus equipos, ligas, jugadores o marcas relacionadas. Usamos datos, nombres e imágenes con finalidad informativa, educativa y de entretenimiento.",
          },
        ],
      }}
      en={{
        kicker: "COURT INSIDE",
        title: "About the project",
        intro: "Court Inside is an independent daily basketball games site: quick, visual challenges built for NBA memory without killing the flow.",
        badge: "A daily gym for beautifully obsessed basketball fans.",
        layout: "accordion",
        sections: [
          {
            title: "What is Court Inside?",
            body: "Court Inside is a daily games platform where you can test your NBA knowledge every day through interactive challenges like 1vs1, Top 5, Who Am I, Tic-Tac-Toe, Stat Line and Pyramid. Each game is built to feel quick, visual and replayable.",
          },
          {
            title: "How does it work?",
            body: "Every day the website resets at 00:00 with new games. It also updates internally with fresh statistics from played games, so challenges can reflect how the real season evolves.",
          },
          {
            title: "Are we independent?",
            body: "We do not belong to any official or external organization. Court Inside is not affiliated with, sponsored by or endorsed by the NBA, its teams, leagues, players or related brands. We use data, names and images for informational, educational and entertainment purposes.",
          },
        ],
      }}
    />
  );
}

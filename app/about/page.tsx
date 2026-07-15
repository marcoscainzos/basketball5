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
            title: "Qué queremos construir",
            body: "Una especie de gimnasio diario para fans de baloncesto: 1vs1, Top 5, Who Am I, 3 en raya, Stat Line y más juegos que se irán puliendo poco a poco.",
          },
          {
            title: "Independencia",
            body: "Court Inside no es una web oficial de la NBA ni de ningún equipo. Usamos datos, nombres, fotos y referencias con finalidad informativa, educativa y de entretenimiento.",
          },
          {
            title: "Datos e imágenes",
            body: "Los datos se preparan a partir de fuentes públicas y datasets deportivos. Las imágenes externas se enlazan o acreditan cuando corresponde. Si una atribución está mal, la corregiremos.",
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
            title: "What we are building",
            body: "A daily gym for basketball fans: 1vs1, Top 5, Who Am I, Tic-Tac-Toe, Stat Line and more games we will keep polishing over time.",
          },
          {
            title: "Independence",
            body: "Court Inside is not an official NBA or team website. We use data, names, photos and references for informational, educational and entertainment purposes.",
          },
          {
            title: "Data and images",
            body: "Data is prepared from public sources and sports datasets. External images are linked or credited where appropriate. If an attribution is wrong, we will correct it.",
          },
        ],
      }}
    />
  );
}

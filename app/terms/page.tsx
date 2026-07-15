import { LegalPage } from "@/components/LegalPage";

export default function TermsPage() {
  return (
    <LegalPage
      es={{
        kicker: "LEGAL",
        title: "Términos de uso",
        intro: "Normas básicas para usar Court Inside. La web es de entretenimiento y puede cambiar con el tiempo.",
        updated: "Última actualización: 15 de julio de 2026",
        sections: [
          {
            title: "Uso de la web",
            body: "Court Inside ofrece minijuegos de baloncesto con fines informativos y de entretenimiento. No garantizamos que todos los datos estén libres de errores.",
          },
          {
            title: "Web no oficial",
            body: "Court Inside no está afiliada, patrocinada ni avalada por la NBA, sus equipos, ligas, jugadores o marcas relacionadas. Cualquier marca o logo pertenece a su propietario.",
          },
          {
            title: "Contenido y datos",
            body: "Puedes jugar y compartir tus resultados, pero no puedes copiar la web, automatizar abusivamente las respuestas ni usar el contenido de forma que parezca oficial.",
          },
          {
            title: "Cambios",
            body: "Podemos cambiar juegos, datos, reglas, diseño o estos términos conforme evolucione el proyecto.",
          },
          {
            title: "Limitación",
            body: "La web se ofrece tal cual. Haremos lo posible por que funcione bien, pero no somos responsables de errores, interrupciones o decisiones tomadas usando la información del sitio.",
          },
        ],
      }}
      en={{
        kicker: "LEGAL",
        title: "Terms of Use",
        intro: "Basic rules for using Court Inside. The site is for entertainment and may change over time.",
        updated: "Last updated: July 15, 2026",
        sections: [
          {
            title: "Use of the site",
            body: "Court Inside provides basketball mini-games for informational and entertainment purposes. We do not guarantee that every data point is error-free.",
          },
          {
            title: "Unofficial website",
            body: "Court Inside is not affiliated with, sponsored by, or endorsed by the NBA, its teams, leagues, players or related brands. Any trademark or logo belongs to its owner.",
          },
          {
            title: "Content and data",
            body: "You may play and share your results, but you may not copy the website, abuse automation, or use the content in a way that appears official.",
          },
          {
            title: "Changes",
            body: "We may change games, data, rules, design or these terms as the project evolves.",
          },
          {
            title: "Limitation",
            body: "The site is provided as is. We will try to keep it working well, but we are not responsible for errors, interruptions or decisions made using information from the site.",
          },
        ],
      }}
    />
  );
}

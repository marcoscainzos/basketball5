import { LegalPage } from "@/components/LegalPage";

export default function ContactPage() {
  return (
    <LegalPage
      es={{
        kicker: "CONTACTO",
        title: "Hablemos",
        intro: "Para errores de datos, créditos de imágenes, bugs o propuestas de juegos.",
        sections: [
          {
            title: "Email",
            body: "contact@courtinside.com",
          },
          {
            title: "Qué enviar",
            items: [
              "La página o juego donde viste el problema.",
              "El jugador, equipo o estadística concreta.",
              "Una fuente si estás corrigiendo un dato.",
            ],
          },
          {
            title: "Antes de publicar",
            body: "Cambia este email por uno real del dominio que compres. Idealmente crea una cuenta tipo contact@tudominio.com.",
          },
        ],
      }}
      en={{
        kicker: "CONTACT",
        title: "Talk to us",
        intro: "For data issues, image credits, bugs, or game suggestions.",
        sections: [
          {
            title: "Email",
            body: "contact@courtinside.com",
          },
          {
            title: "What to send",
            items: [
              "The page or game where you saw the issue.",
              "The exact player, team or statistic.",
              "A source if you are correcting data.",
            ],
          },
          {
            title: "Before publishing",
            body: "Replace this email with a real address for the domain you buy. Ideally create something like contact@yourdomain.com.",
          },
        ],
      }}
    />
  );
}

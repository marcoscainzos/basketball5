import { LegalPage } from "@/components/LegalPage";

export default function PrivacyPage() {
  return (
    <LegalPage
      es={{
        kicker: "LEGAL",
        title: "Política de privacidad",
        intro: "Qué datos usa Court Inside, dónde se guardan y cómo puedes borrarlos.",
        updated: "Última actualización: 15 de julio de 2026",
        sections: [
          {
            title: "Datos que guardamos en tu dispositivo",
            items: [
              "Idioma elegido.",
              "Progreso de juegos diarios, intentos, rachas y retos completados.",
              "Preferencias básicas necesarias para que la web recuerde tu partida.",
            ],
          },
          {
            title: "Sin cuentas por ahora",
            body: "En la versión actual no necesitas registrarte y no pedimos nombre, email ni contraseña para jugar en modo individual.",
          },
          {
            title: "Servicios externos",
            body: "Algunas imágenes, logos o recursos pueden cargarse desde fuentes externas como Wikimedia/Wikipedia u otros proveedores públicos. Esos servicios pueden recibir datos técnicos como tu IP, navegador o página visitada.",
          },
          {
            title: "Publicidad y analítica",
            body: "Court Inside puede usar Google AdSense para mostrar anuncios y medir rendimiento. Las cookies publicitarias solo se usarán si aceptas ese uso en el aviso de cookies.",
          },
          {
            title: "Borrar tus datos locales",
            body: "Puedes borrar el progreso limpiando los datos del sitio en tu navegador. Eso elimina localStorage/caché asociados a Court Inside.",
          },
          {
            title: "Contacto",
            body: "Para dudas de privacidad, escribe a contact@courtinside.com. Si eliges otro dominio o email, cambia esta dirección antes de publicar.",
          },
        ],
      }}
      en={{
        kicker: "LEGAL",
        title: "Privacy Policy",
        intro: "What data Court Inside uses, where it is stored, and how you can clear it.",
        updated: "Last updated: July 15, 2026",
        sections: [
          {
            title: "Data stored on your device",
            items: [
              "Selected language.",
              "Daily game progress, attempts, streaks and completed challenges.",
              "Basic preferences required for the site to remember your session.",
            ],
          },
          {
            title: "No accounts for now",
            body: "The current version does not require registration and does not ask for your name, email or password to play individual games.",
          },
          {
            title: "External services",
            body: "Some images, logos or resources may load from external sources such as Wikimedia/Wikipedia or other public providers. Those services may receive technical data such as your IP address, browser and visited page.",
          },
          {
            title: "Advertising and analytics",
            body: "Court Inside may use Google AdSense to show ads and measure performance. Advertising cookies will only be used if you accept them in the cookie notice.",
          },
          {
            title: "Deleting local data",
            body: "You can clear progress by deleting site data in your browser. This removes localStorage/cache associated with Court Inside.",
          },
          {
            title: "Contact",
            body: "For privacy questions, email contact@courtinside.com. If you choose another domain or email, change this address before publishing.",
          },
        ],
      }}
    />
  );
}

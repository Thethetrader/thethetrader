import { ChevronDownIcon } from "./icons";

function ChevronRight(props: { size?: number }) {
  const size = props.size ?? 18;
  return (
    <ChevronDownIcon
      width={size}
      height={size}
      style={{ transform: "rotate(-90deg)", strokeWidth: 2.4 }}
    />
  );
}

function BookingCard() {
  return (
    <section
      className="booking flex flex-col"
      style={{
        flex: "1 1 0",
        position: "relative",
        padding: "48px 40px 0",
        borderRadius: 24,
        background:
          "radial-gradient(120% 100% at 100% 0%, rgba(255, 82, 165, 0.12) 0%, rgba(255, 255, 255, 0) 60%), oklch(0.99 0.002 286)",
        border: "1px solid oklch(0.92 0.004 286.32)",
        overflow: "hidden",
        minHeight: 360,
      }}
    >
      <h2
        style={{
          fontSize: 32,
          fontWeight: 600,
          lineHeight: "36px",
          letterSpacing: "-0.03em",
          color: "oklch(0.141 0.005 285.823)",
          margin: 0,
          maxWidth: 360,
        }}
      >
        Discutons de votre projet
      </h2>
      <p
        style={{
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "22px",
          color: "oklch(0.21 0.006 285.885)",
          margin: "12px 0 0",
          maxWidth: 420,
        }}
      >
        Des questions à propos de nos parcours de formation ou des possibilités de financement
        disponibles ? Nos conseillers pédagogiques sont à votre écoute.
      </p>
      <a
        href="/reserver/"
        className="inline-flex items-center"
        style={{
          marginTop: 20,
          fontSize: 15,
          fontWeight: 600,
          color: "oklch(0.141 0.005 285.823)",
          textDecoration: "none",
          gap: 4,
          alignSelf: "flex-start",
        }}
      >
        Réserver un appel
        <ChevronRight size={16} />
      </a>
      <div
        style={{
          marginTop: "auto",
          alignSelf: "flex-end",
          position: "relative",
          width: 256,
          height: 246,
        }}
      >
        <img
          src="/images/booking/booking-memoji@2x.png"
          alt="Illustration d'un personnage faisant signe de téléphoner"
          width={256}
          height={246}
          loading="lazy"
          style={{ width: 256, height: 246, display: "block", objectFit: "contain" }}
        />
      </div>
    </section>
  );
}

function FreebiesCard() {
  return (
    <section
      className="freebies flex flex-col"
      style={{
        flex: "1 1 0",
        position: "relative",
        padding: "48px 40px 0",
        borderRadius: 24,
        background:
          "radial-gradient(120% 100% at 0% 0%, rgba(10, 171, 240, 0.12) 0%, rgba(255, 255, 255, 0) 60%), oklch(0.99 0.002 286)",
        border: "1px solid oklch(0.92 0.004 286.32)",
        overflow: "hidden",
        minHeight: 360,
      }}
    >
      <h2
        style={{
          fontSize: 32,
          fontWeight: 600,
          lineHeight: "36px",
          letterSpacing: "-0.03em",
          color: "oklch(0.141 0.005 285.823)",
          margin: 0,
          maxWidth: 360,
        }}
      >
        La boîte à outils
      </h2>
      <p
        style={{
          fontSize: 16,
          fontWeight: 400,
          lineHeight: "22px",
          color: "oklch(0.21 0.006 285.885)",
          margin: "12px 0 0",
          maxWidth: 420,
        }}
      >
        Découvrez tous nos outils gratuits clé en main pour commencer à développer vos revenus et
        optimiser vos investissements.
      </p>
      <a
        href="/contenus-gratuits/"
        className="inline-flex items-center"
        style={{
          marginTop: 20,
          fontSize: 15,
          fontWeight: 600,
          color: "oklch(0.141 0.005 285.823)",
          textDecoration: "none",
          gap: 4,
          alignSelf: "flex-start",
        }}
      >
        Voir toutes les ressources gratuites
        <ChevronRight size={16} />
      </a>
      <div
        style={{
          marginTop: "auto",
          width: "100%",
          position: "relative",
          paddingTop: 24,
        }}
      >
        <img
          src="/images/freebies/freebies@2x.png"
          alt="Une collection d'outils illustrés pour investir en bourse"
          width={1385}
          height={275}
          loading="lazy"
          style={{ width: "100%", height: "auto", display: "block", objectFit: "contain" }}
        />
      </div>
    </section>
  );
}

export function BookingFreebiesRow() {
  return (
    <div
      className="mx-auto"
      style={{ maxWidth: 1400, padding: "40px 20px 80px" }}
    >
      <div
        className="grid booking-freebies-row"
        style={{
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
          gap: 20,
        }}
      >
        <BookingCard />
        <FreebiesCard />
      </div>
    </div>
  );
}

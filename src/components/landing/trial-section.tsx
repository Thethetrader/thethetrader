import { FacebookIcon, GoogleIcon, PlayIcon } from "./icons";

export function TrialSection() {
  return (
    <section
      className="trial"
      style={{ padding: "80px 0", letterSpacing: "-0.01em" }}
    >
      <div
        className="mx-auto"
        style={{ maxWidth: 1400, padding: "0 20px" }}
      >
        <div
          className="grid items-center"
          style={{
            gridTemplateColumns: "minmax(0, 1fr) minmax(0, 1.1fr)",
            gap: 80,
            padding: "56px 64px",
            borderRadius: 32,
            background:
              "radial-gradient(110% 120% at 0% 0%, rgba(10, 171, 240, 0.12) 0%, rgba(143, 102, 255, 0.06) 40%, rgba(255, 255, 255, 0) 75%), oklch(0.99 0.002 286)",
            border: "1px solid oklch(0.92 0.004 286.32)",
          }}
        >
          {/* Left: form */}
          <div className="flex flex-col">
            <h2
              style={{
                fontSize: 36,
                fontWeight: 600,
                lineHeight: "40px",
                letterSpacing: "-0.03em",
                color: "oklch(0.141 0.005 285.823)",
                margin: 0,
              }}
            >
              Essayez notre formation 100% Gratuite ✨
            </h2>
            <p
              style={{
                fontSize: 17,
                fontWeight: 400,
                lineHeight: "24px",
                color: "oklch(0.21 0.006 285.885)",
                margin: "12px 0 0",
              }}
            >
              Et découvrez comment faire fructifier votre argent en partant de zéro !
            </p>

            <form
              onSubmit={(e) => e.preventDefault()}
              className="flex flex-col"
              style={{ gap: 10, marginTop: 24 }}
            >
              <input
                type="text"
                name="first_name"
                placeholder="Prénom"
                autoComplete="given-name"
                style={{
                  height: 48,
                  padding: "0 16px",
                  fontSize: 15,
                  border: "1px solid oklch(0.92 0.004 286.32)",
                  borderRadius: 10,
                  background: "oklch(1 0 0)",
                  outline: "none",
                }}
              />
              <input
                type="email"
                name="email"
                placeholder="Email"
                autoComplete="email"
                style={{
                  height: 48,
                  padding: "0 16px",
                  fontSize: 15,
                  border: "1px solid oklch(0.92 0.004 286.32)",
                  borderRadius: 10,
                  background: "oklch(1 0 0)",
                  outline: "none",
                }}
              />
              <button
                type="submit"
                className="flex items-center justify-center"
                style={{
                  height: 48,
                  padding: "0 24px",
                  fontSize: 15,
                  fontWeight: 600,
                  color: "oklch(0.985 0 0)",
                  background: "oklch(0.21 0.006 285.885)",
                  border: "none",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                Commencer
              </button>
            </form>

            <div
              className="flex items-center"
              style={{
                gap: 12,
                margin: "20px 0",
                fontSize: 13,
                color: "oklch(0.552 0.016 285.938)",
              }}
            >
              <div style={{ flex: 1, height: 1, background: "oklch(0.92 0.004 286.32)" }} />
              <span>Ou</span>
              <div style={{ flex: 1, height: 1, background: "oklch(0.92 0.004 286.32)" }} />
            </div>

            <div className="flex flex-col" style={{ gap: 10 }}>
              <button
                type="button"
                className="flex items-center justify-center"
                style={{
                  height: 48,
                  padding: "0 24px",
                  gap: 10,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "oklch(0.141 0.005 285.823)",
                  background: "oklch(1 0 0)",
                  border: "1px solid oklch(0.92 0.004 286.32)",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                <GoogleIcon width={18} height={18} />
                Connexion avec Google
              </button>
              <button
                type="button"
                className="flex items-center justify-center"
                style={{
                  height: 48,
                  padding: "0 24px",
                  gap: 10,
                  fontSize: 15,
                  fontWeight: 500,
                  color: "oklch(0.141 0.005 285.823)",
                  background: "oklch(1 0 0)",
                  border: "1px solid oklch(0.92 0.004 286.32)",
                  borderRadius: 10,
                  cursor: "pointer",
                }}
              >
                <FacebookIcon width={18} height={18} />
                Connexion avec Facebook
              </button>
            </div>

            <p
              style={{
                fontSize: 13,
                color: "oklch(0.552 0.016 285.938)",
                marginTop: 16,
                margin: "16px 0 0",
              }}
            >
              100% gratuit. Aucun moyen de paiement requis.
            </p>
          </div>

          {/* Right: phone video visual */}
          <div className="flex items-center justify-center" style={{ position: "relative" }}>
            <div style={{ position: "relative", width: "100%", maxWidth: 620 }}>
              <img
                src="/images/trial/hand-horizontal-phone.webp"
                alt="Un téléphone portable tenu à l'horizontal affichant une vidéo de formation"
                width={620}
                height={720}
                loading="lazy"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
              <div
                aria-hidden
                className="flex items-center justify-center"
                style={{
                  position: "absolute",
                  left: "50%",
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 64,
                  height: 64,
                  borderRadius: "50%",
                  background: "oklch(1 0 0 / 0.95)",
                  boxShadow: "0 12px 30px rgba(0, 0, 0, 0.25)",
                  color: "oklch(0.21 0.006 285.885)",
                }}
              >
                <PlayIcon width={26} height={26} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

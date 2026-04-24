import { useState } from "react";
import { supabase } from "../../lib/supabase";

type Step = "form" | "success" | "error";

export function TrialSection() {
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [errorMsg, setErrorMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim() || !email.trim() || password.length < 6) {
      setErrorMsg("Remplis tous les champs (mot de passe : 6 caractères minimum).");
      return;
    }
    setLoading(true);
    setErrorMsg("");

    const trialEndsAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

    const { data: signUpData, error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: firstName.trim(),
          trial_plan: "journal",
          trial_ends_at: trialEndsAt,
        },
      },
    });

    if (error) {
      console.error("Signup error:", error);
      const msg = error.message.toLowerCase();
      if (msg.includes("already registered") || msg.includes("already exists") || msg.includes("email address is already")) {
        setErrorMsg("Cet email est déjà utilisé.");
      } else if (msg.includes("rate limit") || msg.includes("too many")) {
        setErrorMsg("Trop de tentatives. Réessaie dans quelques minutes.");
      } else if (msg.includes("disabled") || msg.includes("not allowed")) {
        setErrorMsg("Les inscriptions sont temporairement désactivées.");
      } else if (msg.includes("password")) {
        setErrorMsg("Mot de passe invalide (6 caractères minimum).");
      } else {
        setErrorMsg(`Erreur : ${error.message}`);
      }
      setLoading(false);
      return;
    }

    // Créer le profil dans user_profiles pour éviter le crash du shell
    if (signUpData?.user) {
      const { error: profileError } = await supabase.from("user_profiles").upsert({
        id: signUpData.user.id,
        user_id: signUpData.user.id,
        user_type: "user",
        display_name: firstName.trim(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });
      if (profileError) console.error("Profile creation error:", profileError);
    }

    setStep("success");
    setLoading(false);
  };

  return (
    <section
      id="trial"
      className="trial"
      style={{ padding: "80px 0", letterSpacing: "-0.01em" }}
    >
      <div className="mx-auto" style={{ maxWidth: 1400, padding: "0 20px" }}>
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
              Essaie le journal 1 mois gratuit
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
              Teste la méthode TPLN sans engagement et commence à trader avec structure.
            </p>

            {step === "success" ? (
              <div
                style={{
                  marginTop: 24,
                  padding: "24px",
                  borderRadius: 12,
                  background: "oklch(0.97 0.05 145)",
                  border: "1px solid oklch(0.85 0.1 145)",
                  color: "oklch(0.3 0.1 145)",
                }}
              >
                <p style={{ margin: 0, fontWeight: 600, fontSize: 16 }}>
                  ✓ Compte créé avec succès !
                </p>
                <p style={{ margin: "8px 0 0", fontSize: 14 }}>
                  Vérifie ta boîte mail pour confirmer ton adresse, puis connecte-toi pour accéder au journal pendant 30 jours.
                </p>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                className="flex flex-col"
                style={{ gap: 10, marginTop: 24 }}
              >
                <input
                  type="text"
                  placeholder="Prénom"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  autoComplete="given-name"
                  required
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
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
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
                  type="password"
                  placeholder="Mot de passe (6 caractères min.)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="new-password"
                  required
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

                {errorMsg && (
                  <p style={{ margin: 0, fontSize: 13, color: "oklch(0.55 0.2 25)" }}>
                    {errorMsg}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center"
                  style={{
                    height: 48,
                    padding: "0 24px",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "oklch(0.985 0 0)",
                    background: loading ? "oklch(0.5 0.006 285.885)" : "oklch(0.21 0.006 285.885)",
                    border: "none",
                    borderRadius: 10,
                    cursor: loading ? "not-allowed" : "pointer",
                    transition: "background 0.15s",
                  }}
                >
                  {loading ? "Création du compte…" : "Commencer 1 mois gratuit"}
                </button>
              </form>
            )}

            <p
              style={{
                fontSize: 13,
                color: "oklch(0.552 0.016 285.938)",
                marginTop: 16,
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
                alt="Aperçu du journal de trading TPLN"
                width={620}
                height={720}
                loading="lazy"
                style={{ width: "100%", height: "auto", display: "block" }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

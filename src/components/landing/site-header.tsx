import { useEffect, useState } from "react";
import { AltiLogo, ChevronDownIcon, GlobeIcon } from "./icons";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type MainNavItem = { label: string; href?: string; panel?: boolean };

const mainNavItems: MainNavItem[] = [
  { label: "Formations", panel: true },
  { label: "CPF", href: "/expert-marches-financiers/" },
  { label: "Financements", href: "/financements/" },
  { label: "Avis", href: "/avis/" },
  { label: "Ressources", panel: true },
];

export function SiteHeader({ onOpenAuth }: { onOpenAuth?: () => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Upper nav — relative, scrolls away */}
      <nav
        id="upper-nav"
        className="relative z-[1002] w-full"
        style={{
          height: 40,
          background: "oklch(0.967 0.001 286.375)",
          color: "oklch(0.442 0.017 285.786)",
          fontSize: 12,
          lineHeight: "18px",
          fontWeight: 400,
        }}
        aria-label="Navigation supérieure"
      >
        <ul className="mx-auto flex h-full max-w-[1080px] items-center px-5" style={{ gap: 8 }}>
          <li className="mr-auto flex items-center">
            <a
              href="https://www.altitrading.com"
              className="group/lang relative flex h-4 items-center gap-1.5 overflow-hidden transition-colors duration-150 hover:text-foreground"
              aria-label="Switch language"
            >
              <GlobeIcon className="size-4 shrink-0" />
              <span className="relative inline-flex">
                <span className="transition-transform duration-200 group-hover/lang:-translate-x-full">Français</span>
                <span className="absolute left-0 top-0 translate-x-full opacity-0 transition-all duration-200 group-hover/lang:translate-x-0 group-hover/lang:opacity-100">
                  English →
                </span>
              </span>
            </a>
          </li>
          <li className="flex items-center">
            <a
              href="#"
              className="flex h-9 items-center gap-1 border-2 border-transparent px-3 transition-colors duration-150 hover:underline underline-offset-4 decoration-[oklch(0.442_0.017_285.786/0.4)]"
            >
              Besoin d&apos;aide pour choisir votre formation ?
            </a>
          </li>
          <li className="flex items-center">
            <a
              href="#"
              className="flex h-9 items-center gap-1 border-2 border-transparent px-3 transition-colors duration-150 hover:underline underline-offset-4"
            >
              Connexion
            </a>
          </li>
          <li className="flex items-center">
            <button className="flex h-9 items-center gap-1 border-2 border-transparent px-3 transition-colors duration-150 hover:underline underline-offset-4">
              À propos
              <ChevronDownIcon className="size-4" />
            </button>
          </li>
        </ul>
      </nav>

      {/* Sticky main header (transparent wrapper, white inner nav) */}
      <header
        id="site-header"
        className="sticky top-0 z-[1000] bg-transparent"
        style={{ height: 56 }}
      >
        <nav
          id="main-nav"
          role="navigation"
          aria-label="Navigation principale"
          className={cn(
            "relative z-[3] h-14 w-full bg-background text-foreground transition-shadow duration-200",
            scrolled
              ? "shadow-[inset_0_-1px_0_rgba(0,0,0,0.08),0_1px_8px_rgba(0,0,0,0.04)]"
              : "shadow-[inset_0_-1px_0_rgba(0,0,0,0.04)]"
          )}
          style={{ fontSize: 13, lineHeight: "19.5px", fontWeight: 500 }}
        >
          <ul className="mx-auto flex h-full max-w-[1080px] items-center px-5">
            <li className="flex h-9 items-center pr-3">
              <a href="/" className="flex items-center" aria-label="Alti Trading — Accueil" style={{ background: "#ffffff", padding: "12px 16px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", maxWidth: "100%", maxHeight: "100%" }}>
                <img src="/faviconewtpln.png" alt="Alti Trading" width={96} height={96} style={{ display: "block", maxWidth: "32px", maxHeight: "32px" }} />
              </a>
            </li>

            <li className="landing-mobile-burger ml-auto items-center" style={{ display: "none" }}>
              <button
                type="button"
                aria-label="Ouvrir le menu"
                aria-expanded={mobileOpen}
                onClick={() => setMobileOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-md border border-[oklch(0.92_0.004_286.32)] bg-white"
              >
                <span
                  aria-hidden
                  style={{
                    display: "block",
                    width: 18,
                    height: 2,
                    background: "currentColor",
                    boxShadow: "0 -6px 0 currentColor, 0 6px 0 currentColor",
                  }}
                />
              </button>
            </li>

            {mainNavItems.map((item) =>
              item.panel ? (
                <li key={item.label} className="landing-desktop-nav flex items-center">
                  <button
                    type="button"
                    className="group/btn flex h-8 items-center gap-1 rounded-lg border border-transparent pl-2.5 pr-1.5 text-[13px] font-normal text-foreground transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted"
                  >
                    {item.label}
                    <ChevronDownIcon className="size-4 opacity-80 transition-transform duration-150 group-hover/btn:rotate-180" />
                  </button>
                </li>
              ) : (
                <li key={item.label} className="landing-desktop-nav flex items-center">
                  <a
                    href={item.href ?? "#"}
                    className="flex h-8 items-center gap-1 rounded-lg border border-transparent px-2.5 text-[13px] font-normal text-foreground transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted"
                  >
                    {item.label}
                  </a>
                </li>
              )
            )}

            <li className="landing-desktop-nav ml-auto flex items-center gap-2">
              <a
                href="#trial"
                className="trial-button flex h-8 items-center gap-1 rounded-lg border border-transparent px-2.5 text-[13px] font-medium text-primary-foreground transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ background: "oklch(0.21 0.006 285.885 / 0.85)" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "oklch(0.21 0.006 285.885 / 1)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "oklch(0.21 0.006 285.885 / 0.85)";
                }}
              >
                Essayer Gratuitement
              </a>
              <button
                type="button"
                onClick={onOpenAuth}
                className="flex h-8 items-center gap-1 rounded-lg border border-[oklch(0.92_0.004_286.32)] bg-white px-2.5 text-[13px] font-medium text-foreground transition-colors duration-150 ease-[cubic-bezier(0.4,0,0.2,1)] hover:bg-muted"
              >
                Se connecter
              </button>
            </li>
          </ul>

          {/* Mobile dropdown panel */}
          {mobileOpen && (
            <div
              className="landing-mobile-panel"
              style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#ffffff",
                borderBottom: "1px solid oklch(0.92 0.004 286.32)",
                boxShadow: "0 6px 12px rgba(0,0,0,0.06)",
                padding: "12px 16px",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                zIndex: 10,
              }}
            >
              {mainNavItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href ?? "#"}
                  className="flex items-center justify-between rounded-md px-2 py-2 text-[14px] font-medium text-foreground hover:bg-muted"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </a>
              ))}
              <div style={{ height: 1, background: "oklch(0.92 0.004 286.32)", margin: "4px 0" }} />
              <a
                href="#trial"
                className="flex h-10 items-center justify-center rounded-md text-[14px] font-medium text-white"
                style={{ background: "oklch(0.21 0.006 285.885)" }}
                onClick={() => setMobileOpen(false)}
              >
                Essayer Gratuitement
              </a>
              <button
                type="button"
                onClick={() => {
                  setMobileOpen(false);
                  onOpenAuth?.();
                }}
                className="flex h-10 items-center justify-center rounded-md border border-[oklch(0.92_0.004_286.32)] bg-white text-[14px] font-medium text-foreground"
              >
                Se connecter
              </button>
            </div>
          )}
        </nav>
      </header>
    </>
  );
}

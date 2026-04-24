import { useEffect, useState } from "react";
import { AltiLogo, ChevronDownIcon, GlobeIcon } from "./icons";

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(" ");
}

type MainNavItem = { label: string; href?: string; panel?: boolean };

const mainNavItems: MainNavItem[] = [
  { label: "Services", href: "#services" },
  { label: "À propos", href: "#about-thethetrader" },
  { label: "La plateforme", href: "#services" },
  { label: "Prix", href: "#pricing" },
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

      {/* Sticky main header (transparent wrapper, white inner nav) */}
      <header
        id="site-header"
        className="sticky top-0 z-[1000] bg-white"
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
                <img src="/TPLNFAVICONFINAL.png" alt="Alti Trading" width={96} height={96} style={{ display: "block", maxWidth: "48px", maxHeight: "48px" }} />
              </a>
            </li>

            <li className="landing-mobile-burger ml-auto items-center gap-2" style={{ display: "none" }}>
              <a
                href="#trial"
                className="landing-mobile-cta flex items-center justify-center rounded-lg text-[13px] font-medium text-white"
                style={{ background: "#25D366", height: 34, padding: "0 12px" }}
              >
                Essayer Gratuitement
              </a>
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
                className="trial-button flex h-8 items-center gap-1 rounded-lg border border-transparent px-2.5 text-[13px] font-medium text-white transition-all duration-150 ease-[cubic-bezier(0.4,0,0.2,1)]"
                style={{ background: "#25D366" }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#1ebe5d";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = "#25D366";
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
                style={{ background: "#25D366" }}
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

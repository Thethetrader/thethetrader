type Article = {
  slug: string;
  title: string;
  category: string;
  readTime: string;
  date: string;
  intro: string;
  sections: { heading?: string; body: string }[];
};

const ARTICLES: Article[] = [
  {
    slug: "strategie-vs-execution",
    title: "Pourquoi ta stratégie n'est pas ton problème",
    category: "Mindset",
    readTime: "5 min",
    date: "Avril 2026",
    intro:
      "La plupart des traders cherchent une meilleure stratégie. Une meilleure entrée. Un meilleur indicateur. Pourtant, la majorité des pertes ne viennent pas d'une mauvaise stratégie. Elles viennent d'une mauvaise exécution d'une bonne stratégie.",
    sections: [
      {
        body: "Tu as déjà vécu ça : tu connais la règle. Tu la vois se vérifier. Et tu fais l'inverse quand même. Ce n'est pas un problème de méthode. C'est un problème de structure.",
      },
      {
        heading: "Le vrai problème",
        body: "Sans cadre clair — règles d'entrée définies, taille de position fixée à l'avance, conditions de sortie non négociables — chaque trade devient une décision émotionnelle. Et les décisions émotionnelles sont aléatoires par nature. Un jour tu coupes trop tôt parce que le marché t'a fait peur la veille. Le lendemain tu tiens trop longtemps parce que tu veux « récupérer ». Résultat : une performance chaotique qui ne reflète même pas ta capacité réelle à lire le marché.",
      },
      {
        heading: "Ce que la structure change",
        body: "Quand tes règles sont écrites avant d'entrer dans le trade, tu n'as plus à décider sous pression. Tu exécutes un plan. La qualité de ton analyse peut enfin s'exprimer parce qu'elle n'est plus sabotée par l'émotion du moment. La structure ne remplace pas la stratégie. Elle la rend applicable.",
      },
      {
        heading: "Comment commencer",
        body: "Commence simple : avant chaque trade, écris en une phrase pourquoi tu entres, où tu sors en perte, et où tu sors en gain. Si tu ne peux pas répondre aux trois, tu n'entres pas. Cette seule règle élimine 80% des trades impulsifs.",
      },
    ],
  },
  {
    slug: "journal-de-trading",
    title: "Journal de trading : pourquoi 95% des traders le font mal",
    category: "Méthode",
    readTime: "6 min",
    date: "Avril 2026",
    intro:
      "Tenir un journal de trading est un conseil universel. Presque personne ne le fait correctement.",
    sections: [
      {
        body: "La plupart notent le résultat. Gain, perte, PnL. Ce n'est pas un journal, c'est un relevé de compte. Un relevé de compte, tu l'as déjà dans ton broker. Ça ne t'apprend rien sur toi.",
      },
      {
        heading: "Ce qu'un vrai journal capture",
        body: "Un vrai journal capture ce qui se passe avant et pendant le trade : ton état mental au moment de l'entrée, la raison exacte pour laquelle tu as pris la position, si tu as respecté tes règles — indépendamment du résultat. C'est cette dernière distinction qui est critique.",
      },
      {
        heading: "Le résultat ne dit pas tout",
        body: "Un trade gagnant pris hors règles est un mauvais trade. Un trade perdant pris dans les règles est un bon trade. Si tu ne fais pas cette distinction, tu vas renforcer des comportements aléatoires quand tu gagnes et te décourager d'une méthode valide quand tu perds. Le journal t'aide à séparer la qualité de ton processus de la qualité du résultat.",
      },
      {
        heading: "Le format minimal",
        body: "Date — Actif — Direction — Raison d'entrée — Respect des règles (oui/non) — Ce que j'aurais dû faire différemment. Cinq lignes suffisent. Ce n'est pas la longueur qui compte, c'est la régularité et l'honnêteté. Sans ça, tu analyses du bruit.",
      },
    ],
  },
  {
    slug: "biais-cognitifs-trading",
    title: "Les 3 biais qui détruisent les traders disciplinés",
    category: "Psychologie",
    readTime: "5 min",
    date: "Avril 2026",
    intro:
      "Même les traders structurés tombent dans ces pièges. Les connaître ne suffit pas — mais c'est le premier pas.",
    sections: [
      {
        heading: "1. Le biais de récence",
        body: "Après 3 pertes consécutives, ton cerveau conclut que ta méthode est cassée. Après 3 gains, il conclut qu'elle est parfaite. Les deux sont faux. Un échantillon de 3 trades ne signifie rien statistiquement. Une méthode solide peut avoir 10 pertes de suite et rester profitable sur 100 trades. Le biais de récence te pousse à changer de méthode trop tôt — juste avant qu'elle ne commence à payer.",
      },
      {
        heading: "2. L'aversion à la perte",
        body: "Tu coupes tes gains trop tôt par peur de les perdre. Tu laisses courir tes pertes en espérant un retournement. Résultat : des petits gains et de grosses pertes. C'est l'inverse de ce qu'il faut pour être profitable sur le long terme. Ce biais est câblé dans notre cerveau — la douleur d'une perte est psychologiquement deux fois plus intense que le plaisir d'un gain équivalent. La seule façon de le contourner : des règles de sortie définies à l'avance, pas en temps réel.",
      },
      {
        heading: "3. Le biais de confirmation",
        body: "Tu lis le marché pour valider ce que tu veux déjà faire, pas pour chercher la vérité. Tu vois des signaux d'entrée parce que tu veux entrer, pas parce qu'ils sont réellement là. La solution : une checklist pré-trade avec des critères objectifs. Si les critères ne sont pas cochés, le trade n'existe pas. Peu importe ce que tu « ressens ».",
      },
    ],
  },
  {
    slug: "constance-et-marches",
    title: "Constance : ce que les marchés t'apprennent vraiment",
    category: "Mindset",
    readTime: "4 min",
    date: "Avril 2026",
    intro:
      "On parle de constance comme d'une qualité morale. C'est en réalité une compétence technique.",
    sections: [
      {
        body: "Être constant ne veut pas dire gagner à chaque trade. Ça veut dire appliquer le même process sur chaque trade, quelle que soit l'issue du précédent. C'est ça qui te permet d'évaluer ta méthode correctement.",
      },
      {
        heading: "Pourquoi la constance crée de la donnée",
        body: "Si ton exécution varie — si tu sizes différemment selon ton humeur, si tu sors plus tôt quand tu es stressé, si tu prends des positions supplémentaires quand tu es en confiance — tu ne sais pas si c'est ta stratégie ou ton comportement qui génère les résultats. Tu ne peux rien améliorer parce que tu n'as rien à analyser. La constance crée de la donnée. La donnée te permet de t'améliorer.",
      },
      {
        heading: "Ce que les marchés récompensent vraiment",
        body: "Les marchés ne récompensent pas les meilleurs analystes. Il y a des traders avec une analyse médiocre qui gagnent régulièrement parce qu'ils exécutent fidèlement. Il y a des traders avec une lecture du marché excellente qui perdent parce qu'ils ne s'y tiennent pas. L'exécution fiable sur la durée bat l'analyse brillante et irrégulière. Toujours.",
      },
      {
        heading: "Comment construire la constance",
        body: "Fixe des règles que tu peux tenir même dans tes pires journées. Pas tes meilleures — tes pires. Si ta règle de risk demande trop de calcul mental quand tu es fatigué, simplifie-la. Si ta condition d'entrée est trop subjective pour être appliquée sous pression, rends-la plus objective. La constance se construit sur des règles simples, pas sur des intentions.",
      },
    ],
  },
  {
    slug: "checklist-pre-trade",
    title: "La checklist pré-trade : l'outil que les pros utilisent et que les débutants ignorent",
    category: "Méthode",
    readTime: "5 min",
    date: "Avril 2026",
    intro:
      "Les pilotes de ligne ne décollent pas sans checklist. Les chirurgiens ne commencent pas sans protocole. Les traders professionnels ne rentrent pas dans un trade sans vérification systématique. Ce n'est pas de la bureaucratie — c'est ce qui sépare l'exécution fiable de l'improvisation.",
    sections: [
      {
        heading: "Pourquoi ta mémoire ne suffit pas",
        body: "Sous pression, le cerveau prend des raccourcis. Tu oublies de vérifier le contexte macro. Tu sautes l'étape de la confirmation. Tu entres parce que le setup « ressemble » à ce qu'il faut, pas parce qu'il l'est vraiment. Une checklist écrite élimine ce problème. Elle t'oblige à passer par chaque étape, même quand tu es impatient, même quand tu es convaincu.",
      },
      {
        heading: "Les 5 questions à se poser avant chaque trade",
        body: "1. Le contexte de marché est-il favorable à cette direction ? 2. Mon signal d'entrée est-il clairement validé selon mes règles ? 3. Mon stop loss est-il positionné de manière logique, pas arbitraire ? 4. Mon take profit offre-t-il un ratio risque/rendement acceptable ? 5. Ma taille de position respecte-t-elle mon risk maximum par trade ? Si tu ne peux pas répondre oui aux cinq, tu n'entres pas.",
      },
      {
        heading: "Comment la construire",
        body: "Ta checklist doit refléter ta méthode, pas celle d'un autre. Commence par noter les 3 dernières fois où tu as pris un mauvais trade. Qu'est-ce que tu aurais dû vérifier et que tu n'as pas vérifié ? Ces points deviennent les premières entrées de ta checklist. Ajoute, affine et simplifie au fil du temps. L'objectif : une liste de 5 à 8 points que tu peux traverser en moins de 2 minutes.",
      },
      {
        heading: "L'erreur à éviter",
        body: "Ne crée pas une checklist trop longue. Vingt critères ne te protègent pas mieux que huit — ils te paralysent. La checklist doit accélérer ta décision en la rendant plus fiable, pas la ralentir. Si elle devient un fardeau, tu cesseras de l'utiliser. Commence court, reste court.",
      },
    ],
  },
  {
    slug: "gerer-ses-emotions-en-trading",
    title: "Gérer ses émotions en trading : arrête de chercher le contrôle, cherche le cadre",
    category: "Psychologie",
    readTime: "5 min",
    date: "Avril 2026",
    intro:
      "La plupart des conseils sur la gestion des émotions en trading te disent de « rester calme », « ne pas avoir peur », « être discipliné ». C'est inutile. Tu ne contrôles pas tes émotions. Personne ne le fait. Ce que tu peux contrôler, c'est le cadre dans lequel tu opères.",
    sections: [
      {
        heading: "Le problème avec « rester calme »",
        body: "La peur, la frustration, l'euphorie — ce sont des réponses automatiques du cerveau face à l'incertitude et à l'enjeu financier. Tu ne peux pas les éteindre par la volonté. Essayer de « ne pas avoir peur » quand tu vois un trade partir en négatif, c'est comme essayer de ne pas avoir faim. L'émotion est là. La question c'est : est-ce qu'elle dirige ta décision ?",
      },
      {
        heading: "Ce que le cadre change",
        body: "Quand tes règles sont définies avant d'entrer dans le trade — taille de position, stop loss, conditions de sortie — l'émotion n'a plus de levier. Tu n'as pas à décider sous pression parce que la décision est déjà prise. Tu exécutes un plan. L'émotion peut être là, elle ne change rien à ce que tu fais.",
      },
      {
        heading: "Les deux situations à risque",
        body: "L'euphorie après une série de gains : tu augmentes ta taille, tu prends des setups moins propres, tu te crois infaillible. C'est là que les comptes explosent. La déprime après une série de pertes : tu réduis ta taille au mauvais moment, tu hésites sur des setups valides, tu changes de méthode. C'est là que tu sabotes une edge qui fonctionnait. Les deux ont la même solution : des règles fixes sur la taille de position, indépendantes de tes résultats récents.",
      },
      {
        heading: "Ce que tu dois construire",
        body: "Un environnement de trading où les décisions importantes sont prises hors marché. Taille de position calculée avant l'entrée. Niveaux de sortie posés avant l'entrée. Nombre maximum de trades par jour défini à l'avance. Quand le marché est ouvert, ton seul rôle est d'exécuter ce que tu as planifié — pas de penser, pas de décider, pas de ressentir. Juste exécuter.",
      },
    ],
  },
];

export function getArticleBySlug(slug: string): Article | undefined {
  return ARTICLES.find((a) => a.slug === slug);
}

export function getAllArticles() {
  return ARTICLES;
}

export function ArticlePage({ slug }: { slug: string }) {
  const article = getArticleBySlug(slug);

  if (!article) {
    return (
      <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, color: "oklch(0.55 0.01 286)" }}>Article introuvable.</p>
          <a href="/" style={{ marginTop: 16, display: "inline-block", fontSize: 14, color: "oklch(0.21 0.006 285.885)" }}>
            ← Retour à l'accueil
          </a>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "#ffffff", minHeight: "100vh", fontFamily: "inherit" }}>
      {/* Header */}
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 100,
          background: "#ffffff",
          borderBottom: "1px solid oklch(0.92 0.004 286.32)",
          height: 56,
          display: "flex",
          alignItems: "center",
          padding: "0 20px",
        }}
      >
        <a href="/" style={{ display: "flex", alignItems: "center", gap: 12, textDecoration: "none" }}>
          <img src="/TPLNFAVICONFINAL.png" alt="TPLN" width={32} height={32} style={{ display: "block" }} />
          <span style={{ fontSize: 13, fontWeight: 500, color: "oklch(0.55 0.01 286)" }}>
            ← Retour
          </span>
        </a>
      </header>

      {/* Article */}
      <main style={{ maxWidth: 680, margin: "0 auto", padding: "64px 20px 120px" }}>
        {/* Meta */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "oklch(0.21 0.006 285.885)",
              background: "oklch(0.967 0.001 286.375)",
              border: "1px solid oklch(0.92 0.004 286.32)",
              borderRadius: 9999,
              padding: "2px 10px",
            }}
          >
            {article.category}
          </span>
          <span style={{ fontSize: 13, color: "oklch(0.55 0.01 286)" }}>{article.readTime} de lecture</span>
          <span style={{ fontSize: 13, color: "oklch(0.55 0.01 286)" }}>·</span>
          <span style={{ fontSize: 13, color: "oklch(0.55 0.01 286)" }}>{article.date}</span>
        </div>

        {/* Title */}
        <h1
          style={{
            fontSize: 40,
            fontWeight: 700,
            lineHeight: "46px",
            letterSpacing: "-0.03em",
            color: "oklch(0.141 0.005 285.823)",
            margin: "0 0 32px",
          }}
        >
          {article.title}
        </h1>

        {/* Intro */}
        <p
          style={{
            fontSize: 18,
            lineHeight: "28px",
            color: "oklch(0.35 0.005 285)",
            fontWeight: 400,
            margin: "0 0 40px",
            paddingBottom: 40,
            borderBottom: "1px solid oklch(0.92 0.004 286.32)",
          }}
        >
          {article.intro}
        </p>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {article.sections.map((section, i) => (
            <div key={i}>
              {section.heading && (
                <h2
                  style={{
                    fontSize: 22,
                    fontWeight: 600,
                    lineHeight: "28px",
                    letterSpacing: "-0.02em",
                    color: "oklch(0.141 0.005 285.823)",
                    margin: "0 0 12px",
                  }}
                >
                  {section.heading}
                </h2>
              )}
              <p
                style={{
                  fontSize: 17,
                  lineHeight: "27px",
                  color: "oklch(0.35 0.005 285)",
                  margin: 0,
                }}
              >
                {section.body}
              </p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 64,
            padding: 32,
            borderRadius: 16,
            background: "oklch(0.967 0.001 286.375)",
            border: "1px solid oklch(0.92 0.004 286.32)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: 18,
              fontWeight: 600,
              color: "oklch(0.141 0.005 285.823)",
              margin: "0 0 8px",
              letterSpacing: "-0.02em",
            }}
          >
            Prêt à trader avec structure ?
          </p>
          <p style={{ fontSize: 14, color: "oklch(0.55 0.01 286)", margin: "0 0 20px" }}>
            Rejoins TPLN et accède à la méthode complète.
          </p>
          <a
            href="/#pricing"
            style={{
              display: "inline-flex",
              alignItems: "center",
              padding: "10px 24px",
              background: "oklch(0.141 0.005 285.823)",
              color: "#ffffff",
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 9,
              textDecoration: "none",
            }}
          >
            Voir les offres
          </a>
        </div>
      </main>
    </div>
  );
}

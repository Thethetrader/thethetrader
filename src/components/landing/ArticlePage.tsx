import { useEffect } from "react";

type Article = {
  slug: string;
  title: string;
  metaTitle: string;
  metaDescription: string;
  category: string;
  readTime: string;
  date: string;
  intro: string;
  sections: { heading?: string; body: string }[];
};

const ARTICLES: Article[] = [
  {
    slug: "strategie-vs-execution",
    title: "Pourquoi ta stratégie n'est pas ton problème (et ce qui l'est vraiment)",
    metaTitle: "Stratégie vs Exécution en Trading : Pourquoi ta méthode ne suffit pas | TPLN",
    metaDescription: "La majorité des traders perdants ont une bonne stratégie. Leur problème, c'est l'exécution. Découvrez pourquoi la structure prime sur la méthode et comment la mettre en place.",
    category: "Mindset",
    readTime: "7 min",
    date: "Avril 2026",
    intro:
      "La plupart des traders cherchent une meilleure stratégie. Une meilleure entrée. Un meilleur indicateur. Pourtant, la majorité des pertes ne viennent pas d'une mauvaise stratégie. Elles viennent d'une mauvaise exécution d'une bonne stratégie. Si tu perds de l'argent en trading, il y a de fortes chances que ton problème ne soit pas où tu le cherches.",
    sections: [
      {
        body: "Tu as déjà vécu ça : tu connais la règle. Tu la vois se vérifier. Et tu fais l'inverse quand même. Ce n'est pas un problème de méthode. C'est un problème de structure. Et cette distinction change tout à la façon dont tu dois travailler ton trading.",
      },
      {
        heading: "Le vrai problème : l'absence de cadre",
        body: "Sans cadre clair — règles d'entrée définies, taille de position fixée à l'avance, conditions de sortie non négociables — chaque trade devient une décision émotionnelle. Et les décisions émotionnelles sont aléatoires par nature. Un jour tu coupes trop tôt parce que le marché t'a fait peur la veille. Le lendemain tu tiens trop longtemps parce que tu veux « récupérer ». Résultat : une performance chaotique qui ne reflète même pas ta capacité réelle à lire le marché. Le problème n'est pas ton analyse. C'est l'absence de processus autour de cette analyse.",
      },
      {
        heading: "Pourquoi les traders cherchent une meilleure stratégie",
        body: "C'est plus simple de chercher un meilleur setup que de travailler sa discipline. Un nouveau système promet de résoudre le problème sans effort. Mais dans la réalité, la plupart des stratégies rentables ont un win rate entre 40 et 60%. Ce qui les rend profitables, ce n'est pas leur précision. C'est la rigueur avec laquelle elles sont appliquées. Un trader qui exécute une stratégie moyenne avec une discipline parfaite battra presque toujours un trader qui possède une stratégie excellente mais une exécution chaotique.",
      },
      {
        heading: "Ce que la structure change concrètement",
        body: "Quand tes règles sont écrites avant d'entrer dans le trade, tu n'as plus à décider sous pression. Tu exécutes un plan. La qualité de ton analyse peut enfin s'exprimer parce qu'elle n'est plus sabotée par l'émotion du moment. La structure ne remplace pas la stratégie. Elle la rend applicable. Elle transforme une bonne idée en comportement reproductible. Et c'est uniquement sur les comportements reproductibles qu'on peut construire une edge durable.",
      },
      {
        heading: "Comment distinguer un problème de stratégie d'un problème d'exécution",
        body: "Pose-toi cette question honnêtement : est-ce que tu respectes tes règles à 100% ? Si la réponse est non, arrête de chercher une nouvelle stratégie. Ton problème n'est pas la stratégie, c'est l'exécution. Documente tes 20 derniers trades. Note pour chaque : est-ce que j'ai suivi mes règles, oui ou non ? Indépendamment du résultat. Tu verras probablement que tes trades hors règles ont une performance bien inférieure à tes trades dans les règles. C'est la preuve que ta stratégie fonctionne. Ton exécution, non.",
      },
      {
        heading: "Comment commencer à construire ta structure",
        body: "Commence simple : avant chaque trade, écris en une phrase pourquoi tu entres, où tu sors en perte, et où tu sors en gain. Si tu ne peux pas répondre aux trois, tu n'entres pas. Cette seule règle élimine 80% des trades impulsifs. Ensuite, crée une règle de taille de position fixe — par exemple, ne jamais risquer plus de 1% de ton capital par trade. Ne la dépasse jamais, même quand tu es confiant. C'est l'absence de règles fixes qui transforme la confiance en imprudence.",
      },
      {
        heading: "La méthode TPLN : exécution avant tout",
        body: "C'est exactement ce sur quoi repose la méthode TPLN. Pas une nouvelle stratégie secrète. Un cadre d'exécution rigoureux autour d'une méthode simple et lisible. Chaque signal est documenté, chaque trade est suivi dans le journal, chaque session live montre comment appliquer les règles en temps réel — pas comment « lire le marché ». La différence est fondamentale.",
      },
    ],
  },
  {
    slug: "journal-de-trading",
    title: "Journal de trading : le guide complet pour arrêter de le faire mal",
    metaTitle: "Journal de Trading : Comment le tenir correctement pour progresser | TPLN",
    metaDescription: "95% des traders tiennent mal leur journal de trading. Découvrez ce qu'un vrai journal doit capturer, le format minimal efficace, et pourquoi noter seulement le PnL ne sert à rien.",
    category: "Méthode",
    readTime: "8 min",
    date: "Avril 2026",
    intro:
      "Tenir un journal de trading est un conseil universel. Presque personne ne le fait correctement. Et cette différence entre le faire et le faire bien est souvent ce qui sépare les traders qui progressent de ceux qui stagnent pendant des années. Ce guide explique précisément ce qu'un journal de trading doit capturer — et ce qu'il ne doit pas se contenter d'être.",
    sections: [
      {
        body: "La plupart des traders notent le résultat. Gain, perte, PnL. Ce n'est pas un journal, c'est un relevé de compte. Un relevé de compte, tu l'as déjà dans ton broker. Ça ne t'apprend rien sur toi, sur tes erreurs, sur tes comportements. Ça te dit ce qui s'est passé, pas pourquoi.",
      },
      {
        heading: "Ce qu'un vrai journal de trading capture",
        body: "Un vrai journal capture ce qui se passe avant et pendant le trade : ton état mental au moment de l'entrée, la raison exacte pour laquelle tu as pris la position, si tu as respecté tes règles indépendamment du résultat. C'est cette dernière distinction qui est critique. Le processus est séparable du résultat. Un bon processus peut produire un mauvais résultat sur un trade individuel. Un mauvais processus peut produire un bon résultat par chance. Sans journal, tu confonds les deux.",
      },
      {
        heading: "Pourquoi le résultat seul ne suffit pas",
        body: "Un trade gagnant pris hors règles est un mauvais trade. Un trade perdant pris dans les règles est un bon trade. Si tu ne fais pas cette distinction, tu vas renforcer des comportements aléatoires quand tu gagnes et te décourager d'une méthode valide quand tu perds. Sur le long terme, cette confusion détruit les comptes même avec une stratégie rentable. Le journal te permet de séparer la qualité de ton processus de la qualité du résultat — c'est la base de toute progression réelle.",
      },
      {
        heading: "Le format minimal efficace",
        body: "Tu n'as pas besoin d'un journal compliqué. Six éléments suffisent : la date et l'actif tradé, la direction (achat ou vente), la raison précise de l'entrée, si tu as respecté tes règles (oui ou non, sans nuance), le résultat en pips ou en euros, et une seule phrase sur ce que tu aurais dû faire différemment. C'est tout. Six lignes. Ça prend deux minutes. Ce n'est pas la longueur qui compte, c'est la régularité et l'honnêteté. Sans ça, tu analyses du bruit.",
      },
      {
        heading: "Comment utiliser ton journal pour progresser",
        body: "Une fois par semaine, relis tes 20 derniers trades. Filtre par « trades dans les règles » et « trades hors règles ». Compare les performances de chaque groupe. Tu verras presque immédiatement que tes trades hors règles sont largement moins rentables — ou directement responsables de tes pertes. Cette analyse te donne une priorité claire : l'exécution disciplinée, pas une nouvelle stratégie. Une fois par mois, identifie ton erreur récurrente numéro 1. Concentre-toi uniquement sur cette erreur le mois suivant.",
      },
      {
        heading: "Les erreurs les plus communes dans la tenue d'un journal",
        body: "La première erreur : ne noter que les trades gagnants, ou oublier les trades impulsifs qu'on préférerait oublier. Un journal incomplet est inutile. La deuxième erreur : noter après coup avec le recul du résultat. Note toujours la raison d'entrée avant de savoir comment le trade finit. La troisième erreur : ne jamais relire le journal. L'écriture seule ne suffit pas. C'est la relecture et l'analyse régulière qui créent la progression.",
      },
      {
        heading: "Le journal TPLN : ce que ça change",
        body: "Le journal intégré dans l'environnement TPLN est conçu pour capturer exactement ces informations — pas juste le PnL. Chaque trade est documenté avec ses conditions d'entrée, le respect ou non des règles, et les statistiques automatiquement calculées sur le win rate, le ratio risk/reward réel, et la discipline par session. L'objectif n'est pas de te donner un beau tableau. C'est de te montrer exactement où tu gagnes de l'argent et où tu en perds.",
      },
    ],
  },
  {
    slug: "biais-cognitifs-trading",
    title: "Les 3 biais cognitifs qui détruisent les traders disciplinés (et comment les neutraliser)",
    metaTitle: "Biais Cognitifs en Trading : Les 3 pièges psychologiques qui coûtent le plus cher | TPLN",
    metaDescription: "Même les traders disciplinés tombent dans ces 3 biais cognitifs. Biais de récence, aversion à la perte, biais de confirmation : comprendre et neutraliser ces mécanismes psychologiques.",
    category: "Psychologie",
    readTime: "7 min",
    date: "Avril 2026",
    intro:
      "Même les traders structurés tombent dans ces pièges. Les connaître ne suffit pas à les éviter — notre cerveau n'a pas été conçu pour trader des marchés financiers. Mais les identifier précisément te permet de construire des règles qui les neutralisent, même quand tu n'y penses pas. Voici les trois biais cognitifs qui coûtent le plus cher aux traders, et les solutions concrètes pour chacun.",
    sections: [
      {
        heading: "1. Le biais de récence : l'ennemi de la patience",
        body: "Après 3 pertes consécutives, ton cerveau conclut que ta méthode est cassée. Après 3 gains, il conclut qu'elle est parfaite. Les deux sont faux. Un échantillon de 3 trades ne signifie rien statistiquement. Une méthode solide peut avoir 10 pertes de suite et rester profitable sur 100 trades. Le biais de récence te pousse à changer de méthode trop tôt, juste avant qu'elle ne commence à payer. C'est l'une des raisons pour lesquelles tant de traders sautent de système en système sans jamais obtenir de résultats.",
      },
      {
        heading: "Comment neutraliser le biais de récence",
        body: "Fixe un minimum de 50 trades avant d'évaluer une stratégie. Écris ce nombre quelque part de visible. Quand tu te sens prêt à abandonner ta méthode, regarde ce chiffre. Es-tu à 50 trades ? Si non, continue. Si oui, analyse les données complètes — pas les 3 derniers trades. C'est tout. Ce simple engagement te protège du réflexe d'abandon prématuré qui sabote la majorité des traders.",
      },
      {
        heading: "2. L'aversion à la perte : le biais le plus coûteux",
        body: "Tu coupes tes gains trop tôt par peur de les perdre. Tu laisses courir tes pertes en espérant un retournement. Résultat : des petits gains et de grosses pertes. C'est l'inverse de ce qu'il faut pour être profitable sur le long terme. Ce biais est câblé dans notre cerveau : la douleur d'une perte est psychologiquement deux fois plus intense que le plaisir d'un gain équivalent. Cette asymétrie pousse à des comportements irrationnels même chez des traders expérimentés.",
      },
      {
        heading: "Comment neutraliser l'aversion à la perte",
        body: "La seule façon de contourner ce biais : des règles de sortie définies à l'avance, pas en temps réel. Ton stop loss est posé avant l'entrée. Ton take profit est posé avant l'entrée. En cours de trade, ton seul rôle est de ne pas y toucher. Si tu déplaces ton stop en cours de route « parce que le niveau est proche », tu es sous l'influence de l'aversion à la perte. C'est une discipline qui s'acquiert avec du temps et un journal qui trace chaque modification de stop.",
      },
      {
        heading: "3. Le biais de confirmation : voir ce qu'on veut voir",
        body: "Tu lis le marché pour valider ce que tu veux déjà faire, pas pour chercher la vérité. Tu vois des signaux d'entrée parce que tu veux entrer, pas parce qu'ils sont réellement là. Ce biais est particulièrement dangereux parce qu'il est invisible : tu es convaincu d'analyser objectivement alors que tu cherches des preuves de ta conclusion préexistante. C'est lui qui fait sur-trader les traders qui s'ennuient, et sur-convaincre les traders qui ont une position ouverte.",
      },
      {
        heading: "Comment neutraliser le biais de confirmation",
        body: "La solution : une checklist pré-trade avec des critères objectifs et binaires. Chaque critère est validé ou non, sans interprétation. Si les critères ne sont pas tous cochés, le trade n'existe pas. Peu importe ce que tu « ressens ». Peu importe que tu aies l'impression que « ça ressemble » à un bon setup. La checklist objectivise ta décision et coupe court au raisonnement biaisé.",
      },
      {
        heading: "Ce que ces trois biais ont en commun",
        body: "Les trois partagent la même origine : des décisions prises sous l'influence de l'émotion du moment. Et ils ont la même solution : des règles définies hors marché, quand tu es calme et rationnel, que tu appliques mécaniquement quand le marché est ouvert. Ce n'est pas une question de volonté ou de caractère. C'est une question de structure. Les meilleurs traders ne sont pas plus forts psychologiquement. Ils ont simplement construit un cadre qui rend leurs biais moins dangereux.",
      },
    ],
  },
  {
    slug: "constance-et-marches",
    title: "Constance en trading : la compétence technique que personne ne t'a enseignée",
    metaTitle: "Constance en Trading : Pourquoi la régularité bat l'analyse | TPLN",
    metaDescription: "La constance en trading n'est pas une qualité morale, c'est une compétence technique. Découvrez comment construire une exécution régulière qui vous permet de vraiment progresser.",
    category: "Mindset",
    readTime: "6 min",
    date: "Avril 2026",
    intro:
      "On parle de constance comme d'une qualité morale. « Sois discipliné. » « Reste constant. » Ces injonctions sont inutiles parce qu'elles ne te disent pas comment. La constance en trading est en réalité une compétence technique — elle se construit, elle s'entraîne, et elle repose sur des règles concrètes, pas sur la force de caractère.",
    sections: [
      {
        body: "Être constant ne veut pas dire gagner à chaque trade. Ça veut dire appliquer le même processus sur chaque trade, quelle que soit l'issue du précédent. C'est ça qui te permet d'évaluer ta méthode correctement et de progresser de manière structurée. Sans constance, tu ne peux rien analyser. Sans analyse, tu ne peux rien améliorer.",
      },
      {
        heading: "Pourquoi la constance crée de la donnée utilisable",
        body: "Si ton exécution varie — si tu sizes différemment selon ton humeur, si tu sors plus tôt quand tu es stressé, si tu prends des positions supplémentaires quand tu es en confiance — tu ne sais pas si c'est ta stratégie ou ton comportement qui génère les résultats. Tu ne peux rien améliorer parce que tu n'as rien à analyser. La constance crée de la donnée. La donnée te permet de t'améliorer. C'est la seule boucle de progression qui fonctionne sur le long terme.",
      },
      {
        heading: "Ce que les marchés récompensent vraiment",
        body: "Les marchés ne récompensent pas les meilleurs analystes. Il y a des traders avec une analyse médiocre qui gagnent régulièrement parce qu'ils exécutent fidèlement un plan solide. Il y a des traders avec une lecture du marché excellente qui perdent parce qu'ils ne s'y tiennent pas. L'exécution fiable sur la durée bat l'analyse brillante et irrégulière. Toujours. Ce n'est pas une opinion — c'est ce que les données de performance montrent systématiquement.",
      },
      {
        heading: "Comment construire la constance concrètement",
        body: "Fixe des règles que tu peux tenir même dans tes pires journées. Pas tes meilleures — tes pires. Si ta règle de risk demande trop de calcul mental quand tu es fatigué, simplifie-la. Si ta condition d'entrée est trop subjective pour être appliquée sous pression, rends-la plus objective. La constance se construit sur des règles simples, pas sur des intentions. Une règle que tu appliques à 70% n'est pas une règle. C'est une suggestion. Et les suggestions ne créent pas de données.",
      },
      {
        heading: "Les ennemis de la constance",
        body: "Le premier ennemi : la recherche de validation immédiate. Après un mois difficile, l'instinct est de changer quelque chose — n'importe quoi — pour avoir l'impression d'agir. Ce changement brise la constance et empêche d'évaluer ce qui fonctionnait vraiment. Le deuxième ennemi : le sur-optimisme après une bonne période. Tu augmentes ta taille, tu assouplis tes critères, tu prends plus de risque. C'est là que les gains d'un mois peuvent être effacés en quelques trades. La constance signifie appliquer les mêmes règles dans les deux situations.",
      },
      {
        heading: "Mesurer ta constance",
        body: "Une fois par semaine, calcule ton taux de respect des règles. Sur 10 trades, combien ont été pris en respectant tous tes critères d'entrée ? Combien de stops ont été respectés sans modification ? Combien de tailles de position étaient conformes à ta règle de risk ? Si ce taux est inférieur à 80%, la constance est ta priorité numéro un — avant la stratégie, avant les entrées, avant tout le reste.",
      },
    ],
  },
  {
    slug: "checklist-pre-trade",
    title: "La checklist pré-trade : les 5 questions que tout trader sérieux se pose avant d'entrer",
    metaTitle: "Checklist Pré-Trade : Les 5 Questions Indispensables Avant Chaque Trade | TPLN",
    metaDescription: "Les pilotes ont leur checklist. Les traders professionnels aussi. Découvrez les 5 questions à se poser systématiquement avant chaque trade pour éliminer les entrées impulsives.",
    category: "Méthode",
    readTime: "7 min",
    date: "Avril 2026",
    intro:
      "Les pilotes de ligne ne décollent pas sans checklist. Les chirurgiens ne commencent pas sans protocole. Les traders professionnels ne rentrent pas dans un trade sans vérification systématique. Ce n'est pas de la bureaucratie — c'est ce qui sépare l'exécution fiable de l'improvisation. Et en trading comme en aviation, l'improvisation finit mal.",
    sections: [
      {
        heading: "Pourquoi ta mémoire ne suffit pas en trading",
        body: "Sous pression, le cerveau prend des raccourcis. Tu oublies de vérifier le contexte macro. Tu sautes l'étape de la confirmation. Tu entres parce que le setup « ressemble » à ce qu'il faut, pas parce qu'il l'est vraiment. La pression du temps, la peur de rater un mouvement, l'impatience — autant de facteurs qui biaisent ton jugement en temps réel. Une checklist écrite élimine ce problème. Elle t'oblige à passer par chaque étape, même quand tu es impatient, même quand tu es convaincu. Elle transforme une décision subjective en processus objectif.",
      },
      {
        heading: "Les 5 questions à se poser avant chaque trade",
        body: "1. Le contexte de marché est-il favorable à cette direction ? (tendance, niveaux clés, volatilité) — 2. Mon signal d'entrée est-il clairement validé selon mes règles définies, pas selon mon interprétation du moment ? — 3. Mon stop loss est-il positionné de manière logique par rapport à la structure du marché, pas arbitrairement ? — 4. Mon take profit offre-t-il un ratio risque/rendement d'au moins 1:2 ? — 5. Ma taille de position respecte-t-elle mon risk maximum par trade, quelle que soit ma conviction sur ce setup ? Si tu ne peux pas répondre oui aux cinq, tu n'entres pas.",
      },
      {
        heading: "Comment construire ta propre checklist",
        body: "Ta checklist doit refléter ta méthode, pas celle d'un autre. La liste ci-dessus est un point de départ, pas un modèle universel. Commence par noter les 3 dernières fois où tu as pris un mauvais trade. Qu'est-ce que tu aurais dû vérifier et que tu n'as pas vérifié ? Ces points deviennent les premières entrées de ta checklist. Ajoute, affine et simplifie au fil du temps. L'objectif : une liste de 5 à 8 points que tu peux traverser en moins de 2 minutes.",
      },
      {
        heading: "L'erreur à éviter : la checklist trop longue",
        body: "Ne crée pas une checklist trop longue. Vingt critères ne te protègent pas mieux que huit — ils te paralysent. La checklist doit accélérer ta décision en la rendant plus fiable, pas la ralentir. Si elle devient un fardeau, tu cesseras de l'utiliser. Commence court, reste court. Une checklist de 6 points appliquée à 100% vaut infiniment mieux qu'une checklist de 20 points appliquée quand tu y penses.",
      },
      {
        heading: "Comment intégrer la checklist dans ton processus quotidien",
        body: "Imprime-la ou note-la sur un post-it à côté de ton écran. En format numérique, note-la dans ton journal de trading avant chaque entrée. L'habitude prend 3 à 4 semaines à s'installer. Les premières fois, ça paraît mécanique. C'est normal. C'est exactement ce que tu cherches : remplacer l'improvisation par un mécanisme. Au bout de quelques semaines, tu ne pourras plus t'imaginer entrer dans un trade sans l'avoir traversée.",
      },
      {
        heading: "Ce que la checklist ne fait pas",
        body: "La checklist ne te garantit pas des trades gagnants. Une entrée qui respecte tous les critères peut très bien perdre. C'est inévitable et normal dans un activité probabiliste. Ce que la checklist garantit, c'est que chaque trade est pris pour les bonnes raisons. Que tu construises des données utilisables. Que tes pertes sont des pertes propres, pas des erreurs d'exécution. Sur la durée, c'est cette rigueur qui fait la différence.",
      },
    ],
  },
  {
    slug: "gerer-ses-emotions-en-trading",
    title: "Gérer ses émotions en trading : arrête de chercher le contrôle, cherche le cadre",
    metaTitle: "Gérer ses Émotions en Trading : La Méthode qui Fonctionne Vraiment | TPLN",
    metaDescription: "Vous ne pouvez pas contrôler vos émotions en trading. Personne ne le peut. Mais vous pouvez construire un cadre qui les rend inoffensives. Voici comment.",
    category: "Psychologie",
    readTime: "7 min",
    date: "Avril 2026",
    intro:
      "La plupart des conseils sur la gestion des émotions en trading te disent de « rester calme », « ne pas avoir peur », « être discipliné ». C'est inutile. Tu ne contrôles pas tes émotions. Personne ne le fait. Ce que tu peux contrôler, c'est le cadre dans lequel tu opères. Et c'est cette distinction qui change tout.",
    sections: [
      {
        heading: "Le problème avec « rester calme »",
        body: "La peur, la frustration, l'euphorie — ce sont des réponses automatiques du cerveau face à l'incertitude et à l'enjeu financier. Tu ne peux pas les éteindre par la volonté. Essayer de « ne pas avoir peur » quand tu vois un trade partir en négatif, c'est comme essayer de ne pas avoir faim. L'émotion est là. La question, c'est : est-ce qu'elle dirige ta décision ? Et si ta décision dépend de l'émotion du moment, tu as un problème structurel, pas psychologique.",
      },
      {
        heading: "Ce que le cadre change",
        body: "Quand tes règles sont définies avant d'entrer dans le trade — taille de position, stop loss, conditions de sortie — l'émotion n'a plus de levier. Tu n'as pas à décider sous pression parce que la décision est déjà prise. Tu exécutes un plan. L'émotion peut être là, elle ne change rien à ce que tu fais. C'est ça, la gestion des émotions en trading. Pas le contrôle de l'émotion elle-même, mais la suppression de son pouvoir de décision.",
      },
      {
        heading: "La situation à risque numéro 1 : l'euphorie après les gains",
        body: "Tu viens de faire 3 trades gagnants de suite. Tu te sens invincible. Tu augmentes ta taille. Tu prends des setups moins propres. Tu t'autorises des exceptions à tes règles « parce que ça tourne bien ». C'est là que les comptes explosent. Pas pendant les périodes difficiles — pendant les bonnes séries. L'euphorie est aussi dangereuse que la peur, juste dans l'autre sens. La solution : une règle de taille de position fixe, indépendante de tes résultats récents. Même si tu as gagné 10 trades de suite, ta taille reste la même.",
      },
      {
        heading: "La situation à risque numéro 2 : la déprime après les pertes",
        body: "Tu viens de perdre 4 trades de suite. Tu doutes de tout. Tu hésites sur des setups valides. Tu réduis ta taille au mauvais moment. Tu changes de méthode. C'est là que tu sabotes une edge qui fonctionnait, juste au moment où elle allait reprendre. La déprime après une série de pertes est aussi prévisible que l'euphorie — et tout aussi destructrice. La solution est identique : des règles fixes sur la taille de position et une règle sur le nombre minimum de trades avant de réévaluer ta méthode.",
      },
      {
        heading: "Ce que tu dois construire",
        body: "Un environnement de trading où les décisions importantes sont prises hors marché. Taille de position calculée avant l'entrée. Niveaux de sortie posés avant l'entrée. Nombre maximum de trades par jour défini à l'avance. Condition d'arrêt si tu atteins une perte maximale journalière. Quand le marché est ouvert, ton seul rôle est d'exécuter ce que tu as planifié — pas de penser, pas de décider, pas de ressentir. Juste exécuter.",
      },
      {
        heading: "La vérité sur la psychologie du trading",
        body: "Les traders qui gèrent bien leurs émotions ne sont pas plus forts mentalement que les autres. Ils ont simplement construit un cadre suffisamment solide pour que leurs émotions n'aient plus de prise sur leurs décisions. L'objectif n'est pas d'être un robot. C'est de construire des règles qui protègent ta performance de tes propres biais — y compris quand tu n'es pas dans ton meilleur jour. C'est accessible à tout trader. Ça demande du temps, de la structure, et un journal qui trace honnêtement ce qui se passe vraiment.",
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

  useEffect(() => {
    if (!article) return;
    document.title = article.metaTitle;
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) metaDesc.setAttribute("content", article.metaDescription);
    const ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", article.metaTitle);
    const ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", article.metaDescription);
    const canonical = document.querySelector('link[rel="canonical"]');
    if (canonical) canonical.setAttribute("href", `https://tradingpourlesnuls.com/articles/${article.slug}`);

    // Article schema
    const existing = document.getElementById("article-schema");
    if (existing) existing.remove();
    const schema = document.createElement("script");
    schema.id = "article-schema";
    schema.type = "application/ld+json";
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "Article",
      headline: article.title,
      description: article.metaDescription,
      author: { "@type": "Organization", name: "TPLN - Trading Pour Les Nuls", url: "https://tradingpourlesnuls.com" },
      publisher: { "@type": "Organization", name: "TPLN - Trading Pour Les Nuls", url: "https://tradingpourlesnuls.com" },
      url: `https://tradingpourlesnuls.com/articles/${article.slug}`,
      articleSection: article.category,
      inLanguage: "fr-FR",
    });
    document.head.appendChild(schema);

    return () => {
      const s = document.getElementById("article-schema");
      if (s) s.remove();
    };
  }, [article]);

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

        {/* Autres articles */}
        <div style={{ marginTop: 64, paddingTop: 40, borderTop: "1px solid oklch(0.92 0.004 286.32)" }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: "oklch(0.55 0.01 286)", textTransform: "uppercase", letterSpacing: "0.08em", margin: "0 0 20px" }}>
            À lire aussi
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            {ARTICLES.filter((a) => a.slug !== article.slug).slice(0, 3).map((a) => (
              <a
                key={a.slug}
                href={`/articles/${a.slug}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "14px 16px",
                  borderRadius: 10,
                  border: "1px solid oklch(0.92 0.004 286.32)",
                  textDecoration: "none",
                  background: "oklch(0.99 0 0)",
                }}
              >
                <div>
                  <span style={{ fontSize: 11, fontWeight: 500, color: "oklch(0.55 0.01 286)", display: "block", marginBottom: 4 }}>{a.category}</span>
                  <span style={{ fontSize: 15, fontWeight: 500, color: "oklch(0.21 0.006 285.885)", lineHeight: "20px" }}>{a.title}</span>
                </div>
                <span style={{ fontSize: 18, color: "oklch(0.7 0.01 286)", marginLeft: 12, flexShrink: 0 }}>→</span>
              </a>
            ))}
          </div>
        </div>

        {/* CTA */}
        <div
          style={{
            marginTop: 48,
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
            Rejoins TPLN et accède à la méthode complète — journal, sessions live et signaux.
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
            Voir les offres →
          </a>
        </div>
      </main>
    </div>
  );
}

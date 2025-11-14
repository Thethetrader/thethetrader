/**
 * Configuration des raisons de stop-loss
 * 
 * Pour ajouter/modifier/supprimer des raisons, édite simplement ce fichier.
 * 
 * Format:
 * - value: identifiant unique (sans espaces, en minuscules avec underscore)
 * - emoji: emoji à afficher
 * - label: texte à afficher
 */

export interface LossReason {
  value: string;
  emoji: string;
  label: string;
}

export const LOSS_REASONS: LossReason[] = [
  {
    value: 'mauvais_entree',
    emoji: '🎯',
    label: 'Mauvais point d\'entrée'
  },
  {
    value: 'stop_trop_serre',
    emoji: '⚠️',
    label: 'Stop-loss trop serré'
  },
  {
    value: 'news_impact',
    emoji: '📰',
    label: 'Impact de news/événements'
  },
  {
    value: 'psychologie',
    emoji: '🧠',
    label: 'Erreur psychologique (FOMO/Panic)'
  },
  {
    value: 'analyse_technique',
    emoji: '📊',
    label: 'Erreur d\'analyse technique'
  },
  {
    value: 'gestion_risque',
    emoji: '💰',
    label: 'Mauvaise gestion du risque'
  },
  {
    value: 'timing',
    emoji: '⏰',
    label: 'Mauvais timing'
  },
  {
    value: 'volatilite',
    emoji: '📈',
    label: 'Volatilité excessive'
  },
  {
    value: 'autre',
    emoji: '🔧',
    label: 'Autre raison'
  }
];

/**
 * Obtenir le label complet (emoji + texte) d'une raison
 */
export const getLossReasonLabel = (reasonValue: string): string => {
  const reason = LOSS_REASONS.find(r => r.value === reasonValue);
  if (reason) {
    return `${reason.emoji} ${reason.label}`;
  }
  return reasonValue;
};


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
    value: 'crt_contre_crt_htf',
    emoji: '📊',
    label: 'CRT Contre crt htf'
  },
  {
    value: 'contre_sma',
    emoji: '📈',
    label: 'Contre sma'
  },
  {
    value: 'pas_extremite',
    emoji: '📍',
    label: 'Pas extrémité'
  },
  {
    value: 'erreur_psychologique',
    emoji: '🧠',
    label: 'Erreur psychologique (fomo / panic)'
  },
  {
    value: 'stop_loss_trop_serre',
    emoji: '⚠️',
    label: 'Stop loss trop serré'
  },
  {
    value: 'manip_sans_fvg',
    emoji: '🔄',
    label: 'Manip sans fvg'
  },
  {
    value: 'faible_itmss',
    emoji: '📉',
    label: 'Faible ITMSS'
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


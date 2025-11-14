// Script pour vider tous les signaux du localStorage
// À exécuter dans la console du navigateur

console.log('🗑️ Nettoyage de tous les signaux...');

// Vérifier combien de signaux existent
const allSignals = JSON.parse(localStorage.getItem('signals') || '[]');
console.log('📊 Signaux trouvés:', allSignals.length);

// Afficher les détails des signaux avant suppression
if (allSignals.length > 0) {
  console.log('📋 Détails des signaux:');
  allSignals.forEach((signal, index) => {
    console.log(`${index + 1}. ${signal.symbol} - ${signal.status} - Salon: ${signal.channel_id}`);
  });
}

// Demander confirmation
if (confirm(`⚠️ Voulez-vous vraiment supprimer TOUS les ${allSignals.length} signaux ?\n\nCette action est irréversible !`)) {
  // Supprimer tous les signaux
  localStorage.removeItem('signals');
  
  console.log('✅ Tous les signaux ont été supprimés !');
  console.log('🔄 Rechargez la page pour voir les changements');
  
  // Optionnel : recharger automatiquement
  if (confirm('Voulez-vous recharger la page maintenant ?')) {
    window.location.reload();
  }
} else {
  console.log('❌ Suppression annulée');
} 
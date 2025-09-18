#!/bin/bash

# Script pour remettre le commit CHECKPOINT_LIVESTREAM_COMPLETE_2025_01_17

echo "🔄 Remise du commit CHECKPOINT_LIVESTREAM_COMPLETE_2025_01_17..."

# Aller dans le bon dossier
cd /Users/theodorebrey/Downloads/thethe

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé"
    exit 1
fi

echo "✅ Dans le dossier: $(pwd)"

# Vérifier l'historique git
echo "📊 Historique git:"
git log --oneline -5

# Chercher le commit dans l'historique distant
echo "🔍 Recherche du commit dans l'historique distant..."
git fetch origin main
git log --oneline origin/main -10

# Essayer de trouver le commit par message
echo "🔍 Recherche par message de commit..."
git log --grep="CHECKPOINT_LIVESTREAM_COMPLETE" --oneline

echo "✅ Recherche terminée"


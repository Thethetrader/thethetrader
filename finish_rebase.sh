#!/bin/bash

# Script pour terminer le rebase et remettre le commit

echo "🔄 Finalisation du rebase et remise du commit..."

# Aller dans le bon dossier
cd /Users/theodorebrey/Downloads/thethe

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé"
    exit 1
fi

echo "✅ Dans le dossier: $(pwd)"

# Terminer le rebase
echo "🔄 Finalisation du rebase..."
git rebase --continue

# Vérifier le statut
echo "📊 Statut après rebase:"
git status

# Push le commit
echo "🚀 Push du commit..."
git push origin main

echo "✅ Commit remis avec succès!"


#!/bin/bash

# Script pour push vers GitHub

echo "🚀 Push vers GitHub..."

# Aller dans le bon dossier
cd /Users/theodorebrey/Downloads/thethe

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé"
    exit 1
fi

echo "✅ Dans le dossier: $(pwd)"

# Vérifier le statut git
echo "📊 Statut git:"
git status

# Ajouter les changements
echo "📝 Ajout des changements..."
git add .

# Commit si nécessaire
echo "💾 Commit des changements..."
git commit -m "CHECKPOINT_LIVESTREAM_COMPLETE_2025_01_17 - Final push"

# Pull pour synchroniser
echo "🔄 Synchronisation avec le remote..."
git pull origin main --rebase

# Push vers GitHub
echo "🚀 Push vers GitHub..."
git push origin main

echo "✅ Push terminé!"
echo "🌐 Vérifiez sur Netlify: https://app.netlify.com/sites/thethetrader/deploys"

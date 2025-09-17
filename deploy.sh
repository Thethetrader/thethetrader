#!/bin/bash

# Script de déploiement pour CHECKPOINT_LIVESTREAM_COMPLETE_2025_01_17

echo "🚀 Début du déploiement..."

# Aller dans le bon dossier
cd /Users/theodorebrey/Downloads/thethe

# Vérifier qu'on est dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur: package.json non trouvé"
    exit 1
fi

echo "✅ Dans le bon dossier: $(pwd)"

# Initialiser git si nécessaire
if [ ! -d ".git" ]; then
    echo "📁 Initialisation git..."
    git init
fi

# Ajouter tous les fichiers
echo "📝 Ajout des fichiers..."
git add .

# Faire le commit
echo "💾 Création du commit..."
git commit -m "CHECKPOINT_LIVESTREAM_COMPLETE_2025_01_17"

# Build pour production
echo "🔨 Build pour production..."
npm run build

echo "✅ Déploiement terminé!"
echo "📝 Nom du commit: CHECKPOINT_LIVESTREAM_COMPLETE_2025_01_17"
echo "📁 Dossier dist/ prêt pour upload"

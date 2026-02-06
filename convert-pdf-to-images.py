#!/usr/bin/env python3
import os
import sys

try:
    from pdf2image import convert_from_path
    from PIL import Image
except ImportError:
    print("Installation des dépendances...")
    os.system(f"{sys.executable} -m pip install pdf2image pillow")
    from pdf2image import convert_from_path
    from PIL import Image

# Convertir le PDF en images
pdf_path = "public/trading pour les nuls.pdf"
output_folder = "public/fondamentaux"

# Créer le dossier de sortie
os.makedirs(output_folder, exist_ok=True)

print(f"Conversion du PDF: {pdf_path}")
print(f"Dossier de sortie: {output_folder}")

try:
    # Convertir le PDF en images (DPI=200 pour bonne qualité)
    images = convert_from_path(pdf_path, dpi=200)
    
    print(f"Nombre de pages: {len(images)}")
    
    # Sauvegarder chaque page
    for i, image in enumerate(images):
        output_path = os.path.join(output_folder, f"page-{i+1}.jpg")
        # Optimiser la qualité et la taille
        image.save(output_path, 'JPEG', quality=85, optimize=True)
        print(f"Page {i+1}/{len(images)} sauvegardée: {output_path}")
    
    print(f"\n✅ Conversion terminée! {len(images)} pages converties.")
    
except Exception as e:
    print(f"❌ Erreur: {e}")
    print("\nSi vous n'avez pas poppler installé:")
    print("  macOS: brew install poppler")
    print("  Ubuntu/Debian: sudo apt-get install poppler-utils")

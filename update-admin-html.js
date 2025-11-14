import fs from 'fs';
import path from 'path';

// Trouver le fichier JS et CSS le plus récent dans dist/assets
const distAssetsDir = path.join(process.cwd(), 'dist', 'assets');
const files = fs.readdirSync(distAssetsDir);

// Trouver les fichiers JS et CSS les plus récents (par date de modification)
const jsFiles = files.filter(f => f.startsWith('index-') && f.endsWith('.js'));
const cssFiles = files.filter(f => f.startsWith('index-') && f.endsWith('.css'));

if (jsFiles.length === 0 || cssFiles.length === 0) {
  console.error('❌ Fichiers JS/CSS non trouvés dans dist/assets');
  process.exit(1);
}

// Trier par date de modification (plus récent en premier)
const getMostRecent = (fileList) => {
  return fileList
    .map(file => ({
      name: file,
      time: fs.statSync(path.join(distAssetsDir, file)).mtimeMs
    }))
    .sort((a, b) => b.time - a.time)[0].name;
};

const jsFile = getMostRecent(jsFiles);
const cssFile = getMostRecent(cssFiles);

// Mettre à jour admin.html dans dist (après build)
const distAdminHtmlPath = path.join(process.cwd(), 'dist', 'admin.html');
const publicAdminHtmlPath = path.join(process.cwd(), 'public', 'admin.html');

// Lire le template depuis public
let adminHtml = fs.readFileSync(publicAdminHtmlPath, 'utf8');

adminHtml = adminHtml.replace(
  /src="\/assets\/index-[^"]+\.js"/,
  `src="/assets/${jsFile}"`
);

adminHtml = adminHtml.replace(
  /href="\/assets\/index-[^"]+\.css"/,
  `href="/assets/${cssFile}"`
);

// Écrire dans dist
fs.writeFileSync(distAdminHtmlPath, adminHtml);
console.log('✅ admin.html mis à jour avec:', jsFile, cssFile);


const fs = require('fs');
const path = require('path');

const pagePath = path.join('frontend', 'app', '(player)', 'profile', 'page.tsx');
let content = fs.readFileSync(pagePath, 'utf8');

// Remove state and functions
content = content.replace('const [uploadedGames, setUploadedGames] = useState<any[]>([]);\n', '');
content = content.replace('fetchUploadedGames();\n', '');

const fetchUploadedGamesRegex = /const fetchUploadedGames = async \(\) => \{[\s\S]*?\};\n\n/g;
content = content.replace(fetchUploadedGamesRegex, '');

const handleDeleteGameRegex = /const handleDeleteGame = async \(gameId: string\) => \{[\s\S]*?\};\n\n/g;
content = content.replace(handleDeleteGameRegex, '');

// Remove stats block
const statsBlockRegex = /<div className="flex flex-wrap justify-center md:justify-start gap-3 mt-6 md:mt-0">[\s\S]*?<\/div>\s*<\/div>\n/g;
content = content.replace(statsBlockRegex, '');

// Remove tab button
content = content.replace('{ id: \'uploads\', icon: UploadCloud, label: t("profile.myUploads") }', '');
content = content.replace(',\n            \n          ]', '\n          ]'); // Clean up dangling comma if any
content = content.replace(/,\s*\]/, ']');

// Remove tab content
const uploadsTabContentRegex = /\{activeTab === 'uploads' && \([\s\S]*?<\/div>\n\s*\)\}/g;
content = content.replace(uploadsTabContentRegex, '');

fs.writeFileSync(pagePath, content);
console.log('done refactoring profile page');

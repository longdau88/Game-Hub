const fs = require('fs');
const path = require('path');

const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');

let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
vi['creator.allGames'] = 'Tất cả Game';
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));

let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
en['creator.allGames'] = 'All Games';
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('done adding translation creator.allGames');

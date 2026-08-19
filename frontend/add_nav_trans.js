const fs = require('fs');
const path = require('path');

const locales = ['vi', 'en'];
const translations = {
  vi: {
    "nav.creatorStudio": "Creator Studio"
  },
  en: {
    "nav.creatorStudio": "Creator Studio"
  }
};

locales.forEach(lang => {
  const p = path.join('frontend', 'locales', `${lang}.json`);
  let content = JSON.parse(fs.readFileSync(p, 'utf8'));
  Object.assign(content, translations[lang]);
  fs.writeFileSync(p, JSON.stringify(content, null, 2));
});
console.log("Translations added.");

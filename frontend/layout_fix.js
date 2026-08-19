const fs = require('fs');
const path = require('path');

const file = path.join('frontend', 'app', '(creator)', 'creator', 'layout.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/>Creator Studio<\/span>/g, '>{t("creator.studio") || "Creator Studio"}</span>');
content = content.replace(/> Back to GameHub/g, '> {t("creator.backToGameHub") || "Back to GameHub"}');
content = content.replace(/>Need Help\?<\/h4>/g, '>{t("creator.needHelp") || "Need Help?"}</h4>');
content = content.replace(/>Check out our creator documentation and guidelines\./g, '>{t("creator.needHelpDesc") || "Check out our creator documentation and guidelines."}');
content = content.replace(/> Documentation\n              <\/Button>/g, '>{t("creator.documentation") || "Documentation"}\n              </Button>');

fs.writeFileSync(file, content);

const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');
let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

vi['creator.studio'] = 'Creator Studio';
vi['creator.backToGameHub'] = 'Về GameHub';
vi['creator.needHelp'] = 'Cần Hỗ Trợ?';
vi['creator.needHelpDesc'] = 'Xem tài liệu và hướng dẫn dành cho nhà phát triển của chúng tôi.';
vi['creator.documentation'] = 'Tài Liệu';

en['creator.studio'] = 'Creator Studio';
en['creator.backToGameHub'] = 'Back to GameHub';
en['creator.needHelp'] = 'Need Help?';
en['creator.needHelpDesc'] = 'Check out our creator documentation and guidelines.';
en['creator.documentation'] = 'Documentation';

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('done layout');

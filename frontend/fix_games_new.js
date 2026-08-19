const fs = require('fs');
const path = require('path');

const file = path.join('frontend', 'app', '(creator)', 'creator', 'games', 'new', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replace Button Texts
content = content.replace(/>\s*Back\s*<\/Button>/g, '>{t("creator.back") || "Back"}</Button>');
content = content.replace(/\{loading \? "Processing\.\.\." : \(step === 3 \? "Publish Game" : "Continue"\)\}/g, '{loading ? (t("creator.processing") || "Processing...") : (step === 3 ? (t("creator.publishGame") || "Publish Game") : (t("creator.continue") || "Continue"))}');

// Replace Categories
content = content.replace(/<select id="category" className="/g, '<select id="category" multiple className="min-h-[100px] ');
content = content.replace(/<option value="adventure">Adventure<\/option>/g, '<option value="adventure">{t("creator.catAdventure") || "Adventure"}</option>');
content = content.replace(/<option value="racing">Racing<\/option>/g, '<option value="racing">{t("creator.catRacing") || "Racing"}</option>');

// Replace other texts
content = content.replace(/HTML5 Game Package \(\.zip\)/g, '{t("creator.gamePackage") || "HTML5 Game Package (.zip)"}');
content = content.replace(/Click to upload or drag and drop/g, '{t("creator.clickToUpload") || "Click to upload or drag and drop"}');
content = content.replace(/ZIP file containing index\.html \(Max 200MB\)/g, '{t("creator.zipHelpText") || "ZIP file containing index.html (Max 200MB)"}');
content = content.replace(/Cover Image <span/g, '{t("creator.coverImage") || "Cover Image"} <span');

fs.writeFileSync(file, content);

const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');
let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

vi['creator.back'] = 'Quay Lại';
vi['creator.continue'] = 'Tiếp Tục';
vi['creator.publishGame'] = 'Xuất Bản Game';
vi['creator.processing'] = 'Đang Xử Lý...';
vi['creator.catAdventure'] = 'Phiêu Lưu';
vi['creator.catRacing'] = 'Đua Xe';
vi['creator.gamePackage'] = 'Gói Game HTML5 (.zip)';
vi['creator.clickToUpload'] = 'Bấm để tải lên hoặc kéo thả vào đây';
vi['creator.zipHelpText'] = 'File ZIP chứa index.html (Tối đa 200MB)';
vi['creator.coverImage'] = 'Ảnh Bìa Game';

en['creator.back'] = 'Back';
en['creator.continue'] = 'Continue';
en['creator.publishGame'] = 'Publish Game';
en['creator.processing'] = 'Processing...';
en['creator.catAdventure'] = 'Adventure';
en['creator.catRacing'] = 'Racing';
en['creator.gamePackage'] = 'HTML5 Game Package (.zip)';
en['creator.clickToUpload'] = 'Click to upload or drag and drop';
en['creator.zipHelpText'] = 'ZIP file containing index.html (Max 200MB)';
en['creator.coverImage'] = 'Cover Image';

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('done new game fix');

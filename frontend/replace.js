const fs = require('fs');
const path = require('path');

const file = path.join('frontend', 'app', '(creator)', 'creator', 'games', 'new', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Replacements
content = content.replace(/label: "Basic Info"/g, 'label: t("creator.step1") || "Basic Info"');
content = content.replace(/label: "Assets"/g, 'label: t("creator.step2") || "Assets"');
content = content.replace(/label: "Review"/g, 'label: t("creator.step3") || "Review"');

content = content.replace(/\{step === 1 && "Basic Information"\}/g, '{step === 1 && (t("creator.step1Title") || "Basic Information")}');
content = content.replace(/\{step === 2 && "Game Assets"\}/g, '{step === 2 && (t("creator.step2Title") || "Game Assets")}');
content = content.replace(/\{step === 3 && "Review & Publish"\}/g, '{step === 3 && (t("creator.step3Title") || "Review & Publish")}');

content = content.replace(/\{step === 1 && "Enter the primary details for your game\."\}/g, '{step === 1 && (t("creator.step1Desc") || "Enter the primary details for your game.")}');
content = content.replace(/\{step === 2 && "Upload your HTML5 game package and marketing assets\."\}/g, '{step === 2 && (t("creator.step2Desc") || "Upload your HTML5 game package and marketing assets.")}');
content = content.replace(/\{step === 3 && "Verify all details before publishing to the platform\."\}/g, '{step === 3 && (t("creator.step3Desc") || "Verify all details before publishing to the platform.")}');

content = content.replace(/Game Title <span/g, '{t("creator.gameTitle") || "Game Title"} <span');
content = content.replace(/placeholder="e\.g\. Neon District: Zero"/g, 'placeholder={t("creator.gameTitlePlaceholder") || "e.g. Neon District: Zero"}');

content = content.replace(/Description <span/g, '{t("creator.description") || "Description"} <span');
content = content.replace(/placeholder="Describe your game\.\.\."/g, 'placeholder={t("creator.descPlaceholder") || "Describe your game..."}');

content = content.replace(/Category<\/Label>/g, '{t("creator.category") || "Category"}</Label>');
content = content.replace(/Tags \(comma separated\)<\/Label>/g, '{t("creator.tags") || "Tags (comma separated)"}</Label>');
content = content.replace(/>Action<\/option>/g, '>{t("creator.catAction") || "Action"}</option>');
content = content.replace(/>Puzzle<\/option>/g, '>{t("creator.catPuzzle") || "Puzzle"}</option>');
content = content.replace(/>RPG<\/option>/g, '>{t("creator.catRPG") || "RPG"}</option>');
content = content.replace(/>Strategy<\/option>/g, '>{t("creator.catStrategy") || "Strategy"}</option>');

content = content.replace(/>Continue<\/Button>/g, '>{t("creator.continue") || "Continue"}</Button>');
content = content.replace(/>Back<\/Button>/g, '>{t("creator.back") || "Back"}</Button>');
content = content.replace(/>Publish Game<\/Button>/g, '>{t("creator.publishGame") || "Publish Game"}</Button>');
content = content.replace(/>Uploading\.\.\.<\/Button>/g, '>{t("creator.uploading") || "Uploading..."}</Button>');

fs.writeFileSync(file, content);
console.log('games/new/page.tsx updated!');

const fs = require('fs');
const path = require('path');

const translations = {
  vi: {
    "admin.gameTitleDescRequired": "Tiêu đề và mô tả là bắt buộc.",
    "admin.gameUpdatedSuccess": "Cập nhật game thành công!",
    "admin.emailSubjectMessageRequired": "Vui lòng nhập chủ đề và nội dung."
  },
  en: {
    "admin.gameTitleDescRequired": "Title and description are required.",
    "admin.gameUpdatedSuccess": "Game updated successfully!",
    "admin.emailSubjectMessageRequired": "Please enter subject and message."
  }
};

['vi', 'en'].forEach(lang => {
  const p = path.join('frontend', 'locales', `${lang}.json`);
  let content = JSON.parse(fs.readFileSync(p, 'utf8'));
  Object.assign(content, translations[lang]);
  fs.writeFileSync(p, JSON.stringify(content, null, 2));
});
console.log("Admin notify translations injected.");

const fs = require('fs');
const path = require('path');

const translations = {
  vi: {
    "admin.tabAudit": "Lịch sử hoạt động",
    "admin.audit.title": "Lịch sử hoạt động",
    "admin.audit.desc": "Theo dõi toàn bộ thao tác của Admin trên hệ thống.",
    "admin.audit.colTime": "Thời gian",
    "admin.audit.colAdmin": "Quản trị viên",
    "admin.audit.colAction": "Hành động",
    "admin.audit.colEntity": "Đối tượng",
    "admin.audit.colDetails": "Chi tiết"
  },
  en: {
    "admin.tabAudit": "Audit Logs",
    "admin.audit.title": "Audit Logs",
    "admin.audit.desc": "Track all Admin actions on the system.",
    "admin.audit.colTime": "Time",
    "admin.audit.colAdmin": "Admin",
    "admin.audit.colAction": "Action",
    "admin.audit.colEntity": "Entity",
    "admin.audit.colDetails": "Details"
  }
};

['vi', 'en'].forEach(lang => {
  const p = path.join('frontend', 'locales', `${lang}.json`);
  let content = JSON.parse(fs.readFileSync(p, 'utf8'));
  Object.assign(content, translations[lang]);
  fs.writeFileSync(p, JSON.stringify(content, null, 2));
});
console.log("Translations injected.");

const fs = require('fs');
const viPath = 'frontend/locales/vi.json';
const enPath = 'frontend/locales/en.json';

let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
vi['creator.rejected'] = 'Bị Từ Chối';
if (!vi['creator.processing']) vi['creator.processing'] = 'Đang Xử Lý...';
fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));

let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
en['creator.rejected'] = 'Rejected';
if (!en['creator.processing']) en['creator.processing'] = 'Processing...';
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('done updating status translations');

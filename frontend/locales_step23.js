const fs = require('fs');
const path = require('path');

const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');
let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

vi['creator.uploadCoverArt'] = 'Tải Lên Ảnh Bìa';
vi['creator.coverArtHelpText'] = 'Khuyên dùng 1920x1080, PNG hoặc JPG (Tối đa 5MB)';
vi['creator.almostDone'] = 'Sắp xong rồi!';
vi['creator.reviewGuidelinesDesc'] = 'Vui lòng xem lại nguyên tắc của nền tảng. Khi xuất bản, bạn đồng ý rằng trò chơi này không chứa mã độc và bạn có quyền phân phối nó.';
vi['creator.publishingSettings'] = 'Cài Đặt Xuất Bản';
vi['creator.visibility'] = 'Chế độ hiển thị';
vi['creator.makePublicDesc'] = 'Hiển thị công khai game này ngay lập tức';

en['creator.uploadCoverArt'] = 'Upload Cover Art';
en['creator.coverArtHelpText'] = '1920x1080 recommended, PNG or JPG (Max 5MB)';
en['creator.almostDone'] = 'Almost done!';
en['creator.reviewGuidelinesDesc'] = 'Please review the platform guidelines. By publishing, you agree that this game does not contain malicious code and you have the rights to distribute it.';
en['creator.publishingSettings'] = 'Publishing Settings';
en['creator.visibility'] = 'Visibility';
en['creator.makePublicDesc'] = 'Make this game public immediately';

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('done step 2 and 3');

const fs = require('fs');
const path = require('path');

const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');

let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

// vi translations
vi['creator.uploadNewGame'] = 'Tải Lên Game Mới';
vi['creator.uploadDesc'] = 'Chia sẻ sản phẩm của bạn với cộng đồng GameHub.';
vi['creator.step1'] = 'Cơ Bản';
vi['creator.step2'] = 'Tài Sản';
vi['creator.step3'] = 'Xem Lại';
vi['creator.step1Title'] = 'Thông Tin Cơ Bản';
vi['creator.step2Title'] = 'Tài Sản Game';
vi['creator.step3Title'] = 'Xem Lại & Xuất Bản';
vi['creator.step1Desc'] = 'Nhập thông tin chính cho game của bạn.';
vi['creator.step2Desc'] = 'Tải lên gói game HTML5 và tài nguyên quảng cáo của bạn.';
vi['creator.step3Desc'] = 'Kiểm tra mọi thông tin trước khi phát hành lên nền tảng.';
vi['creator.gameTitle'] = 'Tên Game';
vi['creator.gameTitlePlaceholder'] = 'VD: Neon District: Zero';
vi['creator.description'] = 'Mô Tả';
vi['creator.descPlaceholder'] = 'Mô tả ngắn gọn về game của bạn...';
vi['creator.category'] = 'Thể Loại';
vi['creator.tags'] = 'Từ khóa (cách nhau bằng dấu phẩy)';
vi['creator.catAction'] = 'Hành Động';
vi['creator.catPuzzle'] = 'Giải Đố';
vi['creator.catRPG'] = 'Nhập Vai';
vi['creator.catStrategy'] = 'Chiến Thuật';
vi['creator.continue'] = 'Tiếp Tục';
vi['creator.back'] = 'Quay Lại';
vi['creator.publishGame'] = 'Xuất Bản Game';
vi['creator.uploading'] = 'Đang Tải Lên...';

// en translations
en['creator.uploadNewGame'] = 'Upload New Game';
en['creator.uploadDesc'] = 'Share your creation with the GameHub community.';
en['creator.step1'] = 'Basic Info';
en['creator.step2'] = 'Assets';
en['creator.step3'] = 'Review';
en['creator.step1Title'] = 'Basic Information';
en['creator.step2Title'] = 'Game Assets';
en['creator.step3Title'] = 'Review & Publish';
en['creator.step1Desc'] = 'Enter the primary details for your game.';
en['creator.step2Desc'] = 'Upload your HTML5 game package and marketing assets.';
en['creator.step3Desc'] = 'Verify all details before publishing to the platform.';
en['creator.gameTitle'] = 'Game Title';
en['creator.gameTitlePlaceholder'] = 'e.g. Neon District: Zero';
en['creator.description'] = 'Description';
en['creator.descPlaceholder'] = 'Describe your game...';
en['creator.category'] = 'Category';
en['creator.tags'] = 'Tags (comma separated)';
en['creator.catAction'] = 'Action';
en['creator.catPuzzle'] = 'Puzzle';
en['creator.catRPG'] = 'RPG';
en['creator.catStrategy'] = 'Strategy';
en['creator.continue'] = 'Continue';
en['creator.back'] = 'Back';
en['creator.publishGame'] = 'Publish Game';
en['creator.uploading'] = 'Uploading...';

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('Locales updated!');

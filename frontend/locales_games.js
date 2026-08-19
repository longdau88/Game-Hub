const fs = require('fs');
const path = require('path');

const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');
let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

vi['creator.myGamesDesc'] = 'Quản lý danh mục game và theo dõi hiệu suất.';
vi['creator.searchGames'] = 'Tìm kiếm game...';
vi['creator.noGamesFound'] = 'Không tìm thấy game';
vi['creator.tryDifferentSearch'] = 'Thử một từ khóa tìm kiếm khác';
vi['creator.startByUploading'] = 'Bắt đầu xây dựng danh mục bằng cách tải lên game đầu tiên của bạn.';

en['creator.myGamesDesc'] = 'Manage your game portfolio and track performance.';
en['creator.searchGames'] = 'Search games...';
en['creator.noGamesFound'] = 'No games found';
en['creator.tryDifferentSearch'] = 'Try a different search term';
en['creator.startByUploading'] = 'Start building your portfolio by uploading your first game.';

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('done locales games');

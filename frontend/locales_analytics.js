const fs = require('fs');
const path = require('path');

const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');
let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

vi['creator.analyticsDesc'] = 'Phân tích sâu các chỉ số hiệu suất của game.';
vi['creator.activePlayers'] = 'Người Chơi Đang Trực Tuyến';
vi['creator.playTrends'] = 'Xu Hướng Chơi (7 Ngày)';
vi['creator.playTrendsDesc'] = 'Số lượt chơi hàng ngày trên danh mục của bạn';
vi['creator.revenueMetrics'] = 'Chỉ Số Doanh Thu';
vi['creator.revenueDesc'] = 'Ước tính doanh thu quảng cáo và tiền quyên góp';
vi['creator.settingsDesc'] = 'Quản lý hồ sơ và các tùy chọn nhà phát triển của bạn.';

en['creator.analyticsDesc'] = 'Deep dive into your games performance metrics.';
en['creator.activePlayers'] = 'Active Players';
en['creator.playTrends'] = 'Play Trends (7 Days)';
en['creator.playTrendsDesc'] = 'Daily play count across your portfolio';
en['creator.revenueMetrics'] = 'Revenue Metrics';
en['creator.revenueDesc'] = 'Estimated ad revenue and tips';
en['creator.settingsDesc'] = 'Manage your creator profile and preferences.';

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log('done locales');

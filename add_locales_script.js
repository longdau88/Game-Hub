const fs = require('fs');

const viPath = 'frontend/locales/vi.json';
const enPath = 'frontend/locales/en.json';

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newStrings = {
  "home.loadingMore": { vi: "Đang tải thêm game...", en: "Loading more games..." },
  "home.allLoaded": { vi: "Bạn đã xem hết tất cả game 🎮", en: "You have seen all games 🎮" },
  "home.seeAll": { vi: "Xem tất cả", en: "See all" },
  "home.trendingDesc": { vi: "{count} game đang hot nhất", en: "{count} trending games" },
  "home.newDesc": { vi: "{count} game mới nhất", en: "{count} newest games" },
  "home.noGames": { vi: "Chưa có game nào", en: "No games yet" },
  
  "game.reportTitle": { vi: "Báo cáo Trò chơi (Report/DMCA)", en: "Report Game (DMCA)" },
  "game.reportDesc": { vi: "Vui lòng mô tả vấn đề (ví dụ: lỗi game, nội dung độc hại, hoặc vi phạm bản quyền/DMCA). Chúng tôi sẽ xem xét và gỡ bỏ nếu có vi phạm.", en: "Please describe the issue (e.g. game error, malicious content, or copyright violation/DMCA). We will review and remove if violated." },
  
  "upload.errorNoCategory": { vi: "Vui lòng chọn ít nhất một thể loại.", en: "Please select at least one category." },
  "upload.copyrightWarning": { vi: "Mọi hành vi vi phạm bản quyền sẽ dẫn đến việc trò chơi bị gỡ bỏ và tài khoản có thể bị khóa vĩnh viễn theo Điều khoản Dịch vụ.", en: "Any copyright infringement will result in the game being removed and the account may be permanently banned according to the Terms of Service." },
  
  "admin.analytics.noDataSelected": { vi: "Chưa có dữ liệu trong khoảng thời gian đã chọn.", en: "No data available in the selected time range." },
  "admin.analytics.loadError": { vi: "Không thể tải dữ liệu thống kê.", en: "Failed to load statistics data." },
  "admin.analytics.subtitle": { vi: "Hiệu suất game và chất lượng trải nghiệm.", en: "Game performance and experience quality." },
  "admin.analytics.time7d": { vi: "7 ngày qua", en: "Last 7 days" },
  "admin.analytics.time30d": { vi: "30 ngày qua", en: "Last 30 days" },
  "admin.analytics.time90d": { vi: "90 ngày qua", en: "Last 90 days" },
  "admin.analytics.allGames": { vi: "Tất cả game", en: "All games" },
  "admin.analytics.trendTitle": { vi: "Xu hướng sessions & người chơi", en: "Sessions & players trend" },
  "admin.analytics.topGamesTitle": { vi: "Top game theo lượt chơi", en: "Top games by plays" },
  "admin.analytics.colGame": { vi: "Game", en: "Game" },
  "admin.analytics.colSessions": { vi: "Sessions", en: "Sessions" },
  "admin.analytics.colPlayers": { vi: "Người chơi", en: "Players" },
  "admin.analytics.colAvgSession": { vi: "TB chơi", en: "Avg Play" },
  "admin.analytics.colRating": { vi: "Đánh giá", en: "Rating" },
  "admin.analytics.colFavorites": { vi: "Yêu thích", en: "Favorites" },
  "admin.analytics.qualityTitle": { vi: "Chất lượng game", en: "Game quality" },
  "admin.analytics.crashRate": { vi: "Crash rate", en: "Crash rate" },
  "admin.analytics.crashDetail": { vi: "{crashes} lỗi trên {sessions} sessions", en: "{crashes} crashes out of {sessions} sessions" },
  "admin.analytics.retention": { vi: "Retention", en: "Retention" },
  "admin.analytics.crashByGame": { vi: "Crash theo game", en: "Crashes by game" }
};

for (const [key, value] of Object.entries(newStrings)) {
  vi[key] = value.vi;
  en[key] = value.en;
}

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log("Updated locale files!");

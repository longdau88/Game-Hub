const fs = require('fs');
const path = require('path');

const file = path.join('frontend', 'app', '(creator)', 'creator', 'dashboard', 'page.tsx');
let content = fs.readFileSync(file, 'utf8');

// Add href to stats
content = content.replace(/color: "text-blue-500" }/g, 'color: "text-blue-500", href: "/creator/analytics" }');
content = content.replace(/color: "text-indigo-500" }/g, 'color: "text-indigo-500", href: "/creator/games" }');
content = content.replace(/color: "text-emerald-500" }/g, 'color: "text-emerald-500", href: "/creator/monetization" }');
content = content.replace(/color: "text-amber-500" }/g, 'color: "text-amber-500", href: "/creator/analytics" }');

// Wrap Card with Link
content = content.replace(/<Card key=\{idx\} className="bg-surface\/50 border-border">/g, '<Link key={idx} href={stat.href || "#"}>\n              <Card className="bg-surface/50 border-border hover:border-primary/50 transition-colors cursor-pointer h-full">');
content = content.replace(/<\/Card>\n            \)\)/g, '<\/Card>\n            <\/Link>\n          ))');

// Translate texts
content = content.replace(/Revenue & Plays \(Last 30 Days\)/g, '{t("creator.revenuePlays") || "Revenue & Plays (Last 30 Days)"}');
content = content.replace(/Performance metrics across all your published games\./g, '{t("creator.revenuePlaysDesc") || "Performance metrics across all your published games."}');
content = content.replace(/Not enough data to display chart\./g, '{t("creator.noChartData") || "Not enough data to display chart."}');
content = content.replace(/<CardTitle>Recent Games<\/CardTitle>/g, '<CardTitle>{t("creator.recentGames") || "Recent Games"}</CardTitle>');
content = content.replace(/Status of your latest uploads/g, '{t("creator.recentGamesDesc") || "Status of your latest uploads"}');
content = content.replace(/>View All<\/Button>/g, '>{t("creator.viewAll") || "View All"}</Button>');
content = content.replace(/\{game\.plays\} plays/g, '{game.plays} {t("creator.plays") || "plays"}');
content = content.replace(/Upload New Game\n              <\/Button>/g, '{t("creator.uploadNewGame") || "Upload New Game"}\n              </Button>');

fs.writeFileSync(file, content);

// Locales
const viPath = path.join('frontend', 'locales', 'vi.json');
const enPath = path.join('frontend', 'locales', 'en.json');
let vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
let en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

vi['creator.revenuePlays'] = 'Doanh Thu & Lượt Chơi (30 Ngày Qua)';
vi['creator.revenuePlaysDesc'] = 'Chỉ số hiệu suất trên tất cả các game đã phát hành của bạn.';
vi['creator.noChartData'] = 'Không đủ dữ liệu để hiển thị biểu đồ.';
vi['creator.recentGames'] = 'Game Gần Đây';
vi['creator.recentGamesDesc'] = 'Trạng thái của các bản tải lên mới nhất';
vi['creator.viewAll'] = 'Xem Tất Cả';
vi['creator.plays'] = 'lượt chơi';

en['creator.revenuePlays'] = 'Revenue & Plays (Last 30 Days)';
en['creator.revenuePlaysDesc'] = 'Performance metrics across all your published games.';
en['creator.noChartData'] = 'Not enough data to display chart.';
en['creator.recentGames'] = 'Recent Games';
en['creator.recentGamesDesc'] = 'Status of your latest uploads';
en['creator.viewAll'] = 'View All';
en['creator.plays'] = 'plays';

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));

console.log('done');

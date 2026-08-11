const fs = require('fs');
const pagePath = 'frontend/app/admin/page.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

const replacements = [
  // Sidebar
  ["Game Đã Duyệt", "{t(\"admin.tabGamesPublished\")}"],
  ["Game Chờ Duyệt", "{t(\"admin.tabGamesPending\")}"],
  ["Quản lý Báo cáo", "{t(\"admin.tabReports\")}"],
  ["Cấu hình Hệ thống", "{t(\"admin.tabSettings\")}"],
  ["Lưu trữ & Băng thông", "{t(\"admin.tabStorage\")}"],
  ["Analytics & Crashes", "{t(\"admin.tabAnalytics\")}"],
  ["Mail Campaigns", "{t(\"admin.tabMail\")}"],

  // Reports
  ["<h3 className=\"font-semibold mb-4\">Quản lý Báo cáo</h3>", "<h3 className=\"font-semibold mb-4\">{t(\"admin.reportsTitle\")}</h3>"],
  ["<p className=\"text-sm text-zinc-500\">Chưa có báo cáo nào.</p>", "<p className=\"text-sm text-zinc-500\">{t(\"admin.reportsEmpty\")}</p>"],
  ["<th className=\"text-left font-medium text-zinc-400 pb-3\">Người dùng</th>", "<th className=\"text-left font-medium text-zinc-400 pb-3\">{t(\"admin.reportsUser\")}</th>"],
  ["<th className=\"text-left font-medium text-zinc-400 pb-3\">Game</th>", "<th className=\"text-left font-medium text-zinc-400 pb-3\">{t(\"admin.reportsGame\")}</th>"],
  ["<th className=\"text-left font-medium text-zinc-400 pb-3\">Lý do</th>", "<th className=\"text-left font-medium text-zinc-400 pb-3\">{t(\"admin.reportsReason\")}</th>"],
  ["<th className=\"text-left font-medium text-zinc-400 pb-3\">Trạng thái</th>", "<th className=\"text-left font-medium text-zinc-400 pb-3\">{t(\"admin.reportsStatus\")}</th>"],
  ["Đã xử lý", "{t(\"admin.reportsResolved\")}"],
  ["Chờ xử lý", "{t(\"admin.reportsPending\")}"],
  ["Giải quyết", "{t(\"admin.reportsBtnResolve\")}"],

  // Settings
  ["<h3 className=\"font-semibold mb-4 text-xl\">Cấu hình Hệ thống</h3>", "<h3 className=\"font-semibold mb-4 text-xl\">{t(\"admin.settingsTitle\")}</h3>"],
  ["<label className=\"font-medium\">Kích hoạt bảo trì</label>", "<label className=\"font-medium\">{t(\"admin.settingsMaintenance\")}</label>"],
  ["<p className=\"text-sm text-zinc-400\">Người dùng sẽ không thể truy cập hệ thống.</p>", "<p className=\"text-sm text-zinc-400\">{t(\"admin.settingsMaintenanceDesc\")}</p>"],
  ["<label className=\"font-medium\">Kích hoạt đăng ký</label>", "<label className=\"font-medium\">{t(\"admin.settingsRegistration\")}</label>"],
  ["<p className=\"text-sm text-zinc-400\">Cho phép người dùng mới tạo tài khoản.</p>", "<p className=\"text-sm text-zinc-400\">{t(\"admin.settingsRegistrationDesc\")}</p>"],
  ["<label className=\"font-medium block mb-2\">Dung lượng upload tối đa (MB)</label>", "<label className=\"font-medium block mb-2\">{t(\"admin.settingsUploadLimit\")}</label>"],
  ["<p className=\"text-sm text-zinc-400 mt-2\">Dung lượng tối đa cho phép mỗi người dùng upload 1 file zip game.</p>", "<p className=\"text-sm text-zinc-400 mt-2\">{t(\"admin.settingsUploadLimitDesc\")}</p>"],
  ["Lưu Cấu Hình", "{t(\"admin.settingsSave\")}"],

  // Storage
  ["<h3 className=\"font-semibold mb-4 text-xl\">Quản lý Lưu trữ & Băng thông</h3>", "<h3 className=\"font-semibold mb-4 text-xl\">{t(\"admin.storageTitle\")}</h3>"],
  ["<p className=\"text-sm text-zinc-400 mb-1\">Đã sử dụng</p>", "<p className=\"text-sm text-zinc-400 mb-1\">{t(\"admin.storageUsed\")}</p>"],
  ["<h4 className=\"font-semibold mb-2\">Dọn dẹp rác (Garbage Collection)</h4>", "<h4 className=\"font-semibold mb-2\">{t(\"admin.storageGC\")}</h4>"],
  ["<p className=\"text-sm text-zinc-400 mb-4\">Xóa các file zip tạm trong quá trình upload bị lỗi hoặc các tài nguyên rác.</p>", "<p className=\"text-sm text-zinc-400 mb-4\">{t(\"admin.storageGCDesc\")}</p>"],
  ["Chạy Dọn Dẹp Ngay", "{t(\"admin.storageGCBtn\")}"],

  // Analytics
  ["<h3 className=\"font-semibold mb-4 text-xl\">Thống kê & Trải nghiệm (Analytics)</h3>", "<h3 className=\"font-semibold mb-4 text-xl\">{t(\"admin.analyticsTitle\")}</h3>"],
  ["<h4 className=\"font-semibold mb-4\">Thời lượng chơi trung bình (Top 20)</h4>", "<h4 className=\"font-semibold mb-4\">{t(\"admin.analyticsAvgSession\")}</h4>"],
  ["<th className=\"text-left text-zinc-400 font-medium pb-2\">Trung bình (giây)</th>", "<th className=\"text-left text-zinc-400 font-medium pb-2\">{t(\"admin.analyticsAvgSeconds\")}</th>"],
  ["<th className=\"text-left text-zinc-400 font-medium pb-2\">Tổng số lượt (sessions)</th>", "<th className=\"text-left text-zinc-400 font-medium pb-2\">{t(\"admin.analyticsTotalSessions\")}</th>"],
  ["<p className=\"text-sm text-zinc-500\">Chưa có dữ liệu session.</p>", "<p className=\"text-sm text-zinc-500\">{t(\"admin.analyticsNoSessions\")}</p>"],
  ["<h4 className=\"font-semibold mb-4\">Lịch sử lỗi gần đây (Crash Logs)</h4>", "<h4 className=\"font-semibold mb-4\">{t(\"admin.analyticsCrashLogs\")}</h4>"],
  ["<th className=\"text-left text-zinc-400 font-medium pb-2\">Thời gian</th>", "<th className=\"text-left text-zinc-400 font-medium pb-2\">{t(\"admin.analyticsTime\")}</th>"],
  ["<th className=\"text-left text-zinc-400 font-medium pb-2\">Lỗi</th>", "<th className=\"text-left text-zinc-400 font-medium pb-2\">{t(\"admin.analyticsError\")}</th>"],
  ["<th className=\"text-left text-zinc-400 font-medium pb-2\">Trình duyệt</th>", "<th className=\"text-left text-zinc-400 font-medium pb-2\">{t(\"admin.analyticsBrowser\")}</th>"],
  ["<p className=\"text-sm text-zinc-500\">Chưa có log lỗi nào.</p>", "<p className=\"text-sm text-zinc-500\">{t(\"admin.analyticsNoCrashes\")}</p>"],

  // Mail
  ["<h3 className=\"font-semibold mb-4 text-xl\">Quản lý Chiến dịch Email</h3>", "<h3 className=\"font-semibold mb-4 text-xl\">{t(\"admin.mailTitle\")}</h3>"],
  ["<h4 className=\"font-semibold mb-4\">Tạo Chiến dịch Mới</h4>", "<h4 className=\"font-semibold mb-4\">{t(\"admin.mailCreate\")}</h4>"],
  ["<label className=\"block text-sm font-medium mb-1\">Người nhận</label>", "<label className=\"block text-sm font-medium mb-1\">{t(\"admin.mailRecipients\")}</label>"],
  ["<option value=\"all\">Tất cả người dùng</option>", "<option value=\"all\">{t(\"admin.mailAllUsers\")}</option>"],
  ["<option value=\"active\">Người dùng Active (đã login trong 30 ngày)</option>", "<option value=\"active\">{t(\"admin.mailActiveUsers\")}</option>"],
  ["<label className=\"block text-sm font-medium mb-1\">Tiêu đề Email</label>", "<label className=\"block text-sm font-medium mb-1\">{t(\"admin.mailSubject\")}</label>"],
  ["<label className=\"block text-sm font-medium mb-1\">Nội dung (HTML/Text)</label>", "<label className=\"block text-sm font-medium mb-1\">{t(\"admin.mailContent\")}</label>"],
  ["Gửi Chiến Dịch", "{t(\"admin.mailSend\")}"],
  ["<h4 className=\"font-semibold mb-4\">Lịch sử Chiến dịch</h4>", "<h4 className=\"font-semibold mb-4\">{t(\"admin.mailHistory\")}</h4>"],
  ["<th className=\"text-left text-zinc-400 font-medium pb-2\">Tiêu đề</th>", "<th className=\"text-left text-zinc-400 font-medium pb-2\">{t(\"admin.mailSubjectHeader\")}</th>"],
  ["<th className=\"text-left text-zinc-400 font-medium pb-2\">Đối tượng</th>", "<th className=\"text-left text-zinc-400 font-medium pb-2\">{t(\"admin.mailTargetHeader\")}</th>"],
  ["<th className=\"text-left text-zinc-400 font-medium pb-2\">Đã gửi</th>", "<th className=\"text-left text-zinc-400 font-medium pb-2\">{t(\"admin.mailSentHeader\")}</th>"],
  ["<th className=\"text-left text-zinc-400 font-medium pb-2\">Ngày tạo</th>", "<th className=\"text-left text-zinc-400 font-medium pb-2\">{t(\"admin.mailDateHeader\")}</th>"],
  ["<p className=\"text-sm text-zinc-500\">Chưa có chiến dịch nào.</p>", "<p className=\"text-sm text-zinc-500\">{t(\"admin.mailNoHistory\")}</p>"],

  // Advanced Modal
  ["Cài Đặt Nâng Cao: {advGame?.title}", "{t(\"admin.advTitle\")}: {advGame?.title}"],
  ["<h4 className=\"font-semibold mb-2\">AI & Tìm Kiếm</h4>", "<h4 className=\"font-semibold mb-2\">{t(\"admin.advAISearch\")}</h4>"],
  ["<label className=\"block text-sm text-zinc-400 mb-1\">Hidden Tags (Từ khóa ẩn)</label>", "<label className=\"block text-sm text-zinc-400 mb-1\">{t(\"admin.advHiddenTags\")}</label>"],
  ["<p className=\"text-xs text-zinc-500 mt-1\">Các từ khóa này sẽ không hiển thị ra ngoài nhưng giúp AI (Vector DB) phân loại và gợi ý game này tốt hơn.</p>", "<p className=\"text-xs text-zinc-500 mt-1\">{t(\"admin.advHiddenTagsDesc\")}</p>"],
  ["Lưu Tags", "{t(\"admin.advSaveTags\")}"],
  ["<p className=\"font-medium\">Đồng bộ Vector DB (Mock)</p>", "<p className=\"font-medium\">{t(\"admin.advSyncVector\")}</p>"],
  ["<p className=\"text-xs text-zinc-400\">Đẩy lại dữ liệu của game này vào Vector DB để cập nhật gợi ý.</p>", "<p className=\"text-xs text-zinc-400\">{t(\"admin.advSyncVectorDesc\")}</p>"],
  ["Đồng bộ", "{t(\"admin.advSyncBtn\")}"],
  ["<h4 className=\"font-semibold mb-2\">Version Control</h4>", "<h4 className=\"font-semibold mb-2\">{t(\"admin.advVersionControl\")}</h4>"],
  ["<p className=\"text-sm text-zinc-400 mb-2\">Danh sách các phiên bản (Bản cập nhật)</p>", "<p className=\"text-sm text-zinc-400 mb-2\">{t(\"admin.advVersionsList\")}</p>"],
  ["<th className=\"text-left text-zinc-400 text-sm pb-2\">ID</th>", "<th className=\"text-left text-zinc-400 text-sm pb-2\">{t(\"admin.advVersionID\")}</th>"],
  ["<th className=\"text-left text-zinc-400 text-sm pb-2\">Link R2</th>", "<th className=\"text-left text-zinc-400 text-sm pb-2\">{t(\"admin.advVersionLink\")}</th>"],
  ["<th className=\"text-left text-zinc-400 text-sm pb-2\">Hành động</th>", "<th className=\"text-left text-zinc-400 text-sm pb-2\">{t(\"admin.advVersionAction\")}</th>"],
  ["<td colSpan={4} className=\"py-2 text-sm text-zinc-500 text-center\">Chưa có phiên bản nào.</td>", "<td colSpan={4} className=\"py-2 text-sm text-zinc-500 text-center\">{t(\"admin.advNoVersions\")}</td>"],
  ["Rollback", "{t(\"admin.advRollbackBtn\")}"],

  // Confirm texts inside javascript
  ["confirm('Chạy dọn dẹp hệ thống?')", "confirm(t('admin.advConfirmGC'))"],
  ["confirm(\"Chắc chắn rollback về phiên bản này?\")", "confirm(t(\"admin.advConfirmRollback\"))"],

  // Edit category modal
  ["<h3 className=\"text-xl font-bold mb-4\">Edit Category</h3>", "<h3 className=\"text-xl font-bold mb-4\">{t(\"admin.catEditTitle\")}</h3>"],
  ["<label className=\"block text-sm font-medium mb-1 text-zinc-400\">Name</label>", "<label className=\"block text-sm font-medium mb-1 text-zinc-400\">{t(\"admin.catEditName\")}</label>"],
  ["<label className=\"block text-sm font-medium mb-1 text-zinc-400\">Slug</label>", "<label className=\"block text-sm font-medium mb-1 text-zinc-400\">{t(\"admin.catEditSlug\")}</label>"],
];

for (const [find, replace] of replacements) {
  content = content.replace(find, replace);
}

fs.writeFileSync(pagePath, content);
console.log('Replaced all hardcoded strings!');

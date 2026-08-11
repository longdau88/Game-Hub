const fs = require('fs');

const viPath = 'frontend/locales/vi.json';
const enPath = 'frontend/locales/en.json';

const vi = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));

const newStrings = {
  "admin.tabGamesPublished": { vi: "Game Đã Duyệt", en: "Published Games" },
  "admin.tabGamesPending": { vi: "Game Chờ Duyệt", en: "Pending Games" },
  "admin.tabReports": { vi: "Quản lý Báo cáo", en: "Reports" },
  "admin.tabSettings": { vi: "Cấu hình Hệ thống", en: "System Settings" },
  "admin.tabStorage": { vi: "Lưu trữ & Băng thông", en: "Storage & Bandwidth" },
  "admin.tabAnalytics": { vi: "Analytics & Crashes", en: "Analytics & Crashes" },
  "admin.tabMail": { vi: "Mail Campaigns", en: "Mail Campaigns" },
  
  "admin.reportsTitle": { vi: "Quản lý Báo cáo", en: "Manage Reports" },
  "admin.reportsEmpty": { vi: "Chưa có báo cáo nào.", en: "No reports yet." },
  "admin.reportsUser": { vi: "Người dùng", en: "User" },
  "admin.reportsGame": { vi: "Game", en: "Game" },
  "admin.reportsReason": { vi: "Lý do", en: "Reason" },
  "admin.reportsStatus": { vi: "Trạng thái", en: "Status" },
  "admin.reportsResolved": { vi: "Đã xử lý", en: "Resolved" },
  "admin.reportsPending": { vi: "Chờ xử lý", en: "Pending" },
  "admin.reportsBtnResolve": { vi: "Giải quyết", en: "Resolve" },

  "admin.settingsTitle": { vi: "Cấu hình Hệ thống", en: "System Settings" },
  "admin.settingsMaintenance": { vi: "Kích hoạt bảo trì", en: "Enable Maintenance Mode" },
  "admin.settingsMaintenanceDesc": { vi: "Người dùng sẽ không thể truy cập hệ thống.", en: "Users will not be able to access the system." },
  "admin.settingsRegistration": { vi: "Kích hoạt đăng ký", en: "Enable Registration" },
  "admin.settingsRegistrationDesc": { vi: "Cho phép người dùng mới tạo tài khoản.", en: "Allow new users to create accounts." },
  "admin.settingsUploadLimit": { vi: "Dung lượng upload tối đa (MB)", en: "Max Upload Size (MB)" },
  "admin.settingsUploadLimitDesc": { vi: "Dung lượng tối đa cho phép mỗi người dùng upload 1 file zip game.", en: "Max size allowed for a game zip upload." },
  "admin.settingsSave": { vi: "Lưu Cấu Hình", en: "Save Settings" },
  
  "admin.storageTitle": { vi: "Quản lý Lưu trữ & Băng thông", en: "Storage & Bandwidth Management" },
  "admin.storageUsed": { vi: "Đã sử dụng", en: "Used" },
  "admin.storageGC": { vi: "Dọn dẹp rác (Garbage Collection)", en: "Garbage Collection" },
  "admin.storageGCDesc": { vi: "Xóa các file zip tạm trong quá trình upload bị lỗi hoặc các tài nguyên rác.", en: "Delete temporary zip files from failed uploads and other garbage resources." },
  "admin.storageGCBtn": { vi: "Chạy Dọn Dẹp Ngay", en: "Run Cleanup Now" },
  
  "admin.analyticsTitle": { vi: "Thống kê & Trải nghiệm (Analytics)", en: "Analytics & Experience" },
  "admin.analyticsAvgSession": { vi: "Thời lượng chơi trung bình (Top 20)", en: "Average Session Length (Top 20)" },
  "admin.analyticsAvgSeconds": { vi: "Trung bình (giây)", en: "Average (seconds)" },
  "admin.analyticsTotalSessions": { vi: "Tổng số lượt (sessions)", en: "Total Sessions" },
  "admin.analyticsNoSessions": { vi: "Chưa có dữ liệu session.", en: "No session data yet." },
  "admin.analyticsCrashLogs": { vi: "Lịch sử lỗi gần đây (Crash Logs)", en: "Recent Crash Logs" },
  "admin.analyticsTime": { vi: "Thời gian", en: "Time" },
  "admin.analyticsError": { vi: "Lỗi", en: "Error" },
  "admin.analyticsBrowser": { vi: "Trình duyệt", en: "Browser" },
  "admin.analyticsNoCrashes": { vi: "Chưa có log lỗi nào.", en: "No crash logs yet." },
  
  "admin.mailTitle": { vi: "Quản lý Chiến dịch Email", en: "Email Campaigns Management" },
  "admin.mailCreate": { vi: "Tạo Chiến dịch Mới", en: "Create New Campaign" },
  "admin.mailRecipients": { vi: "Người nhận", en: "Recipients" },
  "admin.mailAllUsers": { vi: "Tất cả người dùng", en: "All Users" },
  "admin.mailActiveUsers": { vi: "Người dùng Active (đã login trong 30 ngày)", en: "Active Users (logged in within 30 days)" },
  "admin.mailSubject": { vi: "Tiêu đề Email", en: "Email Subject" },
  "admin.mailContent": { vi: "Nội dung (HTML/Text)", en: "Content (HTML/Text)" },
  "admin.mailSend": { vi: "Gửi Chiến Dịch", en: "Send Campaign" },
  "admin.mailHistory": { vi: "Lịch sử Chiến dịch", en: "Campaign History" },
  "admin.mailSubjectHeader": { vi: "Tiêu đề", en: "Subject" },
  "admin.mailTargetHeader": { vi: "Đối tượng", en: "Target" },
  "admin.mailSentHeader": { vi: "Đã gửi", en: "Sent Count" },
  "admin.mailDateHeader": { vi: "Ngày tạo", en: "Created At" },
  "admin.mailNoHistory": { vi: "Chưa có chiến dịch nào.", en: "No campaigns yet." },
  
  "admin.advTitle": { vi: "Cài Đặt Nâng Cao", en: "Advanced Settings" },
  "admin.advAISearch": { vi: "AI & Tìm Kiếm", en: "AI & Search" },
  "admin.advHiddenTags": { vi: "Hidden Tags (Từ khóa ẩn)", en: "Hidden Tags" },
  "admin.advHiddenTagsDesc": { vi: "Các từ khóa này sẽ không hiển thị ra ngoài nhưng giúp AI (Vector DB) phân loại và gợi ý game này tốt hơn.", en: "These tags will not be visible publicly but will help AI (Vector DB) classify and recommend this game better." },
  "admin.advSaveTags": { vi: "Lưu Tags", en: "Save Tags" },
  "admin.advSyncVector": { vi: "Đồng bộ Vector DB (Mock)", en: "Sync Vector DB (Mock)" },
  "admin.advSyncVectorDesc": { vi: "Đẩy lại dữ liệu của game này vào Vector DB để cập nhật gợi ý.", en: "Push this game's data to Vector DB to update recommendations." },
  "admin.advSyncBtn": { vi: "Đồng bộ", en: "Sync" },
  "admin.advVersionControl": { vi: "Version Control", en: "Version Control" },
  "admin.advVersionsList": { vi: "Danh sách các phiên bản (Bản cập nhật)", en: "List of versions (Updates)" },
  "admin.advVersionID": { vi: "ID", en: "ID" },
  "admin.advVersionLink": { vi: "Link R2", en: "R2 Link" },
  "admin.advVersionAction": { vi: "Hành động", en: "Action" },
  "admin.advNoVersions": { vi: "Chưa có phiên bản nào.", en: "No versions yet." },
  "admin.advRollbackBtn": { vi: "Rollback", en: "Rollback" },
  "admin.advConfirmRollback": { vi: "Chắc chắn rollback về phiên bản này?", en: "Are you sure you want to rollback to this version?" },
  "admin.advConfirmGC": { vi: "Chạy dọn dẹp hệ thống?", en: "Run system cleanup?" },
  
  "admin.catEditTitle": { vi: "Chỉnh sửa Thể loại", en: "Edit Category" },
  "admin.catEditName": { vi: "Tên", en: "Name" },
  "admin.catEditSlug": { vi: "Đường dẫn (Slug)", en: "Slug" }
};

for (const [key, langs] of Object.entries(newStrings)) {
  vi[key] = langs.vi;
  en[key] = langs.en;
}

fs.writeFileSync(viPath, JSON.stringify(vi, null, 2));
fs.writeFileSync(enPath, JSON.stringify(en, null, 2));
console.log("Locales updated!");

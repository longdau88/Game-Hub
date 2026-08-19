const fs = require('fs');
const path = require('path');

const translations = {
  vi: {
    "admin.audit.actions.BAN_USER": "Cấm người dùng",
    "admin.audit.actions.UNBAN_USER": "Bỏ cấm người dùng",
    "admin.audit.actions.CHANGE_USER_ROLE": "Đổi quyền người dùng",
    "admin.audit.actions.CREATE_USER": "Tạo người dùng mới",
    "admin.audit.actions.UPDATE_USER": "Cập nhật người dùng",
    "admin.audit.actions.SEND_EMAIL_USER": "Gửi Email",
    "admin.audit.actions.REJECT_GAME": "Từ chối Game",
    "admin.audit.actions.DELETE_GAME": "Xóa Game",
    "admin.audit.actions.FEATURE_GAME": "Đánh dấu nổi bật",
    "admin.audit.actions.UNFEATURE_GAME": "Hủy nổi bật",
    "admin.audit.actions.RUN_GC": "Dọn rác hệ thống (GC)",
    "admin.audit.actions.SYNC_VECTOR_DATABASE": "Đồng bộ Vector DB",
    "admin.audit.actions.APPROVE_GAME": "Duyệt Game",
    "admin.audit.actions.CREATE_CATEGORY": "Tạo danh mục",
    "admin.audit.actions.UPDATE_CATEGORY": "Sửa danh mục",
    "admin.audit.actions.DELETE_CATEGORY": "Xóa danh mục",
    "admin.audit.actions.UPDATE_SYSTEM_SETTINGS": "Cập nhật cấu hình",
    "admin.audit.actions.RESOLVE_REPORT": "Xử lý báo cáo",
    "admin.audit.actions.CREATE_BADGE": "Tạo danh hiệu",
    "admin.audit.actions.DELETE_BADGE": "Xóa danh hiệu",
    "admin.audit.actions.GRANT_BADGE": "Tặng danh hiệu",
    "admin.audit.actions.CREATE_EMAIL_TEMPLATE": "Tạo mẫu Email"
  },
  en: {
    "admin.audit.actions.BAN_USER": "Ban User",
    "admin.audit.actions.UNBAN_USER": "Unban User",
    "admin.audit.actions.CHANGE_USER_ROLE": "Change Role",
    "admin.audit.actions.CREATE_USER": "Create User",
    "admin.audit.actions.UPDATE_USER": "Update User",
    "admin.audit.actions.SEND_EMAIL_USER": "Send Email",
    "admin.audit.actions.REJECT_GAME": "Reject Game",
    "admin.audit.actions.DELETE_GAME": "Delete Game",
    "admin.audit.actions.FEATURE_GAME": "Feature Game",
    "admin.audit.actions.UNFEATURE_GAME": "Unfeature Game",
    "admin.audit.actions.RUN_GC": "Run Garbage Collection",
    "admin.audit.actions.SYNC_VECTOR_DATABASE": "Sync Vector DB",
    "admin.audit.actions.APPROVE_GAME": "Approve Game",
    "admin.audit.actions.CREATE_CATEGORY": "Create Category",
    "admin.audit.actions.UPDATE_CATEGORY": "Update Category",
    "admin.audit.actions.DELETE_CATEGORY": "Delete Category",
    "admin.audit.actions.UPDATE_SYSTEM_SETTINGS": "Update System Config",
    "admin.audit.actions.RESOLVE_REPORT": "Resolve Report",
    "admin.audit.actions.CREATE_BADGE": "Create Badge",
    "admin.audit.actions.DELETE_BADGE": "Delete Badge",
    "admin.audit.actions.GRANT_BADGE": "Grant Badge",
    "admin.audit.actions.CREATE_EMAIL_TEMPLATE": "Create Email Template"
  }
};

['vi', 'en'].forEach(lang => {
  const p = path.join('frontend', 'locales', `${lang}.json`);
  let content = JSON.parse(fs.readFileSync(p, 'utf8'));
  Object.assign(content, translations[lang]);
  fs.writeFileSync(p, JSON.stringify(content, null, 2));
});
console.log("Audit action translations injected.");

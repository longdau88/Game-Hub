const fs = require('fs');
const path = require('path');

const locales = ['vi', 'en'];
const translations = {
  vi: {
    "creator.profileSettings": "Hồ Sơ Creator",
    "creator.security": "Bảo Mật",
    "creator.username": "Tên Hiển Thị",
    "creator.email": "Email",
    "creator.bio": "Tiểu Sử",
    "creator.avatarUrl": "URL Ảnh Đại Diện",
    "creator.changePassword": "Đổi Mật Khẩu",
    "creator.currentPassword": "Mật khẩu hiện tại",
    "creator.newPassword": "Mật khẩu mới",
    "creator.confirmPassword": "Xác nhận mật khẩu mới",
    "creator.saveChanges": "Lưu Thay Đổi",
    "creator.passwordMismatch": "Mật khẩu xác nhận không khớp",
    "creator.profileUpdated": "Đã cập nhật hồ sơ thành công",
    "creator.passwordUpdated": "Đã đổi mật khẩu thành công"
  },
  en: {
    "creator.profileSettings": "Creator Profile",
    "creator.security": "Security",
    "creator.username": "Display Name",
    "creator.email": "Email",
    "creator.bio": "Bio",
    "creator.avatarUrl": "Avatar URL",
    "creator.changePassword": "Change Password",
    "creator.currentPassword": "Current Password",
    "creator.newPassword": "New Password",
    "creator.confirmPassword": "Confirm New Password",
    "creator.saveChanges": "Save Changes",
    "creator.passwordMismatch": "Passwords do not match",
    "creator.profileUpdated": "Profile updated successfully",
    "creator.passwordUpdated": "Password changed successfully"
  }
};

locales.forEach(lang => {
  const p = path.join('frontend', 'locales', `${lang}.json`);
  let content = JSON.parse(fs.readFileSync(p, 'utf8'));
  Object.assign(content, translations[lang]);
  fs.writeFileSync(p, JSON.stringify(content, null, 2));
});
console.log("Translations added.");

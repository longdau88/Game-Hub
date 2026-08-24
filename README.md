# Game Hub - Nền tảng Chơi Game Web

Game Hub là một nền tảng phân phối game web tương tự như Steam, được thiết kế chuyên biệt cho các web game HTML5. Người dùng có thể đóng gói game dưới dạng file `.zip` để upload. Hệ thống sẽ tự động giải nén và lưu trữ trên Cloudflare R2, sau đó cho phép người chơi trải nghiệm trực tiếp trên trình duyệt thông qua giao diện Storefront hiện đại.

## Tính Năng Nổi Bật
- **Frontend**: Xây dựng bằng Next.js 15, Tailwind CSS, Lucide Icons (Được export tĩnh).
- **Backend**: Node.js, Express.js (Phục vụ API và host luôn cả file tĩnh của Frontend).
- **Cơ sở dữ liệu**: PostgreSQL (kết nối qua Prisma ORM).
- **Lưu trữ (Storage)**: Tích hợp Cloudflare R2 Object Storage để lưu game.
- **Xác thực (Authentication)**: Đăng nhập bằng JWT (JSON Web Tokens) qua Cookie bảo mật, mã hóa mật khẩu bằng bcrypt.
- **Phân quyền (Authorization)**: Phân chia Role rõ ràng (Admin / User thường).
- **Hệ thống Nhiệm vụ (Gamification)**: Hỗ trợ tạo các nhiệm vụ (Quests) với 4 mốc thời gian: Hàng ngày (Daily), Hàng tuần (Weekly), Hàng tháng (Monthly), và Trọn đời (Lifetime) cho phép người chơi cày cuốc để kiếm điểm/phần thưởng.
- **Xác minh Email**: Tự động gửi email kích hoạt tài khoản qua Nodemailer / Resend.

## Cấu Trúc Dự Án (Monolith)
Để tối ưu hóa việc triển khai (deploy), toàn bộ Frontend (Next.js) đã được thiết lập để **build ra file tĩnh** (`out/`) và được host chung trên cùng một port của **Backend Express**.
- `/frontend`: Chứa mã nguồn giao diện (React/Next.js).
- `/backend`: Chứa mã nguồn Server (Node.js/Express) và CSDL Prisma. Đảm nhận cả việc cung cấp API và trả về giao diện người dùng.

## Hướng Dẫn Cài Đặt (Local Development)

### 1. Cấu hình Biến Môi Trường (Environment Variables)
Đảm bảo bạn đã có sẵn một cơ sở dữ liệu PostgreSQL (ví dụ: Neon, Supabase).
Tạo một file `.env` bên trong thư mục `/backend` với các thông số sau:
```env
PORT=4000
DATABASE_URL="your-postgresql-url"
R2_ACCOUNT_ID="your-r2-account-id"
R2_ACCESS_KEY_ID="your-r2-access-key"
R2_SECRET_ACCESS_KEY="your-r2-secret-key"
R2_BUCKET_NAME="your-bucket-name"
JWT_SECRET="chuoi-bao-mat-jwt-cua-ban"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"

# Thông tin tài khoản Admin mặc định sẽ được tạo lúc khởi động (Tùy chọn)
ADMIN_EMAIL="admin@gamehub.com"
ADMIN_PASSWORD="admin123"
```

### 2. Build Giao Diện (Frontend)
Tạo một file `.env.local` bên trong thư mục `/frontend` với thông số đường dẫn công khai (Public URL) của R2:
```env
NEXT_PUBLIC_R2_URL="https://pub-your-bucket.r2.dev"
```
Mỗi khi có thay đổi code ở giao diện, bạn cần build lại để xuất ra file tĩnh cho backend sử dụng:
```bash
cd frontend
npm install
npm run build
```

### 3. Khởi Chạy Server (Backend)
Backend sẽ tự động đồng bộ CSDL và phục vụ giao diện trên cổng 4000.
```bash
cd backend
npm install
npx prisma db push
npx prisma generate
npm start
```
*Lưu ý: Ngay lần khởi chạy đầu tiên, hệ thống sẽ tự động tạo một tài khoản Admin dựa trên thông tin trong file `.env` (hoặc cấu hình mặc định).*

Mở trình duyệt và truy cập: **http://localhost:4000**

## Hướng Dẫn Upload Game
1. Đăng nhập bằng tài khoản (hoặc đăng ký mới).
2. Chuẩn bị game của bạn dưới dạng một file `.zip` (bắt buộc phải có file `index.html` nằm ngay ở thư mục gốc của file zip).
3. Sau khi upload, game sẽ ở trạng thái `Pending` (Chờ duyệt).
4. Đăng nhập vào tài khoản Admin, chuyển đến Admin Dashboard để kiểm duyệt. Sau khi nhấn "Approve", game mới chính thức xuất hiện trên Storefront.

## Danh Sách API (API Endpoints)

Hệ thống cung cấp các API RESTful để tương tác với dữ liệu. Prefix chung của backend là `/api`.

### 1. Xác thực (Auth) - `/api/auth`
- `POST /send-otp`: Gửi mã OTP để xác thực email.
- `POST /register`: Đăng ký tài khoản mới.
- `GET /verify`: Xác thực email thông qua JWT token (click từ email).
- `POST /login`: Đăng nhập, trả về JWT.
- `GET /me`: (Protected) Xác thực token và lấy thông tin user.

### 2. Người Dùng (Users) - `/api/users`
Tất cả các route này yêu cầu đăng nhập (Protected).
- `GET /me`: Lấy chi tiết thông tin hồ sơ và các thống kê (số game, lượt chơi) của user.
- `PUT /me`: Cập nhật hồ sơ (Tên hiển thị, Ảnh đại diện Imgbb).
- `PUT /me/password`: Thay đổi mật khẩu.

### 3. Game - `/api/games`
- `GET /`: (Cache 60s) Lấy danh sách game đã duyệt (Published). Hỗ trợ param `search`, `category`.
- `GET /:id`: (Cache 30s) Lấy chi tiết thông tin của 1 game.
- `POST /:id/play`: Tăng số lượt chơi (Play count) khi user chơi game.
- `POST /upload`: (Protected) Upload game mới dạng `.zip` (Multipart Form).
- `GET /creator/games`: (Protected) Lấy danh sách các game do user hiện tại tải lên.
- `GET /user/bookmarked`: (Protected) Lấy danh sách game đã bookmark.
- `POST /:id/bookmark`: (Protected) Đánh dấu (Thêm/Xoá) game vào danh sách yêu thích.

### 4. Thể Loại (Categories) - `/api/categories`
- `GET /`: (Cache 1 giờ) Lấy danh sách tất cả thể loại.
- `POST /`: (Admin) Tạo thể loại mới.
- `PUT /:id`: (Admin) Cập nhật tên thể loại.
- `DELETE /:id`: (Admin) Xóa thể loại.

### 5. Tương Tác Xã Hội (Social) - `/api/social`
- `GET /comments/:gameId`: Lấy danh sách bình luận của 1 game.
- `POST /rate/:gameId`: (Protected) Đánh giá game (1-5 sao).
- `GET /rate/:gameId`: (Protected) Lấy đánh giá hiện tại của user cho game.
- `POST /comment/:gameId`: (Protected) Viết bình luận.

### 6. Quản Trị Hệ Thống (Admin) - `/api/admin`
Tất cả các route này yêu cầu đăng nhập với quyền `admin`.
- `GET /stats`: Lấy thống kê tổng quan (User, Game, Số lượt chơi) cho Admin Dashboard.
- `GET /users`: Quản lý danh sách người dùng.
- `PUT /users/:id/ban`: Khóa hoặc mở khóa tài khoản user.
- `PUT /users/:id/role`: Cấp hoặc thu hồi quyền Admin.
- `GET /games/pending`: Xem danh sách game đang chờ duyệt.
- `GET /games/published`: Xem danh sách game đang hoạt động.
- `PUT /games/:id/approve`: Duyệt game để hiển thị ra trang chủ.
- `PUT /games/:id/reject`: Từ chối game.
- `DELETE /games/:id`: Xóa game khỏi CSDL và R2.

### 7. Gamification & Nhiệm Vụ (Quests) - `/api/gamification`
Hệ thống xử lý logic tính điểm và tiến độ hoàn thành nhiệm vụ theo chu kỳ (`periodKey` ví dụ `2026-W34` cho tuần).
- `GET /quests/active`: Trả về danh sách nhiệm vụ được chia theo chu kỳ (Daily, Weekly, Monthly, Lifetime) kèm theo tiến trình (progress) của người dùng hiện tại.

---

## Giải pháp WebView cho Mobile (Khuyên Dùng)

Vì Next.js của dự án sử dụng **Dynamic Routes** (VD: `/creator/games/edit/[id]`), việc xuất file tĩnh hoàn toàn (`output: export`) để nhúng vào App Mobile sẽ gặp lỗi nếu không biết trước `id`.

Để khắc phục mà không cần đổi code Next.js, chúng ta cấu hình Capacitor hoạt động như một **WebView Wrapper** trỏ thẳng đến trang Frontend đã deploy (ví dụ: Vercel):
1. Sửa `frontend/capacitor.config.ts`:
   ```typescript
   import type { CapacitorConfig } from '@capacitor/cli';
   const config: CapacitorConfig = {
     appId: 'com.longdau88.gamehub',
     appName: 'Game Hub',
     webDir: 'out',
     server: {
       url: 'https://game-hub-frontend.vercel.app', // Thay bằng domain thật
       cleartext: true
     }
   };
   export default config;
   ```
2. Mở App ra, nội dung sẽ được kéo trực tiếp từ Web về, App đóng vai trò như một trình duyệt Native mượt mà.

---

## Hướng Dẫn Build Đa Nền Tảng (Mobile & PC)

Dự án này sử dụng CapacitorJS để đóng gói Frontend thành ứng dụng Mobile và PC. Kết quả build sẽ được lưu vào thư mục `build_outputs`.

### 1. Kịch Bản Tự Động (PowerShell Script)
Cách dễ nhất để tự động build và copy toàn bộ các bản release ra thư mục `build_outputs`.
Tạo file `build-all.ps1` ở thư mục gốc:

```powershell
Write-Host "Bắt đầu quy trình Build Đa Nền Tảng..."

# 1. Build Frontend Next.js
cd frontend
npm run build
npx cap sync

# 2. Build Android APK
cd android
./gradlew assembleDebug
cd ..
New-Item -ItemType Directory -Force -Path "../build_outputs/android"
Copy-Item "android/app/build/outputs/apk/debug/app-debug.apk" -Destination "../build_outputs/android/GameHub-test.apk"

# 3. Build Windows App (yêu cầu cài đặt @capacitor-community/electron)
# cd electron
# npm run electron:build

Write-Host "XONG! File của bạn đã được xuất ra thư mục build_outputs!"
```

### 2. Build Thủ Công Từng Nền Tảng

**Build Android APK (để Test):**
```bash
cd frontend/android
./gradlew assembleDebug
mkdir -p ../../build_outputs/android
cp app/build/outputs/apk/debug/app-debug.apk ../../build_outputs/android/game-hub-test.apk
```

**Build Android AAB (để Upload CH Play):**
```bash
cd frontend/android
./gradlew bundleRelease
mkdir -p ../../build_outputs/android
cp app/build/outputs/bundle/release/app-release.aab ../../build_outputs/android/game-hub-release.aab
```

**Build iOS và macOS (App Store) thông qua Xcode:**
> Việc upload lên App Store Apple yêu cầu phải thao tác qua phần mềm **Xcode** trên máy tính **macOS**. Capacitor có sẵn tính năng tương thích để 1 project chạy được cả trên iPhone (iOS) và máy Mac (macOS - Mac Catalyst).

```bash
# 1. Chuyển vào thư mục frontend và thêm nền tảng iOS
cd frontend
npm install @capacitor/ios
npx cap add ios
npx cap sync

# 2. Mở dự án trực tiếp bằng Xcode
npx cap open ios
```
**Khi Xcode đã mở lên, bạn làm theo các bước sau để Build và Upload:**
1. **Để hỗ trợ thêm macOS (Tùy chọn):** Ở cột bên trái, bấm vào thư mục `App` (Màu xanh dương) -> Chọn Target là `App` -> Ở tab **General**, tìm mục **Supported Destinations** -> Bấm nút `+` và chọn **Mac (Mac Catalyst)**. Giờ App của bạn đã chạy được mượt mà trên cả iPhone và Macbook.
2. **Ký chứng chỉ (Signing):** Chuyển sang tab **Signing & Capabilities**, tick vào *Automatically manage signing* và chọn Team (Tài khoản Apple Developer của bạn).
3. **Build & Archive:** Nhìn lên thanh menu trên cùng của máy Mac, chọn thiết bị đích là **Any iOS Device (arm64)** (hoặc **Any Mac** nếu build cho macOS). Tiếp theo bấm vào menu `Product > Archive`.
4. **Upload App Store:** Khi quá trình Archive chạy xong, cửa sổ *Organizer* sẽ hiện ra, bạn chỉ việc bấm nút **Distribute App** màu xanh dương, chọn **App Store Connect** và Next liên tục để đẩy thẳng bản build lên hệ thống chờ duyệt của Apple.

**Build Windows PC (.exe):**
Sử dụng Electron wrapper thông qua plugin `@capacitor-community/electron`.
```bash
cd frontend
npm install @capacitor-community/electron
npx cap add @capacitor-community/electron
cd electron
npm run electron:build
```
> Cấu hình đường dẫn xuất trong `frontend/electron/electron-builder.config.json` thành `"directories": { "output": "../../build_outputs/" }`.
# Game Hub - Nền tảng Chơi Game Web

Game Hub là một nền tảng phân phối game web tương tự như Steam, được thiết kế chuyên biệt cho các web game HTML5. Người dùng có thể đóng gói game dưới dạng file `.zip` để upload. Hệ thống sẽ tự động giải nén và lưu trữ trên Cloudflare R2, sau đó cho phép người chơi trải nghiệm trực tiếp trên trình duyệt thông qua giao diện Storefront hiện đại.

## Tính Năng Nổi Bật
- **Frontend**: Xây dựng bằng Next.js 15, Tailwind CSS, Lucide Icons (Được export tĩnh).
- **Backend**: Node.js, Express.js (Phục vụ API và host luôn cả file tĩnh của Frontend).
- **Cơ sở dữ liệu**: PostgreSQL (kết nối qua Prisma ORM).
- **Lưu trữ (Storage)**: Tích hợp Cloudflare R2 Object Storage để lưu game.
- **Xác thực (Authentication)**: Đăng nhập bằng JWT (JSON Web Tokens) qua Cookie bảo mật, mã hóa mật khẩu bằng bcrypt.
- **Phân quyền (Authorization)**: Phân chia Role rõ ràng (Admin / User thường).
- **Xác minh Email**: Tự động gửi email kích hoạt tài khoản qua Nodemailer khi người dùng đăng ký mới.

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
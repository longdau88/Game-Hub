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
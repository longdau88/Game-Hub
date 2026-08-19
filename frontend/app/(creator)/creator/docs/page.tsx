"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { BookOpen, FileArchive, ShieldAlert, Code2, UploadCloud, Rocket, CheckCircle2 } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState, useEffect } from "react";

export default function CreatorDocs() {
  const { t, locale } = useLanguage();
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isVi = locale === "vi";

  return (
    <div className="space-y-8 pb-10 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-indigo-500 flex items-center gap-2">
            <BookOpen className="w-8 h-8" />
            {isVi ? "Tài Liệu Nhà Phát Triển" : "Developer Documentation"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {isVi
              ? "Hướng dẫn chi tiết về cách chuẩn bị, đóng gói và xuất bản trò chơi của bạn lên nền tảng GameHub."
              : "Detailed guide on how to prepare, package, and publish your games on the GameHub platform."}
          </p>
        </div>
      </div>

      {/* 1. Chuẩn bị File */}
      <Card className="border-border bg-surface/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileArchive className="w-5 h-5 text-blue-500" />
            {isVi ? "1. Chuẩn Bị Tệp Trò Chơi (Game Files)" : "1. Preparing Game Files"}
          </CardTitle>
          <CardDescription>
            {isVi ? "Cấu trúc tệp .ZIP bắt buộc để hệ thống có thể đọc được." : "Required .ZIP structure for the system."}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm">
            {isVi 
              ? "Trò chơi của bạn phải được viết bằng HTML5/JavaScript và có thể chạy hoàn toàn trên trình duyệt web. Bạn cần đóng gói toàn bộ mã nguồn, hình ảnh, âm thanh thành một tệp ZIP duy nhất."
              : "Your game must be written in HTML5/JavaScript and playable completely in a web browser. You need to package all source code, images, and audio into a single ZIP file."}
          </p>
          <div className="bg-black/80 text-green-400 p-4 rounded-xl font-mono text-sm leading-relaxed overflow-x-auto">
            <p>game-folder.zip/</p>
            <p className="ml-4">├── <span className="text-yellow-400 font-bold">index.html</span> (Bắt buộc / Required)</p>
            <p className="ml-4">├── style.css</p>
            <p className="ml-4">├── script.js</p>
            <p className="ml-4">└── assets/</p>
            <p className="ml-8">├── image.png</p>
            <p className="ml-8">└── sound.mp3</p>
          </div>
          <div className="flex items-start gap-2 mt-4 text-sm bg-warning/10 text-warning p-3 rounded-lg border border-warning/20">
            <ShieldAlert className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              {isVi 
                ? "Tệp index.html bắt buộc phải nằm ở thư mục gốc (root) của file ZIP. Nếu bạn nén nguyên một thư mục chứa index.html (tạo ra một cấp thư mục thừa), hệ thống sẽ báo lỗi không tìm thấy file chạy."
                : "The index.html file MUST be in the root directory of the ZIP. If you compress a folder containing index.html, the system will not find the executable file."}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* 2. Giao tiếp API */}
      <Card className="border-border bg-surface/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Code2 className="w-5 h-5 text-purple-500" />
            {isVi ? "2. Tích Hợp Giao Diện (Iframe)" : "2. Iframe Integration"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <p>
            {isVi 
              ? "Trò chơi của bạn sẽ được nhúng vào nền tảng GameHub thông qua một iFrame. Hệ thống sẽ tự động cấp quyền và thiết lập kích thước (responsive) để game hiển thị tốt trên cả điện thoại và máy tính."
              : "Your game will be embedded in the GameHub platform via an iFrame. The system will automatically configure permissions and responsive dimensions."}
          </p>
          <ul className="list-disc pl-5 space-y-2 text-muted-foreground mt-2">
            <li>
              {isVi 
                ? "Game nên sử dụng viewport tự động co giãn để tương thích với nhiều kích thước màn hình."
                : "The game should use a responsive viewport to adapt to various screen sizes."}
            </li>
            <li>
              {isVi 
                ? "Không sử dụng window.top.location để chuyển hướng người chơi ra khỏi GameHub."
                : "Do not use window.top.location to redirect users away from GameHub."}
            </li>
          </ul>
        </CardContent>
      </Card>

      {/* 3. Quy trình Đăng tải */}
      <Card className="border-border bg-surface/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <UploadCloud className="w-5 h-5 text-emerald-500" />
            {isVi ? "3. Quy Trình Tải Lên & Xét Duyệt" : "3. Upload & Review Process"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid gap-4">
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <div>
                <strong className="block text-foreground">{isVi ? "Bước 1: Điền thông tin" : "Step 1: Information"}</strong>
                <span className="text-muted-foreground">
                  {isVi 
                    ? "Nhập tên game, mô tả đa ngôn ngữ (Tiếng Việt & Tiếng Anh), chọn thể loại và thẻ tag phù hợp."
                    : "Enter the game name, multi-language descriptions, categories, and tags."}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
              <div>
                <strong className="block text-foreground">{isVi ? "Bước 2: Tải lên Assets" : "Step 2: Upload Assets"}</strong>
                <span className="text-muted-foreground">
                  {isVi 
                    ? "Tải lên file mã nguồn (.zip) và ảnh bìa game (.jpg, .png). Dung lượng tối đa thường là 500MB cho game."
                    : "Upload the source code (.zip) and cover image (.jpg, .png). Maximum size is usually 500MB."}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-warning shrink-0" />
              <div>
                <strong className="block text-foreground">{isVi ? "Bước 3: Chờ Xét Duyệt (Pending)" : "Step 3: Pending Review"}</strong>
                <span className="text-muted-foreground">
                  {isVi 
                    ? "Sau khi tải lên thành công, game của bạn sẽ ở trạng thái 'Đang chờ duyệt'. Đội ngũ kiểm duyệt (Admin) sẽ chơi thử để đảm bảo game không chứa mã độc hoặc nội dung cấm."
                    : "After successful upload, your game is 'Pending'. Our moderation team will review it."}
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Rocket className="w-5 h-5 text-indigo-500 shrink-0" />
              <div>
                <strong className="block text-foreground">{isVi ? "Bước 4: Phát Hành (Published)" : "Step 4: Published"}</strong>
                <span className="text-muted-foreground">
                  {isVi 
                    ? "Khi được duyệt, game sẽ tự động công khai (Published) trên trang chủ GameHub để mọi người cùng chơi!"
                    : "Once approved, the game will be automatically published on the GameHub homepage!"}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 4. Quy định & Tiêu chuẩn */}
      <Card className="border-error border bg-error/5">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl text-error">
            <ShieldAlert className="w-5 h-5" />
            {isVi ? "4. Nội Dung Bị Cấm" : "4. Prohibited Content"}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>{isVi ? "Để đảm bảo một môi trường chơi game lành mạnh, các nội dung sau sẽ bị từ chối:" : "The following contents will be rejected:"}</p>
          <ul className="list-disc pl-5 space-y-1">
            <li>{isVi ? "Chứa mã độc, virus, công cụ đào tiền ảo (crypto miners)." : "Malware, viruses, crypto miners."}</li>
            <li>{isVi ? "Nội dung người lớn (18+), bạo lực máu me cực đoan." : "Adult content (18+), extreme gore."}</li>
            <li>{isVi ? "Vi phạm bản quyền (sử dụng asset, âm nhạc của hãng khác mà không có quyền)." : "Copyright infringement."}</li>
            <li>{isVi ? "Trò chơi lừa đảo, cờ bạc ăn tiền thật." : "Scams, real-money gambling."}</li>
          </ul>
        </CardContent>
      </Card>
      
      <div className="text-center pt-4">
        <p className="text-sm text-muted-foreground">
          {isVi ? "Bạn cần hỗ trợ thêm?" : "Need more help?"} <a href="mailto:support@gamehub.com" className="text-indigo-500 hover:underline">support@gamehub.com</a>
        </p>
      </div>

    </div>
  );
}

import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "Game Mới Phát Hành | Game Hub",
  description: "Trải nghiệm ngay những tựa game mới nhất vừa ra mắt trên Game Hub. Luôn cập nhật game hành động 3D, game giải đố miễn phí và nhiều thể loại khác mỗi ngày.",
  keywords: ["game mới ra mắt", "game mới nhất", "chơi game miễn phí", "chơi game web", "game hành động 3D", "game giải đố miễn phí"],
};

export default function Page() {
  return <ClientPage />;
}

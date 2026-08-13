import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "Game Đang Thịnh Hành | Game Hub",
  description: "Khám phá danh sách các tựa game đang thịnh hành và được chơi nhiều nhất trên Game Hub. Từ game hành động 3D đến game giải đố miễn phí.",
  keywords: ["game thịnh hành", "game hot", "game được chơi nhiều nhất", "chơi game web", "game hành động 3D", "game giải đố miễn phí"],
};

export default function Page() {
  return <ClientPage />;
}

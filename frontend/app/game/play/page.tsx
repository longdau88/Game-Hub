import type { Metadata } from "next";
import ClientPage from "./ClientPage";

export const metadata: Metadata = {
  title: "Play Game | Game Hub",
  description: "Play awesome web games directly in your browser.",
};

export default function Page() {
  return <ClientPage />;
}


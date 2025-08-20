import "./globals.css";
import "@/lib/token-refresh"; // 引入token刷新工具

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return children;
}

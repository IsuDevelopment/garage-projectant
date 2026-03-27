import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Konfigurator Garażu 3D",
  description: "Skonfiguruj swój garaż blaszany w 3D",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pl" className="h-full">
      <body className="h-full">{children}</body>
    </html>
  );
}

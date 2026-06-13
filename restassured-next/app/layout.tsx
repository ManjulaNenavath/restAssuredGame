import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RestAssured Mastery",
  description: "Become a senior API tester through interactive lessons and games",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

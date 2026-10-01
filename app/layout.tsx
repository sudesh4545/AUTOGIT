import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AutoGit Studio | Sudesh Mehar",
  description: "Manage mini projects and publish them to GitHub and your portfolio.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}

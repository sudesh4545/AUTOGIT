import type { Metadata } from "next";
import "./globals.css";
import "@fontsource-variable/manrope/index.css";
import "@fontsource-variable/space-grotesk/index.css";
import { StudioShell } from "./studio-shell";

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
      <body><StudioShell>{children}</StudioShell></body>
    </html>
  );
}

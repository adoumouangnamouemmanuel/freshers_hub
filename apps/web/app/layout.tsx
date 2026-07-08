import type { ReactNode } from "react";

import "./globals.css";

export const metadata = {
  title: "Fresher Hub Web Admin",
  description: "Workspace scaffold for the Fresher Hub web admin dashboard.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

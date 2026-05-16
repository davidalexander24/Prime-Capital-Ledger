import type { Metadata } from "next";
import "./globals.css";
<<<<<<< HEAD
import { Providers } from "./providers";
=======
>>>>>>> origin/nico

export const metadata: Metadata = {
  title: "Prime Capital Ledger",
  description:
    "Professional portfolio management platform for Indonesian equity markets. Track transactions, analyze performance, and manage your investment ledger.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
<<<<<<< HEAD
      <body>
        <Providers>{children}</Providers>
      </body>
=======
      <body>{children}</body>
>>>>>>> origin/nico
    </html>
  );
}

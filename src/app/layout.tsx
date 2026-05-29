import type { Metadata, Viewport } from "next";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL
      || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000"),
  ),
  applicationName: "뜀로그",
  title: {
    default: "뜀로그 | dduim.log",
    template: "%s | 뜀로그",
  },
  description: "러너들이 나만의 동네 러닝 코스를 그리고 공유하는 모바일 웹 플랫폼",
  icons: {
    icon: [{ url: "/dduim-favicon-shoe.svg", type: "image/svg+xml" }],
    shortcut: "/dduim-favicon-shoe.svg",
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  appleWebApp: {
    capable: true,
    title: "뜀로그",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    siteName: "뜀로그",
    title: "뜀로그 | dduim.log",
    description: "내 동네 러닝 코스를 그리고 공유하는 모바일 웹 플랫폼",
    images: [
      {
        url: "/opengraph-image",
        width: 800,
        height: 400,
        alt: "뜀로그",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "뜀로그 | dduim.log",
    description: "내 동네 러닝 코스를 그리고 공유하는 모바일 웹 플랫폼",
    images: ["/opengraph-image"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}<Analytics /></body>
    </html>
  );
}

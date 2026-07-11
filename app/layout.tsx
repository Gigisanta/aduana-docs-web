import type { Metadata } from "next";
import "./globals.css";

const title = "AduanaDocs — Sistema documental aduanero";
const description =
  "SaaS de gestión documental aduanera para despachantes, ATA, forwarders e importadores/exportadores.";
const baseUrl = "https://aduana-docs-web.vercel.app";
const ogImage = `${baseUrl}/og-image.svg`;

export const metadata: Metadata = {
  title,
  description,
  metadataBase: new URL(baseUrl),
  openGraph: {
    title,
    description,
    url: baseUrl,
    type: "website",
    images: [ogImage],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [ogImage],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}

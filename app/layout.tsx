import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AduanaDocs — Sistema documental aduanero",
  description:
    "SaaS de gestión documental aduanera para despachantes, ATA, forwarders e importadores/exportadores.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es-AR">
      <body>{children}</body>
    </html>
  );
}

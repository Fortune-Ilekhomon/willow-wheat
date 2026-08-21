import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Willow & Wheat Bakery",
  description:
    "Handcrafted cakes, custom designs, and celebration baking — order online with real availability.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-page-bg text-text-primary">
        {children}
      </body>
    </html>
  );
}

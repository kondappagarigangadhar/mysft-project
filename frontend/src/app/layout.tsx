import type { Metadata } from "next";
import { Suspense } from "react";

import { NavigationProgress } from "@/components/navigation/NavigationProgress";
import { AdminThemeProvider } from "@/components/theme/AdminThemeProvider";
import {
  BROWSER_TITLE_DEFAULT,
  BROWSER_TITLE_TEMPLATE,
  COMPANY_SHORT,
  FAVICON_SRC,
  PRODUCT_NAME,
} from "@/lib/branding";

import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: BROWSER_TITLE_DEFAULT,
    template: BROWSER_TITLE_TEMPLATE,
  },
  description: `${PRODUCT_NAME} — unified real estate and construction management platform by ${COMPANY_SHORT}.`,
  applicationName: PRODUCT_NAME,
  appleWebApp: { title: PRODUCT_NAME },
  icons: {
    icon: [{ url: FAVICON_SRC, type: "image/png" }],
    shortcut: FAVICON_SRC,
    apple: [{ url: FAVICON_SRC, type: "image/png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href={FAVICON_SRC} type="image/png" />
        <link rel="shortcut icon" href={FAVICON_SRC} type="image/png" />
        <link rel="apple-touch-icon" href={FAVICON_SRC} />
      </head>
      <body className="antialiased" suppressHydrationWarning>
        <Suspense fallback={null}>
          <NavigationProgress />
        </Suspense>
        <AdminThemeProvider>{children}</AdminThemeProvider>
      </body>
    </html>
  );
}

import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/global.css';
import { buildMeta, SITE_JSON_LD } from '../lib/seo';
import { InstallAppBar } from '../components/InstallApp';
import Script from 'next/script';

export const metadata = buildMeta();

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: '#0ea5e9',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-theme="gold">
      <head>
        <meta name="google-adsense-account" content="ca-pub-1642832204354188" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(SITE_JSON_LD) }}
        />
      </head>
      <body>
        <Theme radius="large" scaling="100%">
          <InstallAppBar />
          {children}
          <ToastContainer position="top-right" autoClose={3000} newestOnTop closeOnClick pauseOnHover />
        </Theme>
        <Script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1642832204354188"
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}

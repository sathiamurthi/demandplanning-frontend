import '@radix-ui/themes/styles.css';
import { Theme } from '@radix-ui/themes';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import '../styles/global.css';
export const metadata = {
  title: 'Enterprise Dashboard',
  description: 'Next.js Migration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="gold">
      <body>
        <Theme radius="large" scaling="100%">
          {children}

          <ToastContainer
            position="top-right"
            autoClose={3000}
            newestOnTop
            closeOnClick
            pauseOnHover
          />
        </Theme>
      </body>
    </html>
  );
}

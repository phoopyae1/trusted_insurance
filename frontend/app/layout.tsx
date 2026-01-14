import './globals.css';
import { ThemeRegistry } from '../lib/theme';
import Layout from '../components/Layout';
import Providers from './providers';
import React from 'react';

export const metadata = {
  title: 'Trusted Insurance',
  description: 'Modern insurance experience'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeRegistry>
          <Providers>
            <Layout>{children}</Layout>
          </Providers>
        </ThemeRegistry>
      </body>
    </html>
  );
}

import './globals.css';
import { ThemeRegistry } from '../lib/theme';
import Layout from '../components/Layout';
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
          <Layout>{children}</Layout>
        </ThemeRegistry>
      </body>
    </html>
  );
}

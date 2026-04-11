import '@/app/styles/globals.css';
import { lobster, opensans, slackey, inter } from './styles/fonts';
import { AuthProvider } from '@/app/lib/context/AuthContext';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en">
            <body
                className={`${lobster.variable} ${opensans.variable} ${slackey.variable} ${inter.variable} antialiased`}
            >
                <AuthProvider>{children}</AuthProvider>
            </body>
        </html>
    );
}

import { AuthProvider } from '@/app/lib/context/AuthContext';
import '@/app/styles/globals.css';
import { inter, lobster, opensans, slackey } from './styles/fonts';

const isDevelopment = process.env.NODE_ENV === 'development';

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const content = isDevelopment ? children : <AuthProvider>{children}</AuthProvider>;

    return (
        <html lang="en">
            <body
                className={`${lobster.variable} ${opensans.variable} ${slackey.variable} ${inter.variable} antialiased`}
            >
                {content}
            </body>
        </html>
    );
}

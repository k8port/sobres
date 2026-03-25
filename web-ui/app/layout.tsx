import "@/app/styles/globals.css";
import { lobster, opensans, slackey, inter } from "./styles/fonts";

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
        {children}
      </body>
    </html>
  );
}

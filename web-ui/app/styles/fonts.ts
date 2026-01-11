import { Lobster, Slackey, Open_Sans, Inter } from 'next/font/google';
import { Metadata } from 'next';

export const lobster = Lobster({
    weight: ['400'],
    subsets: ['latin'],
    variable: '--font-lobster',
});

export const slackey = Slackey({
    weight: ['400'],
    subsets: ['latin'],
    variable: '--font-slackey',
});

export const opensans = Open_Sans({
    weight: ['400'],
    subsets: ['latin'],
    variable: '--font-open-sans',
});

export const inter = Inter({
    weight: ['400'],
    subsets: ['latin'],
    variable: '--font-inter',
});

export const metadata: Metadata = {
    title: 'Sobres-personal budgeting app',
    description: 'Sobres-personal budgeting app',
};
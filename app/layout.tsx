import type { Metadata, Viewport } from 'next'
import { Inter, Poppins } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import { LanguageProvider } from '@/lib/language-context'
import './globals.css'

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
})

const poppins = Poppins({ 
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-poppins",
})

export const metadata: Metadata = {
  title: 'Hello Mayor Portal',
  description: 'Transparent Governance, Empowered Citizens - Ward Administration Portal of Nepal Municipality',
  generator: 'v0.app',
  keywords: ['ward', 'adyaksh', 'nepal', 'municipality', 'government', 'portal', 'civic'],
  authors: [{ name: 'Ward Administration' }],
  icons: {
    icon: [
      {
        url: '/nepallogo.svg',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/nepallogo.svg',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/nepallogo.svg',
        type: 'image/svg+xml',
      },
    ],
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#003893' },
    { media: '(prefers-color-scheme: dark)', color: '#DC143C' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable}`}>
      <body className="font-sans antialiased">
        <LanguageProvider>
          {children}
        </LanguageProvider>
        <Analytics />
      </body>
    </html>
  )
}

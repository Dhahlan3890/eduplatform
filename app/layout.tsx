import type { Metadata } from 'next'
import './globals.css'
import { AuthProvider } from "@/contexts/AuthContext"

export const metadata: Metadata = {
  title: 'EduPlatform - Online Learning Management System',
  description: 'A comprehensive online learning platform for teachers and students. Create courses, manage enrollments, and learn together.',
  keywords: 'education, learning, online courses, LMS, teaching platform',
  authors: [{ name: 'EduPlatform Team' }],
  creator: 'EduPlatform',
  publisher: 'EduPlatform',
  robots: 'index, follow',
  openGraph: {
    title: 'EduPlatform - Online Learning Management System',
    description: 'A comprehensive online learning platform for teachers and students',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'EduPlatform - Online Learning Management System',
    description: 'A comprehensive online learning platform for teachers and students',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  )
}

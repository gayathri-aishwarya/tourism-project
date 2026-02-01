'use client'

import type { ReactNode } from 'react'
import { Poppins } from 'next/font/google'
// Components
import Nav from '@/src/components/NavRelated/Nav'
import Main from '@/src/components/ContainerRelated/Main'
import Footer from '@/src/components/FooterRelated/Footer'
// Providers
import { SessionProvider } from 'next-auth/react'
import {
    AdminProvider,
    AreAuthModalsOpenProvider,
    UserProvider,
} from '@/src/providers/Providers'
// Style
import '../src/styles/globals.css'

const poppins = Poppins({ subsets: ['latin'], weight: '400' })

export default function Layout({
    children,
}: Readonly<{
    children: ReactNode
}>) {
    return (
        <html lang='en'>
            <body className={`${poppins.className} antialiased`}>
                <AreAuthModalsOpenProvider>
                    <SessionProvider>
                        <UserProvider>
                            <AdminProvider>
                                <Nav />
                                <Main navFixed={true} noPadding={true}>
                                    {children}
                                </Main>
                                <Footer />
                            </AdminProvider>
                        </UserProvider>
                    </SessionProvider>
                </AreAuthModalsOpenProvider>
            </body>
        </html>
    )
}

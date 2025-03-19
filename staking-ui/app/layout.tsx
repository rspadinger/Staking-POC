// app/layout.tsx
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Web3Provider } from '@/components/web3-provider'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { StakingProvider } from "@/lib/staking-context"
import { WalletProvider } from "@/lib/wallet-context"

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Staking App',
  description: 'A simple staking application',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen flex flex-col bg-slate-900 text-white`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <WalletProvider>
            <StakingProvider>
              <Web3Provider>
                <Header />
                <main className="flex-grow">
                  {children}
                </main>
                <Footer />
                <Toaster />
              </Web3Provider>
            </StakingProvider>
          </WalletProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
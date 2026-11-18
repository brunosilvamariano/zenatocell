import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import './store.css'

export const metadata: Metadata = {
  icons: { icon: { url: '/zenatocell/zenatocell.svg', type: 'image/svg+xml' } },
  title: 'ZenatoCell | Celulares e acessórios',
  description: 'Explore celulares e acessórios, monte seu carrinho e envie o pedido pelo WhatsApp.',
}
export default function RootLayout({ children }: { children: ReactNode }) {
  return <html lang="pt-BR"><head><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous"/><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&amp;display=swap"/></head><body>{children}</body></html>
}


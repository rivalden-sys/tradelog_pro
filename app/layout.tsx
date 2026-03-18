import type { Metadata } from 'next'
import { ThemeProvider } from '@/components/layout/ThemeProvider'
import './globals.css'

export const metadata: Metadata = {
  title: 'TradeLog Pro — AI Trading Journal',
  description: 'Професійний щоденник трейдера з AI-аналітикою. by dnproduction',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="uk">
      <head>
        <style>{`
          *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
          html, body { min-height: 100vh; }
          body {
            font-family: -apple-system, 'SF Pro Display', BlinkMacSystemFont, sans-serif;
            -webkit-font-smoothing: antialiased;
          }
          a { text-decoration: none; color: inherit; }
          button { font-family: inherit; }
          input, textarea, select { font-family: inherit; }
          @keyframes spin { to { transform: rotate(360deg); } }
          @keyframes fadeIn {
            from { opacity: 0; transform: translateY(8px); }
            to   { opacity: 1; transform: translateY(0); }
          }
          .fade-in { animation: fadeIn 0.25s ease forwards; }
          ::-webkit-scrollbar { width: 6px; }
          ::-webkit-scrollbar-thumb { background: rgba(142,142,147,0.4); border-radius: 3px; }
        `}</style>
      </head>
      <body>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}

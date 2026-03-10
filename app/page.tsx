'use client'

import Link from "next/link"
import { useTheme } from "@/components/layout/ThemeProvider"

export default function Landing() {

  const { theme } = useTheme()

  const section = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "80px 24px"
  }

  const card = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 24,
    boxShadow: theme.shadow
  }

  const button = {
    background: theme.text,
    color: theme.bg,
    padding: "12px 20px",
    borderRadius: 12,
    fontWeight: 500,
    textDecoration: "none"
  }

  return (
    <main>

      {/* HERO */}

      <section style={{ ...section, textAlign: "center" }}>

        <h1 style={{ fontSize: 48, marginBottom: 16 }}>
          AI Trading Journal
        </h1>

        <p style={{ opacity: .7, marginBottom: 32 }}>
          Track every trade, analyze performance and get AI insights to improve your trading decisions.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 16 }}>

          <Link href="/register" style={button}>
            Start free
          </Link>

          <Link href="/login">
            Login
          </Link>

        </div>

      </section>


      {/* FEATURES */}

      <section style={section}>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px,1fr))",
          gap: 24
        }}>

          <div style={card}>
            <h3>Track trades</h3>
            <p style={{ opacity:.7 }}>
              Log entries, exits, strategy and notes for every trade.
            </p>
          </div>

          <div style={card}>
            <h3>AI analysis</h3>
            <p style={{ opacity:.7 }}>
              Get automatic insights on mistakes and improvements.
            </p>
          </div>

          <div style={card}>
            <h3>Performance stats</h3>
            <p style={{ opacity:.7 }}>
              Understand win rate, expectancy and trading behavior.
            </p>
          </div>

        </div>

      </section>


      {/* AI SECTION */}

      <section style={{ ...section, textAlign: "center" }}>

        <h2 style={{ fontSize: 32, marginBottom: 12 }}>
          Built for serious traders
        </h2>

        <p style={{ opacity:.7 }}>
          TradeLog analyzes your trades and helps you understand patterns in your decision making.
        </p>

      </section>


      {/* PRICING */}

      <section style={section}>

        <h2 style={{ textAlign: "center", marginBottom: 40 }}>
          Pricing
        </h2>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(260px,1fr))",
          gap: 24
        }}>

          <div style={card}>
            <h3>Free</h3>
            <p style={{ opacity:.7 }}>Basic trade journal</p>
            <h2>$0</h2>

            <Link href="/register" style={button}>
              Start
            </Link>
          </div>

          <div style={{
            ...card,
            background: theme.text,
            color: theme.bg
          }}>
            <h3>Pro</h3>
            <p style={{ opacity:.8 }}>
              AI analysis and advanced stats
            </p>

            <h2>$19</h2>

            <Link href="/register" style={{
              ...button,
              background: theme.bg,
              color: theme.text
            }}>
              Start Pro
            </Link>
          </div>

        </div>

      </section>


      {/* CTA */}

      <section style={{ ...section, textAlign: "center" }}>

        <h2 style={{ marginBottom: 20 }}>
          Improve your trading discipline
        </h2>

        <Link href="/register" style={button}>
          Start your journal
        </Link>

      </section>

    </main>
  )
}

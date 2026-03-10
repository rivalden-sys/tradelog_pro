'use client'

import Link from "next/link"
import { useTheme } from "@/components/layout/ThemeProvider"

export default function Landing() {

  const { theme } = useTheme()

  const container = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "40px 24px"
  }

  const hero = {
    textAlign: "center" as const,
    paddingTop: 80,
    paddingBottom: 40
  }

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(240px,1fr))",
    gap: 20,
    marginTop: 30
  }

  const card = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 20,
    boxShadow: theme.shadow
  }

  const buttonPrimary = {
    background: theme.text,
    color: theme.bg,
    padding: "10px 18px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 500
  }

  const buttonSecondary = {
    padding: "10px 18px",
    borderRadius: 12,
    border: `1px solid ${theme.border}`,
    textDecoration: "none"
  }

  return (
    <main>

      {/* HERO */}

      <section style={{ ...container, ...hero }}>

        <h1 style={{ fontSize: 44, marginBottom: 12 }}>
          AI Trading Journal
        </h1>

        <p style={{ opacity: .7, marginBottom: 24 }}>
          Track every trade, analyze performance and get AI insights to improve your trading decisions.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 12 }}>
          <Link href="/register" style={buttonPrimary}>
            Start free
          </Link>

          <Link href="/login" style={buttonSecondary}>
            Login
          </Link>
        </div>

      </section>


      {/* FEATURES */}

      <section style={container}>

        <div style={grid}>

          <div style={card}>
            <h3 style={{ marginBottom: 8 }}>Track trades</h3>
            <p style={{ opacity:.7 }}>
              Log entries, exits, strategy and notes for every trade.
            </p>
          </div>

          <div style={card}>
            <h3 style={{ marginBottom: 8 }}>AI analysis</h3>
            <p style={{ opacity:.7 }}>
              Get automatic insights on mistakes and improvements.
            </p>
          </div>

          <div style={card}>
            <h3 style={{ marginBottom: 8 }}>Performance stats</h3>
            <p style={{ opacity:.7 }}>
              Understand win rate, expectancy and trading behavior.
            </p>
          </div>

        </div>

      </section>


      {/* AI SECTION */}

      <section style={{ ...container, textAlign:"center" }}>

        <h2 style={{ fontSize: 28, marginBottom: 10 }}>
          Built for serious traders
        </h2>

        <p style={{ opacity:.7 }}>
          TradeLog analyzes your trades and helps you understand patterns in your decision making.
        </p>

      </section>


      {/* PRICING */}

      <section style={container}>

        <h2 style={{ textAlign:"center", marginBottom: 24 }}>
          Pricing
        </h2>

        <div style={grid}>

          <div style={card}>
            <h3>Free</h3>
            <p style={{ opacity:.7 }}>Basic trade journal</p>
            <h2 style={{ margin:"12px 0" }}>$0</h2>

            <Link href="/register" style={buttonPrimary}>
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

            <h2 style={{ margin:"12px 0" }}>$19</h2>

            <Link
              href="/register"
              style={{
                ...buttonPrimary,
                background: theme.bg,
                color: theme.text
              }}
            >
              Start Pro
            </Link>
          </div>

        </div>

      </section>


      {/* CTA */}

      <section style={{ ...container, textAlign:"center", paddingBottom:60 }}>

        <h2 style={{ marginBottom: 16 }}>
          Improve your trading discipline
        </h2>

        <Link href="/register" style={buttonPrimary}>
          Start your journal
        </Link>

      </section>

    </main>
  )
}

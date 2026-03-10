'use client'

import Link from "next/link"
import { useTheme } from "@/components/layout/ThemeProvider"

export default function Landing() {

  const { theme } = useTheme()

  const background = "#0f0f10"

  const container = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "60px 24px"
  }

  const hero = {
    textAlign: "center" as const,
    paddingTop: 80
  }

  const grid3 = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 24,
    marginTop: 40
  }

  const grid2 = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
    gap: 24,
    marginTop: 40
  }

  const card = {
    background: theme.surface,
    border: `1px solid ${theme.border}`,
    borderRadius: 16,
    padding: 28,
    boxShadow: theme.shadow
  }

  const cardTitle = {
    color: theme.text,
    fontWeight: 600,
    marginBottom: 8
  }

  const cardText = {
    color: theme.text2
  }

  const buttonPrimary = {
    background: theme.text,
    color: theme.bg,
    padding: "12px 24px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 500,
    display: "inline-block"
  }

  const buttonOutline = {
    border: `1px solid ${theme.border}`,
    padding: "12px 24px",
    borderRadius: 12,
    textDecoration: "none",
    display: "inline-block",
    color: theme.text
  }

  return (
    <main style={{ background: background, minHeight: "100vh" }}>

      {/* HERO */}

      <section style={{ ...container, ...hero }}>

        <h1 style={{ fontSize: 48, marginBottom: 16 }}>
          AI Trading Journal
        </h1>

        <p style={{ color: theme.text2, maxWidth: 640, margin: "0 auto 28px" }}>
          Track every trade, analyze your performance and understand your mistakes
          with AI-powered trading insights.
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: 14 }}>
          <Link href="/register" style={buttonPrimary}>
            Start free
          </Link>

          <Link href="/login" style={buttonOutline}>
            Login
          </Link>
        </div>

      </section>



      {/* FEATURES */}

      <section style={container}>

        <h2 style={{ textAlign:"center", marginBottom: 20 }}>
          Everything you need to improve your trading
        </h2>

        <div style={grid3}>

          <div style={card}>
            <h3 style={cardTitle}>Track trades</h3>
            <p style={cardText}>
              Log entries, exits, position size, strategy and notes
              for every trade you take.
            </p>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>AI analysis</h3>
            <p style={cardText}>
              AI analyzes your trades and identifies patterns
              in your decision making.
            </p>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>Performance stats</h3>
            <p style={cardText}>
              Understand win rate, expectancy, risk-reward
              and long term performance.
            </p>
          </div>

        </div>

      </section>



      {/* HOW IT WORKS */}

      <section style={container}>

        <h2 style={{ textAlign:"center", marginBottom: 20 }}>
          How it works
        </h2>

        <div style={grid3}>

          <div style={card}>
            <h3 style={cardTitle}>1. Log trades</h3>
            <p style={cardText}>
              Record your trades including entry, exit,
              strategy and notes.
            </p>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>2. Analyze performance</h3>
            <p style={cardText}>
              View statistics about your trading behavior
              and performance over time.
            </p>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>3. Improve with AI</h3>
            <p style={cardText}>
              AI highlights mistakes and helps you improve
              your decision making.
            </p>
          </div>

        </div>

      </section>



      {/* AI SECTION */}

      <section style={container}>

        <div style={{ ...card, textAlign:"center" }}>

          <h2 style={{ marginBottom: 12 }}>
            AI-powered trading insights
          </h2>

          <p style={{ color: theme.text2, maxWidth: 700, margin:"0 auto" }}>
            TradeLog analyzes your trades and identifies emotional decisions,
            poor risk management and strategy mistakes.
            Use data and AI insights to become a more disciplined trader.
          </p>

        </div>

      </section>



      {/* PRICING */}

      <section style={container}>

        <h2 style={{ textAlign:"center", marginBottom: 24 }}>
          Pricing
        </h2>

        <div style={grid2}>

          <div style={{ ...card, textAlign:"center" }}>
            <h3 style={cardTitle}>Free</h3>
            <p style={cardText}>Basic trading journal</p>

            <h2 style={{ margin:"16px 0", color: theme.text }}>
              $0
            </h2>

            <Link href="/register" style={buttonPrimary}>
              Start
            </Link>
          </div>

          <div style={{
            ...card,
            textAlign:"center",
            background: theme.text,
            color: theme.bg
          }}>
            <h3>Pro</h3>

            <p style={{ opacity:.85 }}>
              AI analysis and advanced statistics
            </p>

            <h2 style={{ margin:"16px 0" }}>
              $19
            </h2>

            <Link
              href="/register"
              style={{
                background: theme.bg,
                color: theme.text,
                padding: "12px 24px",
                borderRadius: 12,
                textDecoration: "none",
                display: "inline-block"
              }}
            >
              Start Pro
            </Link>
          </div>

        </div>

      </section>



      {/* FINAL CTA */}

      <section style={{ ...container, textAlign:"center", paddingBottom:80 }}>

        <h2 style={{ marginBottom: 16 }}>
          Start improving your trading today
        </h2>

        <Link href="/register" style={buttonPrimary}>
          Create your trading journal
        </Link>

      </section>

    </main>
  )
}

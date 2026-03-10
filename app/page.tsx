'use client'

import Link from "next/link"

export default function Landing() {

  const container = {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "80px 24px"
  }

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(260px,1fr))",
    gap: 24,
    marginTop: 32
  }

  const card = {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 4px 16px rgba(0,0,0,0.04)"
  }

  const title = {
    fontSize: 44,
    fontWeight: 700,
    color: "#111",
    marginBottom: 12
  }

  const subtitle = {
    color: "#555",
    maxWidth: 640,
    margin: "0 auto 28px"
  }

  const cardTitle = {
    fontWeight: 600,
    color: "#111",
    marginBottom: 6
  }

  const cardText = {
    color: "#555"
  }

  const buttonPrimary = {
    background: "#111",
    color: "#fff",
    padding: "12px 22px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 500
  }

  const buttonOutline = {
    border: "1px solid rgba(0,0,0,0.15)",
    padding: "12px 22px",
    borderRadius: 12,
    textDecoration: "none",
    color: "#111"
  }

  return (
    <main style={{ background:"#f5f5f7", minHeight:"100vh" }}>

      {/* HERO */}

      <section style={{...container, textAlign:"center"}}>

        <h1 style={title}>
          AI Trading Journal
        </h1>

        <p style={subtitle}>
          Track every trade, analyze performance and improve your
          trading decisions with AI insights.
        </p>

        <div style={{display:"flex",gap:12,justifyContent:"center"}}>

          <Link href="/register" style={buttonPrimary}>
            Start free
          </Link>

          <Link href="/login" style={buttonOutline}>
            Login
          </Link>

        </div>

      </section>


      {/* STATS */}

      <section style={container}>

        <div style={{
          ...grid,
          gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"
        }}>

          <div style={card}>
            <div style={cardTitle}>Trades logged</div>
            <div style={{fontSize:24,fontWeight:600}}>12,430+</div>
          </div>

          <div style={card}>
            <div style={cardTitle}>Average win rate</div>
            <div style={{fontSize:24,fontWeight:600}}>57%</div>
          </div>

          <div style={card}>
            <div style={cardTitle}>AI insights</div>
            <div style={{fontSize:24,fontWeight:600}}>84k</div>
          </div>

          <div style={card}>
            <div style={cardTitle}>Active traders</div>
            <div style={{fontSize:24,fontWeight:600}}>2,300+</div>
          </div>

        </div>

      </section>


      {/* FEATURES */}

      <section style={container}>

        <h2 style={{fontSize:28,fontWeight:700,color:"#111"}}>
          Everything you need to improve your trading
        </h2>

        <div style={grid}>

          <div style={card}>
            <div style={cardTitle}>Trade journal</div>
            <div style={cardText}>
              Log entries, exits, strategy and notes for every trade.
            </div>
          </div>

          <div style={card}>
            <div style={cardTitle}>Performance analytics</div>
            <div style={cardText}>
              Track win rate, risk-reward and performance statistics.
            </div>
          </div>

          <div style={card}>
            <div style={cardTitle}>AI trade analysis</div>
            <div style={cardText}>
              Identify emotional trades and strategy mistakes.
            </div>
          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}

      <section style={container}>

        <h2 style={{fontSize:28,fontWeight:700,color:"#111"}}>
          How it works
        </h2>

        <div style={grid}>

          <div style={card}>
            <div style={cardTitle}>1. Log trades</div>
            <div style={cardText}>
              Record entries, exits and strategy.
            </div>
          </div>

          <div style={card}>
            <div style={cardTitle}>2. Analyze performance</div>
            <div style={cardText}>
              View statistics and patterns in your trading.
            </div>
          </div>

          <div style={card}>
            <div style={cardTitle}>3. Improve with AI</div>
            <div style={cardText}>
              AI highlights mistakes and improvements.
            </div>
          </div>

        </div>

      </section>


      {/* PRICING */}

      <section style={container}>

        <h2 style={{fontSize:28,fontWeight:700,color:"#111"}}>
          Pricing
        </h2>

        <div style={grid}>

          <div style={{...card,textAlign:"center"}}>

            <div style={cardTitle}>Free</div>
            <div style={cardText}>Basic trade journal</div>

            <div style={{fontSize:32,fontWeight:700,margin:"12px 0"}}>$0</div>

            <Link href="/register" style={buttonPrimary}>
              Start
            </Link>

          </div>

          <div style={{
            ...card,
            textAlign:"center",
            border:"2px solid #22c55e"
          }}>

            <div style={cardTitle}>Pro</div>

            <div style={cardText}>
              AI analysis and advanced statistics
            </div>

            <div style={{fontSize:32,fontWeight:700,margin:"12px 0"}}>$19</div>

            <Link href="/register" style={buttonPrimary}>
              Start Pro
            </Link>

          </div>

        </div>

      </section>

    </main>
  )
}

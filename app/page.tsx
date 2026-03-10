'use client'

import Link from "next/link"

export default function Landing() {

  const container = {
    maxWidth: 1200,
    margin: "0 auto",
    padding: "80px 24px"
  }

  const grid = {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))",
    gap: 24
  }

  const card = {
    background: "#ffffff",
    border: "1px solid rgba(0,0,0,0.06)",
    borderRadius: 16,
    padding: 28,
    boxShadow: "0 2px 12px rgba(0,0,0,0.04)"
  }

  const button = {
    background: "#111",
    color: "#fff",
    padding: "12px 24px",
    borderRadius: 12,
    textDecoration: "none",
    fontWeight: 500
  }

  const buttonOutline = {
    border: "1px solid rgba(0,0,0,0.1)",
    padding: "12px 24px",
    borderRadius: 12,
    textDecoration: "none",
    color: "#111"
  }

  return (
    <main style={{ background:"#f5f5f7", minHeight:"100vh" }}>

      {/* HERO */}

      <section style={{...container, textAlign:"center"}}>

        <h1 style={{
          fontSize:52,
          marginBottom:12,
          fontWeight:700
        }}>
          AI Trading Journal
        </h1>

        <p style={{
          maxWidth:640,
          margin:"0 auto 28px",
          color:"#666"
        }}>
          Track every trade, analyze performance and improve your
          trading decisions with AI insights.
        </p>

        <div style={{display:"flex",gap:12,justifyContent:"center"}}>

          <Link href="/register" style={button}>
            Start free
          </Link>

          <Link href="/login" style={buttonOutline}>
            Login
          </Link>

        </div>

      </section>


      {/* STATS PREVIEW */}

      <section style={container}>

        <div style={{
          ...grid,
          gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))"
        }}>

          <div style={card}>
            <h3>Trades logged</h3>
            <h2 style={{marginTop:8}}>12,430+</h2>
          </div>

          <div style={card}>
            <h3>Average win rate</h3>
            <h2 style={{marginTop:8}}>57%</h2>
          </div>

          <div style={card}>
            <h3>AI insights generated</h3>
            <h2 style={{marginTop:8}}>84k</h2>
          </div>

          <div style={card}>
            <h3>Active traders</h3>
            <h2 style={{marginTop:8}}>2,300+</h2>
          </div>

        </div>

      </section>


      {/* FEATURES */}

      <section style={container}>

        <h2 style={{marginBottom:28}}>
          Everything you need to improve your trading
        </h2>

        <div style={grid}>

          <div style={card}>
            <h3>Trade journal</h3>
            <p style={{color:"#666"}}>
              Log entries, exits, strategy and notes for every trade.
            </p>
          </div>

          <div style={card}>
            <h3>Performance analytics</h3>
            <p style={{color:"#666"}}>
              Track win rate, risk-reward and performance statistics.
            </p>
          </div>

          <div style={card}>
            <h3>AI trade analysis</h3>
            <p style={{color:"#666"}}>
              Identify emotional trades and strategy mistakes.
            </p>
          </div>

        </div>

      </section>


      {/* HOW IT WORKS */}

      <section style={container}>

        <h2 style={{marginBottom:28}}>
          How it works
        </h2>

        <div style={grid}>

          <div style={card}>
            <h3>1. Log your trades</h3>
            <p style={{color:"#666"}}>
              Record entries, exits and strategy.
            </p>
          </div>

          <div style={card}>
            <h3>2. Analyze performance</h3>
            <p style={{color:"#666"}}>
              View statistics and patterns in your trading.
            </p>
          </div>

          <div style={card}>
            <h3>3. Improve with AI</h3>
            <p style={{color:"#666"}}>
              AI highlights mistakes and improvements.
            </p>
          </div>

        </div>

      </section>


      {/* PRICING */}

      <section style={container}>

        <h2 style={{marginBottom:28}}>
          Pricing
        </h2>

        <div style={grid}>

          <div style={{...card,textAlign:"center"}}>

            <h3>Free</h3>
            <p style={{color:"#666"}}>Basic trade journal</p>

            <h1 style={{margin:"16px 0"}}>$0</h1>

            <Link href="/register" style={button}>
              Start
            </Link>

          </div>

          <div style={{
            ...card,
            textAlign:"center",
            border:"2px solid #22c55e"
          }}>

            <h3>Pro</h3>
            <p style={{color:"#666"}}>
              AI analysis and advanced statistics
            </p>

            <h1 style={{margin:"16px 0"}}>$19</h1>

            <Link href="/register" style={button}>
              Start Pro
            </Link>

          </div>

        </div>

      </section>

    </main>
  )
}

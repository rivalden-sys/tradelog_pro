'use client'

import Link from "next/link"

export default function Landing() {

  return (

    <main
      style={{
        background:"#212124",
        minHeight:"100vh",
        color:"#ffffff"
      }}
    >

      {/* HERO */}

      <section
        style={{
          maxWidth:1100,
          margin:"0 auto",
          padding:"120px 24px",
          textAlign:"center"
        }}
      >

        <h1
          style={{
            fontSize:44,
            fontWeight:700,
            marginBottom:16
          }}
        >
          AI Trading Journal
        </h1>

        <p
          style={{
            color:"#9CA3AF",
            maxWidth:620,
            margin:"0 auto 30px"
          }}
        >
          Track every trade, analyze performance and improve
          your trading decisions with AI insights.
        </p>

        <div style={{display:"flex",gap:12,justifyContent:"center"}}>

          <Link
            href="/register"
            style={{
              background:"#000",
              padding:"12px 22px",
              borderRadius:12,
              textDecoration:"none",
              color:"#fff",
              fontWeight:500
            }}
          >
            Start free
          </Link>

          <Link
            href="/login"
            style={{
              border:"1px solid rgba(255,255,255,0.15)",
              padding:"12px 22px",
              borderRadius:12,
              textDecoration:"none",
              color:"#fff"
            }}
          >
            Login
          </Link>

        </div>

      </section>


      {/* STATS */}

      <section
        style={{
          maxWidth:1100,
          margin:"0 auto",
          padding:"0 24px 80px"
        }}
      >

        <div
          style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(220px,1fr))",
            gap:20
          }}
        >

          <Stat label="Trades logged" value="12,430+" />
          <Stat label="Average win rate" value="57%" />
          <Stat label="AI insights" value="84k" />
          <Stat label="Active traders" value="2,300+" />

        </div>

      </section>


      {/* FEATURES */}

      <section
        style={{
          maxWidth:1100,
          margin:"0 auto",
          padding:"0 24px 100px"
        }}
      >

        <h2
          style={{
            fontSize:28,
            fontWeight:700,
            marginBottom:32
          }}
        >
          Everything you need to improve your trading
        </h2>

        <div
          style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
            gap:20
          }}
        >

          <Card
            title="Trade journal"
            text="Log entries, exits, strategy and notes for every trade."
          />

          <Card
            title="Performance analytics"
            text="Track win rate, risk-reward and performance statistics."
          />

          <Card
            title="AI trade analysis"
            text="Identify emotional trades and strategy mistakes."
          />

        </div>

      </section>


      {/* PRICING */}

      <section
        style={{
          maxWidth:1100,
          margin:"0 auto",
          padding:"0 24px 120px"
        }}
      >

        <h2
          style={{
            fontSize:28,
            fontWeight:700,
            marginBottom:30
          }}
        >
          Pricing
        </h2>

        <div
          style={{
            display:"grid",
            gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",
            gap:24
          }}
        >

          <Price
            title="Free"
            desc="Basic trade journal"
            price="$0"
            button="Start"
          />

          <Price
            title="Pro"
            desc="AI analysis and advanced statistics"
            price="$19"
            button="Start Pro"
            highlight
          />

        </div>

      </section>

    </main>
  )
}

function Stat({label,value}:{label:string,value:string}) {

  return (

    <div
      style={{
        background:"#2a2a2e",
        padding:26,
        borderRadius:16,
        border:"1px solid rgba(255,255,255,0.05)"
      }}
    >

      <div style={{color:"#9CA3AF",fontSize:14}}>
        {label}
      </div>

      <div
        style={{
          fontSize:28,
          fontWeight:700,
          marginTop:4
        }}
      >
        {value}
      </div>

    </div>
  )
}

function Card({title,text}:{title:string,text:string}) {

  return (

    <div
      style={{
        background:"#2a2a2e",
        padding:28,
        borderRadius:16,
        border:"1px solid rgba(255,255,255,0.05)"
      }}
    >

      <div
        style={{
          fontWeight:600,
          marginBottom:8
        }}
      >
        {title}
      </div>

      <div style={{color:"#9CA3AF"}}>
        {text}
      </div>

    </div>
  )
}

function Price({title,desc,price,button,highlight}:{title:string,desc:string,price:string,button:string,highlight?:boolean}) {

  return (

    <div
      style={{
        background:"#2a2a2e",
        padding:32,
        borderRadius:18,
        border: highlight
          ? "2px solid #22c55e"
          : "1px solid rgba(255,255,255,0.05)",
        textAlign:"center"
      }}
    >

      <div style={{color:"#9CA3AF"}}>
        {title}
      </div>

      <div style={{marginTop:6}}>
        {desc}
      </div>

      <div
        style={{
          fontSize:36,
          fontWeight:700,
          margin:"16px 0"
        }}
      >
        {price}
      </div>

      <Link
        href="/register"
        style={{
          background:"#000",
          color:"#fff",
          padding:"10px 20px",
          borderRadius:10,
          textDecoration:"none"
        }}
      >
        {button}
      </Link>

    </div>
  )
}

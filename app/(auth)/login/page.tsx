'use client'

import Link from "next/link"

export default function LoginPage() {

  const card = {
    background:"#ffffff",
    padding:"36px",
    borderRadius:"16px",
    width:"420px",
    boxShadow:"0 10px 30px rgba(0,0,0,0.08)",
    border:"1px solid rgba(0,0,0,0.06)"
  }

  const input = {
    width:"100%",
    padding:"12px 14px",
    borderRadius:"10px",
    border:"1px solid #e5e7eb",
    marginTop:"6px",
    marginBottom:"18px",
    fontSize:"14px"
  }

  const button = {
    width:"100%",
    background:"#111",
    color:"#fff",
    padding:"12px",
    borderRadius:"10px",
    border:"none",
    fontWeight:500,
    cursor:"pointer"
  }

  const buttonGoogle = {
    width:"100%",
    background:"#fff",
    border:"1px solid #e5e7eb",
    padding:"12px",
    borderRadius:"10px",
    marginTop:"12px",
    cursor:"pointer"
  }

  return (
    <main style={{
      minHeight:"100vh",
      background:"#f5f5f7",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      padding:"40px"
    }}>

      <div style={card}>

        <div style={{textAlign:"center",marginBottom:"24px"}}>

          <h1 style={{fontSize:26,fontWeight:700}}>
            TradeLog <span style={{color:"#22c55e"}}>Pro</span>
          </h1>

          <p style={{color:"#6b7280",marginTop:"4px"}}>
            Sign in to your account
          </p>

        </div>

        <label>Email</label>
        <input
          style={input}
          placeholder="you@email.com"
        />

        <label>Password</label>
        <input
          type="password"
          style={input}
          placeholder="••••••••"
        />

        <button style={button}>
          Sign in
        </button>

        <button style={buttonGoogle}>
          Continue with Google
        </button>

        <p style={{
          textAlign:"center",
          marginTop:"18px",
          fontSize:"14px",
          color:"#6b7280"
        }}>
          No account?{" "}
          <Link href="/register" style={{color:"#22c55e"}}>
            Create account
          </Link>
        </p>

      </div>

    </main>
  )
}

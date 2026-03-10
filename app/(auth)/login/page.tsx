'use client'

import Link from "next/link"

export default function LoginPage() {

  return (

    <main style={{
      minHeight:"100vh",
      display:"flex",
      alignItems:"center",
      justifyContent:"center",
      background:"#1c1c1e"
    }}>

      <div style={{
        width:420,
        background:"#ffffff",
        padding:36,
        borderRadius:18,
        border:"1px solid rgba(0,0,0,0.08)",
        boxShadow:"0 20px 40px rgba(0,0,0,0.25)"
      }}>

        {/* header */}

        <div style={{textAlign:"center",marginBottom:28}}>

          <h1 style={{
            fontSize:26,
            fontWeight:700,
            color:"#111"
          }}>
            TradeLog <span style={{color:"#22c55e"}}>Pro</span>
          </h1>

          <p style={{
            color:"#6b7280",
            fontSize:14,
            marginTop:6
          }}>
            Sign in to your account
          </p>

        </div>


        {/* email */}

        <label style={{
          fontSize:13,
          fontWeight:500,
          color:"#374151"
        }}>
          Email
        </label>

        <input
          placeholder="you@email.com"
          style={{
            width:"100%",
            marginTop:6,
            marginBottom:18,
            padding:"12px 14px",
            borderRadius:10,
            border:"1px solid #e5e7eb",
            background:"#f9fafb",
            color:"#212124",
            fontSize:14
          }}
        />


        {/* password */}

        <label style={{
          fontSize:13,
          fontWeight:500,
          color:"#374151"
        }}>
          Password
        </label>

        <input
          type="password"
          placeholder="••••••••"
          style={{
            width:"100%",
            marginTop:6,
            marginBottom:22,
            padding:"12px 14px",
            borderRadius:10,
            border:"1px solid #e5e7eb",
            background:"#f9fafb",
            color:"#212124",
            fontSize:14
          }}
        />


        {/* login */}

        <button style={{
          width:"100%",
          padding:"12px",
          borderRadius:10,
          background:"#0a0a0b",
          color:"#fff",
          fontWeight:500,
          border:"none",
          cursor:"pointer"
        }}>
          Sign in
        </button>


        {/* google */}

        <button style={{
          width:"100%",
          padding:"12px",
          borderRadius:10,
          border:"1px solid #e5e7eb",
          background:"#212124",
          color:"#ffffff",
          marginTop:12,
          fontWeight:500,
          cursor:"pointer"
        }}>
          Continue with Google
        </button>


        {/* register */}

        <p style={{
          textAlign:"center",
          fontSize:14,
          marginTop:18,
          color:"#6b7280"
        }}>
          No account?{" "}
          <Link href="/register" style={{
            color:"#22c55e",
            fontWeight:500
          }}>
            Create account
          </Link>
        </p>

      </div>

    </main>
  )
}

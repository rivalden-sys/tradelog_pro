'use client'

import { useState } from 'react'
import Link from "next/link"
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function LoginPage() {

  const [email,setEmail] = useState('')
  const [password,setPassword] = useState('')
  const [loading,setLoading] = useState(false)
  const [error,setError] = useState('')

  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async () => {

    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if(error){
      setError(error.message)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  const handleGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider:'google',
      options:{
        redirectTo:`${window.location.origin}/dashboard`
      }
    })
  }

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


        {error && (
          <div style={{
            background:"#ff3b3015",
            border:"1px solid #ff3b3040",
            padding:"10px 12px",
            borderRadius:8,
            marginBottom:16,
            fontSize:13,
            color:"#ff3b30"
          }}>
            {error}
          </div>
        )}


        <label style={{
          fontSize:13,
          fontWeight:500,
          color:"#374151"
        }}>
          Email
        </label>

        <input
          value={email}
          onChange={(e)=>setEmail(e.target.value)}
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


        <label style={{
          fontSize:13,
          fontWeight:500,
          color:"#374151"
        }}>
          Password
        </label>

        <input
          type="password"
          value={password}
          onChange={(e)=>setPassword(e.target.value)}
          placeholder="••••••••"
          onKeyDown={(e)=>e.key==="Enter" && handleLogin()}
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


        <button
          onClick={handleLogin}
          disabled={loading}
          style={{
            width:"100%",
            padding:"12px",
            borderRadius:10,
            background:"#0a0a0b",
            color:"#fff",
            fontWeight:500,
            border:"none",
            cursor: loading ? "not-allowed" : "pointer",
            opacity: loading ? 0.6 : 1
          }}
        >
          {loading ? "Signing in..." : "Sign in"}
        </button>


        <button
          onClick={handleGoogle}
          style={{
            width:"100%",
            padding:"12px",
            borderRadius:10,
            border:"1px solid #e5e7eb",
            background:"#212124",
            color:"#ffffff",
            marginTop:12,
            fontWeight:500,
            cursor:"pointer"
          }}
        >
          Continue with Google
        </button>


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

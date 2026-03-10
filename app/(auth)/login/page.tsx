'use client'

import Link from "next/link"

export default function LoginPage() {

  return (

    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#212124"
      }}
    >

      <div
        style={{
          width: 420,
          padding: 36,
          borderRadius: 18,
          background: "#2a2a2e",
          border: "1px solid rgba(255,255,255,0.06)",
          boxShadow: "0 20px 40px rgba(0,0,0,0.6)"
        }}
      >

        {/* header */}

        <div style={{ textAlign: "center", marginBottom: 28 }}>

          <h1
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: "#ffffff"
            }}
          >
            TradeLog <span style={{ color: "#22c55e" }}>Pro</span>
          </h1>

          <p
            style={{
              color: "#9ca3af",
              fontSize: 14,
              marginTop: 6
            }}
          >
            Sign in to your account
          </p>

        </div>

        {/* EMAIL */}

        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#d1d5db"
          }}
        >
          Email
        </label>

        <input
          placeholder="you@email.com"
          style={{
            width: "100%",
            marginTop: 6,
            marginBottom: 18,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#ffffff",
            color: "#212124",
            fontSize: 14
          }}
        />

        {/* PASSWORD */}

        <label
          style={{
            fontSize: 13,
            fontWeight: 500,
            color: "#d1d5db"
          }}
        >
          Password
        </label>

        <input
          type="password"
          placeholder="••••••••"
          style={{
            width: "100%",
            marginTop: 6,
            marginBottom: 22,
            padding: "12px 14px",
            borderRadius: 10,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#ffffff",
            color: "#212124",
            fontSize: 14
          }}
        />

        {/* LOGIN BUTTON */}

        <button
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            background: "#000",
            color: "#fff",
            fontWeight: 500,
            border: "none",
            cursor: "pointer"
          }}
        >
          Sign in
        </button>

        {/* GOOGLE */}

        <button
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: 10,
            marginTop: 12,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "#212124",
            color: "#ffffff",
            fontWeight: 500,
            cursor: "pointer"
          }}
        >
          Continue with Google
        </button>

        {/* REGISTER */}

        <p
          style={{
            textAlign: "center",
            fontSize: 14,
            marginTop: 18,
            color: "#9ca3af"
          }}
        >
          No account?{" "}
          <Link
            href="/register"
            style={{
              color: "#22c55e",
              fontWeight: 500
            }}
          >
            Create account
          </Link>
        </p>

      </div>

    </main>
  )
}

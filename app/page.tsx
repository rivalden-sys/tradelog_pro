import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center text-center px-6">
      
      <h1 className="text-5xl font-bold mb-6">
        AI Trading Journal
      </h1>

      <p className="text-lg text-gray-500 max-w-xl mb-10">
        Track your trades, analyze performance and get AI insights to
        improve your trading decisions.
      </p>

      <div className="flex gap-4">
        <Link
          href="/register"
          className="px-6 py-3 rounded-xl bg-black text-white"
        >
          Get Started
        </Link>

        <Link
          href="/login"
          className="px-6 py-3 rounded-xl border"
        >
          Login
        </Link>
      </div>

      <div className="mt-24 text-sm text-gray-400">
        Built for traders who want to improve.
      </div>

    </main>
  );
}

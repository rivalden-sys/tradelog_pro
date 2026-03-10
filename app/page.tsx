import Link from "next/link";

export default function Landing() {
  return (
    <main className="min-h-screen bg-white text-black">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-8 py-6 max-w-6xl mx-auto">
        <div className="font-bold text-xl">TradeLog</div>

        <div className="flex gap-6 items-center">
          <Link href="/login" className="text-sm opacity-70 hover:opacity-100">
            Login
          </Link>

          <Link
            href="/register"
            className="px-4 py-2 bg-black text-white rounded-lg text-sm"
          >
            Start free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="text-center px-6 py-20 max-w-4xl mx-auto">
        <h1 className="text-5xl font-bold leading-tight mb-6">
          AI Trading Journal
        </h1>

        <p className="text-lg text-gray-500 mb-10">
          Track every trade, analyze performance and get AI insights
          to improve your trading decisions.
        </p>

        <div className="flex justify-center gap-4">
          <Link
            href="/register"
            className="px-6 py-3 bg-black text-white rounded-xl"
          >
            Start free
          </Link>

          <Link
            href="/login"
            className="px-6 py-3 border rounded-xl"
          >
            Login
          </Link>
        </div>
      </section>

      {/* FEATURES */}
      <section className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8 px-8 py-20">

        <div className="p-6 border rounded-xl">
          <h3 className="font-semibold mb-2">Track trades</h3>
          <p className="text-sm text-gray-500">
            Log entries, exits, strategy and notes for every trade.
          </p>
        </div>

        <div className="p-6 border rounded-xl">
          <h3 className="font-semibold mb-2">AI analysis</h3>
          <p className="text-sm text-gray-500">
            Get automatic insights on mistakes and improvements.
          </p>
        </div>

        <div className="p-6 border rounded-xl">
          <h3 className="font-semibold mb-2">Performance stats</h3>
          <p className="text-sm text-gray-500">
            Understand win rate, expectancy and trading behavior.
          </p>
        </div>

      </section>

      {/* AI SECTION */}
      <section className="bg-gray-50 py-24 text-center px-6">
        <h2 className="text-3xl font-bold mb-6">
          Built for serious traders
        </h2>

        <p className="max-w-xl mx-auto text-gray-500">
          TradeLog analyzes your trades and helps you understand
          patterns in your decision making.
        </p>
      </section>

      {/* PRICING */}
      <section className="max-w-4xl mx-auto py-24 px-6 text-center">

        <h2 className="text-3xl font-bold mb-12">Pricing</h2>

        <div className="grid md:grid-cols-2 gap-8">

          <div className="border p-8 rounded-xl">
            <h3 className="font-semibold text-lg mb-2">Free</h3>
            <p className="text-gray-500 text-sm mb-6">
              Basic trade journal
            </p>

            <p className="text-3xl font-bold mb-6">$0</p>

            <Link
              href="/register"
              className="px-6 py-3 border rounded-xl inline-block"
            >
              Start
            </Link>
          </div>

          <div className="border p-8 rounded-xl bg-black text-white">
            <h3 className="font-semibold text-lg mb-2">Pro</h3>
            <p className="text-gray-300 text-sm mb-6">
              AI analysis and advanced stats
            </p>

            <p className="text-3xl font-bold mb-6">$19</p>

            <Link
              href="/register"
              className="px-6 py-3 bg-white text-black rounded-xl inline-block"
            >
              Start Pro
            </Link>
          </div>

        </div>

      </section>

      {/* CTA */}
      <section className="text-center py-20 px-6">
        <h2 className="text-3xl font-bold mb-6">
          Improve your trading discipline
        </h2>

        <Link
          href="/register"
          className="px-8 py-4 bg-black text-white rounded-xl"
        >
          Start your journal
        </Link>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-sm text-gray-400 py-10">
        TradeLog © {new Date().getFullYear()}
      </footer>

    </main>
  );
}

# TradeLog Pro — Project Structure

tradelog-pro/
├── app/
│   ├── layout.tsx                    ✅ M1
│   ├── page.tsx                      ✅ M1 (redirect → /dashboard)
│   ├── (auth)/
│   │   ├── login/page.tsx            → M2
│   │   └── register/page.tsx         → M2
│   ├── dashboard/
│   │   └── page.tsx                  → M4
│   ├── trades/
│   │   ├── page.tsx                  → M3
│   │   ├── new/page.tsx              → M3
│   │   └── [id]/page.tsx             → M3
│   ├── ai/
│   │   └── page.tsx                  → M5
│   ├── analytics/
│   │   └── page.tsx                  → M4
│   ├── settings/
│   │   └── page.tsx                  → M6
│   └── api/
│       ├── ai/
│       │   ├── trade-review/route.ts → M5
│       │   ├── trade-score/route.ts  → M5
│       │   ├── coach/route.ts        → M5
│       │   ├── psychology/route.ts   → M5
│       │   └── chat/route.ts         → M5
│       └── upload/route.ts           → M3
│
├── components/
│   ├── layout/
│   │   ├── ThemeProvider.tsx         ✅ M1
│   │   └── Header.tsx                ✅ M1
│   ├── ui/
│   │   └── index.tsx                 ✅ M1 (Card, Button, Badge, etc.)
│   ├── trades/
│   │   ├── TradeTable.tsx            → M3
│   │   ├── TradeCard.tsx             → M3
│   │   └── TradeForm.tsx             → M3
│   ├── dashboard/
│   │   ├── StatCards.tsx             → M4
│   │   └── Charts.tsx                → M4
│   └── ai/
│       ├── TradeReview.tsx           → M5
│       ├── CoachPanel.tsx            → M5
│       └── ChatPanel.tsx             → M5
│
├── services/                         (ALL business logic)
│   ├── tradesService.ts              → M3
│   ├── dashboardService.ts           → M4
│   ├── aiService.ts                  → M5
│   ├── setupsService.ts              → M3
│   └── storageService.ts             → M3
│
├── hooks/
│   ├── useTrades.ts                  → M3
│   └── useDashboard.ts               → M4
│
├── lib/
│   ├── design.ts                     ✅ M1
│   ├── openai.ts                     ✅ M1
│   ├── rateLimit.ts                  ✅ M1
│   └── supabase/
│       ├── client.ts                 ✅ M1
│       ├── server.ts                 ✅ M1
│       └── middleware.ts             ✅ M1
│
├── types/
│   └── index.ts                      ✅ M1
│
├── supabase/
│   └── migrations/
│       ├── 001_initial_schema.sql    ✅ M1
│       └── 002_seed_setups.sql       ✅ M1
│
├── middleware.ts                     ✅ M1
├── next.config.ts                    ✅ M1
├── tsconfig.json                     ✅ M1
├── package.json                      ✅ M1
└── .env.local.example                ✅ M1

# SOBRES Budgeting APP

## Frontend structure

frontend/
├── .github/
│   └── workflows/
│       └── ci.yml                 # CI: lint → test → build → deploy
├── docs/                          # Design docs, component library guidelines, ADRs
│   └── architecture.md
├── public/                        # Static assets served as-is (favicon, robots.txt)
│   ├── index.html
│   └── favicon.ico
├── scripts/                       # Build, deploy, and utility scripts
│   ├── bootstrap.sh               # install deps, link packages
│   └── release.sh                 # bump version, changelog, git tag
├── src/
│   ├── assets/                    # Images, fonts, svgs, icons
│   ├── components/                # Reusable, generic UI components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.stories.tsx # Storybook stories
│   │   └── ……
│   ├── features/                  # Feature modules (group components, hooks, tests)
│   │   └── Dashboard/
│   │       ├── DashboardPage.tsx
│   │       ├── dashboardSlice.ts  # Redux / Zustand / whatever state
│   │       ├── Dashboard.api.ts   # API client abstractions
│   │       └── Dashboard.test.tsx
│   ├── hooks/                     # Custom React hooks (useAuth, useFetch, etc.)
│   ├── contexts/                  # React Context providers (Theme, Auth, Config)
│   ├── services/                  # API clients, WebSocket connectors
│   │   └── apiClient.ts
│   ├── styles/                    # Global styles, theming, Tailwind config imports
│   │   └── tailwind.css
│   ├── utils/                     # Pure helpers, date formatting, validation
│   ├── types/                     # Shared TypeScript interfaces/types
│   ├── routes/                    # If using React Router or a file-based router
│   ├── App.tsx                    # Root app (router, providers)
│   ├── index.tsx                  # Entry point
│   └── setupTests.ts              # Jest setup (mocks, custom matchers)
├── .env                           # Local overrides (git-ignored)
├── .env.production                # Production configs (CI injects secrets)
├── package.json
├── tsconfig.json
├── tailwind.config.js             # Or your CSS-in-JS config
├── vite.config.ts                 # Or webpack.config.js
├── jest.config.js
├── cypress/                       # End-to-end tests
│   ├── integration/
│   └── support/
├── .storybook/                    # Component explorer
│   ├── main.js
│   └── preview.js
├── .eslintrc.js
├── .prettierrc
└── README.md

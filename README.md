# HabitCore - Habit Tracker SPA

A modern, offline-first habit tracker built with React, Vite, and Tailwind CSS. Track your daily habits, visualize your progress with beautiful analytics, and stay motivated with streaks and completion rates.

🌐 **Live Demo**: [https://test-habitos.vercel.app](https://test-habitos.vercel.app)

## Features

- ✅ **Habit Management**: Create, edit, and organize habits by category
- 📊 **Analytics Dashboard**: Visualize your progress with interactive charts
- 🔥 **Streak Tracking**: Monitor your best streaks and completion rates
- 🎨 **Category System**: Color-coded categories for better organization
- 📱 **PWA Support**: Install as a desktop or mobile app
- 💾 **Offline-First**: All data stored locally in your browser
- 🌙 **Dark Mode**: Beautiful dark theme optimized for extended use
- ℹ️ **Helpful Tooltips**: Learn what each metric means with hover tooltips

## Prerequisites

- **Node.js** (v16 or higher)
  - Download: [https://nodejs.org/](https://nodejs.org/)
- **npm**, **yarn**, **pnpm**, or **bun** (comes with Node.js)

## Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/juanlondonoc/habit-tracker-test-antigravity.git
cd habit-tracker-test-antigravity
```

### 2. Install Dependencies

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 3. Start Development Server

```bash
npm run dev
```

The app will open at `http://localhost:5173`.

### 4. Build for Production

```bash
npm run build
```

The production build will be in the `dist/` folder.

## Deployment

This project is configured for deployment on **Vercel** with automatic deployments from GitHub.

### Deploy to Vercel

1. Push your code to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Vercel will auto-detect the Vite configuration
4. Deploy!

Every push to the `main` branch will trigger a new deployment.

## Tech Stack

- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand (persisted to localStorage)
- **Charts**: Recharts
- **Icons**: Lucide React
- **Date Handling**: date-fns
- **PWA**: vite-plugin-pwa

## Project Structure

```
src/
├── components/
│   ├── dashboard/        # Dashboard components
│   │   ├── charts/       # Chart components (Bar, Pie, Heatmap)
│   │   ├── AnalyticsDashboard.tsx
│   │   ├── CategoryManager.tsx
│   │   ├── Checklist.tsx
│   │   └── ...
│   ├── ui/               # Reusable UI components
│   └── ErrorBoundary.tsx # Error handling
├── lib/                  # Utilities and metrics
├── store/                # Zustand state management
├── types/                # TypeScript definitions
└── App.tsx               # Main application
```

## Data Storage

**Important**: This app uses **localStorage** for data persistence. This means:
- ✅ Your data is stored locally in your browser
- ✅ No server or account required
- ⚠️ Data is **device-specific** (not synced across devices)
- ⚠️ Clearing browser data will delete your habits

To sync data across devices, you would need to implement a backend solution (e.g., Firebase, Supabase).

## License

MIT

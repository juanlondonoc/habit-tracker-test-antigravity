# Habit Tracker SPA

A simple, offline-first habit tracker built with React, Vite, and Tailwind CSS.

## Prerequisites

You need **Node.js** to build and run this project.
Download it here: [https://nodejs.org/](https://nodejs.org/)

## Setup Instructions

1.  **Install Dependencies**
    Open your terminal in this folder and run:
    ```bash
    npm install
    # or
    yarn install
    # or
    pnpm install
    ```

2.  **Start Development Server**
    ```bash
    npm run dev
    ```
    The app will open at `http://localhost:5173`.

## Architecture
- **Framework**: React + Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand (persisted to LocalStorage)
- **Charts**: Recharts
- **Icons**: Lucide React

## Project Structure
- `/src/components`: UI components and Dashboard widgets.
- `/src/lib`: Logic, metrics, and utils.
- `/src/store`: State management (Zustand).
- `/src/types`: TypeScript definitions.

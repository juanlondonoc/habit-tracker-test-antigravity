import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { ClerkProvider } from '@clerk/clerk-react'
import { ErrorBoundary } from './components/ErrorBoundary'

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY

if (!PUBLISHABLE_KEY) {
  console.warn("Missing Publishable Key: Please set VITE_CLERK_PUBLISHABLE_KEY in your .env.local file")
}

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <ErrorBoundary>
            {PUBLISHABLE_KEY ? (
                <ClerkProvider publishableKey={PUBLISHABLE_KEY}>
                    <App />
                </ClerkProvider>
            ) : (
                <div className="min-h-screen bg-[#0E0F13] text-white flex items-center justify-center p-4 text-center">
                    <div>
                        <h1 className="text-2xl font-bold mb-4">Configuración Pendiente</h1>
                        <p className="text-gray-400">Por favor, agrega <code className="bg-white/10 px-2 py-1 rounded">VITE_CLERK_PUBLISHABLE_KEY</code> en tu archivo <code className="bg-white/10 px-2 py-1 rounded">.env.local</code>.</p>
                    </div>
                </div>
            )}
        </ErrorBoundary>
    </React.StrictMode>,
)

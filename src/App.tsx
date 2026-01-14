import { useState } from 'react';
import { DateSelector } from './components/dashboard/DateSelector';
import { Checklist } from './components/dashboard/Checklist';
import { Activity } from 'lucide-react';
import { cn } from './lib/utils';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';

function App() {
    const [selectedDate, setSelectedDate] = useState(new Date());

    // Placeholder for view selection (will be used in Phase 2)
    const [view, setView] = useState<'dashboard' | 'analytics'>('dashboard');

    return (
        <div className="min-h-screen bg-[#0E0F13] text-white font-sans selection:bg-primary/30">
            {/* Header / Sidebar (simplified as top Header for now) */}
            <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-[#0E0F13]/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">HabitCore</span>
                    </div>

                    <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                        <button
                            onClick={() => setView('dashboard')}
                            className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all", view === 'dashboard' ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white")}
                        >
                            Dashboard
                        </button>
                        <button
                            onClick={() => setView('analytics')}
                            className={cn("px-4 py-1.5 rounded-full text-sm font-medium transition-all", view === 'analytics' ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white")}
                        >
                            Analytics
                        </button>
                    </nav>

                    <div className="w-8" /> {/* Spacer for balance */}
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-4 lg:p-6 min-h-[calc(100vh-64px)]">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">

                    {/* Left Column: Input & Checklist */}
                    <div className={cn(
                        "flex flex-col h-full gap-6",
                        view === 'analytics' ? "hidden" : "lg:col-span-4 xl:col-span-5"
                    )}>
                        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
                        <div className="flex-1 overflow-hidden">
                            <Checklist selectedDate={selectedDate} />
                        </div>
                    </div>

                    {/* Right Column: Analytics */}
                    <div className={cn(
                        "h-full overflow-y-auto custom-scrollbar",
                        view === 'dashboard' ? "hidden lg:block lg:col-span-8 xl:col-span-7" : "lg:col-span-12"
                    )}>
                        <AnalyticsDashboard />
                    </div>

                </div>
            </main>
        </div>
    )
}

export default App

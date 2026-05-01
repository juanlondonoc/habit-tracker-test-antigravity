import { useState } from 'react';
import { SignedIn, SignedOut, SignIn, UserButton } from '@clerk/clerk-react';
import { DateSelector } from './components/dashboard/DateSelector';
import { Checklist } from './components/dashboard/Checklist';
import { Activity } from 'lucide-react';
import { cn } from './lib/utils';
import { AnalyticsDashboard } from './components/dashboard/AnalyticsDashboard';
import { TransactionsDashboard } from './components/dashboard/TransactionsDashboard';

type View = 'dashboard' | 'gastos';

function App() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [view, setView] = useState<View>('dashboard');

    const navItems: { id: View; label: string }[] = [
        { id: 'dashboard', label: 'Hábitos' },
        { id: 'gastos', label: 'Gastos' },
    ];

    return (
        <div className="min-h-screen bg-[#0E0F13] text-white font-sans selection:bg-primary/30">
            {/* Header */}
            <header className="sticky top-0 z-30 w-full border-b border-white/5 bg-[#0E0F13]/80 backdrop-blur-xl">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Activity className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight">HabitCore</span>
                    </div>

                    <nav className="flex items-center gap-1 bg-white/5 p-1 rounded-full border border-white/5">
                        {navItems.map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => setView(id)}
                                className={cn(
                                    "px-3 sm:px-4 py-1.5 rounded-full text-xs sm:text-sm font-medium transition-all",
                                    view === id ? "bg-primary text-white shadow-lg" : "text-gray-400 hover:text-white"
                                )}
                            >
                                {label}
                            </button>
                        ))}
                    </nav>
                    <div className="ml-2 flex items-center">
                        <SignedIn>
                            <UserButton afterSignOutUrl="/" appearance={{ elements: { userButtonAvatarBox: "w-8 h-8" } }} />
                        </SignedIn>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="container mx-auto p-4 lg:p-6 min-h-[calc(100vh-64px)]">
                <SignedOut>
                    <div className="flex items-center justify-center h-full pt-10">
                        <SignIn routing="hash" />
                    </div>
                </SignedOut>
                
                <SignedIn>
                    {view === 'gastos' ? (
                        <TransactionsDashboard />
                    ) : (
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full">
                            {/* Left Column */}
                            <div className="flex flex-col h-full gap-6 lg:col-span-4 xl:col-span-5">
                                <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
                                <div className="flex-1 overflow-hidden">
                                    <Checklist selectedDate={selectedDate} />
                                </div>
                            </div>

                            {/* Right Column: Analytics */}
                            <div className="h-full overflow-y-auto custom-scrollbar lg:col-span-8 xl:col-span-7">
                                <AnalyticsDashboard />
                            </div>
                        </div>
                    )}
                </SignedIn>
            </main>
        </div>
    );
}

export default App;

import React, { useState } from 'react';
import { useHabitStore } from '../../store/useHabitStore';
import { getBestDayOfWeek, calculateBestStreak, getCompletionStats } from '../../lib/metrics';
import { Heatmap } from './charts/Heatmap';
import { CompletionBarChart } from './charts/CompletionBarChart';
import { CompletionPieChart } from './charts/CompletionPieChart';
import { Calendar, BarChart3, PieChart, TrendingUp, Trophy, CalendarDays } from 'lucide-react';
import { subDays } from 'date-fns';

export const AnalyticsDashboard: React.FC = () => {
    const { habits = [], logs = {}, categories = [] } = useHabitStore();

    const [selectedHabitId, setSelectedHabitId] = useState<string>('all');
    const [range, setRange] = useState<'week' | 'month'>('week');
    const [view, setView] = useState<'heatmap' | 'bar' | 'pie'>('bar'); // Default to bar as it works for 'all'

    const selectedHabit = habits?.find(h => h.id === selectedHabitId);
    const activeHabits = habits?.filter(h => !h.archived) || [];

    const getCategoryColor = (catId: string) => categories?.find(c => c.id === catId)?.color || '#3B82F6';

    // Computed Stats
    const bestDay = getBestDayOfWeek(logs, selectedHabit ? [selectedHabit] : activeHabits);

    // Best Streak logic
    let bestStreakVal = 0;
    if (selectedHabit) {
        bestStreakVal = calculateBestStreak(selectedHabit, logs);
    } else {
        // Find max streak among all
        bestStreakVal = activeHabits.reduce((max, h) => Math.max(max, calculateBestStreak(h, logs)), 0);
    }

    // Completion Rate for period
    const startDate = range === 'week' ? subDays(new Date(), 6) : subDays(new Date(), 29);
    let completionInfo = { rate: 0, completedDays: 0, totalDays: 0 };

    if (selectedHabit) {
        completionInfo = getCompletionStats(selectedHabit, logs, startDate, new Date());
    } else {
        // Average completion rate of all habits?? Or global completion?
        // Let's do average of averages for simplicity in this view
        if (activeHabits.length > 0) {
            const rates = activeHabits.map(h => getCompletionStats(h, logs, startDate, new Date()).rate);
            const avg = rates.reduce((a, b) => a + b, 0) / rates.length;
            completionInfo = { rate: avg, completedDays: 0, totalDays: 0 }; // Days not relevant for agg
        }
    }

    return (
        <div className="flex flex-col h-full gap-6">

            {/* Controls */}
            <div className="flex flex-col gap-4 bg-[#161821] p-4 rounded-3xl border border-white/5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    {/* Habit Selector */}
                    <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar max-w-full">
                        <button
                            onClick={() => setSelectedHabitId('all')}
                            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${selectedHabitId === 'all' ? 'bg-white text-black' : 'bg-black/20 text-gray-400 hover:text-white'}`}
                        >
                            Todos
                        </button>
                        {activeHabits.map(h => (
                            <button
                                key={h.id}
                                onClick={() => setSelectedHabitId(h.id)}
                                className={`px-4 py-2 rounded-xl text-sm font-medium transition-all whitespace-nowrap flex items-center gap-2 ${selectedHabitId === h.id ? 'bg-white/10 text-white border border-white/20' : 'bg-black/20 text-gray-400 hover:text-white'}`}
                            >
                                <div className="w-2 h-2 rounded-full" style={{ background: getCategoryColor(h.categoryId) }} />
                                {h.name}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    {/* View Selector */}
                    <div className="flex bg-black/20 p-1 rounded-xl gap-1">
                        <button onClick={() => setView('heatmap')} className={`p-2 rounded-lg transition-all ${view === 'heatmap' ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:bg-white/5'}`} title="Calendario">
                            <Calendar className="w-4 h-4" />
                        </button>
                        <button onClick={() => setView('bar')} className={`p-2 rounded-lg transition-all ${view === 'bar' ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:bg-white/5'}`} title="Barras">
                            <BarChart3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => setView('pie')} className={`p-2 rounded-lg transition-all ${view === 'pie' ? 'bg-[#3B82F6] text-white' : 'text-gray-400 hover:bg-white/5'}`} title="Torta" disabled={!selectedHabit}>
                            <PieChart className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Range Selector */}
                    <div className="flex bg-black/20 p-1 rounded-xl gap-1">
                        <button onClick={() => setRange('week')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${range === 'week' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
                            Semana
                        </button>
                        <button onClick={() => setRange('month')} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${range === 'month' ? 'bg-white/10 text-white' : 'text-gray-400'}`}>
                            Mes
                        </button>
                    </div>
                </div>
            </div>

            {/* Main Chart Area */}
            <div className="h-[200px] shrink-0 bg-[#161821] rounded-3xl p-2 border border-white/5 flex flex-col items-center justify-center relative">
                {!selectedHabit && view === 'pie' ? (
                    <div className="text-center text-gray-400">
                        <p>Selecciona un hábito específico para ver el gráfico de torta.</p>
                    </div>
                ) : (
                    <>
                        {view === 'heatmap' && selectedHabit && <Heatmap habit={selectedHabit} />}
                        {view === 'heatmap' && !selectedHabit && (
                            <div className="text-center text-gray-400">
                                <p>Calendario Heatmap solo disponible por hábito individual.</p>
                            </div>
                        )}
                        {view === 'bar' && <CompletionBarChart habit={selectedHabit} range={range} />}
                        {view === 'pie' && selectedHabit && <CompletionPieChart habit={selectedHabit} range={range} />}
                    </>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-[#161821] p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase">
                        <TrendingUp className="w-3 h-3 text-emerald-400" />
                        Tasa de Éxito
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {Math.round(completionInfo.rate)}%
                    </div>
                    <div className="text-xs text-gray-500">
                        {range === 'week' ? 'Últimos 7 días' : 'Últimos 30 días'}
                    </div>
                </div>

                <div className="bg-[#161821] p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase">
                        <Trophy className="w-3 h-3 text-yellow-400" />
                        Mejor Racha
                    </div>
                    <div className="text-2xl font-bold text-white">
                        {bestStreakVal} <span className="text-sm font-normal text-gray-500">días</span>
                    </div>
                    <div className="text-xs text-gray-500">
                        {selectedHabit ? 'Histórico' : 'Entre todos'}
                    </div>
                </div>

                <div className="bg-[#161821] p-4 rounded-2xl border border-white/5 flex flex-col gap-1">
                    <div className="flex items-center gap-2 text-gray-400 text-xs font-medium uppercase">
                        <CalendarDays className="w-3 h-3 text-blue-400" />
                        Mejor Día
                    </div>
                    <div className="text-lg font-bold text-white capitalize truncate" title={bestDay}>
                        {bestDay}
                    </div>
                    <div className="text-xs text-gray-500">
                        Frecuencia alta
                    </div>
                </div>
            </div>

        </div>
    );
};

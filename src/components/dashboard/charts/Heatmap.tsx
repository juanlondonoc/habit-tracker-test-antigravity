import React from 'react';
import { eachDayOfInterval, format, subDays, startOfWeek, endOfWeek, getDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { useHabitStore } from '../../../store/useHabitStore';
import { Habit } from '../../../types';

interface HeatmapProps {
    habit: Habit;
    daysBack?: number;
}

export const Heatmap: React.FC<HeatmapProps> = ({ habit, daysBack = 90 }) => {
    const { logs, categories } = useHabitStore();
    const category = categories.find(c => c.id === habit.categoryId);
    const color = category?.color || '#3B82F6';

    const today = new Date();
    const startDate = subDays(today, daysBack);

    // Align start date to Sunday for grid alignment
    const gridStart = startOfWeek(startDate);
    // Align end date to Saturday
    const gridEnd = endOfWeek(today);

    const days = eachDayOfInterval({ start: gridStart, end: gridEnd });

    // Group by weeks
    const weeks: Date[][] = [];
    let currentWeek: Date[] = [];
    days.forEach(day => {
        currentWeek.push(day);
        if (getDay(day) === 6) { // Saturday
            weeks.push(currentWeek);
            currentWeek = [];
        }
    });
    if (currentWeek.length > 0) weeks.push(currentWeek);

    return (
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-end mb-2">
                <h4 className="text-sm text-gray-400 font-medium">Historial (Últimos 3 meses)</h4>
                <div className="flex gap-2 text-xs text-gray-500">
                    <span>Menos</span>
                    <div className="flex gap-1">
                        <div className="w-3 h-3 rounded-sm bg-[#1F2937]" />
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.3 }} />
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color, opacity: 0.6 }} />
                        <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: color }} />
                    </div>
                    <span>Más</span>
                </div>
            </div>

            <div className="flex gap-1 overflow-x-auto pb-2 custom-scrollbar">
                {weeks.map((week, i) => (
                    <div key={i} className="flex flex-col gap-1">
                        {week.map(day => {
                            const dateStr = format(day, 'yyyy-MM-dd');
                            const val = logs[dateStr]?.[habit.id] || 0;

                            // Completion level for quantitative?
                            // For v1 let's stick to binary visual (Hit target or not)
                            // Or maybe opacity based on % of target?
                            let opacity = 0;
                            if (habit.type === 'binary') {
                                opacity = val === 1 ? 1 : 0;
                            } else {
                                if (habit.target && val >= habit.target) opacity = 1;
                                else if (habit.target && val > 0) opacity = val / habit.target * 0.5; // Partial
                                else opacity = 0;
                            }

                            return (
                                <div
                                    key={dateStr}
                                    className="w-3 h-3 rounded-sm transition-all hover:ring-1 ring-white/50"
                                    title={`${format(day, 'dd MMM', { locale: es })}: ${val}`}
                                    style={{
                                        backgroundColor: opacity > 0 ? color : '#1F2937',
                                        opacity: opacity > 0 ? Math.max(0.3, opacity) : 1
                                    }}
                                />
                            );
                        })}
                    </div>
                ))}
            </div>
        </div>
    );
};


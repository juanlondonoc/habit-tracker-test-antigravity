import React from 'react';
import { BarChart as ReBaChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Habit } from '../../../types';
import { useHabitStore } from '../../../store/useHabitStore';
import { format, subDays, eachDayOfInterval } from 'date-fns';
import { es } from 'date-fns/locale';
import { isCompleted } from '../../../lib/metrics';

interface CompletionBarChartProps {
    habit?: Habit; // If null, aggregate
    range: 'week' | 'month';
}

export const CompletionBarChart: React.FC<CompletionBarChartProps> = ({ habit, range }) => {
    const { logs, habits, categories } = useHabitStore();
    const today = new Date();

    const getCategoryColor = (h: Habit) => categories.find(c => c.id === h.categoryId)?.color || '#3B82F6';

    const start = range === 'week' ? subDays(today, 6) : subDays(today, 29);
    const days = eachDayOfInterval({ start, end: today });
    const activeHabits = habits.filter(h => !h.archived);

    // Calculate Data
    let totalCompletedSum = 0;

    // Get unique categories from active habits
    const categoryMap = new Map<string, { id: string; name: string; color: string }>();
    activeHabits.forEach(h => {
        const cat = categories.find(c => c.id === h.categoryId);
        if (cat && !categoryMap.has(cat.id)) {
            categoryMap.set(cat.id, { id: cat.id, name: cat.name, color: cat.color });
        }
    });

    const data = days.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const row: any = {
            date: format(day, range === 'week' ? 'EEE' : 'd', { locale: es }),
            fullDate: format(day, 'd MMM yyyy', { locale: es }),
        };

        if (habit) {
            // Single Habit View (Percentage or Value)
            const val = logs[dateStr]?.[habit.id] || 0;
            let value = 0;
            if (habit.type === 'quantitative') {
                value = Math.min(100, (val / (habit.target || 1)) * 100);
            } else {
                value = val === 1 ? 100 : 0;
            }
            row.value = Math.round(value);
            totalCompletedSum += row.value;
        } else {
            // Aggregate Stacked View - GROUP BY CATEGORY
            let dailyCount = 0;

            // Initialize category counts
            categoryMap.forEach((cat) => {
                row[cat.id] = 0;
            });

            // Count completed habits per category
            activeHabits.forEach(h => {
                const val = logs[dateStr]?.[h.id] || 0;
                if (isCompleted(h, val)) {
                    const cat = categories.find(c => c.id === h.categoryId);
                    if (cat) {
                        row[cat.id] = (row[cat.id] || 0) + 1; // Increment category count
                        dailyCount++;
                    }
                }
            });
            totalCompletedSum += dailyCount;
        }
        return row;
    });

    const average = totalCompletedSum / days.length;

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%">
                <ReBaChart data={data} stackOffset="sign">
                    <XAxis
                        dataKey="date"
                        stroke="#4B5563"
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <YAxis
                        domain={[0, 'auto']}
                        stroke="#4B5563"
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        tickLine={false}
                        axisLine={false}
                        width={30}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        labelStyle={{ color: '#9CA3AF', marginBottom: '0.5rem' }}
                    />

                    {/* Average Line - Only show if valid */}
                    {!isNaN(average) && average > 0 && (
                        <ReferenceLine
                            y={average}
                            stroke="#FFFFFF"
                            strokeDasharray="3 3"
                            label={{ position: 'right', value: 'Promedio', fill: '#FFFFFF', fontSize: 10, offset: 5 }}
                            opacity={0.8}
                        />
                    )}

                    {habit ? (
                        // Single Bar
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} fill={getCategoryColor(habit)} name="Cumplimiento %" />
                    ) : (
                        // Stacked Bars per CATEGORY (not per habit)
                        Array.from(categoryMap.values()).map((cat) => (
                            <Bar
                                key={cat.id}
                                dataKey={cat.id}
                                stackId="a"
                                fill={cat.color}
                                name={cat.name}
                                radius={[0, 0, 0, 0]}
                            />
                        ))
                    )}
                </ReBaChart>
            </ResponsiveContainer>
        </div>
    );
};

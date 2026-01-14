import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Habit } from '../../../types';
import { useHabitStore } from '../../../store/useHabitStore';
import { isCompleted } from '../../../lib/metrics';
import { subDays, eachDayOfInterval, format } from 'date-fns';

interface CompletionPieChartProps {
    habit: Habit;
    range: 'week' | 'month';
}

export const CompletionPieChart: React.FC<CompletionPieChartProps> = ({ habit, range }) => {
    const { logs, categories } = useHabitStore();
    const today = new Date();
    const start = range === 'week' ? subDays(today, 6) : subDays(today, 29);
    const days = eachDayOfInterval({ start, end: today });

    const category = categories.find(c => c.id === habit.categoryId);
    const color = category?.color || '#3B82F6';

    let completed = 0;
    let missed = 0;

    days.forEach(day => {
        const dateStr = format(day, 'yyyy-MM-dd');
        const val = logs[dateStr]?.[habit.id] || 0;
        if (isCompleted(habit, val)) completed++;
        else missed++;
    });

    const data = [
        { name: 'Cumplido', value: completed },
        { name: 'No Cumplido', value: missed }
    ];

    const COLORS = [color, '#1F2937'];

    return (
        <div className="h-[200px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={data}
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                    >
                        {data.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{ backgroundColor: '#1F2937', border: 'none', borderRadius: '8px', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                    />
                </PieChart>
            </ResponsiveContainer>

            {/* Centered Percentage */}
            <div className="absolute font-bold text-2xl text-white pointer-events-none">
                {Math.round((completed / (completed + missed || 1)) * 100)}%
            </div>
        </div>
    );
};

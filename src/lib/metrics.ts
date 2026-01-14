import { Habit, DayLog } from '../types';
import { differenceInDays, format, parseISO, startOfDay, subDays, eachDayOfInterval } from 'date-fns';

/**
 * Checks if a habit is completed for a given value
 */
export const isCompleted = (habit: Habit, value: number): boolean => {
    if (habit.type === 'binary') {
        return value === 1;
    }
    // Quantitative: value must meet the target
    return value >= (habit.target || 0);
};

/**
 * Calculates the current streak for a habit.
 * Streak counts consecutive days ending today or yesterday.
 */
export const calculateStreak = (
    habit: Habit,
    logs: Record<string, DayLog>,
    referenceDate: Date = new Date()
): number => {
    let streak = 0;
    let currentRef = startOfDay(referenceDate);

    // Check if completed today
    const todayKey = format(currentRef, 'yyyy-MM-dd');
    const todayVal = logs[todayKey]?.[habit.id] || 0;

    // If not completed today, check yesterday to continue streak
    if (!isCompleted(habit, todayVal)) {
        currentRef = subDays(currentRef, 1);
        const yesterdayKey = format(currentRef, 'yyyy-MM-dd');
        const yesterdayVal = logs[yesterdayKey]?.[habit.id] || 0;
        if (!isCompleted(habit, yesterdayVal)) {
            return 0; // Streak broken or not started
        }
    }

    // Count backwards
    while (true) {
        const key = format(currentRef, 'yyyy-MM-dd');
        const val = logs[key]?.[habit.id] || 0;

        if (isCompleted(habit, val)) {
            streak++;
            currentRef = subDays(currentRef, 1);
        } else {
            break;
        }
    }
    return streak;
};

/**
 * Calculates Best Streak (All time)
 * This is expensive for long histories, so simple implementation for now.
 */
export const calculateBestStreak = (habit: Habit, logs: Record<string, DayLog>): number => {
    const dates = Object.keys(logs).sort(); // Sort chronological
    if (dates.length === 0) return 0;

    let maxStreak = 0;
    let currentStreak = 0;
    let lastDate: Date | null = null;

    for (const dateStr of dates) {
        const val = logs[dateStr]?.[habit.id] || 0;
        if (isCompleted(habit, val)) {
            const currentDate = parseISO(dateStr);
            if (lastDate && differenceInDays(currentDate, lastDate) === 1) {
                currentStreak++;
            } else {
                currentStreak = 1; // Restart or start
            }
            lastDate = currentDate;
            maxStreak = Math.max(maxStreak, currentStreak);
        }
        // If we want to strictly break sequence on gaps in LOGS (not just uncompleted values), logic holds relative to sorted keys.
        // However, if a user misses a day, there likely won't be a log entry or it will be 0.
        // We should strictly iterate calendar days if we want true precision, but iterating logs might be enough if we assume missing log = 0.
        // Actually, iterating known logs is safer.
    }

    return maxStreak;
};

/**
 * Get completion rate for a period
 */
export const getCompletionStats = (
    habit: Habit,
    logs: Record<string, DayLog>,
    startDate: Date,
    endDate: Date
) => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    let completed = 0;

    days.forEach(day => {
        const key = format(day, 'yyyy-MM-dd');
        const val = logs[key]?.[habit.id] || 0;
        if (isCompleted(habit, val)) {
            completed++;
        }
    });

    return {
        totalDays: days.length,
        completedDays: completed,
        rate: days.length > 0 ? (completed / days.length) * 100 : 0
    };
};

/**
 * Get Best Day (Day of week with highest completion rate for all habits)
 */
export const getBestDayOfWeek = (logs: Record<string, DayLog>, habits: Habit[]) => {
    const dayCounts: Record<string, { total: number, completed: number }> = {};

    // Initialize map
    const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    weekDays.forEach(d => dayCounts[d] = { total: 0, completed: 0 });

    Object.entries(logs).forEach(([dateStr, log]) => {
        const date = parseISO(dateStr);
        const dayName = format(date, 'eeee'); // Monday, Tuesday...

        habits.forEach(h => {
            if (!h.archived) {
                dayCounts[dayName].total++;
                if (isCompleted(h, log[h.id] || 0)) {
                    dayCounts[dayName].completed++;
                }
            }
        });
    });

    let bestDay = 'N/A';
    let bestRate = -1;

    Object.entries(dayCounts).forEach(([day, stats]) => {
        if (stats.total === 0) return;
        const rate = stats.completed / stats.total;
        if (rate > bestRate) {
            bestRate = rate;
            bestDay = day;
        }
    });

    return bestDay;
};

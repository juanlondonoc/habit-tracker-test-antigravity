export type HabitType = 'binary' | 'quantitative';

export interface Category {
    id: string;
    name: string;
    color: string;
}

export interface Habit {
    id: string;
    name: string;
    type: HabitType;
    categoryId: string; // References Category.id
    description?: string;
    target?: number; // For quantitative habits (e.g., 90 minutes)
    unit?: string;   // e.g., 'minutes', 'pages'
    frequency: 'daily'; // v1 only supports daily
    archived: boolean;
    createdAt: string; // ISO date
}

export interface DayLog {
    [habitId: string]: number; // Store the value. 1 for binary "done", N for quantitative.
}

export interface AppState {
    habits: Habit[];
    categories: Category[];
    logs: Record<string, DayLog>; // Key is YYYY-MM-DD
    isLoading: boolean;
    // Actions
    addHabit: (habit: Omit<Habit, 'id' | 'createdAt'>) => void;
    updateHabit: (id: string, updates: Partial<Habit>) => void;
    deleteHabit: (id: string) => void;
    addCategory: (category: Omit<Category, 'id'>) => string;
    updateCategory: (id: string, updates: Partial<Omit<Category, 'id'>>) => void;
    deleteCategory: (id: string) => void;
    toggleBinaryLog: (date: string, habitId: string) => void;
    setQuantitativeLog: (date: string, habitId: string, value: number) => void;
}

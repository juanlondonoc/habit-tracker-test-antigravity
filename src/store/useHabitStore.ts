import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { AppState, Habit, Category } from '../types';

/* 
  Ideally we should update the types/index.ts first but since we are inside the store file, 
  and we are using the imported AppState, we need to update the interface DEFINITION.
  Wait, AppState is imported. I need to update types/index.ts first or typescript will complain.
  I will update types/index.ts in the next step.
*/

const DEFAULT_CATEGORIES: Category[] = [
    { id: 'cat-1', name: 'Salud', color: '#10B981' }, // Green
    { id: 'cat-2', name: 'Trabajo', color: '#3B82F6' }, // Blue
    { id: 'cat-3', name: 'Aprendizaje', color: '#8B5CF6' }, // Purple
    { id: 'cat-4', name: 'Fitness', color: '#F59E0B' }, // Orange
    { id: 'cat-5', name: 'Mindset', color: '#EC4899' }, // Pink
];

export const useHabitStore = create<AppState>()(
    persist(
        (set) => ({
            habits: [],
            categories: DEFAULT_CATEGORIES,
            logs: {},
            isLoading: false,

            addCategory: (catData) => {
                const id = crypto.randomUUID();
                const newCat: Category = { ...catData, id };
                set((state) => ({ categories: [...state.categories, newCat] }));
                return id;
            },

            updateCategory: (id, updates) => {
                set((state) => ({
                    categories: state.categories.map(c => c.id === id ? { ...c, ...updates } : c)
                }));
            },

            deleteCategory: (id) => {
                set((state) => ({
                    categories: state.categories.filter(c => c.id !== id),
                    // Optional: Reset habits with this category to undefined or a default? 
                    // For now let's keep the ID on habit but it won't be found, defaulting to "Uncategorized" in UI.
                }));
            },

            addHabit: (habitData) => {
                const newHabit: Habit = {
                    ...habitData,
                    id: crypto.randomUUID(),
                    createdAt: new Date().toISOString(),
                    archived: false,
                };
                set((state) => ({
                    habits: [...state.habits, newHabit]
                }));
            },

            updateHabit: (id, updates) => {
                set((state) => ({
                    habits: state.habits.map(h => h.id === id ? { ...h, ...updates } : h)
                }));
            },

            deleteHabit: (id) => {
                set((state) => ({
                    habits: state.habits.filter(h => h.id !== id)
                }));
            },

            toggleBinaryLog: (date, habitId) => {
                set((state) => {
                    const currentLogs = state.logs[date] || {};
                    const currentVal = currentLogs[habitId] || 0;
                    const newVal = currentVal === 0 ? 1 : 0;

                    return {
                        logs: {
                            ...state.logs,
                            [date]: {
                                ...currentLogs,
                                [habitId]: newVal
                            }
                        }
                    };
                });
            },

            setQuantitativeLog: (date, habitId, value) => {
                set((state) => {
                    const currentLogs = state.logs[date] || {};
                    return {
                        logs: {
                            ...state.logs,
                            [date]: {
                                ...currentLogs,
                                [habitId]: value
                            }
                        }
                    };
                });
            },
        }),
        {
            name: 'habit-tracker-storage',
            storage: createJSONStorage(() => localStorage),
            // Merge initial categories if not present in persisted state
            onRehydrateStorage: () => (state) => {
                if (state) {
                    if (!state.categories || state.categories.length === 0) {
                        state.categories = DEFAULT_CATEGORIES;
                    }
                    if (!state.habits) {
                        state.habits = [];
                    }
                    if (!state.logs) {
                        state.logs = {};
                    }
                }
            }
        }
    )
);

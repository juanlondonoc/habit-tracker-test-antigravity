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

const SECRET = import.meta.env.VITE_TRANSACTIONS_SECRET || '';

const getToken = async () => {
    // @ts-ignore
    if (window.Clerk && window.Clerk.session) {
        // @ts-ignore
        return await window.Clerk.session.getToken();
    }
    return null;
};

const neonStorage = {
    getItem: async (name: string): Promise<string | null> => {
        try {
            const token = await getToken();
            const res = await fetch(`/api/state?key=${name}`, {
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
            const data = await res.json();
            return data.value || null;
        } catch {
            return null;
        }
    },
    setItem: async (name: string, value: string): Promise<void> => {
        try {
            const token = await getToken();
            await fetch('/api/state', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
                },
                body: JSON.stringify({ key: name, value, token: SECRET })
            });
        } catch (e) {
            console.error('Failed to sync to neon', e);
        }
    },
    removeItem: async (name: string): Promise<void> => {
        try {
            const token = await getToken();
            await fetch(`/api/state?key=${name}&token=${SECRET}`, { 
                method: 'DELETE',
                headers: token ? { 'Authorization': `Bearer ${token}` } : {}
            });
        } catch (e) {
            console.error('Failed to delete from neon', e);
        }
    },
};

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
            reorderHabits: (habits) => {
                set({ habits });
            },
        }),
        {
            name: 'habit-tracker-storage',
            storage: createJSONStorage(() => neonStorage),
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

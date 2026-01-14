import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { HabitForm } from './HabitForm';
import { HabitItem } from './HabitItem';


interface ChecklistProps {
    selectedDate: Date;
}

export const Checklist: React.FC<ChecklistProps> = ({ selectedDate }) => {
    const { habits } = useHabitStore();
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="bg-card/50 rounded-3xl p-6 border border-white/5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Mis Hábitos</h2>
                <Button onClick={() => setIsCreating(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Nuevo
                </Button>
            </div>

            <div className="space-y-4">
                {habits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                        <p>No tienes hábitos aún.</p>
                        <Button variant="ghost" onClick={() => setIsCreating(true)} className="mt-2 text-primary">
                            Crear el primero
                        </Button>
                    </div>
                ) : (
                    habits.map(habit => (
                        <HabitItem
                            key={habit.id}
                            habit={habit}
                            selectedDate={selectedDate}
                        />
                    ))
                )}
            </div>

            <Modal
                isOpen={isCreating}
                onClose={() => setIsCreating(false)}
                title="Crear Nuevo Hábito"
            >
                <HabitForm onClose={() => setIsCreating(false)} />
            </Modal>
        </div>
    );
};

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import { useHabitStore } from '../../store/useHabitStore';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { HabitItem } from './HabitItem';
import { HabitManager } from './HabitManager';


interface ChecklistProps {
    selectedDate: Date;
}

export const Checklist: React.FC<ChecklistProps> = ({ selectedDate }) => {
    const { habits } = useHabitStore();
    const [isManaging, setIsManaging] = useState(false);

    return (
        <div className="bg-card/50 rounded-3xl p-6 border border-white/5 h-full flex flex-col">
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Mis Hábitos</h2>
                <Button onClick={() => setIsManaging(true)} variant="secondary" className="gap-2">
                    <Settings className="w-4 h-4" /> Gestionar
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {habits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                        <p>No tienes hábitos aún.</p>
                        <Button variant="ghost" onClick={() => setIsManaging(true)} className="mt-2 text-primary">
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
                isOpen={isManaging}
                onClose={() => setIsManaging(false)}
                title="Gestionar Hábitos"
            >
                <HabitManager onClose={() => setIsManaging(false)} />
            </Modal>
        </div>
    );
};

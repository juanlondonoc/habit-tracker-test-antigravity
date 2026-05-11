import React, { useState } from 'react';
import { useHabitStore } from '../../store/useHabitStore';
import { Button } from '../ui/button';
import { Plus } from 'lucide-react';
import { HabitItem } from './HabitItem';
import { Modal } from '../ui/modal';
import { HabitForm } from './HabitForm';

interface HabitManagerProps {
    onClose: () => void;
}

export const HabitManager: React.FC<HabitManagerProps> = ({ onClose }) => {
    const { habits } = useHabitStore();
    const [isCreating, setIsCreating] = useState(false);

    return (
        <div className="flex flex-col h-[600px] max-h-[80vh]">
            <div className="flex items-center justify-between mb-4 px-1">
                <p className="text-sm text-gray-400">Administra tus hábitos, edítalos o elimina los que ya no necesites.</p>
                <Button size="sm" onClick={() => setIsCreating(true)} className="gap-2">
                    <Plus className="w-4 h-4" /> Nuevo
                </Button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 p-1">
                {habits.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-48 text-gray-500 border-2 border-dashed border-gray-800 rounded-2xl">
                        <p>No tienes hábitos aún.</p>
                    </div>
                ) : (
                    habits.map(habit => (
                        <HabitItem 
                            key={habit.id} 
                            habit={habit} 
                            selectedDate={new Date()} 
                            showActions={true} 
                        />
                    ))
                )}
            </div>

            <div className="pt-4 border-t border-white/10 mt-4 flex justify-end">
                <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            </div>

            {/* Create New Modal */}
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

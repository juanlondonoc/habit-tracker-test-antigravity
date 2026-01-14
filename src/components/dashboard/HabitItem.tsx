import React, { useState, useEffect } from 'react';
import { Check, Edit2, Trash2 } from 'lucide-react';
import { Habit } from '../../types';
import { useHabitStore } from '../../store/useHabitStore';
import { isCompleted } from '../../lib/metrics';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Modal } from '../ui/modal';
import { HabitForm } from './HabitForm';
import { format } from 'date-fns';

interface HabitItemProps {
    habit: Habit;
    selectedDate: Date;
    onEdit?: () => void;
    onDelete?: () => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({ habit, selectedDate }) => {
    const { logs, categories, toggleBinaryLog, setQuantitativeLog, deleteHabit } = useHabitStore();
    const [isEditing, setIsEditing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const category = categories.find(c => c.id === habit.categoryId);
    const color = category?.color || '#6B7280'; // Gray-500 default

    const dateStr = format(selectedDate, 'yyyy-MM-dd');
    const currentLogValue = logs[dateStr]?.[habit.id] || 0;

    // Quantitative temporary state for input before blur
    const [val, setVal] = useState(currentLogValue.toString());

    // Sync val with currentLogValue if currentLogValue changes externally
    useEffect(() => {
        setVal(currentLogValue.toString());
    }, [currentLogValue]);

    const completed = isCompleted(habit, currentLogValue);

    return (
        <div className={cn(
            "group relative flex items-center justify-between p-3 rounded-2xl bg-[#161821] border transition-all duration-200",
            completed
                ? "border-emerald-500/20 bg-emerald-500/5"
                : "border-white/5 hover:border-white/10"
        )}>
            {/* Visual Color Indicator strip */}
            <div
                className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full"
                style={{ backgroundColor: color }}
            />

            <div className="flex flex-col pl-3 gap-1 flex-1">
                {/* Top Row: Name + Actions */}
                <div className="flex items-center justify-between">
                    <h3 className={cn("font-medium text-base leading-none truncate pr-2", completed ? "text-white line-through decoration-white/20" : "text-gray-200")}>
                        {habit.name}
                    </h3>

                    {/* Actions Dropdown / buttons (visible on hover) */}
                    <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-2 shrink-0">
                        <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}>
                            <Edit2 className="w-4 h-4 text-gray-400" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={() => setIsDeleting(true)}>
                            <Trash2 className="w-4 h-4 text-red-400" />
                        </Button>
                    </div>
                </div>

                {/* Bottom Row: Checkbox/Input + Category Dot */}
                <div className="flex items-center gap-3 mt-2">
                    <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-white/5 text-gray-400 border border-white/5 flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
                        {category?.name || 'Sin Categoría'}
                    </span>

                    <div className="flex-1" />

                    {habit.type === 'binary' ? (
                        <button
                            onClick={() => toggleBinaryLog(dateStr, habit.id)}
                            className={cn(
                                "flex items-center justify-center w-8 h-8 rounded-lg transition-all duration-200 border",
                                completed
                                    ? "text-white border-transparent"
                                    : "bg-transparent border-white/20 text-transparent hover:border-white/40"
                            )}
                            style={{ backgroundColor: completed ? color : undefined }}
                        >
                            <Check className="w-4 h-4 stroke-[3]" />
                        </button>
                    ) : (
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                value={val}
                                onChange={(e) => {
                                    setVal(e.target.value);
                                    const num = parseFloat(e.target.value);
                                    if (!isNaN(num)) setQuantitativeLog(dateStr, habit.id, num);
                                }}
                                className={cn(
                                    "w-14 h-8 text-center rounded-lg bg-black/30 border text-white font-bold text-sm focus:outline-none focus:ring-1 transition-colors",
                                    completed ? "border-transparent text-white" : "border-gray-700"
                                )}
                                style={{ borderColor: completed ? color : undefined }}
                            />
                            <span className="text-xs text-gray-500 font-medium lowercase self-center">/ {habit.target} {habit.unit}</span>
                        </div>
                    )}
                </div>

                {/* Progress Bar for Quantitative */}
                {habit.type === 'quantitative' && habit.target && (
                    <div className="w-full h-1 bg-[#0E0F13] rounded-full overflow-hidden mt-1 max-w-[200px] opacity-40">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, (currentLogValue / habit.target) * 100)}%`, background: color }}
                        />
                    </div>
                )}

            </div>

            {/* Edit Modal */}
            <Modal
                isOpen={isEditing}
                onClose={() => setIsEditing(false)}
                title="Editar Hábito"
            >
                <HabitForm initialData={habit} onClose={() => setIsEditing(false)} />
            </Modal>

            {/* Delete Confirmation Modal */}
            <Modal
                isOpen={isDeleting}
                onClose={() => setIsDeleting(false)}
                title="Eliminar Hábito"
            >
                <div className="space-y-4">
                    <p className="text-gray-300">¿Estás seguro de que quieres eliminar <b>"{habit.name}"</b>? Se perderá todo el historial registrado.</p>
                    <div className="flex justify-end gap-3 pt-2">
                        <Button variant="secondary" onClick={() => setIsDeleting(false)}>Cancelar</Button>
                        <Button variant="danger" onClick={() => { deleteHabit(habit.id); setIsDeleting(false); }}>Eliminar</Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};

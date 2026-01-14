import React, { useState } from 'react';
import { useHabitStore } from '../../store/useHabitStore';
import { HabitType, Habit } from '../../types';
import { Target, CheckCircle2, Settings2 } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Modal } from '../ui/modal';
import { CategoryManager } from './CategoryManager';

interface HabitFormProps {
    onClose: () => void;
    initialData?: Habit;
}

export const HabitForm: React.FC<HabitFormProps> = ({ onClose, initialData }) => {
    const { addHabit, updateHabit, categories } = useHabitStore();
    const [showCatManager, setShowCatManager] = useState(false);

    const [formData, setFormData] = useState({
        name: initialData?.name || '',
        categoryId: initialData?.categoryId || categories[0]?.id || '',
        type: (initialData?.type || 'binary') as HabitType,
        target: initialData?.target || 1,
        unit: initialData?.unit || '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        if (initialData) {
            updateHabit(initialData.id, formData);
        } else {
            addHabit({
                ...formData,
                frequency: 'daily',
                archived: false,
            });
        }
        onClose();
    };

    return (
        <>
            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                {/* Name */}
                <div className="space-y-2">
                    <Label>Nombre del Hábito</Label>
                    <Input
                        placeholder="Ej. Leer 30 minutos"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        required
                        autoFocus
                    />
                </div>

                {/* Category */}
                <div className="space-y-2">
                    <div className="flex justify-between items-center">
                        <Label>Categoría</Label>
                        <button type="button" onClick={() => setShowCatManager(true)} className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors">
                            <Settings2 className="w-3 h-3" />
                            Gestionar
                        </button>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                        {categories.map(cat => (
                            <button
                                key={cat.id}
                                type="button"
                                onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                                className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${formData.categoryId === cat.id
                                    ? 'border-white/40 bg-white/10 text-white'
                                    : 'border-transparent bg-black/20 text-gray-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <div className="w-3 h-3 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}` }} />
                                <span className="text-sm font-medium">{cat.name}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Type Selection */}
                <div className="space-y-2">
                    <Label>Tipo de Meta</Label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'binary' })}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.type === 'binary'
                                ? 'bg-blue-600/20 border-blue-500 text-blue-100'
                                : 'bg-black/20 border-white/5 text-gray-400 hover:bg-black/40'
                                }`}
                        >
                            <CheckCircle2 className="w-6 h-6" />
                            <span className="text-sm font-medium">Si / No</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setFormData({ ...formData, type: 'quantitative' })}
                            className={`p-3 rounded-xl border flex flex-col items-center gap-2 transition-all ${formData.type === 'quantitative'
                                ? 'bg-green-600/20 border-green-500 text-green-100'
                                : 'bg-black/20 border-white/5 text-gray-400 hover:bg-black/40'
                                }`}
                        >
                            <Target className="w-6 h-6" />
                            <span className="text-sm font-medium">Cuantitativo</span>
                        </button>
                    </div>
                </div>

                {/* Quantitative Details */}
                {formData.type === 'quantitative' && (
                    <div className="grid grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                            <Label>Meta Diaria</Label>
                            <Input
                                type="number"
                                min="1"
                                value={formData.target}
                                onChange={e => setFormData({ ...formData, target: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Unidad</Label>
                            <Input
                                placeholder="mins, págs, etc."
                                value={formData.unit}
                                onChange={e => setFormData({ ...formData, unit: e.target.value })}
                            />
                        </div>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 pt-4">
                    <Button type="button" variant="secondary" className="flex-1" onClick={onClose}>
                        Cancelar
                    </Button>
                    <Button type="submit" disabled={!formData.name} className="flex-1">
                        {initialData ? 'Guardar Cambios' : 'Crear Hábito'}
                    </Button>
                </div>
            </form>

            <Modal isOpen={showCatManager} onClose={() => setShowCatManager(false)} title="Gestionar Categorías">
                <CategoryManager onClose={() => setShowCatManager(false)} />
            </Modal>
        </>
    );
};

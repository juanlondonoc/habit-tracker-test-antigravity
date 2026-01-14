import React, { useState } from 'react';
import { useHabitStore } from '../../store/useHabitStore';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Trash2, Edit2, Save } from 'lucide-react';

interface CategoryManagerProps {
    onClose: () => void;
}

const PRESET_COLORS = [
    '#EF4444', // Red
    '#F59E0B', // Orange
    '#10B981', // Green
    '#06B6D4', // Cyan
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#64748B', // Slate
    '#F9fafb', // White
];

export const CategoryManager: React.FC<CategoryManagerProps> = ({ onClose }) => {
    const { categories, addCategory, updateCategory, deleteCategory } = useHabitStore();
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isCreating, setIsCreating] = useState(false);

    // Form State
    const [formData, setFormData] = useState({ name: '', color: PRESET_COLORS[0] });

    const resetForm = () => {
        setFormData({ name: '', color: PRESET_COLORS[0] });
        setEditingId(null);
        setIsCreating(false);
    };

    const handleEdit = (cat: any) => {
        setFormData({ name: cat.name, color: cat.color });
        setEditingId(cat.id);
        setIsCreating(false);
    };

    const handleSave = () => {
        if (!formData.name.trim()) return;

        if (editingId) {
            updateCategory(editingId, formData);
        } else {
            addCategory(formData);
        }
        resetForm();
    };

    const handleDelete = (id: string, name: string) => {
        if (confirm(`¿Eliminar categoría "${name}"? Los hábitos perderán su color asignado.`)) {
            deleteCategory(id);
        }
    };

    return (
        <div className="flex flex-col h-[500px]">
            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 p-1">

                {/* List */}
                {categories.map(cat => (
                    <div key={cat.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5 hover:border-white/10 transition-colors group">
                        {editingId === cat.id ? (
                            /* Editing Mode Row */
                            <div className="flex-1 flex flex-col gap-3">
                                <div className="flex items-center gap-2">
                                    <Input
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        className="h-9"
                                        placeholder="Nombre"
                                        autoFocus
                                    />
                                </div>
                                <div className="flex gap-2 flex-wrap">
                                    {PRESET_COLORS.map(c => (
                                        <button
                                            key={c}
                                            onClick={() => setFormData({ ...formData, color: c })}
                                            className={`w-6 h-6 rounded-full border-2 transition-transform ${formData.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                                            style={{ backgroundColor: c }}
                                        />
                                    ))}
                                </div>
                                <div className="flex justify-end gap-2 mt-1">
                                    <Button size="sm" variant="ghost" onClick={resetForm}>Cancelar</Button>
                                    <Button size="sm" onClick={handleSave}><Save className="w-4 h-4 mr-1" /> Guardar</Button>
                                </div>
                            </div>
                        ) : (
                            /* View Mode Row */
                            <>
                                <div className="flex items-center gap-3">
                                    <div className="w-4 h-4 rounded-full shadow-[0_0_8px]" style={{ backgroundColor: cat.color, boxShadow: `0 0 8px ${cat.color}` }} />
                                    <span className="font-medium">{cat.name}</span>
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white" onClick={() => handleEdit(cat)}>
                                        <Edit2 className="w-4 h-4" />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-red-400" onClick={() => handleDelete(cat.id, cat.name)}>
                                        <Trash2 className="w-4 h-4" />
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                ))}

                {/* Create New Form */}
                {isCreating ? (
                    <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-3 animate-in fade-in slide-in-from-bottom-2">
                        <div className="flex items-center gap-2">
                            <Input
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                                className="h-9"
                                placeholder="Nueva Categoría"
                                autoFocus
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {PRESET_COLORS.map(c => (
                                <button
                                    key={c}
                                    onClick={() => setFormData({ ...formData, color: c })}
                                    className={`w-6 h-6 rounded-full border-2 transition-transform ${formData.color === c ? 'border-white scale-110' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: c }}
                                />
                            ))}
                        </div>
                        <div className="flex justify-end gap-2 mt-1">
                            <Button size="sm" variant="ghost" onClick={resetForm}>Cancelar</Button>
                            <Button size="sm" onClick={handleSave}>Crear</Button>
                        </div>
                    </div>
                ) : (
                    <Button
                        variant="secondary"
                        className="w-full py-6 border-dashed border-white/20 bg-transparent hover:bg-white/5"
                        onClick={() => { resetForm(); setIsCreating(true); }}
                    >
                        <Plus className="w-5 h-5 mr-2" />
                        Nueva Categoría
                    </Button>
                )}

            </div>

            <div className="pt-4 border-t border-white/10 mt-4 flex justify-end">
                <Button variant="ghost" onClick={onClose}>Cerrar</Button>
            </div>
        </div>
    );
};

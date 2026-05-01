import React, { useState, useEffect } from 'react';
import { Plus, Trash2, X, Check } from 'lucide-react';
import { useAuth } from '@clerk/clerk-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';

interface Category {
  id: string;
  name: string;
  color: string;
  icon: string;
}

const PRESET_COLORS = [
  '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16', 
  '#10b981', '#06b6d4', '#3b82f6', '#6366f1', '#8b5cf6', 
  '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#64748b'
];

export const TransactionCategoryManager: React.FC<{ 
  onClose: () => void, 
  onUpdate: () => void 
}> = ({ onClose, onUpdate }) => {
  const { getToken } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState('');
  const [selectedColor, setSelectedColor] = useState(PRESET_COLORS[7]);
  const [isAdding, setIsAdding] = useState(false);

  const fetchCategories = async () => {
    try {
      const token = await getToken();
      const res = await fetch('/api/categories', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      const data = await res.json();
      setCategories(Array.isArray(data) ? data : []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const addCategory = async () => {
    if (!newName.trim()) return;
    try {
      const token = await getToken();
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ name: newName, color: selectedColor, icon: 'MoreHorizontal' })
      });
      if (res.ok) {
        setNewName('');
        setIsAdding(false);
        fetchCategories();
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const deleteCategory = async (id: string) => {
    try {
      const token = await getToken();
      const res = await fetch(`/api/categories?id=${id}`, {
        method: 'DELETE',
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        fetchCategories();
        onUpdate();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      {!isAdding ? (
        <Button 
          onClick={() => setIsAdding(true)} 
          className="w-full gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white"
        >
          <Plus className="w-4 h-4" /> Nueva Categoría
        </Button>
      ) : (
        <div className="bg-white/5 p-4 rounded-2xl border border-white/10 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-white">Nueva Categoría</span>
            <button onClick={() => setIsAdding(false)} className="text-gray-500 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <Input 
            placeholder="Nombre (ej. Suscripciones)" 
            value={newName} 
            onChange={(e) => setNewName(e.target.value)}
            className="bg-black/20"
          />

          <div className="flex flex-wrap gap-2">
            {PRESET_COLORS.map(color => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`w-8 h-8 rounded-full border-2 transition-all ${selectedColor === color ? 'border-white scale-110' : 'border-transparent'}`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="secondary" className="flex-1" onClick={() => setIsAdding(false)}>Cancelar</Button>
            <Button className="flex-1 bg-primary" onClick={addCategory} disabled={!newName.trim()}>Crear</Button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
        {loading ? (
          <div className="text-center py-8 text-gray-500 text-sm">Cargando...</div>
        ) : categories.length === 0 ? (
          <div className="text-center py-8 text-gray-500 text-sm italic">No tienes categorías aún</div>
        ) : (
          categories.map(cat => (
            <div key={cat.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5 group">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color, boxShadow: `0 0 10px ${cat.color}40` }} />
                <span className="text-sm font-medium text-white">{cat.name}</span>
              </div>
              <button 
                onClick={() => deleteCategory(cat.id)}
                className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

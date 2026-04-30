import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  PlusCircle, ShoppingBag, Car, UtensilsCrossed, Film,
  Heart, BookOpen, Smartphone, Zap, MoreHorizontal,
  Trash2, X, TrendingDown, Wallet, RefreshCw, Calendar,
  Target,
} from 'lucide-react';
import {
  format, isToday, isThisMonth, parseISO,
  startOfMonth, endOfMonth, eachDayOfInterval, subMonths, isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { BarChart, Bar, XAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { cn } from '../../lib/utils';
import { Button } from '../ui/button';
import { Transaction, CATEGORIES } from '../../types/transaction';

const ICON_MAP: Record<string, React.ElementType> = {
  Comida: UtensilsCrossed,
  Transporte: Car,
  Entretenimiento: Film,
  Compras: ShoppingBag,
  Salud: Heart,
  Educación: BookOpen,
  Suscripciones: Smartphone,
  Servicios: Zap,
  Otros: MoreHorizontal,
};

const SECRET = import.meta.env.VITE_TRANSACTIONS_SECRET || '';

function fmt(amount: number, currency = 'COP') {
  if (currency === 'COP') {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(amount);
  }
  return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(amount);
}

function getCat(name: string) {
  return CATEGORIES.find((c) => c.name === name) ?? CATEGORIES[CATEGORIES.length - 1];
}

// ── Add Transaction Modal ─────────────────────────────────────────────────────
interface AddModalProps {
  onClose: () => void;
  onAdded: (tx: Transaction) => void;
}

function AddModal({ onClose, onAdded }: AddModalProps) {
  const [form, setForm] = useState({
    amount: '',
    merchant: '',
    category: 'Otros',
    currency: 'COP',
    note: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.amount || !form.merchant) { setError('Completa monto y comercio'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, source: 'manual', token: SECRET, date: new Date().toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      onAdded(data.transaction);
      onClose();
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-md bg-[#161821] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4">
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <h2 className="font-semibold text-white text-lg">Agregar gasto</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={submit} className="p-5 space-y-4">
          {error && <p className="text-red-400 text-sm bg-red-500/10 rounded-lg px-3 py-2">{error}</p>}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Monto *</label>
              <input
                type="number" inputMode="decimal" placeholder="0"
                value={form.amount} onChange={set('amount')} required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Moneda</label>
              <select value={form.currency} onChange={set('currency')}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary/50 text-sm">
                <option value="COP">COP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Comercio *</label>
            <input type="text" placeholder="Ej: Starbucks, Rappi..."
              value={form.merchant} onChange={set('merchant')} required
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 text-sm"
            />
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Categoría</label>
            <select value={form.category} onChange={set('category')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-primary/50 text-sm">
              {CATEGORIES.map((c) => <option key={c.name} value={c.name}>{c.name}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-400 mb-1 block">Nota (opcional)</label>
            <input type="text" placeholder="Descripción opcional..."
              value={form.note} onChange={set('note')}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-white placeholder-gray-600 focus:outline-none focus:border-primary/50 text-sm"
            />
          </div>

          <Button type="submit" disabled={loading} className="w-full bg-primary hover:bg-primary/90 text-white rounded-xl py-2.5">
            {loading ? 'Guardando...' : 'Guardar gasto'}
          </Button>
        </form>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export function TransactionsDashboard() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  
  // Settings (Simple local budget for now)
  const [budget, setBudget] = useState(() => {
    const saved = localStorage.getItem('habitcore_budget');
    return saved ? parseFloat(saved) : 2000000;
  });
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [tempBudget, setTempBudget] = useState(budget.toString());

  // Filters
  const [filter, setFilter] = useState<'current' | 'prev' | '7d'>('current');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const saveBudget = () => {
    const nb = parseFloat(tempBudget) || 0;
    setBudget(nb);
    localStorage.setItem('habitcore_budget', nb.toString());
    setIsEditingBudget(false);
  };

  async function deleteTx(id: string) {
    setDeleting(id);
    try {
      await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, token: SECRET }),
      });
      setTransactions((prev) => prev.filter((t) => t.id !== id));
    } finally {
      setDeleting(null);
    }
  }

  // Filtered transactions
  const filteredTxs = useMemo(() => {
    const now = new Date();
    if (filter === 'prev') {
        const prevMonth = subMonths(now, 1);
        return transactions.filter(t => isSameMonth(parseISO(t.date), prevMonth));
    }
    if (filter === '7d') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return transactions.filter(t => parseISO(t.date) >= weekAgo);
    }
    return transactions.filter(t => isThisMonth(parseISO(t.date)));
  }, [transactions, filter]);

  // Stats
  const totalSpend = filteredTxs.reduce((s, t) => s + t.amount, 0);
  const remaining = budget - totalSpend;
  const spendPercent = Math.min(100, (totalSpend / budget) * 100);

  // Category breakdown
  const catBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTxs.forEach(t => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .map(([name, total]) => ({ name, total, percent: (total / totalSpend) * 100 }))
      .sort((a, b) => b.total - a.total);
  }, [filteredTxs, totalSpend]);

  // Chart data
  const now = new Date();
  const days = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) });
  const chartData = days.map((d) => ({
    label: format(d, 'd', { locale: es }),
    total: transactions
      .filter((t) => format(parseISO(t.date), 'yyyy-MM-dd') === format(d, 'yyyy-MM-dd'))
      .reduce((s, t) => s + t.amount, 0),
  }));

  return (
    <div className="space-y-5 pb-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Gastos</h2>
          <p className="text-sm text-gray-400">
            {filter === 'current' ? 'Este mes' : filter === 'prev' ? 'Mes pasado' : 'Últimos 7 días'}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
          </button>
          <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90 rounded-xl flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Nuevo
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex bg-white/5 p-1 rounded-xl gap-1">
        {[
          { id: 'current', label: 'Este mes' },
          { id: '7d', label: '7 días' },
          { id: 'prev', label: 'Anterior' },
        ].map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id as any)}
            className={cn(
              "flex-1 py-1.5 text-xs font-medium rounded-lg transition-all",
              filter === f.id ? "bg-white/10 text-white shadow-sm" : "text-gray-500 hover:text-gray-300"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Budget Card (Remanente) */}
      <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-6 shadow-xl shadow-indigo-900/20 relative overflow-hidden">
        <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-3xl" />
        
        <div className="flex justify-between items-start mb-6">
          <div 
            className="cursor-pointer group"
            onClick={() => { setIsEditingBudget(true); setTempBudget(budget.toString()); }}
          >
            <p className="text-indigo-100/70 text-sm font-medium mb-1 group-hover:text-white transition-colors">Presupuesto Restante</p>
            <h3 className="text-3xl font-bold text-white tracking-tight group-hover:scale-[1.02] transition-transform origin-left">{fmt(remaining)}</h3>
          </div>
          <button 
            onClick={() => { setIsEditingBudget(true); setTempBudget(budget.toString()); }}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all"
          >
            <Target className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-indigo-100/80">
            <span>Gastado: {fmt(totalSpend)}</span>
            <span>Meta: {fmt(budget)}</span>
          </div>
          <div className="h-2 w-full bg-black/20 rounded-full overflow-hidden">
            <div 
              className={cn(
                "h-full transition-all duration-1000 ease-out rounded-full",
                spendPercent > 90 ? "bg-red-400" : spendPercent > 70 ? "bg-yellow-400" : "bg-emerald-400"
              )}
              style={{ width: `${spendPercent}%` }}
            />
          </div>
        </div>

        {isEditingBudget && (
          <div className="absolute inset-0 bg-[#161821] flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in-95">
             <p className="text-sm text-gray-400 mb-3">Define tu presupuesto mensual</p>
             <div className="flex gap-2 w-full">
               <input 
                autoFocus
                type="number" 
                value={tempBudget} 
                onChange={(e) => setTempBudget(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white focus:outline-none focus:border-primary"
               />
               <Button onClick={saveBudget} className="bg-primary">OK</Button>
             </div>
             <button onClick={() => setIsEditingBudget(false)} className="mt-4 text-xs text-gray-500 hover:text-white">Cancelar</button>
          </div>
        )}
      </div>

      {/* Category Breakdown */}
      <div className="bg-[#161821] border border-white/5 rounded-3xl p-5">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <TrendingDown className="w-4 h-4 text-primary" />
          Desglose por Categoría
        </h3>
        
        {catBreakdown.length === 0 ? (
          <p className="text-xs text-gray-500 text-center py-4 italic">No hay datos en este periodo</p>
        ) : (
          <div className="space-y-4">
            {catBreakdown.map(cat => {
              const info = getCat(cat.name);
              const Icon = ICON_MAP[cat.name] || MoreHorizontal;
              return (
                <div key={cat.name} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center", info.bg)}>
                        <Icon className={cn("w-3 h-3", info.color)} />
                      </div>
                      <span className="text-gray-300">{cat.name}</span>
                    </div>
                    <span className="text-white font-medium">{fmt(cat.total)}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full transition-all duration-1000"
                      style={{ width: `${cat.percent}%`, backgroundColor: info.hex }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart (Only for current month) */}
      {filter === 'current' && transactions.length > 0 && (
        <div className="bg-[#161821] border border-white/5 rounded-3xl p-5">
          <p className="text-xs text-gray-400 mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4" /> Historial Diario
          </p>
          <ResponsiveContainer width="100%" height={100}>
            <BarChart data={chartData} barSize={6}>
              <XAxis dataKey="label" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} interval={3} />
              <Tooltip
                contentStyle={{ background: '#1f2937', border: 'none', borderRadius: 8, fontSize: 12 }}
                labelStyle={{ color: '#fff' }}
                formatter={(v: number) => [fmt(v), 'Gasto']}
              />
              <Bar dataKey="total" radius={[4, 4, 0, 0]}>
                {chartData.map((_, i) => (
                  <Cell key={i} fill={isToday(days[i]) ? '#3b82f6' : '#3b82f620'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Recent Transactions List */}
      <div className="bg-[#161821] border border-white/5 rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <h3 className="font-semibold text-sm text-white flex items-center gap-2">
            <RefreshCw className="w-4 h-4 text-gray-500" /> Transacciones
          </h3>
          <span className="text-xs text-gray-500">{filteredTxs.length} registros</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        ) : filteredTxs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
            <Wallet className="w-10 h-10 opacity-20" />
            <p className="text-sm">Sin transacciones aún</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {filteredTxs.slice(0, 15).map((tx) => {
              const cat = getCat(tx.category);
              const Icon = ICON_MAP[tx.category] ?? MoreHorizontal;
              return (
                <li key={tx.id} className="flex items-center gap-3 px-5 py-4 hover:bg-white/[0.02] transition-colors group">
                  <div className={cn('w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 border', cat.bg)}>
                    <Icon className={cn('w-5 h-5', cat.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.merchant}</p>
                    <p className="text-xs text-gray-500">
                      {format(parseISO(tx.date), "d MMM · HH:mm", { locale: es })}
                      {tx.source === 'apple_pay' && <span className="ml-1 text-primary/60">· Apple Pay</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-white">{fmt(tx.amount, tx.currency)}</span>
                    <button
                      onClick={() => deleteTx(tx.id)}
                      disabled={deleting === tx.id}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-xl hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      
      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={(tx) => setTransactions((p) => [tx, ...p])} />}
    </div>
  );
}

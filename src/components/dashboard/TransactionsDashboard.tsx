import React, { useState, useEffect, useCallback } from 'react';
import {
  PlusCircle, ShoppingBag, Car, UtensilsCrossed, Film,
  Heart, BookOpen, Smartphone, Zap, MoreHorizontal,
  Trash2, X, TrendingDown, Wallet, RefreshCw,
} from 'lucide-react';
import {
  format, isToday, isThisWeek, isThisMonth, parseISO,
  startOfMonth, endOfMonth, eachDayOfInterval,
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
      <div className="w-full max-w-md bg-[#161821] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
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

  // Stats
  const todayTotal = transactions.filter((t) => isToday(parseISO(t.date))).reduce((s, t) => s + t.amount, 0);
  const weekTotal = transactions.filter((t) => isThisWeek(parseISO(t.date), { locale: es })).reduce((s, t) => s + t.amount, 0);
  const monthTotal = transactions.filter((t) => isThisMonth(parseISO(t.date))).reduce((s, t) => s + t.amount, 0);

  // Chart data — last 14 days of this month
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
          <p className="text-sm text-gray-400">{format(now, 'MMMM yyyy', { locale: es })}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={load} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all">
            <RefreshCw className="w-4 h-4" />
          </button>
          <Button onClick={() => setShowAdd(true)} className="bg-primary hover:bg-primary/90 rounded-xl flex items-center gap-2">
            <PlusCircle className="w-4 h-4" /> Nuevo
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Hoy', value: todayTotal },
          { label: 'Semana', value: weekTotal },
          { label: 'Este mes', value: monthTotal },
        ].map(({ label, value }) => (
          <div key={label} className="bg-[#161821] border border-white/5 rounded-2xl p-4 flex flex-col gap-1">
            <span className="text-xs text-gray-400">{label}</span>
            <span className="text-base font-bold text-white leading-tight">{fmt(value)}</span>
          </div>
        ))}
      </div>

      {/* Chart */}
      {transactions.length > 0 && (
        <div className="bg-[#161821] border border-white/5 rounded-2xl p-4">
          <p className="text-xs text-gray-400 mb-3">Gasto diario del mes</p>
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

      {/* Transaction list */}
      <div className="bg-[#161821] border border-white/5 rounded-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <h3 className="font-semibold text-sm text-white">Transacciones</h3>
          <span className="text-xs text-gray-500">{transactions.length} registros</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 text-gray-500 text-sm gap-2">
            <RefreshCw className="w-4 h-4 animate-spin" /> Cargando...
          </div>
        ) : transactions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-500 gap-3">
            <Wallet className="w-10 h-10 opacity-20" />
            <p className="text-sm">Sin transacciones aún</p>
            <p className="text-xs text-gray-600">Agrega una manualmente o configura el Shortcut de iOS</p>
          </div>
        ) : (
          <ul className="divide-y divide-white/5">
            {transactions.map((tx) => {
              const cat = getCat(tx.category);
              const Icon = ICON_MAP[tx.category] ?? MoreHorizontal;
              return (
                <li key={tx.id} className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.02] transition-colors group">
                  <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 border', cat.bg)}>
                    <Icon className={cn('w-4 h-4', cat.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-white truncate">{tx.merchant}</p>
                    <p className="text-xs text-gray-500">
                      {tx.category} · {format(parseISO(tx.date), "d MMM, HH:mm", { locale: es })}
                      {tx.source === 'apple_pay' && <span className="ml-1 text-gray-600">· Apple Pay</span>}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-white">{fmt(tx.amount, tx.currency)}</span>
                    <button
                      onClick={() => deleteTx(tx.id)}
                      disabled={deleting === tx.id}
                      className="opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-red-500/20 text-gray-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* iOS Shortcut info */}
      <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 border border-blue-500/20 rounded-2xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0">
            <TrendingDown className="w-4 h-4 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold text-white mb-1">Automatiza con iOS Shortcuts</p>
            <p className="text-xs text-gray-400 leading-relaxed">
              Configura un Shortcut en tu iPhone para que cada vez que llegue una notificación de Apple Pay,
              se registre automáticamente aquí.
            </p>
            <p className="text-xs text-blue-400 mt-2">
              Endpoint: <span className="font-mono">POST /api/transactions</span>
            </p>
          </div>
        </div>
      </div>

      {showAdd && <AddModal onClose={() => setShowAdd(false)} onAdded={(tx) => setTransactions((p) => [tx, ...p])} />}
    </div>
  );
}

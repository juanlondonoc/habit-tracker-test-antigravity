export interface Transaction {
  id: string;
  amount: number;
  merchant: string;
  date: string;
  currency: string;
  category: string;
  note: string;
  source: 'apple_pay' | 'manual';
}

export const CATEGORIES = [
  { name: 'Comida', color: 'text-orange-400', bg: 'bg-orange-500/10 border-orange-500/20', hex: '#fb923c' },
  { name: 'Transporte', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20', hex: '#60a5fa' },
  { name: 'Entretenimiento', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/20', hex: '#c084fc' },
  { name: 'Compras', color: 'text-pink-400', bg: 'bg-pink-500/10 border-pink-500/20', hex: '#f472b6' },
  { name: 'Salud', color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', hex: '#f87171' },
  { name: 'Educación', color: 'text-teal-400', bg: 'bg-teal-500/10 border-teal-500/20', hex: '#2dd4bf' },
  { name: 'Suscripciones', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/20', hex: '#818cf8' },
  { name: 'Servicios', color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', hex: '#facc15' },
  { name: 'Otros', color: 'text-gray-400', bg: 'bg-gray-500/10 border-gray-500/20', hex: '#9ca3af' },
] as const;

export type CategoryName = typeof CATEGORIES[number]['name'];

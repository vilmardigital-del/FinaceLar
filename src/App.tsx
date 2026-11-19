import { useEffect, useState } from 'react';
import { CalculatorPage } from './components/CalculatorPage';
import { EntryForm } from './components/EntryForm';
import { PixReceiptsPage } from './components/PixReceiptsPage';
import { ShoppingListPage } from './components/ShoppingListPage';
import { TransactionList } from './components/TransactionList';
import {
  ActivePage,
  Transaction,
  TransactionDescricao,
  TransactionType,
} from './types';

const STORAGE_KEY = 'caixa_simples_lancamentos_v1';

function loadTransactions(): Transaction[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (item): item is Transaction =>
        item &&
        typeof item.id === 'string' &&
        (item.type === 'entrada' || item.type === 'saida') &&
        typeof item.descricao === 'string' &&
        typeof item.amount === 'number' &&
        typeof item.createdAt === 'string'
    );
  } catch {
    return [];
  }
}

export default function App() {
  const [activePage, setActivePage] = useState<ActivePage>('lancar');
  const [transactions, setTransactions] = useState<Transaction[]>(loadTransactions);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [transactions]);

  function handleSaveEntry(entry: {
    type: TransactionType;
    descricao: TransactionDescricao;
    amount: number;
  }) {
    const newItem: Transaction = {
      id:
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      type: entry.type,
      descricao: entry.descricao,
      amount: entry.amount,
      createdAt: new Date().toISOString(),
    };
    setTransactions((prev) => [newItem, ...prev]);
  }

  function handleDeleteEntry(id: string) {
    setTransactions((prev) => prev.filter((item) => item.id !== id));
  }

  const entradas = transactions.filter((item) => item.type === 'entrada');
  const saidas = transactions.filter((item) => item.type === 'saida');
  const totalEntradas = entradas.reduce((acc, item) => acc + item.amount, 0);
  const totalSaidas = saidas.reduce((acc, item) => acc + item.amount, 0);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
      <header className="w-full border-b border-[#E4E7EC] bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-2.5 sm:py-0 sm:h-16 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-8">
          <div className="flex items-center justify-between sm:justify-start">
            <button
              type="button"
              onClick={() => setActivePage('lancar')}
              className="inline-flex items-center gap-2.5 min-h-[44px] text-lg font-bold tracking-tight text-[#111827] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 36 24"
                className="w-9 h-6 shrink-0"
                fill="none"
              >
                <rect
                  x="1"
                  y="1"
                  width="34"
                  height="22"
                  rx="3.5"
                  fill="#ECFDF3"
                  stroke="#067647"
                  strokeWidth="1.75"
                />
                <rect
                  x="4"
                  y="4"
                  width="28"
                  height="16"
                  rx="2"
                  stroke="#067647"
                  strokeOpacity="0.35"
                  strokeWidth="1"
                />
                <circle
                  cx="18"
                  cy="12"
                  r="5.5"
                  fill="#D1FADF"
                  stroke="#067647"
                  strokeWidth="1.2"
                />
                <text
                  x="18"
                  y="15"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#067647"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  $
                </text>
              </svg>
              <span>LarFinance</span>
            </button>
          </div>

          <nav
            aria-label="Páginas"
            className="flex flex-wrap items-center justify-between sm:justify-end gap-x-4 gap-y-1 sm:gap-6 border-t border-[#F2F4F7] sm:border-t-0 pt-1 sm:pt-0"
          >
            <button
              type="button"
              onClick={() => setActivePage('lancar')}
              aria-current={activePage === 'lancar' ? 'page' : undefined}
              className={`min-h-[44px] px-1 text-[13px] sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                activePage === 'lancar'
                  ? 'border-[#111827] text-[#111827] font-semibold'
                  : 'border-transparent text-[#667085] hover:text-[#111827]'
              }`}
            >
              Lançar
            </button>
            <button
              type="button"
              onClick={() => setActivePage('entradas')}
              aria-current={activePage === 'entradas' ? 'page' : undefined}
              className={`min-h-[44px] px-1 text-[13px] sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                activePage === 'entradas'
                  ? 'border-[#067647] text-[#067647] font-semibold'
                  : 'border-transparent text-[#667085] hover:text-[#111827]'
              }`}
            >
              Entradas
            </button>
            <button
              type="button"
              onClick={() => setActivePage('saidas')}
              aria-current={activePage === 'saidas' ? 'page' : undefined}
              className={`min-h-[44px] px-1 text-[13px] sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                activePage === 'saidas'
                  ? 'border-[#B42318] text-[#B42318] font-semibold'
                  : 'border-transparent text-[#667085] hover:text-[#111827]'
              }`}
            >
              Saídas
            </button>
            <button
              type="button"
              onClick={() => setActivePage('calculadora')}
              aria-current={activePage === 'calculadora' ? 'page' : undefined}
              className={`min-h-[44px] px-1 text-[13px] sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                activePage === 'calculadora'
                  ? 'border-[#111827] text-[#111827] font-semibold'
                  : 'border-transparent text-[#667085] hover:text-[#111827]'
              }`}
            >
              Calculadora
            </button>
            <button
              type="button"
              onClick={() => setActivePage('comprovantes')}
              aria-current={activePage === 'comprovantes' ? 'page' : undefined}
              className={`min-h-[44px] px-1 text-[13px] sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                activePage === 'comprovantes'
                  ? 'border-[#111827] text-[#111827] font-semibold'
                  : 'border-transparent text-[#667085] hover:text-[#111827]'
              }`}
            >
              Comprovantes
            </button>
            <button
              type="button"
              onClick={() => setActivePage('compras')}
              aria-current={activePage === 'compras' ? 'page' : undefined}
              className={`min-h-[44px] px-1 text-[13px] sm:text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                activePage === 'compras'
                  ? 'border-[#15803D] text-[#15803D] font-semibold'
                  : 'border-transparent text-[#667085] hover:text-[#111827]'
              }`}
            >
              Compras
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 flex flex-col justify-start">
        {activePage === 'lancar' && (
          <EntryForm
            totalEntradas={totalEntradas}
            totalSaidas={totalSaidas}
            onSave={handleSaveEntry}
          />
        )}

        {activePage === 'entradas' && (
          <TransactionList
            type="entrada"
            items={entradas}
            totalEntradas={totalEntradas}
            onDelete={handleDeleteEntry}
            onBackToForm={() => setActivePage('lancar')}
          />
        )}

        {activePage === 'saidas' && (
          <TransactionList
            type="saida"
            items={saidas}
            totalEntradas={totalEntradas}
            onDelete={handleDeleteEntry}
            onBackToForm={() => setActivePage('lancar')}
          />
        )}

        {activePage === 'calculadora' && <CalculatorPage />}

        {activePage === 'comprovantes' && <PixReceiptsPage />}

        {activePage === 'compras' && <ShoppingListPage />}
      </main>
    </div>
  );
}

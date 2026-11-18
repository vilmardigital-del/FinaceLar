import { useEffect, useState } from 'react';
import { EntryForm } from './components/EntryForm';
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#111827]">
      <header className="w-full border-b border-[#E4E7EC] bg-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between gap-8">
          <button
            type="button"
            onClick={() => setActivePage('lancar')}
            className="text-base font-bold tracking-tight text-[#111827] whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            Caixa Simples
          </button>

          <nav aria-label="Páginas" className="flex items-center gap-6">
            <button
              type="button"
              onClick={() => setActivePage('lancar')}
              aria-current={activePage === 'lancar' ? 'page' : undefined}
              className={`min-h-[44px] text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                activePage === 'lancar'
                  ? 'border-[#111827] text-[#111827]'
                  : 'border-transparent text-[#667085] hover:text-[#111827]'
              }`}
            >
              Lançar
            </button>
            <button
              type="button"
              onClick={() => setActivePage('entradas')}
              aria-current={activePage === 'entradas' ? 'page' : undefined}
              className={`min-h-[44px] text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                activePage === 'entradas'
                  ? 'border-[#067647] text-[#067647]'
                  : 'border-transparent text-[#667085] hover:text-[#111827]'
              }`}
            >
              Entradas
            </button>
            <button
              type="button"
              onClick={() => setActivePage('saidas')}
              aria-current={activePage === 'saidas' ? 'page' : undefined}
              className={`min-h-[44px] text-sm font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer border-b-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                activePage === 'saidas'
                  ? 'border-[#B42318] text-[#B42318]'
                  : 'border-transparent text-[#667085] hover:text-[#111827]'
              }`}
            >
              Saídas
            </button>
          </nav>
        </div>
      </header>

      <main className="flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-14 flex flex-col justify-start">
        {activePage === 'lancar' && <EntryForm onSave={handleSaveEntry} />}

        {activePage === 'entradas' && (
          <TransactionList
            type="entrada"
            items={entradas}
            onDelete={handleDeleteEntry}
            onBackToForm={() => setActivePage('lancar')}
          />
        )}

        {activePage === 'saidas' && (
          <TransactionList
            type="saida"
            items={saidas}
            onDelete={handleDeleteEntry}
            onBackToForm={() => setActivePage('lancar')}
          />
        )}
      </main>
    </div>
  );
}

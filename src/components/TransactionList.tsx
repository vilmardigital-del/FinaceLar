import { Trash2 } from 'lucide-react';
import { Transaction, TransactionType } from '../types';
import { formatBRL, formatDateTime } from '../utils/format';

interface TransactionListProps {
  type: TransactionType;
  items: Transaction[];
  totalEntradas: number;
  onDelete: (id: string) => void;
  onBackToForm: () => void;
}

export function TransactionList({
  type,
  items,
  totalEntradas,
  onDelete,
  onBackToForm,
}: TransactionListProps) {
  const isEntrada = type === 'entrada';
  const title = isEntrada ? 'Entradas' : 'Saídas';
  const total = items.reduce((acc, item) => acc + item.amount, 0);

  return (
    <section
      aria-label={`Listagem de ${title}`}
      className="w-full max-w-2xl mx-auto flex-1 flex flex-col justify-between gap-8"
    >
      <div>
        <div className="flex flex-wrap items-baseline justify-between gap-4 pb-5 border-b border-[#E4E7EC]">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              {title}
            </h1>
            <p className="mt-1 text-sm text-[#667085]">
              {items.length} {items.length === 1 ? 'registro' : 'registros'}
            </p>
          </div>

          <button
            type="button"
            onClick={onBackToForm}
            className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#344054] bg-white border border-[#D0D5DD] rounded-xl hover:bg-[#F2F4F7] hover:text-[#111827] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            Novo lançamento
          </button>
        </div>

        {items.length === 0 ? (
          <div className="mt-6 bg-white border border-[#E4E7EC] rounded-2xl p-10 text-center">
            <p className="text-sm text-[#667085]">
              Nenhuma {isEntrada ? 'entrada' : 'saída'} registrada ainda.
            </p>
          </div>
        ) : (
          <ul className="mt-6 bg-white border border-[#E4E7EC] rounded-2xl divide-y divide-[#E4E7EC] overflow-hidden">
            {items.map((item) => {
              const { date, time } = formatDateTime(item.createdAt);
              return (
                <li
                  key={item.id}
                  className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-[#F8F9FA] transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">
                      {item.descricao}
                    </p>
                    <p className="mt-0.5 text-xs text-[#667085] font-mono-num">
                      {date} · {time}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span
                      className={`text-sm sm:text-base font-semibold font-mono-num whitespace-nowrap ${
                        isEntrada ? 'text-[#067647]' : 'text-[#B42318]'
                      }`}
                    >
                      {isEntrada ? '+' : '-'} {formatBRL(item.amount)}
                    </span>
                    <button
                      type="button"
                      onClick={() => onDelete(item.id)}
                      aria-label={`Excluir ${item.descricao} de ${formatBRL(item.amount)}`}
                      className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#667085] hover:text-[#B42318] hover:bg-[#FEF3F2] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
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

      <footer className="bg-white border border-[#E4E7EC] rounded-2xl px-5 py-4 space-y-2.5">
        {!isEntrada && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-medium text-[#667085]">
              Total de saídas
            </span>
            <strong className="text-base font-semibold font-mono-num text-[#B42318] whitespace-nowrap">
              {formatBRL(total)}
            </strong>
          </div>
        )}
        <div
          className={`flex items-center justify-between gap-4 ${
            !isEntrada ? 'pt-2.5 border-t border-[#E4E7EC]' : ''
          }`}
        >
          <span className="text-sm font-medium text-[#344054]">
            Total de entradas
          </span>
          <strong className="text-base font-semibold font-mono-num text-[#067647] whitespace-nowrap">
            {formatBRL(totalEntradas)}
          </strong>
        </div>
        {!isEntrada && (
          <div className="pt-2.5 border-t border-[#E4E7EC] flex items-center justify-between gap-4">
            <span className="text-sm font-semibold text-[#111827]">
              Total líquido restante
            </span>
            <strong
              className={`text-base font-bold font-mono-num whitespace-nowrap ${
                totalEntradas - total >= 0
                  ? 'text-[#067647]'
                  : 'text-[#B42318]'
              }`}
            >
              {formatBRL(Math.round((totalEntradas - total) * 100) / 100)}
            </strong>
          </div>
        )}
      </footer>
    </section>
  );
}

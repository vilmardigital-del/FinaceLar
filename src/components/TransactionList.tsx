import { Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatBRL, formatDateTime } from '../utils/format';

const DELETE_PASSWORD = '4526';

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

  const [pendingDelete, setPendingDelete] = useState<Transaction | null>(null);
  const [passwordText, setPasswordText] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const passwordInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pendingDelete) return;
    passwordInputRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPendingDelete(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [pendingDelete]);

  function openDeletePrompt(item: Transaction) {
    setPendingDelete(item);
    setPasswordText('');
    setPasswordError('');
  }

  function closeDeletePrompt() {
    setPendingDelete(null);
    setPasswordText('');
    setPasswordError('');
  }

  function handleConfirmDelete(e: React.FormEvent) {
    e.preventDefault();
    if (!pendingDelete) return;

    if (passwordText.trim() !== DELETE_PASSWORD) {
      setPasswordError('Senha incorreta. Se deseja apagar digite 4526.');
      passwordInputRef.current?.focus();
      return;
    }

    onDelete(pendingDelete.id);
    closeDeletePrompt();
  }

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
                      onClick={() => openDeletePrompt(item)}
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

      {pendingDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirmar-exclusao-titulo"
          onClick={closeDeletePrompt}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleConfirmDelete}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#E4E7EC] rounded-2xl p-6 shadow-xl space-y-4"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2
                  id="confirmar-exclusao-titulo"
                  className="text-lg font-bold text-[#111827]"
                >
                  Confirmar exclusão
                </h2>
                <p className="mt-1 text-sm text-[#667085]">
                  {pendingDelete.descricao} ·{' '}
                  <span className="font-mono-num font-semibold text-[#111827]">
                    {formatBRL(pendingDelete.amount)}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={closeDeletePrompt}
                aria-label="Cancelar exclusão"
                className="min-h-[44px] min-w-[44px] -mt-1 -mr-2 flex items-center justify-center rounded-lg text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label
                htmlFor="senha-apagar"
                className="block text-sm font-semibold text-[#344054] mb-2"
              >
                Se deseja apagar digite 4526
              </label>
              <input
                ref={passwordInputRef}
                id="senha-apagar"
                type="text"
                inputMode="numeric"
                autoComplete="off"
                placeholder="Se deseja apagar digite 4526"
                value={passwordText}
                onChange={(e) => {
                  setPasswordText(e.target.value);
                  if (passwordError) setPasswordError('');
                }}
                aria-invalid={Boolean(passwordError)}
                className={`w-full min-h-[48px] px-4 py-2.5 text-lg font-semibold font-mono-num text-[#111827] bg-[#F8F9FA] rounded-xl border-2 focus:bg-white focus:outline-none ${
                  passwordError
                    ? 'border-[#D92D20] focus:border-[#D92D20]'
                    : 'border-[#D0D5DD] focus:border-[#111827]'
                }`}
              />
              {passwordError && (
                <p role="alert" className="mt-2 text-sm text-[#B42318]">
                  {passwordError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={closeDeletePrompt}
                className="min-h-[44px] px-4 py-2 rounded-xl text-sm font-medium text-[#344054] bg-white border border-[#D0D5DD] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[44px] px-5 py-2 rounded-xl text-sm font-semibold text-white bg-[#B42318] hover:bg-[#912018] transition-colors cursor-pointer"
              >
                Apagar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

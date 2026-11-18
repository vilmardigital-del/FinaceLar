import { useEffect, useRef, useState } from 'react';
import {
  ENTRADA_DESCRICOES,
  SAIDA_DESCRICOES,
  TransactionDescricao,
  TransactionType,
} from '../types';
import { formatBRL, parseBRLInput } from '../utils/format';

interface EntryFormProps {
  totalEntradas: number;
  totalSaidas: number;
  onSave: (entry: {
    type: TransactionType;
    descricao: TransactionDescricao;
    amount: number;
  }) => void;
}

export function EntryForm({
  totalEntradas,
  totalSaidas,
  onSave,
}: EntryFormProps) {
  const [type, setType] = useState<TransactionType>('entrada');
  const [descricao, setDescricao] = useState<TransactionDescricao>(ENTRADA_DESCRICOES[0]);
  const [amountText, setAmountText] = useState('');
  const [error, setError] = useState('');
  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const descricoes = type === 'entrada' ? ENTRADA_DESCRICOES : SAIDA_DESCRICOES;

  useEffect(() => {
    if (!savedFeedback) return;
    const timer = window.setTimeout(() => setSavedFeedback(null), 2600);
    return () => window.clearTimeout(timer);
  }, [savedFeedback]);

  function handleTypeChange(nextType: TransactionType) {
    setType(nextType);
    setDescricao(nextType === 'entrada' ? ENTRADA_DESCRICOES[0] : SAIDA_DESCRICOES[0]);
    setError('');
  }

  function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const parsed = parseBRLInput(amountText);

    if (parsed === null) {
      setError('Digite um valor válido maior que zero.');
      inputRef.current?.focus();
      return;
    }

    onSave({
      type,
      descricao,
      amount: parsed,
    });

    setAmountText('');
    setError('');
    setSavedFeedback(
      `${type === 'entrada' ? 'Entrada' : 'Saída'} salva: ${descricao} (${formatBRL(parsed)})`
    );
    inputRef.current?.focus();
  }

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      className="w-full max-w-2xl mx-auto bg-white border border-[#E4E7EC] rounded-2xl p-6 sm:p-10 shadow-xs"
    >
      <div className="space-y-7 sm:space-y-8">
        {/* Auto escolha: Entrada ou Saída */}
        <fieldset>
          <legend className="text-base font-semibold text-[#1F2937] mb-3">
            Tipo de lançamento
          </legend>
          <div className="grid grid-cols-2 gap-2.5 p-1.5 bg-[#F2F4F7] rounded-2xl border border-[#E4E7EC]">
            <button
              type="button"
              onClick={() => handleTypeChange('entrada')}
              aria-pressed={type === 'entrada'}
              className={`min-h-[84px] sm:min-h-[96px] px-4 py-3.5 rounded-xl transition-all flex flex-col items-start justify-center gap-1 min-w-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                type === 'entrada'
                  ? 'bg-white text-[#067647] shadow-xs border border-[#D0D5DD]'
                  : 'text-[#667085] hover:text-[#111827]'
              }`}
            >
              <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
                Entrada
              </span>
              <span className="w-full text-left text-xl sm:text-2xl font-bold font-mono-num whitespace-nowrap overflow-x-auto">
                {formatBRL(totalEntradas)}
              </span>
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('saida')}
              aria-pressed={type === 'saida'}
              className={`min-h-[84px] sm:min-h-[96px] px-4 py-3.5 rounded-xl transition-all flex flex-col items-start justify-center gap-1 min-w-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                type === 'saida'
                  ? 'bg-white text-[#B42318] shadow-xs border border-[#D0D5DD]'
                  : 'text-[#667085] hover:text-[#111827]'
              }`}
            >
              <span className="text-sm sm:text-base font-semibold whitespace-nowrap">
                Saída
              </span>
              <span className="w-full text-left text-xl sm:text-2xl font-bold font-mono-num whitespace-nowrap overflow-x-auto">
                {formatBRL(totalSaidas)}
              </span>
            </button>
          </div>
        </fieldset>

        {/* Caixa de texto para valor em reais */}
        <div>
          <label
            htmlFor="valor-reais"
            className="block text-base font-semibold text-[#1F2937] mb-3"
          >
            Valor em reais
          </label>
          <div className="relative flex items-center">
            <span
              aria-hidden="true"
              className="absolute left-5 text-2xl sm:text-3xl font-semibold text-[#667085] select-none pointer-events-none"
            >
              R$
            </span>
            <input
              ref={inputRef}
              id="valor-reais"
              type="text"
              inputMode="decimal"
              autoComplete="off"
              placeholder="0,00"
              value={amountText}
              onChange={(e) => {
                setAmountText(e.target.value);
                if (error) setError('');
              }}
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'valor-erro' : undefined}
              className={`w-full min-h-[76px] sm:min-h-[84px] pl-16 sm:pl-20 pr-5 py-4 text-4xl sm:text-5xl font-bold font-mono-num text-[#111827] bg-[#F8F9FA] rounded-2xl border-2 transition-colors placeholder:text-[#98A2B3] focus:bg-white focus:outline-none ${
                error
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#D0D5DD] focus:border-[#111827]'
              }`}
            />
          </div>
          {error && (
            <p id="valor-erro" role="alert" className="mt-2.5 text-base font-medium text-[#B42318]">
              {error}
            </p>
          )}
        </div>

        {/* Descrição automática conforme tipo */}
        <fieldset>
          <legend className="text-base font-semibold text-[#1F2937] mb-3">
            Descrição
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {descricoes.map((item) => {
              const selected = descricao === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDescricao(item)}
                  aria-pressed={selected}
                  className={`min-h-[52px] px-4 py-3 rounded-xl text-base font-medium border transition-colors whitespace-nowrap truncate cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                    selected
                      ? type === 'entrada'
                        ? 'bg-[#ECFDF3] border-[#067647] text-[#067647] font-semibold'
                        : 'bg-[#FEF3F2] border-[#B42318] text-[#B42318] font-semibold'
                      : 'bg-white border-[#E4E7EC] text-[#344054] hover:border-[#98A2B3] hover:text-[#111827]'
                  }`}
                >
                  {item}
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Botão Salvar */}
        <div className="pt-1">
          <button
            type="submit"
            className="w-full min-h-[56px] px-6 py-4 rounded-xl bg-[#111827] text-white text-base sm:text-lg font-semibold hover:bg-[#1F2937] active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            Salvar
          </button>
        </div>

        {savedFeedback && (
          <p
            role="status"
            aria-live="polite"
            className="text-base text-center text-[#067647] font-semibold pt-1"
          >
            {savedFeedback}
          </p>
        )}
      </div>
    </form>
  );
}

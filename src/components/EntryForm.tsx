import { useEffect, useRef, useState } from 'react';
import {
  ENTRADA_DESCRICOES,
  SAIDA_DESCRICOES,
  TransactionDescricao,
  TransactionType,
} from '../types';
import { formatBRL, parseBRLInput } from '../utils/format';

interface EntryFormProps {
  onSave: (entry: {
    type: TransactionType;
    descricao: TransactionDescricao;
    amount: number;
  }) => void;
}

export function EntryForm({ onSave }: EntryFormProps) {
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
      className="w-full max-w-lg mx-auto bg-white border border-[#E4E7EC] rounded-2xl p-6 sm:p-8 shadow-xs"
    >
      <div className="space-y-6">
        {/* Auto escolha: Entrada ou Saída */}
        <fieldset>
          <legend className="text-sm font-medium text-[#344054] mb-2">
            Tipo de lançamento
          </legend>
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-[#F2F4F7] rounded-xl border border-[#E4E7EC]">
            <button
              type="button"
              onClick={() => handleTypeChange('entrada')}
              aria-pressed={type === 'entrada'}
              className={`min-h-[44px] rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                type === 'entrada'
                  ? 'bg-white text-[#067647] shadow-xs border border-[#D0D5DD]'
                  : 'text-[#667085] hover:text-[#111827]'
              }`}
            >
              Entrada
            </button>
            <button
              type="button"
              onClick={() => handleTypeChange('saida')}
              aria-pressed={type === 'saida'}
              className={`min-h-[44px] rounded-lg text-sm font-semibold transition-all whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                type === 'saida'
                  ? 'bg-white text-[#B42318] shadow-xs border border-[#D0D5DD]'
                  : 'text-[#667085] hover:text-[#111827]'
              }`}
            >
              Saída
            </button>
          </div>
        </fieldset>

        {/* Caixa de texto para valor em reais */}
        <div>
          <label
            htmlFor="valor-reais"
            className="block text-sm font-medium text-[#344054] mb-2"
          >
            Valor em reais
          </label>
          <div className="relative flex items-center">
            <span
              aria-hidden="true"
              className="absolute left-4 text-lg font-medium text-[#667085] select-none pointer-events-none"
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
              className={`w-full min-h-[56px] pl-12 pr-4 py-3 text-2xl font-semibold font-mono-num text-[#111827] bg-[#F8F9FA] rounded-xl border transition-colors placeholder:text-[#98A2B3] focus:bg-white focus:outline-none ${
                error
                  ? 'border-[#D92D20] focus:border-[#D92D20]'
                  : 'border-[#D0D5DD] focus:border-[#111827]'
              }`}
            />
          </div>
          {error && (
            <p id="valor-erro" role="alert" className="mt-2 text-sm text-[#B42318]">
              {error}
            </p>
          )}
        </div>

        {/* Descrição automática conforme tipo */}
        <fieldset>
          <legend className="text-sm font-medium text-[#344054] mb-2">
            Descrição
          </legend>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {descricoes.map((item) => {
              const selected = descricao === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => setDescricao(item)}
                  aria-pressed={selected}
                  className={`min-h-[44px] px-3 py-2 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap truncate cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
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
            className="w-full min-h-[48px] px-6 py-3 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-[#1F2937] active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            Salvar
          </button>
        </div>

        {savedFeedback && (
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-center text-[#067647] font-medium pt-1"
          >
            {savedFeedback}
          </p>
        )}
      </div>
    </form>
  );
}

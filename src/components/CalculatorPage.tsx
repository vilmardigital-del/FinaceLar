import { Delete } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { formatBRL } from '../utils/format';

type Operator = '+' | '-' | '×' | '÷';

function roundPrecision(value: number): number {
  return Math.round(value * 1e10) / 1e10;
}

function formatDisplayNumber(raw: string): string {
  if (raw === 'Erro') return 'Erro';
  if (!raw) return '0';
  const [intPart, decPart] = raw.split('.');
  const sign = intPart.startsWith('-') ? '-' : '';
  const digits = intPart.replace('-', '') || '0';
  const formattedInt = digits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return decPart !== undefined ? `${sign}${formattedInt},${decPart}` : `${sign}${formattedInt}`;
}

function compute(left: number, operator: Operator, right: number): number | null {
  switch (operator) {
    case '+':
      return roundPrecision(left + right);
    case '-':
      return roundPrecision(left - right);
    case '×':
      return roundPrecision(left * right);
    case '÷':
      return right === 0 ? null : roundPrecision(left / right);
  }
}

export function CalculatorPage() {
  const [current, setCurrent] = useState<string>('0');
  const [stored, setStored] = useState<number | null>(null);
  const [pendingOp, setPendingOp] = useState<Operator | null>(null);
  const [overwrite, setOverwrite] = useState<boolean>(false);
  const [historyLine, setHistoryLine] = useState<string>('');

  const handleClear = useCallback(() => {
    setCurrent('0');
    setStored(null);
    setPendingOp(null);
    setOverwrite(false);
    setHistoryLine('');
  }, []);

  const handleDigit = useCallback(
    (digit: string) => {
      if (current === 'Erro' || overwrite) {
        setCurrent(digit);
        setOverwrite(false);
        return;
      }
      if (current === '0') {
        setCurrent(digit);
      } else if (current.length < 15) {
        setCurrent((prev) => prev + digit);
      }
    },
    [current, overwrite]
  );

  const handleDecimal = useCallback(() => {
    if (current === 'Erro' || overwrite) {
      setCurrent('0.');
      setOverwrite(false);
      return;
    }
    if (!current.includes('.')) {
      setCurrent((prev) => `${prev}.`);
    }
  }, [current, overwrite]);

  const handleBackspace = useCallback(() => {
    if (current === 'Erro' || overwrite) {
      setCurrent('0');
      setOverwrite(false);
      return;
    }
    setCurrent((prev) => {
      if (prev.length <= 1 || (prev.length === 2 && prev.startsWith('-'))) {
        return '0';
      }
      return prev.slice(0, -1);
    });
  }, [current, overwrite]);

  const handleOperator = useCallback(
    (nextOp: Operator) => {
      if (current === 'Erro') return;
      const numericCurrent = Number.parseFloat(current);
      if (!Number.isFinite(numericCurrent)) return;

      if (stored !== null && pendingOp !== null && !overwrite) {
        const result = compute(stored, pendingOp, numericCurrent);
        if (result === null) {
          setCurrent('Erro');
          setStored(null);
          setPendingOp(null);
          setHistoryLine('');
          setOverwrite(true);
          return;
        }
        setStored(result);
        setCurrent(String(result));
        setHistoryLine(`${formatDisplayNumber(String(result))} ${nextOp}`);
      } else {
        setStored(numericCurrent);
        setHistoryLine(`${formatDisplayNumber(current)} ${nextOp}`);
      }

      setPendingOp(nextOp);
      setOverwrite(true);
    },
    [current, overwrite, pendingOp, stored]
  );

  const handleEquals = useCallback(() => {
    if (current === 'Erro' || stored === null || pendingOp === null) return;
    const numericCurrent = Number.parseFloat(current);
    if (!Number.isFinite(numericCurrent)) return;

    const result = compute(stored, pendingOp, numericCurrent);
    if (result === null) {
      setCurrent('Erro');
      setStored(null);
      setPendingOp(null);
      setHistoryLine('');
      setOverwrite(true);
      return;
    }

    setHistoryLine(
      `${formatDisplayNumber(String(stored))} ${pendingOp} ${formatDisplayNumber(
        current
      )} =`
    );
    setCurrent(String(result));
    setStored(null);
    setPendingOp(null);
    setOverwrite(true);
  }, [current, pendingOp, stored]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === ',' || e.key === '.') {
        e.preventDefault();
        handleDecimal();
      } else if (e.key === '+') {
        e.preventDefault();
        handleOperator('+');
      } else if (e.key === '-') {
        e.preventDefault();
        handleOperator('-');
      } else if (e.key === '*') {
        e.preventDefault();
        handleOperator('×');
      } else if (e.key === '/') {
        e.preventDefault();
        handleOperator('÷');
      } else if (e.key === 'Enter' || e.key === '=') {
        e.preventDefault();
        handleEquals();
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleClear();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [
    handleBackspace,
    handleClear,
    handleDecimal,
    handleDigit,
    handleEquals,
    handleOperator,
  ]);

  const numericPreview =
    current !== 'Erro' && Number.isFinite(Number.parseFloat(current))
      ? formatBRL(Number.parseFloat(current))
      : 'Erro';

  return (
    <section
      aria-label="Calculadora para somas"
      className="w-full max-w-md mx-auto"
    >
      <div className="bg-white border border-[#E4E7EC] rounded-2xl p-5 sm:p-6 shadow-xs">
        <div className="mb-4">
          <h1 className="text-lg font-bold tracking-tight text-[#111827]">
            Calculadora de Somas
          </h1>
          <p className="text-xs text-[#667085] mt-0.5">
            Some valores rapidamente pelo teclado ou toque
          </p>
        </div>

        {/* Visor */}
        <div className="bg-[#F8F9FA] border border-[#E4E7EC] rounded-xl p-4 text-right mb-5">
          <div className="min-h-[20px] text-xs font-mono-num text-[#667085] truncate">
            {historyLine || '\u00A0'}
          </div>
          <div
            aria-live="polite"
            className="mt-1 text-3xl sm:text-4xl font-bold font-mono-num text-[#111827] truncate"
          >
            {formatDisplayNumber(current)}
          </div>
          <div className="mt-1 text-xs font-mono-num text-[#067647] font-medium">
            {numericPreview}
          </div>
        </div>

        {/* Teclado */}
        <div className="grid grid-cols-4 gap-2.5">
          <button
            type="button"
            onClick={handleClear}
            className="col-span-2 min-h-[52px] rounded-xl bg-[#FEF3F2] border border-[#FECDCA] text-[#B42318] text-sm font-semibold hover:bg-[#FEE4E2] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            Limpar (C)
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            aria-label="Apagar último dígito"
            className="min-h-[52px] rounded-xl bg-[#F2F4F7] border border-[#E4E7EC] text-[#344054] flex items-center justify-center hover:bg-[#E4E7EC] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            <Delete className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => handleOperator('÷')}
            aria-label="Dividir"
            className={`min-h-[52px] rounded-xl border text-lg font-semibold active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
              pendingOp === '÷' && overwrite
                ? 'bg-[#111827] border-[#111827] text-white'
                : 'bg-[#F2F4F7] border-[#E4E7EC] text-[#111827] hover:bg-[#E4E7EC]'
            }`}
          >
            ÷
          </button>

          {['7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="min-h-[52px] rounded-xl bg-white border border-[#E4E7EC] text-lg font-semibold font-mono-num text-[#111827] hover:bg-[#F8F9FA] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator('×')}
            aria-label="Multiplicar"
            className={`min-h-[52px] rounded-xl border text-lg font-semibold active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
              pendingOp === '×' && overwrite
                ? 'bg-[#111827] border-[#111827] text-white'
                : 'bg-[#F2F4F7] border-[#E4E7EC] text-[#111827] hover:bg-[#E4E7EC]'
            }`}
          >
            ×
          </button>

          {['4', '5', '6'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="min-h-[52px] rounded-xl bg-white border border-[#E4E7EC] text-lg font-semibold font-mono-num text-[#111827] hover:bg-[#F8F9FA] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator('-')}
            aria-label="Subtrair"
            className={`min-h-[52px] rounded-xl border text-lg font-semibold active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
              pendingOp === '-' && overwrite
                ? 'bg-[#111827] border-[#111827] text-white'
                : 'bg-[#F2F4F7] border-[#E4E7EC] text-[#111827] hover:bg-[#E4E7EC]'
            }`}
          >
            −
          </button>

          {['1', '2', '3'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="min-h-[52px] rounded-xl bg-white border border-[#E4E7EC] text-lg font-semibold font-mono-num text-[#111827] hover:bg-[#F8F9FA] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleOperator('+')}
            aria-label="Somar"
            className={`min-h-[52px] rounded-xl border text-xl font-bold active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
              pendingOp === '+' && overwrite
                ? 'bg-[#067647] border-[#067647] text-white'
                : 'bg-[#ECFDF3] border-[#ABEFC6] text-[#067647] hover:bg-[#D1FADF]'
            }`}
          >
            +
          </button>

          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="col-span-2 min-h-[52px] rounded-xl bg-white border border-[#E4E7EC] text-lg font-semibold font-mono-num text-[#111827] hover:bg-[#F8F9FA] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleDecimal}
            aria-label="Vírgula decimal"
            className="min-h-[52px] rounded-xl bg-white border border-[#E4E7EC] text-lg font-semibold font-mono-num text-[#111827] hover:bg-[#F8F9FA] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            ,
          </button>
          <button
            type="button"
            onClick={handleEquals}
            aria-label="Calcular resultado"
            className="min-h-[52px] rounded-xl bg-[#111827] text-white text-xl font-semibold hover:bg-[#1F2937] active:scale-[0.98] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            =
          </button>
        </div>
      </div>
    </section>
  );
}

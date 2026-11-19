import { Calendar, Check, Pencil, Trash2, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ManagedShoppingItem, ManagedShoppingList } from '../types';

const STORAGE_KEY = 'larfinance_compras_gerenciavel_v1';

interface ProductCategory {
  categoria: string;
  itens: string[];
}

const CATALOGO_COMPRAS: ProductCategory[] = [
  {
    categoria: 'Despensa e Básicos',
    itens: [
      'Arroz',
      'Feijão',
      'Macarrão / massas',
      'Óleo ou azeite',
      'Sal e açúcar',
      'Farinha (trigo, mandioca ou aveia)',
      'Café e chá',
      'Molhos (extrato de tomate, mostarda, shoyu)',
      'Temperos secos (orégano, pimenta, cominho)',
    ],
  },
  {
    categoria: 'Hortifrúti (frutas, legumes e verduras)',
    itens: [
      'Frutas (banana, maçã, laranja, mamão)',
      'Legumes (batata, cenoura, cebola, tomate, abobrinha)',
      'Verduras e temperos frescos (alface, couve, alho, cheiro-verde)',
    ],
  },
  {
    categoria: 'Proteínas e laticínios',
    itens: [
      'Carnes (bovina, frango, peixe ou opções vegetarianas)',
      'Ovos',
      'Leite',
      'Queijos, presunto ou requeijão',
      'Iogurte e manteiga/margarina',
    ],
  },
  {
    categoria: 'Limpeza e higiene',
    itens: [
      'Detergente e esponja',
      'Sabão em pó ou líquido e amaciante',
      'Desinfetante e água sanitária',
      'Sacos de lixo',
      'Papel higiênico e papel toalha',
      'Sabonete, creme dental, shampoo e desodorante',
    ],
  },
];

function getTodayYMD(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatYMDToBR(ymd: string): string {
  const parts = ymd.split('-');
  if (parts.length !== 3) return ymd;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function trySumQuantities(a: string, b: string): string | null {
  const numA = Number(a.trim().replace(',', '.'));
  const numB = Number(b.trim().replace(',', '.'));
  if (
    a.trim() !== '' &&
    b.trim() !== '' &&
    Number.isFinite(numA) &&
    Number.isFinite(numB)
  ) {
    const sum = Math.round((numA + numB) * 100) / 100;
    return String(sum).replace('.', ',');
  }
  return null;
}

function loadManagedList(): {
  list: ManagedShoppingList;
  wasExpired: boolean;
} {
  const today = getTodayYMD();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return {
        list: { visibleUntil: today, items: [] },
        wasExpired: false,
      };
    }
    const parsed = JSON.parse(raw) as Partial<ManagedShoppingList>;
    const visibleUntil =
      typeof parsed?.visibleUntil === 'string' && parsed.visibleUntil
        ? parsed.visibleUntil
        : today;
    const items = Array.isArray(parsed?.items)
      ? parsed.items.filter(
          (item): item is ManagedShoppingItem =>
            Boolean(item) &&
            typeof item.id === 'string' &&
            typeof item.nome === 'string' &&
            typeof item.categoria === 'string' &&
            typeof item.qtdeInicial === 'string' &&
            typeof item.qtdeCompra === 'string' &&
            typeof item.qtdeTotal === 'string' &&
            typeof item.marcado === 'boolean'
        )
      : [];

    if (items.length > 0 && today > visibleUntil) {
      window.localStorage.removeItem(STORAGE_KEY);
      return {
        list: { visibleUntil: today, items: [] },
        wasExpired: true,
      };
    }

    return {
      list: { visibleUntil, items },
      wasExpired: false,
    };
  } catch {
    return {
      list: { visibleUntil: today, items: [] },
      wasExpired: false,
    };
  }
}

interface ModalProductState {
  nome: string;
  categoria: string;
  editingId: string | null;
}

export function ShoppingListPage() {
  const initialState = loadManagedList();
  const [visibleUntil, setVisibleUntil] = useState<string>(
    initialState.list.visibleUntil
  );
  const [items, setItems] = useState<ManagedShoppingItem[]>(
    initialState.list.items
  );
  const [expiredNotice, setExpiredNotice] = useState<boolean>(
    initialState.wasExpired
  );

  const [modalProduct, setModalProduct] = useState<ModalProductState | null>(
    null
  );
  const [qtdeInicial, setQtdeInicial] = useState('');
  const [qtdeCompra, setQtdeCompra] = useState('');
  const [qtdeTotal, setQtdeTotal] = useState('');
  const [totalManuallyEdited, setTotalManuallyEdited] = useState(false);
  const [modalError, setModalError] = useState('');

  const inicialInputRef = useRef<HTMLInputElement>(null);
  const todayYMD = getTodayYMD();

  // Persist list whenever items or visibleUntil changes
  useEffect(() => {
    try {
      const payload: ManagedShoppingList = { visibleUntil, items };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignore storage quota errors cleanly
    }
  }, [items, visibleUntil]);

  // Check periodically if date rolled past visibleUntil while page stays open
  useEffect(() => {
    const interval = window.setInterval(() => {
      const nowToday = getTodayYMD();
      if (items.length > 0 && nowToday > visibleUntil) {
        setItems([]);
        setVisibleUntil(nowToday);
        setExpiredNotice(true);
      }
    }, 30000);
    return () => window.clearInterval(interval);
  }, [items.length, visibleUntil]);

  useEffect(() => {
    if (!modalProduct) return;
    inicialInputRef.current?.focus();

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setModalProduct(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [modalProduct]);

  function openProductModal(nome: string, categoria: string) {
    const existing = items.find(
      (item) => item.nome.toLowerCase() === nome.toLowerCase()
    );
    setModalProduct({
      nome,
      categoria,
      editingId: existing ? existing.id : null,
    });
    setQtdeInicial(existing ? existing.qtdeInicial : '');
    setQtdeCompra(existing ? existing.qtdeCompra : '');
    setQtdeTotal(existing ? existing.qtdeTotal : '');
    setTotalManuallyEdited(Boolean(existing));
    setModalError('');
    setExpiredNotice(false);
  }

  function handleInicialChange(value: string) {
    setQtdeInicial(value);
    if (!totalManuallyEdited) {
      const autoSum = trySumQuantities(value, qtdeCompra);
      if (autoSum !== null) {
        setQtdeTotal(autoSum);
      }
    }
    if (modalError) setModalError('');
  }

  function handleCompraChange(value: string) {
    setQtdeCompra(value);
    if (!totalManuallyEdited) {
      const autoSum = trySumQuantities(qtdeInicial, value);
      if (autoSum !== null) {
        setQtdeTotal(autoSum);
      }
    }
    if (modalError) setModalError('');
  }

  function handleSaveProduct(e: React.FormEvent) {
    e.preventDefault();
    if (!modalProduct) return;

    const ini = qtdeInicial.trim();
    const comp = qtdeCompra.trim();
    const tot = qtdeTotal.trim();

    if (!ini && !comp && !tot) {
      setModalError('Preencha ao menos uma quantidade para salvar.');
      inicialInputRef.current?.focus();
      return;
    }

    if (modalProduct.editingId) {
      setItems((prev) =>
        prev.map((item) =>
          item.id === modalProduct.editingId
            ? {
                ...item,
                qtdeInicial: ini || '0',
                qtdeCompra: comp || '0',
                qtdeTotal: tot || comp || ini || '0',
              }
            : item
        )
      );
    } else {
      const newItem: ManagedShoppingItem = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        nome: modalProduct.nome,
        categoria: modalProduct.categoria,
        qtdeInicial: ini || '0',
        qtdeCompra: comp || '0',
        qtdeTotal: tot || comp || ini || '0',
        marcado: false,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setModalProduct(null);
  }

  function toggleItemMarked(id: string) {
    setItems((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, marcado: !item.marcado } : item
      )
    );
  }

  function removeItem(id: string) {
    setItems((prev) => prev.filter((item) => item.id !== id));
  }

  function handleCreateNewList() {
    setItems([]);
    setVisibleUntil(getTodayYMD());
    setExpiredNotice(false);
  }

  function handleVisibleUntilChange(nextDate: string) {
    if (!nextDate) return;
    setVisibleUntil(nextDate);
    setExpiredNotice(false);
    if (items.length > 0 && getTodayYMD() > nextDate) {
      setItems([]);
      setExpiredNotice(true);
    }
  }

  const markedCount = items.filter((item) => item.marcado).length;

  return (
    <section
      aria-label="Lista de compras"
      className="w-full max-w-4xl mx-auto space-y-8"
    >
      {/* Cabeçalho e controle da data de validade da lista */}
      <div className="bg-white border border-[#E4E7EC] rounded-2xl p-5 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
              Lista de Compras
            </h1>
            <p className="mt-1 text-sm text-[#667085]">
              Toque em qualquer produto abaixo para informar as quantidades e salvar na sua lista
            </p>
          </div>

          {items.length > 0 && (
            <button
              type="button"
              onClick={handleCreateNewList}
              className="min-h-[44px] px-4 py-2 text-sm font-medium text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-xl hover:bg-[#FEE4E2] transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
            >
              Criar nova lista
            </button>
          )}
        </div>

        <div className="pt-4 border-t border-[#E4E7EC] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <label
              htmlFor="lista-visivel-ate"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[#344054] whitespace-nowrap"
            >
              <Calendar className="w-4 h-4 text-[#667085]" />
              <span>Lista visível até:</span>
            </label>
            <input
              id="lista-visivel-ate"
              type="date"
              min={todayYMD}
              value={visibleUntil}
              onChange={(e) => handleVisibleUntilChange(e.target.value)}
              className="min-h-[44px] px-3 py-1.5 text-sm font-mono-num font-medium text-[#111827] bg-[#F8F9FA] border border-[#D0D5DD] rounded-xl focus:bg-white focus:border-[#111827] focus:outline-none"
            />
          </div>

          <p className="text-xs sm:text-sm text-[#667085]">
            Após{' '}
            <strong className="font-mono-num text-[#111827]">
              {formatYMDToBR(visibleUntil)}
            </strong>
            , a lista será apagada automaticamente.
          </p>
        </div>

        {expiredNotice && (
          <p
            role="status"
            className="text-sm font-medium text-[#B42318] bg-[#FEF3F2] border border-[#FECDCA] rounded-xl px-4 py-3"
          >
            A lista anterior passou da data limite e foi apagada. Escolha a nova data e adicione produtos para criar outra lista.
          </p>
        )}
      </div>

      {/* Lista gerenciável salva */}
      <div className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-lg font-bold text-[#111827]">
            Lista salva ({items.length})
          </h2>
          {items.length > 0 && (
            <span className="text-sm text-[#667085] font-mono-num">
              {markedCount} de {items.length} marcados
            </span>
          )}
        </div>

        {items.length === 0 ? (
          <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center">
            <p className="text-sm text-[#667085]">
              Sua lista gerenciável está vazia. Selecione um produto no catálogo abaixo para adicionar.
            </p>
          </div>
        ) : (
          <ul className="bg-white border border-[#E4E7EC] rounded-2xl divide-y divide-[#E4E7EC] overflow-hidden">
            {items.map((item) => (
              <li
                key={item.id}
                className={`p-4 sm:px-5 sm:py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors ${
                  item.marcado ? 'bg-[#F6FEF9]' : 'hover:bg-[#F8F9FA]'
                }`}
              >
                <div className="min-w-0 space-y-1">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-base font-semibold ${
                        item.marcado
                          ? 'line-through text-[#15803D]'
                          : 'text-[#111827]'
                      }`}
                    >
                      {item.nome}
                    </p>
                  </div>
                  <p className="text-xs text-[#667085]">{item.categoria}</p>
                  <div className="pt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-mono-num text-[#344054]">
                    <span>
                      Inicial: <strong className="text-[#111827]">{item.qtdeInicial}</strong>
                    </span>
                    <span aria-hidden="true" className="text-[#D0D5DD]">
                      ·
                    </span>
                    <span>
                      Compra: <strong className="text-[#111827]">{item.qtdeCompra}</strong>
                    </span>
                    <span aria-hidden="true" className="text-[#D0D5DD]">
                      ·
                    </span>
                    <span>
                      Total:{' '}
                      <strong className="text-[#15803D]">{item.qtdeTotal}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => toggleItemMarked(item.id)}
                    aria-pressed={item.marcado}
                    className={`min-h-[44px] px-3.5 py-2 rounded-xl text-sm font-semibold border transition-colors inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                      item.marcado
                        ? 'bg-[#15803D] border-[#14532D] text-white'
                        : 'bg-white border-[#D0D5DD] text-[#111827] hover:bg-[#F2F4F7]'
                    }`}
                  >
                    <Check className="w-4 h-4 shrink-0" />
                    <span>{item.marcado ? 'Marcado' : 'Marcar'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => openProductModal(item.nome, item.categoria)}
                    aria-label={`Editar ${item.nome}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label={`Remover ${item.nome}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-[#667085] hover:text-[#B42318] hover:bg-[#FEF3F2] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Catálogo completo organizado por categoria */}
      <div className="space-y-5">
        <h2 className="text-lg font-bold text-[#111827]">
          Produtos disponíveis
        </h2>

        <div className="space-y-5">
          {CATALOGO_COMPRAS.map((grupo) => (
            <section
              key={grupo.categoria}
              aria-label={grupo.categoria}
              className="bg-white border border-[#E4E7EC] rounded-2xl p-5 space-y-3.5"
            >
              <h3 className="text-base font-bold text-[#111827]">
                {grupo.categoria}
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {grupo.itens.map((produto) => {
                  const saved = items.find(
                    (i) => i.nome.toLowerCase() === produto.toLowerCase()
                  );
                  return (
                    <button
                      key={produto}
                      type="button"
                      onClick={() =>
                        openProductModal(produto, grupo.categoria)
                      }
                      className={`min-h-[48px] px-4 py-2.5 rounded-xl border text-left text-sm font-medium transition-colors flex items-center justify-between gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827] ${
                        saved
                          ? 'bg-[#ECFDF3] border-[#15803D] text-[#15803D] font-semibold'
                          : 'bg-[#F8F9FA] border-[#E4E7EC] text-[#111827] hover:bg-white hover:border-[#98A2B3]'
                      }`}
                    >
                      <span>{produto}</span>
                      {saved && <Check className="w-4 h-4 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </section>
          ))}
        </div>
      </div>

      {/* Popup para preencher quantidades */}
      {modalProduct && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="popup-produto-titulo"
          onClick={() => setModalProduct(null)}
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <form
            onSubmit={handleSaveProduct}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md bg-white border border-[#E4E7EC] rounded-2xl p-6 shadow-xl space-y-5"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-medium text-[#667085]">
                  {modalProduct.categoria}
                </p>
                <h2
                  id="popup-produto-titulo"
                  className="mt-0.5 text-lg font-bold text-[#111827]"
                >
                  {modalProduct.nome}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setModalProduct(null)}
                aria-label="Fechar janela"
                className="min-h-[44px] min-w-[44px] -mt-1 -mr-2 flex items-center justify-center rounded-lg text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label
                  htmlFor="qtde-inicial"
                  className="block text-sm font-semibold text-[#344054] mb-1.5"
                >
                  Qtde inicial
                </label>
                <input
                  ref={inicialInputRef}
                  id="qtde-inicial"
                  type="text"
                  placeholder="Ex.: 1 ou 1 kg"
                  value={qtdeInicial}
                  onChange={(e) => handleInicialChange(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-2.5 text-base font-mono-num text-[#111827] bg-[#F8F9FA] border border-[#D0D5DD] rounded-xl placeholder:text-[#98A2B3] focus:bg-white focus:border-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="qtde-compra"
                  className="block text-sm font-semibold text-[#344054] mb-1.5"
                >
                  Qtde de compra
                </label>
                <input
                  id="qtde-compra"
                  type="text"
                  placeholder="Ex.: 2 ou 2 pct"
                  value={qtdeCompra}
                  onChange={(e) => handleCompraChange(e.target.value)}
                  className="w-full min-h-[48px] px-4 py-2.5 text-base font-mono-num text-[#111827] bg-[#F8F9FA] border border-[#D0D5DD] rounded-xl placeholder:text-[#98A2B3] focus:bg-white focus:border-[#111827] focus:outline-none"
                />
              </div>

              <div>
                <label
                  htmlFor="qtde-total"
                  className="block text-sm font-semibold text-[#344054] mb-1.5"
                >
                  Qtde total
                </label>
                <input
                  id="qtde-total"
                  type="text"
                  placeholder="Ex.: 3 ou 3 kg"
                  value={qtdeTotal}
                  onChange={(e) => {
                    setQtdeTotal(e.target.value);
                    setTotalManuallyEdited(true);
                    if (modalError) setModalError('');
                  }}
                  className="w-full min-h-[48px] px-4 py-2.5 text-base font-mono-num font-semibold text-[#111827] bg-[#F8F9FA] border border-[#D0D5DD] rounded-xl placeholder:text-[#98A2B3] focus:bg-white focus:border-[#111827] focus:outline-none"
                />
              </div>

              {modalError && (
                <p role="alert" className="text-sm text-[#B42318]">
                  {modalError}
                </p>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-1">
              <button
                type="button"
                onClick={() => setModalProduct(null)}
                className="min-h-[46px] px-4 py-2 rounded-xl text-sm font-medium text-[#344054] bg-white border border-[#D0D5DD] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="min-h-[46px] px-6 py-2 rounded-xl text-sm font-semibold text-white bg-[#15803D] hover:bg-[#166534] transition-colors cursor-pointer"
              >
                Salvar
              </button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}

import { Download, Eye, FileText, Trash2, Upload, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { PixReceipt } from '../types';
import { formatDateTime } from '../utils/format';
import {
  deletePixReceipt,
  listPixReceipts,
  savePixReceipt,
} from '../utils/pixStorage';

const MAX_FILE_BYTES = 15 * 1024 * 1024;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace('.', ',')} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Falha ao ler o arquivo.'));
      }
    };
    reader.onerror = () => reject(new Error('Não foi possível ler o arquivo.'));
    reader.readAsDataURL(file);
  });
}

export function PixReceiptsPage() {
  const [receipts, setReceipts] = useState<PixReceipt[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [titulo, setTitulo] = useState<string>('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>('');
  const [saving, setSaving] = useState<boolean>(false);
  const [previewItem, setPreviewItem] = useState<PixReceipt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let active = true;
    listPixReceipts()
      .then((items) => {
        if (active) {
          setReceipts(items);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) {
          setError('Não foi possível carregar os comprovantes salvos.');
          setLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!previewItem) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setPreviewItem(null);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [previewItem]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setError('');
    if (!file) {
      setSelectedFile(null);
      return;
    }

    const isAllowed =
      file.type.startsWith('image/') || file.type === 'application/pdf';
    if (!isAllowed) {
      setError('Selecione uma imagem (JPG, PNG, WEBP) ou arquivo PDF.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_BYTES) {
      setError('O arquivo deve ter no máximo 15 MB.');
      setSelectedFile(null);
      e.target.value = '';
      return;
    }

    setSelectedFile(file);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedFile) {
      setError('Selecione um comprovante Pix para salvar.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      const dataUrl = await readFileAsDataUrl(selectedFile);
      const cleanTitle =
        titulo.trim() || selectedFile.name.replace(/\.[^/.]+$/, '');

      const newReceipt: PixReceipt = {
        id:
          typeof crypto !== 'undefined' && crypto.randomUUID
            ? crypto.randomUUID()
            : `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        titulo: cleanTitle,
        fileName: selectedFile.name,
        mimeType: selectedFile.type,
        size: selectedFile.size,
        dataUrl,
        createdAt: new Date().toISOString(),
      };

      await savePixReceipt(newReceipt);
      setReceipts((prev) => [newReceipt, ...prev]);
      setTitulo('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch {
      setError('Erro ao salvar o comprovante no navegador.');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deletePixReceipt(id);
      setReceipts((prev) => prev.filter((item) => item.id !== id));
      if (previewItem?.id === id) {
        setPreviewItem(null);
      }
    } catch {
      setError('Não foi possível excluir o comprovante.');
    }
  }

  return (
    <section
      aria-label="Comprovantes de Pix"
      className="w-full max-w-2xl mx-auto space-y-6"
    >
      <div className="pb-4 border-b border-[#E4E7EC]">
        <h1 className="text-2xl font-bold tracking-tight text-[#111827]">
          Comprovantes Pix
        </h1>
        <p className="mt-1 text-sm text-[#667085]">
          {receipts.length}{' '}
          {receipts.length === 1 ? 'comprovante salvo' : 'comprovantes salvos'}
        </p>
      </div>

      {/* Formulário simples de envio */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="bg-white border border-[#E4E7EC] rounded-2xl p-5 sm:p-6 space-y-4 shadow-xs"
      >
        <div>
          <label
            htmlFor="pix-titulo"
            className="block text-sm font-medium text-[#344054] mb-1.5"
          >
            Descrição do Pix (opcional)
          </label>
          <input
            id="pix-titulo"
            type="text"
            placeholder="Ex.: Mercado, Nubank, Aluguel..."
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            className="w-full min-h-[44px] px-3.5 py-2 text-sm text-[#111827] bg-[#F8F9FA] border border-[#D0D5DD] rounded-xl placeholder:text-[#98A2B3] focus:bg-white focus:border-[#111827] focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="pix-arquivo"
            className="block text-sm font-medium text-[#344054] mb-1.5"
          >
            Arquivo do comprovante (Imagem ou PDF)
          </label>
          <input
            ref={fileInputRef}
            id="pix-arquivo"
            type="file"
            accept="image/*,application/pdf"
            onChange={handleFileChange}
            className="sr-only"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="w-full min-h-[56px] px-4 py-3 border border-dashed border-[#D0D5DD] rounded-xl bg-[#F8F9FA] hover:bg-[#F2F4F7] hover:border-[#98A2B3] transition-colors flex items-center justify-center gap-2.5 text-sm font-medium text-[#344054] cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
          >
            <Upload className="w-4 h-4 shrink-0 text-[#667085]" />
            <span className="truncate">
              {selectedFile
                ? `${selectedFile.name} (${formatFileSize(selectedFile.size)})`
                : 'Selecionar comprovante (Imagem ou PDF)'}
            </span>
          </button>
        </div>

        {error && (
          <p role="alert" className="text-sm text-[#B42318]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving}
          className="w-full min-h-[48px] px-5 py-3 rounded-xl bg-[#111827] text-white text-sm font-semibold hover:bg-[#1F2937] disabled:opacity-60 active:scale-[0.99] transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
        >
          {saving ? 'Salvando...' : 'Salvar comprovante'}
        </button>
      </form>

      {/* Lista de comprovantes */}
      {loading ? (
        <div className="bg-white border border-[#E4E7EC] rounded-2xl p-8 text-center">
          <p className="text-sm text-[#667085]">Carregando comprovantes...</p>
        </div>
      ) : receipts.length === 0 ? (
        <div className="bg-white border border-[#E4E7EC] rounded-2xl p-10 text-center">
          <p className="text-sm text-[#667085]">
            Nenhum comprovante de Pix salvo ainda.
          </p>
        </div>
      ) : (
        <ul className="bg-white border border-[#E4E7EC] rounded-2xl divide-y divide-[#E4E7EC] overflow-hidden">
          {receipts.map((item) => {
            const { date, time } = formatDateTime(item.createdAt);
            const isImage = item.mimeType.startsWith('image/');

            return (
              <li
                key={item.id}
                className="flex items-center justify-between gap-4 px-4 sm:px-5 py-3.5 hover:bg-[#F8F9FA] transition-colors"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  {isImage ? (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      aria-label={`Visualizar ${item.titulo}`}
                      className="w-12 h-12 rounded-lg overflow-hidden border border-[#E4E7EC] bg-[#F2F4F7] shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
                    >
                      <img
                        src={item.dataUrl}
                        alt={item.titulo}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      aria-label={`Visualizar PDF ${item.titulo}`}
                      className="w-12 h-12 rounded-lg border border-[#E4E7EC] bg-[#F8F9FA] text-[#344054] flex items-center justify-center shrink-0 cursor-pointer hover:bg-[#F2F4F7] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  )}

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[#111827] truncate">
                      {item.titulo}
                    </p>
                    <p className="mt-0.5 text-xs text-[#667085] font-mono-num truncate">
                      {date} · {time} · {isImage ? 'Imagem' : 'PDF'} ·{' '}
                      {formatFileSize(item.size)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setPreviewItem(item)}
                    aria-label={`Visualizar ${item.titulo}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <a
                    href={item.dataUrl}
                    download={item.fileName}
                    aria-label={`Baixar ${item.titulo}`}
                    className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#111827]"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                  <button
                    type="button"
                    onClick={() => handleDelete(item.id)}
                    aria-label={`Excluir ${item.titulo}`}
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

      {/* Modal de visualização */}
      {previewItem && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Comprovante: ${previewItem.titulo}`}
          onClick={() => setPreviewItem(null)}
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-2xl bg-white border border-[#E4E7EC] rounded-2xl overflow-hidden shadow-xl"
          >
            <div className="flex items-center justify-between gap-4 px-5 py-3.5 border-b border-[#E4E7EC]">
              <div className="min-w-0">
                <h2 className="text-sm font-semibold text-[#111827] truncate">
                  {previewItem.titulo}
                </h2>
                <p className="text-xs text-[#667085] truncate">
                  {previewItem.fileName}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={previewItem.dataUrl}
                  download={previewItem.fileName}
                  className="min-h-[44px] px-3 flex items-center gap-1.5 rounded-lg text-xs font-medium text-[#344054] hover:bg-[#F2F4F7] transition-colors whitespace-nowrap"
                >
                  <Download className="w-4 h-4" />
                  Baixar
                </a>
                <button
                  type="button"
                  onClick={() => setPreviewItem(null)}
                  aria-label="Fechar visualização"
                  className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg text-[#667085] hover:text-[#111827] hover:bg-[#F2F4F7] transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 bg-[#F8F9FA] flex items-center justify-center">
              {previewItem.mimeType.startsWith('image/') ? (
                <img
                  src={previewItem.dataUrl}
                  alt={previewItem.titulo}
                  referrerPolicy="no-referrer"
                  className="max-h-[72vh] w-auto rounded-lg object-contain"
                />
              ) : (
                <iframe
                  title={previewItem.titulo}
                  src={previewItem.dataUrl}
                  className="w-full h-[72vh] rounded-lg border border-[#E4E7EC] bg-white"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

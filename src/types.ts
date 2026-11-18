export type TransactionType = 'entrada' | 'saida';

export const ENTRADA_DESCRICOES = ['Salário', 'Serviços', 'Bicos'] as const;
export const SAIDA_DESCRICOES = [
  'Mercado',
  'Combustível',
  'Farmácia',
  'Moradia',
  'Lanchonete',
  'Marmita',
] as const;

export type EntradaDescricao = (typeof ENTRADA_DESCRICOES)[number];
export type SaidaDescricao = (typeof SAIDA_DESCRICOES)[number];
export type TransactionDescricao = EntradaDescricao | SaidaDescricao;

export interface Transaction {
  id: string;
  type: TransactionType;
  descricao: TransactionDescricao;
  amount: number;
  createdAt: string;
}

export type ActivePage = 'lancar' | 'entradas' | 'saidas';

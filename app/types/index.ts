/**
 * ============================================================================
 * MÓDULO: types/index.ts
 * DESCRIÇÃO: Tipagem global oficial do Talhação PRO v2.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * ============================================================================
 */

export interface ClienteOficial {
    id: string;
    cnpj: string;
    razaoSocial: string;
    apelido: string;
    aliases: string[];
    endereco?: string;
}

export interface LinhaCorMatriz {
    id: string;
    cor: string;
    quantidades: { [tamanho: string]: number };
}

export interface OrdemServico {
    id: string;
    firebaseId?: string;
    cliente: string;
    ref: string;
    produto: string;
    dataSaida: string;
    statusPagamento: string;
    valorCorte: number;
    mPlotter: number;
    vPlotter: number;
    totalPecas: number;
    total: number;
    linhas: LinhaCorMatriz[];
}
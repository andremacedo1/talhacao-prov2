/**
 * ============================================================================
 * MÓDULO: FormularioOS.tsx
 * DESCRIÇÃO: Formulário de lançamento de O.S. com matriz dinâmica.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * DATA/HORA DE CRIAÇÃO: 2026-08-03 11:55
 * ============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';

const TAM_DEFAULT = ["34", "36", "38", "40", "42", "44", "P", "M", "G", "GG"];

interface LinhaCorMatriz {
    id: string;
    cor: string;
    quantidades: { [tamanho: string]: number };
}

export default function FormularioOS({ onSalvarOS }: { onSalvarOS: (osData: any) => void }) {
    const [cliente, setCliente] = useState('');
    const [ref, setRef] = useState('');
    const [produto, setProduto] = useState('');
    const [dataSaida, setDataSaida] = useState(new Date().toISOString().split('T')[0]);
    const [dataRetorno, setDataRetorno] = useState('');
    const [responsavel, setResponsavel] = useState('');
    const [statusPagamento, setStatusPagamento] = useState('PENDENTE');
    const [valorCorte, setValorCorte] = useState('');
    const [mPlotter, setMPlotter] = useState('');
    const [vPlotter, setVPlotter] = useState('');

    const [gradePersonalizada, setGradePersonalizada] = useState<string[]>(TAM_DEFAULT);
    const [linhasMatriz, setLinhasMatriz] = useState<LinhaCorMatriz[]>([
        { id: Math.random().toString(), cor: '', quantidades: {} }
    ]);

    const [totalPecas, setTotalPecas] = useState(0);
    const [totalValor, setTotalValor] = useState(0);

    useEffect(() => {
        const saved = localStorage.getItem('minhaGradePro');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) setGradePersonalizada(parsed);
            } catch (e) {}
        }
    }, []);

    useEffect(() => {
        let pTotal = 0;
        linhasMatriz.forEach(linha => {
            Object.values(linha.quantidades).forEach(qtd => {
                pTotal += Number(qtd) || 0;
            });
        });

        const vCorteNum = Math.max(0, parseFloat(valorCorte.replace(',', '.')) || 0);
        const mPlotNum = Math.max(0, parseFloat(mPlotter.replace(',', '.')) || 0);
        const vPlotNum = Math.max(0, parseFloat(vPlotter.replace(',', '.')) || 0);

        setTotalPecas(pTotal);
        setTotalValor((pTotal * vCorteNum) + (mPlotNum * vPlotNum));
    }, [linhasMatriz, valorCorte, mPlotter, vPlotter]);

    const fmtReal = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleSalvar = () => {
        if (!cliente.trim()) {
            alert('O nome do cliente é obrigatório!');
            return;
        }

        let itens: { [k: string]: number } = {};
        linhasMatriz.forEach(linha => {
            const cor = linha.cor.trim().toUpperCase() || "SEM COR";
            Object.entries(linha.quantidades).forEach(([tam, q]) => {
                if (q > 0) {
                    const chave = cor === "SEM COR" ? tam : `${cor} - ${tam}`;
                    itens[chave] = (itens[chave] || 0) + q;
                }
            });
        });

        const novaOS = {
            id: Math.random().toString(),
            cliente: cliente.trim().toUpperCase(),
            ref: ref.trim().toUpperCase(),
            produto: produto.trim().toUpperCase(),
            dataSaida,
            dataRetorno,
            responsavel: responsavel.trim().toUpperCase(),
            statusPagamento,
            valorCorte: parseFloat(valorCorte.replace(',', '.')) || 0,
            mPlotter: parseFloat(mPlotter.replace(',', '.')) || 0,
            valorPlotter: parseFloat(vPlotter.replace(',', '.')) || 0,
            totalPecas,
            total: totalValor,
            itens
        };

        onSalvarOS(novaOS);
        setCliente(''); setRef(''); setProduto(''); setLinhasMatriz([{ id: Math.random().toString(), cor: '', quantidades: {} }]);
    };

    return (
        <div className="card">
            <h3>📝 Nova Ordem de Serviço</h3>
            <div className="grid">
                <div>
                    <label>Cliente</label>
                    <input className="padrao" placeholder="Nome..." value={cliente} onChange={(e) => setCliente(e.target.value)} />
                </div>
                <div>
                    <label>Ref / Modelo</label>
                    <input className="padrao" placeholder="Referência..." value={ref} onChange={(e) => setRef(e.target.value)} />
                </div>
                <div>
                    <label>Produto</label>
                    <input className="padrao" placeholder="Ex: Calça Jeans" value={produto} onChange={(e) => setProduto(e.target.value)} />
                </div>
            </div>

            <div className="grid-4">
                <div>
                    <label>Status Finan.</label>
                    <select className="padrao" value={statusPagamento} onChange={(e) => setStatusPagamento(e.target.value)}>
                        <option value="PENDENTE">🔴 Pendente</option>
                        <option value="PAGO">🟢 Pago</option>
                    </select>
                </div>
                <div>
                    <label>R$ Corte (Un)</label>
                    <input className="padrao" placeholder="1,25" value={valorCorte} onChange={(e) => setValorCorte(e.target.value)} />
                </div>
                <div>
                    <label>Plotter (M)</label>
                    <input className="padrao" placeholder="0" value={mPlotter} onChange={(e) => setMPlotter(e.target.value)} />
                </div>
                <div>
                    <label>R$ Plotter (M)</label>
                    <input className="padrao" placeholder="10,00" value={vPlotter} onChange={(e) => setVPlotter(e.target.value)} />
                </div>
            </div>

            <div className="total-box">
                <div>TOTAL PEÇAS:<br /><span>{totalPecas}</span></div>
                <div style={{ textAlign: 'right' }}>VALOR TOTAL:<br /><span>{fmtReal(totalValor)}</span></div>
            </div>
            <button className="acao btn-primary" onClick={handleSalvar}>💾 SALVAR E GERAR O.S.</button>
        </div>
    );
}
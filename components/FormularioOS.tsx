/**
 * ============================================================================
 * MÓDULO: FormularioOS.tsx
 * DESCRIÇÃO: Formulário de lançamento de O.S. com matriz dinâmica.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';

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
    const [dataSaida] = useState(new Date().toISOString().split('T')[0]);
    const [statusPagamento, setStatusPagamento] = useState('PENDENTE');
    const [valorCorte, setValorCorte] = useState('');
    const [mPlotter, setMPlotter] = useState('');
    const [vPlotter, setVPlotter] = useState('');
    const [linhas, setLinhas] = useState<LinhaCorMatriz[]>([
        { id: '1', cor: 'BRANCO', quantidades: {} }
    ]);

    const handleAdicionarCor = () => {
        setLinhas([...linhas, { id: Date.now().toString(), cor: '', quantidades: {} }]);
    };

    const handleQtdChange = (linhaId: string, tamanho: string, valor: string) => {
        const qtd = parseInt(valor) || 0;
        setLinhas(linhas.map(l => {
            if (l.id === linhaId) {
                return { ...l, quantidades: { ...l.quantidades, [tamanho]: qtd } };
            }
            return l;
        }));
    };

    // Cálculos automáticos
    const totalPecas = linhas.reduce((acc, linha) => {
        const somaLinha = Object.values(linha.quantidades).reduce((a, b) => a + b, 0);
        return acc + somaLinha;
    }, 0);

    const vCorteNum = parseFloat(valorCorte.replace(',', '.')) || 0;
    const mPlotterNum = parseFloat(mPlotter.replace(',', '.')) || 0;
    const vPlotterNum = parseFloat(vPlotter.replace(',', '.')) || 0;
    const totalValor = (totalPecas * vCorteNum) + (mPlotterNum * vPlotterNum);

    const handleSalvar = () => {
        if (!cliente || !produto) {
            alert('Preencha o cliente e o produto.');
            return;
        }

        const osData = {
            id: Date.now().toString(),
            cliente,
            ref,
            produto,
            dataSaida,
            statusPagamento,
            valorCorte: vCorteNum,
            mPlotter: mPlotterNum,
            vPlotter: vPlotterNum,
            totalPecas,
            total: totalValor,
            linhas
        };

        onSalvarOS(osData);
        setCliente('');
        setRef('');
        setProduto('');
        setLinhas([{ id: Date.now().toString(), cor: 'BRANCO', quantidades: {} }]);
    };

    return (
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--borda)', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px', color: '#38bdf8' }}>📋 Nova Ordem de Serviço (Chão de Fábrica)</h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                    <label>Cliente / Apelido</label>
                    <input className="padrao" placeholder="Nome do cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
                </div>
                <div>
                    <label>Referência (Ref)</label>
                    <input className="padrao" placeholder="Ex: 1025" value={ref} onChange={(e) => setRef(e.target.value)} />
                </div>
                <div>
                    <label>Produto / Artigo</label>
                    <input className="padrao" placeholder="Ex: Calça Sarja" value={produto} onChange={(e) => setProduto(e.target.value)} />
                </div>
            </div>

            {/* Matriz de Cores e Tamanhos */}
            <div style={{ overflowX: 'auto', marginBottom: '15px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#0f172a', color: '#38bdf8' }}>
                            <th style={{ padding: '8px', textAlign: 'left' }}>Cor</th>
                            {TAM_DEFAULT.map(t => <th key={t} style={{ padding: '8px' }}>{t}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.map((linha, idx) => (
                            <tr key={linha.id} style={{ borderBottom: '1px solid var(--borda)' }}>
                                <td style={{ padding: '6px', textAlign: 'left' }}>
                                    <input 
                                        style={{ width: '120px', padding: '4px' }} 
                                        placeholder="COR" 
                                        value={linha.cor} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLinhas(linhas.map(l => l.id === linha.id ? { ...l, cor: val } : l));
                                        }} 
                                    />
                                </td>
                                {TAM_DEFAULT.map(t => (
                                    <td key={t} style={{ padding: '6px' }}>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            style={{ width: '45px', textAlign: 'center', padding: '4px' }} 
                                            value={linha.quantidades[t] || ''} 
                                            onChange={(e) => handleQtdChange(linha.id, t, e.target.value)} 
                                        />
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <button type="button" className="acao" style={{ background: '#334155', color: '#fff', fontSize: '12px', marginBottom: '15px' }} onClick={handleAdicionarCor}>
                + Adicionar Cor na Grade
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '15px' }}>
                <div>
                    <label>Status Financeiro</label>
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
                    <label>Plotter (Metros)</label>
                    <input className="padrao" placeholder="0" value={mPlotter} onChange={(e) => setMPlotter(e.target.value)} />
                </div>
                <div>
                    <label>R$ Plotter (Metro)</label>
                    <input className="padrao" placeholder="10,00" value={vPlotter} onChange={(e) => setVPlotter(e.target.value)} />
                </div>
            </div>

            <div style={{ background: '#0f172a', padding: '15px', borderRadius: '8px', border: '1px solid var(--borda)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <div>TOTAL PEÇAS:<br /><span style={{ fontSize: '20px', color: '#38bdf8', fontWeight: 'bold' }}>{totalPecas}</span></div>
                <div style={{ textAlign: 'right' }}>VALOR TOTAL:<br /><span style={{ fontSize: '20px', color: '#4ade80', fontWeight: 'bold' }}>R$ {totalValor.toFixed(2)}</span></div>
            </div>
            
            <button className="acao btn-primary" style={{ width: '100%' }} onClick={handleSalvar}>💾 SALVAR E GERAR O.S.</button>
        </div>
    );
}
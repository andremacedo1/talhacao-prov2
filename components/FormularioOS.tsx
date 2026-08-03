/**
 * ============================================================================
 * MÓDULO: FormularioOS.tsx (Com Cache de Sessão em Tempo Real)
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
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
    const [statusPagamento, setStatusPagamento] = useState('PENDENTE');
    const [valorCorte, setValorCorte] = useState('');
    const [mPlotter, setMPlotter] = useState('');
    const [vPlotter, setVPlotter] = useState('');
    const [linhas, setLinhas] = useState<LinhaCorMatriz[]>([
        { id: '1', cor: 'BRANCO', quantidades: {} }
    ]);

    // Carregar cache de sessão ao abrir (Anti-Perda)
    useEffect(() => {
        const cacheSalvo = localStorage.getItem('talhacao_os_draft');
        if (cacheSalvo) {
            try {
                const dados = JSON.parse(cacheSalvo);
                setCliente(dados.cliente || '');
                setRef(dados.ref || '');
                setProduto(dados.produto || '');
                if (dados.linhas) setLinhas(dados.linhas);
            } catch (e) { console.error("Erro ao carregar rascunho"); }
        }
    }, []);

    // Salvar cache de sessão em tempo real a cada alteração
    useEffect(() => {
        const rascunho = { cliente, ref, produto, linhas };
        localStorage.setItem('talhacao_os_draft', JSON.stringify(rascunho));
    }, [cliente, ref, produto, linhas]);

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
            cliente: cliente.toUpperCase(),
            ref,
            produto: produto.toUpperCase(),
            dataSaida: new Date().toISOString().split('T')[0],
            statusPagamento,
            valorCorte: vCorteNum,
            mPlotter: mPlotterNum,
            vPlotter: vPlotterNum,
            totalPecas,
            total: totalValor,
            linhas
        };

        onSalvarOS(osData);
        localStorage.removeItem('talhacao_os_draft'); // Limpa rascunho ao salvar com sucesso
        setCliente('');
        setRef('');
        setProduto('');
        setLinhas([{ id: Date.now().toString(), cor: 'BRANCO', quantidades: {} }]);
    };

    return (
        <div style={{ background: '#111827', padding: '24px', borderRadius: '16px', border: '1px solid #1f2937', boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.3)', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h3 style={{ color: '#38bdf8', fontSize: '18px', fontWeight: 'bold' }}>⚙️ Nova Ordem de Serviço (Chão de Fábrica)</h3>
                <span style={{ fontSize: '11px', background: '#1e293b', color: '#94a3b8', padding: '4px 8px', borderRadius: '6px' }}>💾 Cache de Sessão Ativo</span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', marginBottom: '16px' }}>
                <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Cliente / Apelido</label>
                    <input style={{ background: '#030712', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', width: '100%' }} placeholder="Nome do cliente" value={cliente} onChange={(e) => setCliente(e.target.value)} />
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Referência (Ref)</label>
                    <input style={{ background: '#030712', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', width: '100%' }} placeholder="Ex: 1025" value={ref} onChange={(e) => setRef(e.target.value)} />
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Produto / Artigo</label>
                    <input style={{ background: '#030712', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', width: '100%' }} placeholder="Ex: Calça Sarja" value={produto} onChange={(e) => setProduto(e.target.value)} />
                </div>
            </div>

            <div style={{ overflowX: 'auto', marginBottom: '16px', borderRadius: '8px', border: '1px solid #1f2937' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'center', fontSize: '13px' }}>
                    <thead>
                        <tr style={{ background: '#1f2937', color: '#38bdf8' }}>
                            <th style={{ padding: '10px', textAlign: 'left' }}>Cor</th>
                            {TAM_DEFAULT.map(t => <th key={t} style={{ padding: '10px' }}>{t}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {linhas.map((linha) => (
                            <tr key={linha.id} style={{ borderBottom: '1px solid #1f2937' }}>
                                <td style={{ padding: '8px', textAlign: 'left' }}>
                                    <input 
                                        style={{ width: '130px', padding: '6px', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '6px', textTransform: 'uppercase' }} 
                                        placeholder="COR" 
                                        value={linha.cor} 
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setLinhas(linhas.map(l => l.id === linha.id ? { ...l, cor: val } : l));
                                        }} 
                                    />
                                </td>
                                {TAM_DEFAULT.map(t => (
                                    <td key={t} style={{ padding: '8px' }}>
                                        <input 
                                            type="number" 
                                            min="0" 
                                            style={{ width: '50px', textAlign: 'center', padding: '6px', background: '#030712', border: '1px solid #374151', color: '#fff', borderRadius: '6px' }} 
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

            <button type="button" style={{ background: '#1f2937', color: '#fff', border: 'none', padding: '8px 14px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold', cursor: 'pointer', marginBottom: '20px' }} onClick={handleAdicionarCor}>
                + Adicionar Cor na Grade
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
                <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Status Financeiro</label>
                    <select style={{ background: '#030712', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', width: '100%' }} value={statusPagamento} onChange={(e) => setStatusPagamento(e.target.value)}>
                        <option value="PENDENTE">🔴 Pendente</option>
                        <option value="PAGO">🟢 Pago</option>
                    </select>
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>R$ Corte (Un)</label>
                    <input style={{ background: '#030712', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', width: '100%' }} placeholder="1,25" value={valorCorte} onChange={(e) => setValorCorte(e.target.value)} />
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>Metros Plotter</label>
                    <input style={{ background: '#030712', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', width: '100%' }} placeholder="0" value={mPlotter} onChange={(e) => setMPlotter(e.target.value)} />
                </div>
                <div>
                    <label style={{ fontSize: '12px', color: '#94a3b8', display: 'block', marginBottom: '4px' }}>R$ Plotter (Metro)</label>
                    <input style={{ background: '#030712', border: '1px solid #374151', color: '#fff', padding: '10px', borderRadius: '8px', width: '100%' }} placeholder="10,00" value={vPlotter} onChange={(e) => setVPlotter(e.target.value)} />
                </div>
            </div>

            <div style={{ background: '#030712', padding: '16px', borderRadius: '12px', border: '1px solid #1f2937', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div><span style={{ fontSize: '11px', color: '#94a3b8' }}>TOTAL PEÇAS</span><br /><span style={{ fontSize: '22px', color: '#38bdf8', fontWeight: 'bold' }}>{totalPecas}</span></div>
                <div style={{ textAlign: 'right' }}><span style={{ fontSize: '11px', color: '#94a3b8' }}>VALOR TOTAL O.S.</span><br /><span style={{ fontSize: '22px', color: '#4ade80', fontWeight: 'bold' }}>R$ {totalValor.toFixed(2)}</span></div>
            </div>
            
            <button style={{ width: '100%', background: 'linear-gradient(to right, #2563eb, #1d4ed8)', color: '#fff', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', fontSize: '15px', cursor: 'pointer', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }} onClick={handleSalvar}>
                💾 SALVAR E REGISTRAR ORDEM DE SERVIÇO
            </button>
        </div>
    );
}
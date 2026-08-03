/**
 * ============================================================================
 * MÓDULO: components/FormularioOS.tsx
 * DESCRIÇÃO: Formulário de O.S. Fiel ao HTML Original (Datalist e Grade Dinâmica).
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * DATA/HORA DE ALTERAÇÃO: 2026-08-03 17:35
 * REGRAS DE NEGÓCIO: 
 * 1. Restauração do DataList de Clientes e botão de Limpar (🗑️).
 * 2. Restauração 100% da Lógica de Matriz Dinâmica (minhaGradePro) com Adicionar/Excluir Colunas de Tamanho.
 * 3. Integração com botão "Repetir" (re-popula o state com OS anterior).
 * ============================================================================
 */

'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, addDoc } from 'firebase/firestore';

const TAM_DEFAULT = ["34","36","38","40","42","44","P","M","G","GG"];

export default function FormularioOS({ clientesDb, osCarregada, clearOsCarregada, onSuccess }: any) {
    const [tamanhosGrade, setTamanhosGrade] = useState<string[]>(TAM_DEFAULT);
    
    const [cliente, setCliente] = useState('');
    const [ref, setRef] = useState('');
    const [produto, setProduto] = useState('');
    const [dataSaida, setDataSaida] = useState(new Date().toISOString().split('T')[0]);
    const [dataRetorno, setDataRetorno] = useState('');
    const [responsavel, setResponsavel] = useState('');
    const [statusPagamento, setStatusPagamento] = useState('PENDENTE');
    const [valorCorte, setValorCorte] = useState('');
    const [mPlotter, setMPlotter] = useState('');
    const [vPlotter, setVPlotter] = useState('10,00'); // Padrão do HTML original
    const [linhas, setLinhas] = useState<any[]>([{ id: Date.now(), cor: '', quantidades: {} }]);

    // Restaurando custom grade local
    useEffect(() => {
        try {
            const saved = localStorage.getItem('minhaGradePro');
            if (saved) {
                const parsed = JSON.parse(saved);
                if (Array.isArray(parsed) && parsed.length > 0) setTamanhosGrade(parsed);
            }
        } catch(e) { console.error(e) }
    }, []);

    // Ação do Botão Repetir O.S. do Histórico
    useEffect(() => {
        if (osCarregada) {
            setCliente(osCarregada.cliente || ''); setRef(osCarregada.ref || ''); setProduto(osCarregada.produto || '');
            setResponsavel(osCarregada.responsavel || ''); setValorCorte(osCarregada.valorCorte?.toString().replace('.',',') || '');
            setMPlotter(osCarregada.mPlotter?.toString().replace('.',',') || ''); setVPlotter(osCarregada.valorPlotter?.toString().replace('.',',') || '10,00');
            setStatusPagamento(osCarregada.statusPagamento || 'PENDENTE');
            
            // Remapeando o objeto 'itens' da O.S. repetida para a grade matricial
            let coresMap: any = {};
            let novosTamanhos = [...tamanhosGrade];
            for (let k in osCarregada.itens) {
                let partes = k.split(" - ");
                let cor = partes.length > 1 ? partes[0] : "SEM COR";
                let tam = partes.length > 1 ? partes[1] : partes[0];
                if (!coresMap[cor]) coresMap[cor] = {};
                coresMap[cor][tam] = osCarregada.itens[k];
                if (!novosTamanhos.includes(tam)) novosTamanhos.push(tam);
            }
            setTamanhosGrade(novosTamanhos);
            
            const novasLinhas = Object.keys(coresMap).map((c, i) => ({
                id: Date.now() + i, cor: c === "SEM COR" ? "" : c, quantidades: coresMap[c]
            }));
            setLinhas(novasLinhas.length > 0 ? novasLinhas : [{ id: Date.now(), cor: '', quantidades: {} }]);
            clearOsCarregada();
        }
    }, [osCarregada]);

    // Matriz - Controles de Tamanhos (Colunas)
    const adicionarTamanho = () => {
        const novos = [...tamanhosGrade, "NOVO"];
        setTamanhosGrade(novos);
        localStorage.setItem('minhaGradePro', JSON.stringify(novos));
    };

    const atualizarTamanho = (index: number, valor: string) => {
        const novos = [...tamanhosGrade];
        novos[index] = valor.toUpperCase();
        setTamanhosGrade(novos);
        localStorage.setItem('minhaGradePro', JSON.stringify(novos));
    };

    const removerTamanho = (index: number) => {
        if(confirm("Excluir esta coluna de tamanho?")) {
            const novos = tamanhosGrade.filter((_, i) => i !== index);
            setTamanhosGrade(novos);
            localStorage.setItem('minhaGradePro', JSON.stringify(novos));
        }
    };

    // Cálculos
    const totalPecas = linhas.reduce((acc, linha) => acc + Object.values(linha.quantidades as Record<string, number>).reduce((a, b) => a + (b || 0), 0), 0);
    const vCorteNum = parseFloat(valorCorte.replace(',', '.')) || 0;
    const mPlotterNum = parseFloat(mPlotter.replace(',', '.')) || 0;
    const vPlotterNum = parseFloat(vPlotter.replace(',', '.')) || 0;
    const totalValor = (totalPecas * vCorteNum) + (mPlotterNum * vPlotterNum);

    const handleSalvar = async () => {
        if (!cliente) return alert('O Nome do cliente é obrigatório!');
        if (totalPecas === 0 && mPlotterNum === 0) return alert("Preencha a grade de peças ou o plotter.");

        let itens: any = {};
        linhas.forEach(l => {
            let corStr = l.cor.trim().toUpperCase() || "SEM COR";
            tamanhosGrade.forEach(tam => {
                let q = l.quantidades[tam] || 0;
                if (q > 0) {
                    let chave = corStr === "SEM COR" ? tam : `${corStr} - ${tam}`;
                    itens[chave] = (itens[chave] || 0) + q;
                }
            });
        });

        try {
            await addDoc(collection(db, "historico"), {
                cliente: cliente.toUpperCase(), ref, produto, dataSaida, dataRetorno, responsavel,
                valorCorte: vCorteNum, mPlotter: mPlotterNum, valorPlotter: vPlotterNum,
                itens, totalPecas, total: totalValor, statusPagamento, timestamp: Date.now()
            });

            // Limpa form fiel ao original
            setCliente(''); setRef(''); setProduto(''); setDataRetorno(''); setResponsavel('');
            setValorCorte(''); setMPlotter(''); setStatusPagamento('PENDENTE');
            setLinhas([{ id: Date.now(), cor: '', quantidades: {} }]);
            setDataSaida(new Date().toISOString().split('T')[0]);
            
            alert('💾 Ordem de Serviço Salva!');
            onSuccess();
        } catch(e) { alert("Erro ao salvar. Verifique sua conexão."); }
    };

    return (
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '10px', border: '1px solid var(--borda)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
            <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--azul)', paddingBottom: '10px', fontSize: '18px' }}>📝 Nova Ordem de Serviço</h3>
            
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '15px' }}>
                <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Cliente</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input className="padrao" value={cliente} onChange={(e) => setCliente(e.target.value)} placeholder="Nome..." list="listaClientesOpts" />
                        <button className="acao btn-danger" onClick={() => setCliente('')} title="Remover Cliente">🗑️</button>
                    </div>
                    <datalist id="listaClientesOpts">
                        {clientesDb.map((c: any) => <option key={c.id} value={c.razaoSocial || c.nome} />)}
                    </datalist>
                </div>
                <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Ref / Modelo</label><input className="padrao" value={ref} onChange={(e) => setRef(e.target.value)} placeholder="Referência..." /></div>
                <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Produto</label><input className="padrao" value={produto} onChange={(e) => setProduto(e.target.value)} placeholder="Ex: Calça Jeans" /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px', marginBottom: '15px' }}>
                <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Data Saída</label><input type="date" className="padrao" value={dataSaida} onChange={(e) => setDataSaida(e.target.value)} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Data Retorno</label><input type="date" className="padrao" value={dataRetorno} onChange={(e) => setDataRetorno(e.target.value)} /></div>
                <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Responsável</label><input className="padrao" value={responsavel} onChange={(e) => setResponsavel(e.target.value)} placeholder="Assinatura..." /></div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '12px', marginBottom: '15px' }}>
                <div>
                    <label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Status Finan.</label>
                    <select className="padrao" value={statusPagamento} onChange={(e) => setStatusPagamento(e.target.value)}>
                        <option value="PENDENTE">🔴 Pendente</option><option value="PAGO">🟢 Pago</option>
                    </select>
                </div>
                <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>R$ Corte (Un)</label><input className="padrao" value={valorCorte} onChange={(e) => setValorCorte(e.target.value)} placeholder="1,25" /></div>
                <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Plotter (M)</label><input className="padrao" value={mPlotter} onChange={(e) => setMPlotter(e.target.value)} placeholder="0" /></div>
                <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>R$ Plotter (M)</label><input className="padrao" value={vPlotter} onChange={(e) => setVPlotter(e.target.value)} placeholder="10,00" /></div>
            </div>

            <label style={{ marginTop: '15px', marginBottom: 0, fontSize: '12px', color: 'var(--azul)', fontWeight: 'bold' }}>Tabela Matriz (Adicione Cores e Tamanhos)</label>
            <div style={{ overflowX: 'auto', paddingBottom: '10px', background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '8px', border: '1px solid var(--borda)', marginTop: '5px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', minWidth: 'max-content' }}>
                    {/* Headers da Matriz Dinâmica */}
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'flex-end', paddingBottom: '5px', borderBottom: '2px solid var(--borda)' }}>
                        <div style={{ width: '140px', flexShrink: 0, display: 'flex', alignItems: 'center', fontWeight: 'bold', fontSize: '11px', color: 'var(--subtexto)' }}>CORES (LOTES)</div>
                        {tamanhosGrade.map((t, i) => (
                            <div key={i} style={{ width: '65px', flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                <div style={{ cursor: 'pointer', color: 'var(--vermelho)', fontSize: '12px', fontWeight: 'bold', marginBottom: '4px' }} onClick={() => removerTamanho(i)} title="Remover Tamanho">✖</div>
                                <input type="text" style={{ border: 'none', borderBottom: '1px dashed var(--azul)', background: 'transparent', color: 'var(--texto)', fontSize: '13px', fontWeight: 'bold', width: '100%', textAlign: 'center', paddingBottom: '4px' }} value={t} onChange={(e) => atualizarTamanho(i, e.target.value)} />
                            </div>
                        ))}
                        <div style={{ width: '40px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div className="btn-add-col" onClick={adicionarTamanho} title="Adicionar Tamanho">+</div>
                        </div>
                    </div>
                    {/* Linhas de Cor */}
                    {linhas.map((linha, lIndex) => (
                        <div key={linha.id} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                            <div style={{ width: '140px', flexShrink: 0, display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <button style={{ background: 'var(--vermelho)', color: '#fff', borderRadius: '6px', border: 'none', padding: '10px 12px', cursor: 'pointer', fontWeight: 'bold' }} onClick={() => setLinhas(linhas.filter(x => x.id !== linha.id))}>X</button>
                                <input type="text" className="input-cor" placeholder="Ex: Azul" value={linha.cor} onChange={(e) => { const n = [...linhas]; n[lIndex].cor = e.target.value; setLinhas(n); }} />
                            </div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {tamanhosGrade.map((t, i) => (
                                    <div key={i} style={{ width: '65px', flexShrink: 0 }}>
                                        <input type="number" className="tam-qtd" placeholder="-" value={linha.quantidades[t] || ''} onChange={(e) => {
                                            const n = [...linhas]; 
                                            n[lIndex].quantidades[t] = parseInt(e.target.value) || 0; 
                                            setLinhas(n);
                                        }} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <button className="acao btn-success" style={{ width: '100%', marginTop: '5px' }} onClick={() => setLinhas([...linhas, { id: Date.now(), cor: '', quantidades: {} }])}>➕ ADICIONAR NOVA COR</button>

            <div className="total-box">
                <div>TOTAL PEÇAS:<br/><span>{totalPecas}</span></div>
                <div style={{ textAlign: 'right' }}>VALOR TOTAL:<br/><span>R$ {totalValor.toFixed(2).replace('.',',')}</span></div>
            </div>

            <button className="acao btn-primary" onClick={handleSalvar}>💾 SALVAR E GERAR O.S.</button>
        </div>
    );
}
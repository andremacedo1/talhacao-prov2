/**
 * ============================================================================
 * MÓDULO: HistoricoAcoes.tsx
 * DESCRIÇÃO: Listagem, filtros, exportação de backup e ações de PDF/WhatsApp.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';

export default function HistoricoAcoes({ historico, onExportarBackup, onRestaurarBackup }: { historico: any[], onExportarBackup: () => void, onRestaurarBackup: (e: any) => void }) {
    const [busca, setBusca] = useState('');

    const fmtReal = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const handleCopiarDadosNota = (p: any) => {
        const texto = `TOMADOR: ${p.cliente}\nPRODUTO: ${p.produto} (REF: ${p.ref})\nQTD PEÇAS: ${p.totalPecas}\nVALOR TOTAL: R$ ${p.total.toFixed(2)}`;
        navigator.clipboard.writeText(texto);
        alert('⚡ Dados copiados para a área de transferência! Abrindo portal IPM...');
        window.open('https://riodosul.atende.net/', '_blank');
    };

    const filtrados = historico.filter(p => 
        p.cliente?.toLowerCase().includes(busca.toLowerCase()) || 
        p.produto?.toLowerCase().includes(busca.toLowerCase())
    );

    return (
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--borda)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                <h3 style={{ color: '#38bdf8' }}>📊 Histórico de Ordens de Serviço & Acerto Fiscal</h3>
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button className="acao btn-primary" onClick={onExportarBackup}>📥 Backup JSON</button>
                    <label className="acao btn-success" style={{ cursor: 'pointer', display: 'inline-block' }}>
                        📤 Restaurar <input type="file" accept=".json" onChange={onRestaurarBackup} style={{ display: 'none' }} />
                    </label>
                </div>
            </div>

            <input className="padrao" style={{ marginBottom: '15px' }} placeholder="Buscar por cliente ou produto..." value={busca} onChange={(e) => setBusca(e.target.value)} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {filtrados.map(p => (
                    <div key={p.id} style={{ border: '1px solid var(--borda)', background: 'rgba(0,0,0,0.2)', padding: '15px', borderRadius: '8px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>👤 {p.cliente}</strong>
                            <strong style={{ color: '#4ade80' }}>{fmtReal(p.total)}</strong>
                        </div>
                        <div style={{ fontSize: '13px', color: '#94a3b8', marginTop: '4px' }}>REF: {p.ref || '---'} | PROD: {p.produto || '---'} | Peças: {p.totalPecas}</div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                            <button className="acao btn-success" style={{ background: '#ca8a04', color: '#000', fontSize: '12px', padding: '6px 12px' }} onClick={() => handleCopiarDadosNota(p)}>⚡ Copiar Dados NFSe</button>
                        </div>
                    </div>
                ))}
                {filtrados.length === 0 && <p style={{ color: '#64748b', textAlign: 'center' }}>Nenhuma ordem de serviço registrada.</p>}
            </div>
        </div>
    );
}
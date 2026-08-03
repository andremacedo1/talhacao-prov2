/**
 * ============================================================================
 * MÓDULO: HistoricoAcoes.tsx
 * DESCRIÇÃO: Listagem, filtros, exportação de backup e ações de PDF/WhatsApp.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * DATA/HORA DE CRIAÇÃO: 2026-08-03 11:55
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';

export default function HistoricoAcoes({ historico, onExportarBackup, onRestaurarBackup }: { historico: any[], onExportarBackup: () => void, onRestaurarBackup: (e: any) => void }) {
    const [busca, setBusca] = useState('');
    const [filtroStatus, setFiltroStatus] = useState('TODOS');

    const fmtReal = (v: number) => (v || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    const gerarPDF = (p: any) => {
        if (!(window as any).jspdf) {
            alert('Biblioteca jsPDF não carregada.');
            return;
        }
        const { jsPDF } = (window as any).jspdf;
        const doc = new jsPDF();
        doc.setFontSize(18); doc.text('ORDEM DE SERVIÇO INDUSTRIAL', 20, 23);
        doc.setFontSize(10);
        doc.text(`CLIENTE: ${p.cliente}`, 20, 30);
        doc.text(`REF: ${p.ref || '---'} | PRODUTO: ${p.produto || '---'}`, 20, 35);
        doc.save(`OS_${p.ref || 'S-REF'}_${p.cliente}.pdf`);
    };

    const enviarWhatsApp = (p: any) => {
        const msg = `*ALTO VALE TALHAÇÃO - O.S.*%0A*Ref:* ${p.ref || '---'}%0A*Cliente:* ${p.cliente}%0A*Total:* ${p.totalPecas} pçs | ${fmtReal(p.total)}`;
        window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
    };

    const handleCopiarDadosNota = (p: any) => {
        const textoFiscal = `TOMADOR: ${p.cliente}\nSERVIÇO: Talhação de Peças - Ref: ${p.ref || 'N/A'}\nVALOR TOTAL: ${fmtReal(p.total)}\nQUANTIDADE: ${p.totalPecas} peças`;
        navigator.clipboard.writeText(textoFiscal).then(() => {
            alert(`📋 Dados fiscais copiados para a área de transferência!`);
        });
    };

    const filtrados = historico.filter(p => {
        const matchBusca = !busca || p.cliente.includes(busca.toUpperCase()) || (p.ref && p.ref.includes(busca.toUpperCase()));
        const matchStatus = filtroStatus === 'TODOS' || (p.statusPagamento || 'PENDENTE') === filtroStatus;
        return matchBusca && matchStatus;
    });

    return (
        <div className="card">
            <h3 style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                📂 Histórico & Backup
                <div style={{ display: 'flex', gap: '5px' }}>
                    <button className="acao btn-backup" onClick={onExportarBackup}>⬇️ Exportar Backup</button>
                    <button className="acao btn-backup" onClick={() => document.getElementById('fileRestaurar')?.click()}>⬆️ Restaurar</button>
                    <input type="file" id="fileRestaurar" accept=".json" style={{ display: 'none' }} onChange={onRestaurarBackup} />
                </div>
            </h3>

            <div className="busca-container" style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                <input type="text" className="padrao" placeholder="🔍 Buscar por Cliente ou Ref..." value={busca} onChange={(e) => setBusca(e.target.value)} />
                <select className="padrao" value={filtroStatus} onChange={(e) => setFiltroStatus(e.target.value)}>
                    <option value="TODOS">Todos</option>
                    <option value="PENDENTE">Pendentes</option>
                    <option value="PAGO">Pagos</option>
                </select>
            </div>

            <div>
                {filtrados.map((p) => (
                    <div className="hist-item" key={p.id} style={{ borderLeft: '4px solid var(--azul)', background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '8px', marginBottom: '12px' }}>
                        <div className="hist-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <strong>👤 {p.cliente}</strong>
                            <strong style={{ color: 'var(--verde)' }}>{fmtReal(p.total)}</strong>
                        </div>
                        <div className="hist-sub">REF: {p.ref || '---'} | PROD: {p.produto || '---'}</div>
                        <div className="hist-acoes" style={{ display: 'flex', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
                            <button className="acao" style={{ background: '#333', color: '#fff', fontSize: '12px', padding: '8px 12px' }} onClick={() => gerarPDF(p)}>📄 PDF</button>
                            <button className="acao btn-whats" style={{ fontSize: '12px', padding: '8px 12px' }} onClick={() => enviarWhatsApp(p)}>💬 Whats</button>
                            <button className="acao btn-success" style={{ background: 'var(--amarelo)', color: '#000', fontSize: '12px', padding: '8px 12px' }} onClick={() => handleCopiarDadosNota(p)}>⚡ Copiar Dados NFSe</button>
                        </div>
                    </div>
                ))}
                {filtrados.length === 0 && <p style={{ color: '#777', fontSize: '14px', padding: '15px' }}>Nenhuma O.S. encontrada.</p>}
            </div>
        </div>
    );
}
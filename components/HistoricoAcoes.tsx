/**
 * ============================================================================
 * MÓDULO: components/HistoricoAcoes.tsx
 * DESCRIÇÃO: Restauração Global do Acerto de Contas, Gráfico, Histórico e Backup.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * DATA/HORA DE ALTERAÇÃO: 2026-08-03 19:15
 * REGRAS DE NEGÓCIO: 
 * 1. Tipagem Explícita (any[]) aplicada no map do Firestore.
 * 2. Motor de Exportar/Restaurar Backup JSON operando no topo do Dashboard.
 * 3. 100% de compatibilidade com as ações do HTML original: PDF, Whats, Repetir, Delete.
 * 4. Extensão V2 conectada: Copiar Dados NFSe (Agnóstico, sem menção a empresas de terceiros).
 * ============================================================================
 */

'use client';
import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, orderBy, limit, getDocs, onSnapshot, deleteDoc, doc, updateDoc, where, setDoc } from 'firebase/firestore';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler } from 'chart.js';
import jsPDF from 'jspdf';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Filler);

const fmtReal = (v: number) => (Number(v) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface HistoricoProps {
    clientesDb: any[];
    onRepetir: (os: any) => void;
}

export default function HistoricoAcoes({ clientesDb, onRepetir }: HistoricoProps) {
    const [historico, setHistorico] = useState<any[]>([]);
    const [limiteAtual, setLimiteAtual] = useState(20);
    const [termoBusca, setTermoBusca] = useState('');
    const [statusFiltro, setStatusFiltro] = useState('TODOS');
    
    // Resumo e Gráfico
    const [faturamentoHoje, setFaturamentoHoje] = useState(0);
    const [pecasHoje, setPecasHoje] = useState(0);
    const [dadosGrafico, setDadosGrafico] = useState<any>(null);

    // Relatório Fechamento
    const [relCliente, setRelCliente] = useState('');
    const [relDataIni, setRelDataIni] = useState('');
    const [relDataFim, setRelDataFim] = useState('');
    const [relStatus, setRelStatus] = useState('TODOS');
    const [isGerandoRelatorio, setIsGerandoRelatorio] = useState(false);

    useEffect(() => {
        const qHist = query(collection(db, "historico"), orderBy("timestamp", "desc"), limit(limiteAtual));
        
        const unsub = onSnapshot(qHist, (snap) => {
            const list: any[] = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));
            setHistorico(list);
            
            let hoje = new Date().toISOString().split('T')[0];
            let fat = 0, pcs = 0;
            list.forEach(p => { 
                if (p.dataSaida === hoje) { fat += (p.total || 0); pcs += (p.totalPecas || 0); } 
            });
            setFaturamentoHoje(fat); setPecasHoje(pcs);

            const producaoPorDia: any = {};
            list.forEach(p => {
                if(!p.dataSaida) return;
                const dataFormatada = String(p.dataSaida).split('-').reverse().slice(0,2).join('/'); 
                producaoPorDia[dataFormatada] = (producaoPorDia[dataFormatada] || 0) + (p.totalPecas || 0);
            });
            
            const datas = Object.keys(producaoPorDia).slice(0, 7).reverse();
            const volumes = datas.map(d => producaoPorDia[d]);
            
            setDadosGrafico({
                labels: datas,
                datasets: [{ label: 'Peças', data: volumes, backgroundColor: 'rgba(0, 174, 239, 0.2)', borderColor: '#00AEEF', borderWidth: 2, pointBackgroundColor: '#10b981', tension: 0.3, fill: true }]
            });
        });
        
        return () => unsub();
    }, [limiteAtual]);

    const exportarBackup = () => {
        if (historico.length === 0) return alert("Sem dados para exportar.");
        const blob = new Blob([JSON.stringify(historico, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `backup_altovale_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(a.href);
    };

    const restaurarBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const dados = JSON.parse(e.target?.result as string);
                if (!confirm(`Deseja restaurar ${dados.length} Ordens de Serviço do Backup para o banco de dados?`)) { event.target.value = ""; return; }
                for (let p of dados) {
                    const idOriginal = p.id;
                    const copy = { ...p }; delete copy.id;
                    await setDoc(doc(db, "historico", idOriginal), copy);
                }
                alert("✅ Backup restaurado com sucesso!");
                event.target.value = "";
            } catch (err) { alert("❌ Erro ao ler backup JSON."); }
        };
        reader.readAsText(file);
    };

    const gerarRelatorioFechamento = async () => {
        if (!relCliente) return alert("Selecione um cliente para gerar o relatório.");
        setIsGerandoRelatorio(true);
        try {
            const q = query(collection(db, "historico"), where("cliente", "==", relCliente.toUpperCase()));
            const snap = await getDocs(q);
            let filtrados: any[] = snap.docs.map(d => ({id: d.id, ...(d.data() as any)}));

            if(relDataIni) filtrados = filtrados.filter(p => p.dataSaida >= relDataIni);
            if(relDataFim) filtrados = filtrados.filter(p => p.dataSaida <= relDataFim);
            if(relStatus !== "TODOS") filtrados = filtrados.filter(p => (p.statusPagamento || "PENDENTE") === relStatus);

            if(filtrados.length === 0) { setIsGerandoRelatorio(false); return alert("Nenhum pedido encontrado com estes filtros."); }

            filtrados.sort((a, b) => String(a.dataSaida).localeCompare(String(b.dataSaida)));
            
            const docPdf = new jsPDF();
            const logo = document.getElementById("logoEmpresaHTML") as HTMLImageElement;
            if (logo && logo.complete && logo.naturalHeight !== 0) {
                const canvas = document.createElement("canvas");
                canvas.width = logo.naturalWidth; canvas.height = logo.naturalHeight;
                canvas.getContext("2d")?.drawImage(logo,0,0);
                docPdf.addImage(canvas.toDataURL("image/jpeg"), 'JPEG', 15, 12, 20, 20);
            }

            docPdf.setFontSize(18); docPdf.setFont("helvetica","bold");
            docPdf.text(`EXTRATO DE FECHAMENTO`, 40, 20);
            docPdf.setFontSize(12); docPdf.setFont("helvetica","normal");
            docPdf.text(`CLIENTE: ${relCliente}`, 40, 27);
            let periodoStr = (relDataIni && relDataFim) ? `De ${relDataIni.split('-').reverse().join('/')} ate ${relDataFim.split('-').reverse().join('/')}` : 'Todo o periodo registrado';
            docPdf.setFontSize(9); docPdf.text(`Periodo: ${periodoStr} | Filtro: ${relStatus}`, 40, 32);
            docPdf.line(15, 38, 195, 38);
            
            let y = 45;
            docPdf.setFillColor(0, 174, 239); docPdf.rect(15, y, 180, 8, 'F');
            docPdf.setTextColor(255, 255, 255); docPdf.setFontSize(9); docPdf.setFont("helvetica","bold");
            docPdf.text("DATA", 18, y + 5.5); docPdf.text("REF / PRODUTO", 45, y + 5.5); docPdf.text("STATUS", 125, y + 5.5); docPdf.text("PECAS", 155, y + 5.5); 
            docPdf.text("VALOR", 190, y + 5.5, { align: "right" });
            
            y += 12; docPdf.setTextColor(0, 0, 0); docPdf.setFont("helvetica","normal");
            
            let totalPecasPeriodo = 0; let totalValorPeriodo = 0; let totalPago = 0; let totalPendente = 0; let qtdPedidos = filtrados.length;
            
            filtrados.forEach((p, index) => {
                if(y > 260) { 
                    docPdf.setFontSize(8); docPdf.setTextColor(150); docPdf.text("Sistema PRO - Arquitetado por Andre Macedo da Rosa | andremacedo1@gmail.com", 105, 290, { align: "center" });
                    docPdf.addPage(); y = 20; 
                    docPdf.setFillColor(0, 174, 239); docPdf.rect(15, y, 180, 8, 'F');
                    docPdf.setTextColor(255, 255, 255); docPdf.setFontSize(9); docPdf.setFont("helvetica","bold");
                    docPdf.text("DATA", 18, y + 5.5); docPdf.text("REF / PRODUTO", 45, y + 5.5); docPdf.text("STATUS", 125, y + 5.5); docPdf.text("PECAS", 155, y + 5.5); docPdf.text("VALOR", 190, y + 5.5, { align: "right" });
                    y += 12; docPdf.setTextColor(0, 0, 0); docPdf.setFont("helvetica","normal");
                }
                
                if (index % 2 === 0) { docPdf.setFillColor(245, 245, 245); docPdf.rect(15, y-5, 180, 8, 'F'); }

                let dataStr = p.dataSaida ? String(p.dataSaida).split('-').reverse().join('/') : '---';
                let desc = `${p.ref || 'S/R'} - ${p.produto || 'S/P'}`.substring(0, 35);
                let stat = p.statusPagamento || 'PENDENTE';
                
                docPdf.text(dataStr, 18, y); docPdf.text(desc, 45, y);
                docPdf.setFont("helvetica", "bold");
                if (stat === 'PAGO') { docPdf.setTextColor(16, 185, 129); totalPago += (p.total||0); } else { docPdf.setTextColor(239, 68, 68); totalPendente += (p.total||0); }
                docPdf.text(stat, 125, y);
                
                docPdf.setTextColor(0, 0, 0); docPdf.setFont("helvetica", "normal");
                docPdf.text(String(p.totalPecas), 155, y); docPdf.text(fmtReal(p.total), 190, y, { align: "right" });
                
                totalPecasPeriodo += (p.totalPecas||0); totalValorPeriodo += (p.total||0); y += 8;
            });

            y += 2;
            if(y > 255) { 
                docPdf.setFontSize(8); docPdf.setTextColor(150); docPdf.text("Sistema PRO - Arquitetado por Andre Macedo da Rosa | andremacedo1@gmail.com", 105, 290, { align: "center" });
                docPdf.addPage(); y = 20; 
            } 
            docPdf.setFillColor(245, 245, 245); docPdf.rect(15, y, 180, 28, 'F');
            docPdf.setFillColor(0, 174, 239); docPdf.rect(15, y, 180, 8, 'F');
            docPdf.setTextColor(255, 255, 255); docPdf.setFontSize(10); docPdf.setFont("helvetica","bold");
            docPdf.text(`RESUMO DO PERIODO (${qtdPedidos} pedidos | ${totalPecasPeriodo} pecas)`, 18, y + 5.5);
            docPdf.text(`TOTAL GERAL: ${fmtReal(totalValorPeriodo)}`, 190, y + 5.5, { align: "right" });

            docPdf.setFontSize(11);
            docPdf.setTextColor(16, 185, 129); docPdf.text(`VALOR RECEBIDO (PAGO):`, 18, y + 16); docPdf.text(`${fmtReal(totalPago)}`, 190, y + 16, { align: "right" });
            docPdf.setTextColor(239, 68, 68); docPdf.text(`A RECEBER (PENDENTE):`, 18, y + 24); docPdf.text(`${fmtReal(totalPendente)}`, 190, y + 24, { align: "right" });
            
            docPdf.setFontSize(8); docPdf.setTextColor(150); docPdf.text("Sistema PRO - Arquitetado por Andre Macedo da Rosa | andremacedo1@gmail.com", 105, 290, { align: "center" });
            
            docPdf.save(`Fechamento_${relCliente}_${Date.now()}.pdf`);
        } catch(e) { alert("Erro ao gerar PDF de Relatorio."); }
        setIsGerandoRelatorio(false);
    };

    const togglePagamento = async (id: string, current: string) => { await updateDoc(doc(db, "historico", id), { statusPagamento: current === 'PAGO' ? 'PENDENTE' : 'PAGO' }); };
    const deleteOS = async (id: string) => { if(confirm("Excluir permanentemente O.S.?")) await deleteDoc(doc(db, "historico", id)); };

    const emitirPDF = (os: any) => {
        const docPdf = new jsPDF();
        const logo = document.getElementById("logoEmpresaHTML") as HTMLImageElement;
        if (logo && logo.complete && logo.naturalHeight !== 0) {
            const canvas = document.createElement("canvas");
            canvas.width = logo.naturalWidth; canvas.height = logo.naturalHeight;
            canvas.getContext("2d")?.drawImage(logo,0,0);
            docPdf.addImage(canvas.toDataURL("image/jpeg"), 'JPEG', 20, 15, 15, 15);
        }

        docPdf.setFontSize(18); docPdf.setFont("helvetica","bold"); docPdf.text('ORDEM DE SERVICO INDUSTRIAL', 45, 23);
        docPdf.setFontSize(10); docPdf.setFont("helvetica","normal");
        docPdf.text(`CLIENTE: ${os.cliente}`, 45, 30);
        docPdf.text(`REF: ${os.ref || '---'} | PRODUTO: ${os.produto || '---'}`, 45, 35);
        docPdf.text(`DATA SAIDA: ${os.dataSaida ? String(os.dataSaida).split('-').reverse().join('/') : '---'} | RETORNO: ${os.dataRetorno ? String(os.dataRetorno).split('-').reverse().join('/') : '---'}`, 20, 50);
        
        let coresUnicas = new Set();
        for(let k in os.itens) { let partes = k.split(" - "); if(partes.length > 1 && partes[0]) coresUnicas.add(partes[0]); }
        let coresPrint = (coresUnicas.size > 0 ? Array.from(coresUnicas).join(', ') : '---');
        
        docPdf.text(`CORES: ${coresPrint} | STATUS: ${os.statusPagamento || 'PENDENTE'}`, 20, 55);
        docPdf.line(20, 60, 190, 60);
        
        let y = 70; docPdf.setFont("courier","bold");
        if(os.valorCorte > 0) docPdf.text(`VALOR UNITARIO CORTE: ${fmtReal(os.valorCorte)}`, 20, y);
        y += 10; docPdf.setFont("helvetica","bold"); docPdf.text('DETALHAMENTO DA MATRIZ:', 20, y);
        
        y += 8; docPdf.setFont("courier","normal");
        for (let k in os.itens) { docPdf.text(`- LOTE ${k.padEnd(15, ' ')} : ${String(os.itens[k]).padStart(4, ' ')} un`, 25, y); y += 7; }

        if(os.mPlotter > 0) { y += 5; docPdf.setFont("helvetica","normal"); docPdf.text(`Servico Plotter (${os.mPlotter}m): ${fmtReal(os.mPlotter * os.valorPlotter)}`, 20, y); }

        docPdf.setFillColor(0, 174, 239); docPdf.rect(20, y+10, 170, 15, 'F');
        docPdf.setTextColor(255,255,255); docPdf.setFontSize(12); docPdf.setFont("helvetica","bold");
        docPdf.text(`QTD TOTAL: ${os.totalPecas} PECAS`, 25, y+10.5, {baseline: 'top'});
        docPdf.text(`VALOR FINAL: ${fmtReal(os.total)}`, 185, y+10.5, {baseline: 'top', align: 'right'});
        
        docPdf.setFontSize(8); docPdf.setTextColor(150); docPdf.text("Sistema PRO - Arquitetado por Andre Macedo da Rosa | andremacedo1@gmail.com", 105, 290, { align: "center" });

        docPdf.save(`OS_${os.ref || 'S-REF'}_${os.cliente}.pdf`);
    };

    const zap = (os: any) => {
        let coresUnicas = new Set();
        for(let k in os.itens) { let partes = k.split(" - "); if(partes.length > 1 && partes[0]) coresUnicas.add(partes[0]); }
        let coresPrint = (coresUnicas.size > 0 ? Array.from(coresUnicas).join(', ') : '---');
        let msg = `*ALTO VALE TALHACAO - O.S.*%0A*Ref:* ${os.ref || '---'}%0A*Cliente:* ${os.cliente}%0A*Cores:* ${coresPrint}%0A*Status:* ${os.statusPagamento || 'PENDENTE'}%0A*Total:* ${os.totalPecas} pcs | ${fmtReal(os.total)}`;
        window.open("https://wa.me/?text=" + encodeURIComponent(msg), "_blank");
    };

    // FUNÇÃO AGNÓSTICA E PROFISSIONAL 
    const copiarDadosNFSe = (os: any) => {
        const c = clientesDb.find((x: any) => x.razaoSocial === os.cliente || x.nome === os.cliente);
        let textoNFSe = `[${c?.cnpj || 'SEM CNPJ'}] - TALHACAO ${os.ref ? 'REF ' + os.ref : ''} - ${os.produto} - ${os.totalPecas} PCS - NF`;
        navigator.clipboard.writeText(textoNFSe);
        alert(`Dados fiscais copiados para Área de Transferência:\n\n${textoNFSe}`);
    };

    let filtrados = historico;
    if (termoBusca) {
        filtrados = filtrados.filter(p => 
            (p.cliente && p.cliente.toUpperCase().includes(termoBusca.toUpperCase())) || 
            (p.ref && String(p.ref).toUpperCase().includes(termoBusca.toUpperCase())) || 
            (p.produto && p.produto.toUpperCase().includes(termoBusca.toUpperCase()))
        );
    }
    if (statusFiltro !== "TODOS") {
        filtrados = filtrados.filter(p => (p.statusPagamento || "PENDENTE") === statusFiltro);
    }

    return (
        <>
            <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '10px', borderTop: '5px solid var(--amarelo)', marginBottom: '20px', border: '1px solid var(--borda)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--azul)', paddingBottom: '10px', fontSize: '18px' }}>📑 Acerto de Contas (Relatorio)</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
                    <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Filtrar Cliente</label><input className="padrao" value={relCliente} onChange={e=>setRelCliente(e.target.value)} list="listaClientesOpts" placeholder="Selecione..." /></div>
                    <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Data Inicio</label><input type="date" className="padrao" value={relDataIni} onChange={e=>setRelDataIni(e.target.value)} /></div>
                    <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Data Fim</label><input type="date" className="padrao" value={relDataFim} onChange={e=>setRelDataFim(e.target.value)} /></div>
                    <div><label style={{ fontSize: '10px', fontWeight: 'bold', color: 'var(--subtexto)', textTransform: 'uppercase' }}>Situacao</label>
                        <select className="padrao" value={relStatus} onChange={e=>setRelStatus(e.target.value)}>
                            <option value="TODOS">Todos os Pedidos</option><option value="PENDENTE">Somente Pendentes</option><option value="PAGO">Somente Pagos</option>
                        </select>
                    </div>
                </div>
                <button className="acao" style={{ marginTop: '15px', background: 'var(--amarelo)', color: '#000', width: '100%', padding: '15px', fontSize: '16px' }} onClick={gerarRelatorioFechamento} disabled={isGerandoRelatorio}>
                    {isGerandoRelatorio ? "⏳ BUSCANDO DADOS..." : "🖨️ GERAR EXTRATO DE FECHAMENTO (PDF)"}
                </button>
            </div>

            <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '10px', borderLeft: '5px solid var(--verde)', marginBottom: '20px', border: '1px solid var(--borda)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--azul)', paddingBottom: '10px', fontSize: '18px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
                    <span>📊 Dashboard de Producao</span>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <button className="acao btn-backup" onClick={exportarBackup}>⬇️ Exportar Backup</button>
                        <button className="acao btn-backup" onClick={() => document.getElementById('fileBackup')?.click()}>⬆️ Restaurar</button>
                        <input type="file" id="fileBackup" accept=".json" style={{ display: 'none' }} onChange={restaurarBackup} />
                    </div>
                </h3>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '15px' }}>💰 {fmtReal(faturamentoHoje)} | 📦 {pecasHoje} pecas (Hoje)</div>
                <div style={{ width: '100%', height: '250px', marginTop: '20px' }}>
                    {dadosGrafico && <Line data={dadosGrafico} options={{ responsive: true, maintainAspectRatio: false, plugins: { legend: { display: false } } }} />}
                </div>
            </div>

            <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '10px', border: '1px solid var(--borda)', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
                <h3 style={{ marginTop: 0, borderBottom: '2px solid var(--azul)', paddingBottom: '10px', fontSize: '18px' }}>📂 Painel de Historico</h3>
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px', background: 'rgba(0,0,0,0.02)', padding: '10px', borderRadius: '8px', border: '1px solid var(--borda)' }}>
                    <div style={{ flex: 2 }}><input type="text" className="padrao" placeholder="🔍 Buscar por Cliente, Ref ou Produto..." value={termoBusca} onChange={e => setTermoBusca(e.target.value)} /></div>
                    <div style={{ flex: 1 }}><select className="padrao" value={statusFiltro} onChange={e => setStatusFiltro(e.target.value)}><option value="TODOS">Todos os Status</option><option value="PENDENTE">Apenas Pendentes</option><option value="PAGO">Apenas Pagos</option></select></div>
                </div>
                
                {filtrados.map(p => (
                    <div key={p.id} style={{ borderLeft: '4px solid var(--azul)', background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '8px', marginBottom: '12px', border: '1px solid var(--borda)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', marginBottom: '8px', alignItems: 'flex-start' }}>
                            <div>
                                <strong>👤 {p.cliente}</strong>
                                <span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', color: '#fff', marginLeft: '5px', fontWeight: 'bold', background: p.statusPagamento === 'PAGO' ? 'var(--verde)' : 'var(--vermelho)' }}>{p.statusPagamento || 'PENDENTE'}</span>
                            </div>
                            <div style={{ textAlign: 'right' }}>
                                <strong style={{ color: 'var(--verde)' }}>{fmtReal(p.total)}</strong><br/>
                                <span style={{ fontSize: '11px', color: 'var(--subtexto)' }}>📅 {p.dataSaida ? String(p.dataSaida).split('-').reverse().join('/') : '---'}</span>
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: 'var(--subtexto)', marginBottom: '8px' }}>REF: {p.ref || '---'} | PROD: {p.produto || '---'}</div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '10px' }}>
                            <button className="acao" style={{ background: p.statusPagamento === 'PAGO' ? 'var(--amarelo)' : 'var(--verde)', color: '#fff', fontSize: '12px', padding: '8px 12px' }} onClick={() => togglePagamento(p.id, p.statusPagamento)}>{p.statusPagamento === 'PAGO' ? '⏳ Pendente' : '💲 Pago'}</button>
                            <button className="acao" style={{ background: '#333', color: '#fff', fontSize: '12px', padding: '8px 12px' }} onClick={() => emitirPDF(p)}>📄 PDF</button>
                            <button className="acao btn-whats" style={{ background: 'var(--verde)', color: '#fff', fontSize: '12px', padding: '8px 12px' }} onClick={() => zap(p)}>💬 Whats</button>
                            <button className="acao" style={{ background: '#333', color: '#fff', fontSize: '12px', padding: '8px 12px' }} onClick={() => onRepetir(p)}>🔄 Repetir</button>
                            
                            {/* BOTÃO AGNÓSTICO - NFSe */}
                            <button className="acao" style={{ background: '#6366f1', color: '#fff', fontSize: '12px', padding: '8px 12px' }} onClick={() => copiarDadosNFSe(p)}>📋 Copiar NFSe</button>
                            
                            <button className="acao btn-danger" onClick={() => deleteOS(p.id)}>🗑️</button>
                        </div>
                    </div>
                ))}

                {historico.length === limiteAtual && !termoBusca && (
                    <button className="acao" style={{ background: 'rgba(0,174,239,0.1)', color: 'var(--azul)', border: '1px solid var(--azul)', width: '100%', padding: '12px', fontSize: '14px', marginTop: '10px' }} onClick={() => setLimiteAtual(prev => prev + 20)}>⬇️ CARREGAR MAIS O.S. ANTIGAS</button>
                )}
            </div>
        </>
    );
}
/**
 * ============================================================================
 * MÓDULO: app/page.tsx
 * DESCRIÇÃO: Orquestrador Principal Fiel ao HTML Original (Com Sistema de Abas).
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * DATA/HORA DE ALTERAÇÃO: 2026-08-03 18:45
 * REGRAS DE NEGÓCIO: 
 * 1. Imagens do logotipo (logoApp e logoEmpresaHTML) restauradas no cabeçalho.
 * ============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import CadastroClientes, { ClienteOficial } from '../components/CadastroClientes';
import FormularioOS from '../components/FormularioOS';
import HistoricoAcoes from '../components/HistoricoAcoes';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';

export default function Home() {
    const [abaAtiva, setAbaAtiva] = useState('os');
    const [isOnline, setIsOnline] = useState(true);
    const [isDark, setIsDark] = useState(false);
    const [clientes, setClientes] = useState<ClienteOficial[]>([]);
    const [osParaRepetir, setOsParaRepetir] = useState<any>(null); 

    useEffect(() => {
        if (localStorage.getItem('theme') === 'dark') {
            document.documentElement.classList.add('dark-mode');
            setIsDark(true);
        }
        window.addEventListener('online', () => setIsOnline(true));
        window.addEventListener('offline', () => setIsOnline(false));
        carregarClientesGerais();
    }, []);

    const carregarClientesGerais = async () => {
        try {
            const snap = await getDocs(collection(db, 'clientes'));
            const lista: ClienteOficial[] = [];
            snap.forEach(doc => lista.push({ ...doc.data(), id: doc.id } as ClienteOficial));
            setClientes(lista);
        } catch (error) {
            console.error("Aviso: operando com cache local de clientes.");
        }
    };

    const toggleTheme = () => {
        const h = document.documentElement;
        h.classList.toggle("dark-mode");
        const dark = h.classList.contains('dark-mode');
        localStorage.setItem('theme', dark ? 'dark' : 'light');
        setIsDark(dark);
    };

    const handleSalvarCliente = async (novoCliente: ClienteOficial) => {
        try {
            await addDoc(collection(db, 'clientes'), novoCliente);
            setClientes([...clientes, novoCliente]);
            alert('✅ Cliente e De/Para cadastrados!');
            setAbaAtiva('os');
        } catch (error) {
            alert('❌ Erro ao salvar cliente no banco de dados.');
        }
    };

    const acionarRepetirOS = (os: any) => {
        setOsParaRepetir(os);
        setAbaAtiva('os'); 
    };

    return (
        <>
            <button className="theme-toggle" onClick={toggleTheme} title="Alternar Tema">{isDark ? '☀️' : '🌓'}</button>

            <main style={{ maxWidth: '950px', margin: 'auto', padding: '20px' }}>
                <div style={{ textAlign: 'center', marginBottom: '25px' }}>
                    {/* LOGOTIPOS ORIGINAIS DO HTML RESTAURADOS */}
                    <img id="logoEmpresaHTML" src="/logo.png" style={{ display: 'none' }} alt="Logo Oculta para PDF" />
                    <img src="/logo.png" alt="Alto Vale" id="logoApp" style={{ maxWidth: '180px', margin: '0 auto' }} onError={(e) => e.currentTarget.style.display='none'} />
                    
                    <h2 style={{ marginTop: '10px', marginBottom: '5px' }}>Alto Vale Talhação</h2>
                    <div className="status-nuvem" style={!isOnline ? {color: 'var(--vermelho)', borderColor: 'var(--vermelho)', background: 'rgba(239,68,68,0.1)'} : {}}>
                        {isOnline ? '🟢 Sincronizado' : '🔴 Offline (Salvo localmente)'}
                    </div>
                </div>

                <div style={{ display: 'flex', gap: '5px', marginBottom: '15px' }}>
                    <button className={`acao ${abaAtiva === 'os' ? 'btn-primary' : ''}`} style={{ marginTop: 0, border: '1px solid var(--borda)', background: abaAtiva === 'os' ? 'var(--azul)' : 'transparent', color: abaAtiva === 'os' ? '#fff' : 'var(--texto)'}} onClick={() => setAbaAtiva('os')}>📝 Lançar O.S.</button>
                    <button className={`acao ${abaAtiva === 'historico' ? 'btn-primary' : ''}`} style={{ marginTop: 0, border: '1px solid var(--borda)', background: abaAtiva === 'historico' ? 'var(--azul)' : 'transparent', color: abaAtiva === 'historico' ? '#fff' : 'var(--texto)'}} onClick={() => setAbaAtiva('historico')}>📊 Dashboard & Histórico</button>
                    <button className={`acao ${abaAtiva === 'clientes' ? 'btn-primary' : ''}`} style={{ marginTop: 0, border: '1px solid var(--borda)', background: abaAtiva === 'clientes' ? 'var(--azul)' : 'transparent', color: abaAtiva === 'clientes' ? '#fff' : 'var(--texto)'}} onClick={() => setAbaAtiva('clientes')}>👥 Clientes (De/Para)</button>
                </div>

                {abaAtiva === 'os' && <FormularioOS clientesDb={clientes} osCarregada={osParaRepetir} clearOsCarregada={() => setOsParaRepetir(null)} onSuccess={() => setAbaAtiva('historico')} />}
                {abaAtiva === 'historico' && <HistoricoAcoes clientesDb={clientes} onRepetir={acionarRepetirOS} />}
                {abaAtiva === 'clientes' && <CadastroClientes onSalvarCliente={handleSalvarCliente} />}

                <footer style={{ textAlign: 'center', padding: '20px', marginTop: '20px', borderTop: '1px solid var(--borda)', fontSize: '12px', color: 'var(--subtexto)', lineHeight: '1.6' }}>
                    <p>&copy; 2026 Alto Vale Talhação - Licença de Uso</p>
                    <p>Software Arquitetado e Desenvolvido por <strong style={{color: 'var(--azul)'}}>André Macedo da Rosa</strong></p>
                    <p>Propriedade Intelectual | Contato: <a style={{color: 'var(--azul)', textDecoration: 'none', fontWeight: 'bold'}} href="mailto:andremacedo1@gmail.com">andremacedo1@gmail.com</a></p>
                </footer>
            </main>
        </>
    );
}
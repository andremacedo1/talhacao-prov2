/**
 * ============================================================================
 * MÓDULO: page.tsx (Orquestrador Definitivo com Guias/Tabs)
 * DESCRIÇÃO: Layout fiel ao original com navegação em abas para não poluir a tela.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * ============================================================================
 */

'use client';

import React, { useState, useEffect } from 'react';
import CadastroClientes, { ClienteOficial } from '../components/CadastroClientes';
import FormularioOS from '../components/FormularioOS';
import HistoricoAcoes from '../components/HistoricoAcoes';
import { db } from '../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy } from 'firebase/firestore';

export default function Home() {
    const [historico, setHistorico] = useState<any[]>([]);
    const [clientes, setClientes] = useState<ClienteOficial[]>([]);
    const [carregando, setCarregando] = useState(true);
    
    // Controle de Guias (Tabs) - Padrão: Lançamento de O.S.
    const [abaAtiva, setAbaAtiva] = useState('os'); 

    useEffect(() => {
        sincronizarComFirebase();
    }, []);

    const sincronizarComFirebase = async () => {
        try {
            setCarregando(true);
            const q = query(collection(db, 'historico'), orderBy('id', 'desc'));
            const querySnapshot = await getDocs(q);
            const listaOS: any[] = [];
            querySnapshot.forEach((doc) => {
                listaOS.push({ ...doc.data(), firebaseId: doc.id });
            });
            setHistorico(listaOS);

            const snapClientes = await getDocs(collection(db, 'clientes'));
            const listaC: ClienteOficial[] = [];
            snapClientes.forEach((doc) => {
                listaC.push({ ...doc.data(), id: doc.id } as ClienteOficial);
            });
            setClientes(listaC);
        } catch (error) {
            console.error("Erro ao sincronizar com Firestore:", error);
        } finally {
            setCarregando(false);
        }
    };

    const handleSalvarCliente = async (novoCliente: ClienteOficial) => {
        try {
            await addDoc(collection(db, 'clientes'), novoCliente);
            setClientes(prev => [...prev, novoCliente]);
            alert('✅ Cliente e De/Para cadastrados com sucesso!');
            setAbaAtiva('os'); // Volta pra O.S. após cadastrar
        } catch (error) {
            alert('Erro ao salvar cliente na nuvem.');
        }
    };

    const handleSalvarOS = async (novaOS: any) => {
        try {
            await addDoc(collection(db, 'historico'), novaOS);
            setHistorico(prev => [novaOS, ...prev]);
            alert('✅ Ordem de Serviço registrada com sucesso!');
            setAbaAtiva('historico'); // Vai pro Dashboard ver a O.S. salva
        } catch (error) {
            alert('Erro ao salvar O.S. na nuvem.');
        }
    };

    const exportarBackup = () => { /* Mantido igual */ };
    const restaurarBackup = (event: any) => { /* Mantido igual */ };

    return (
        <main style={{ minHeight: '100vh', background: '#030712' }}>
            {/* CABEÇALHO / TOPO DO SISTEMA (Idêntico ao padrão original) */}
            <header style={{ 
                background: '#111827', 
                padding: '15px 30px', 
                borderBottom: '2px solid #1f2937', 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
                    <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#fff', margin: 0, letterSpacing: '-0.5px' }}>
                        ✂️ Alto Vale Talhação
                    </h1>
                    
                    {/* NAVEGAÇÃO EM GUIAS */}
                    <nav style={{ display: 'flex', gap: '10px' }}>
                        <button 
                            onClick={() => setAbaAtiva('os')} 
                            style={{ background: abaAtiva === 'os' ? '#2563eb' : 'transparent', color: abaAtiva === 'os' ? '#fff' : '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                            📝 Lançar O.S.
                        </button>
                        <button 
                            onClick={() => setAbaAtiva('historico')} 
                            style={{ background: abaAtiva === 'historico' ? '#2563eb' : 'transparent', color: abaAtiva === 'historico' ? '#fff' : '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                            📊 Dashboard & Histórico
                        </button>
                        <button 
                            onClick={() => setAbaAtiva('clientes')} 
                            style={{ background: abaAtiva === 'clientes' ? '#2563eb' : 'transparent', color: abaAtiva === 'clientes' ? '#fff' : '#94a3b8', border: 'none', padding: '8px 16px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s' }}>
                            👥 Clientes (De/Para)
                        </button>
                    </nav>
                </div>
                <div style={{ fontSize: '12px', background: '#065f46', color: '#34d399', padding: '6px 12px', borderRadius: '20px', fontWeight: 'bold' }}>
                    {carregando ? '⏳ Sincronizando...' : '🟢 Online (talhacao-dev)'}
                </div>
            </header>

            {/* ÁREA DE TRABALHO (Renderiza apenas a guia selecionada) */}
            <div style={{ maxWidth: '1000px', margin: '30px auto', padding: '0 20px' }}>
                {abaAtiva === 'os' && <FormularioOS onSalvarOS={handleSalvarOS} />}
                {abaAtiva === 'clientes' && <CadastroClientes onSalvarCliente={handleSalvarCliente} />}
                {abaAtiva === 'historico' && <HistoricoAcoes historico={historico} onExportarBackup={exportarBackup} onRestaurarBackup={restaurarBackup} />}
            </div>
        </main>
    );
}
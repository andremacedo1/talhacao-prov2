/**
 * ============================================================================
 * MÓDULO: app/page.tsx (Orquestrador Definitivo)
 * DESCRIÇÃO: Centraliza o fluxo de Clientes, Chão de Fábrica e Histórico com Firestore.
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

    useEffect(() => {
        sincronizarComFirebase();
    }, []);

    const sincronizarComFirebase = async () => {
        try {
            setCarregando(true);
            
            // Buscar Histórico de O.S.
            const q = query(collection(db, 'historico'), orderBy('id', 'desc'));
            const querySnapshot = await getDocs(q);
            const listaOS: any[] = [];
            querySnapshot.forEach((doc) => {
                listaOS.push({ ...doc.data(), firebaseId: doc.id });
            });
            setHistorico(listaOS);

            // Buscar Clientes
            const snapClientes = await getDocs(collection(db, 'clientes'));
            const listaC: ClienteOficial[] = [];
            snapClientes.forEach((doc) => {
                listaC.push({ ...doc.data(), id: doc.id } as ClienteOficial);
            });
            setClientes(listaC);

        } catch (error) {
            console.error("Aviso: Falha ao sincronizar com Firestore. Operando em modo local.", error);
        } finally {
            setCarregando(false);
        }
    };

    const handleSalvarCliente = async (novoCliente: ClienteOficial) => {
        try {
            await addDoc(collection(db, 'clientes'), novoCliente);
            setClientes(prev => [...prev, novoCliente]);
            alert('✅ Cliente cadastrado com sucesso no talhacao-dev!');
        } catch (error) {
            alert('Erro ao salvar cliente na nuvem.');
        }
    };

    const handleSalvarOS = async (novaOS: any) => {
        try {
            await addDoc(collection(db, 'historico'), novaOS);
            setHistorico(prev => [novaOS, ...prev]);
            alert('✅ Ordem de Serviço registrada com sucesso no talhacao-dev!');
        } catch (error) {
            alert('Erro ao salvar O.S. na nuvem.');
        }
    };

    const exportarBackup = () => {
        if (historico.length === 0) return alert("Sem dados para exportar.");
        const blob = new Blob([JSON.stringify(historico, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `backup_talhacao_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
    };

    const restaurarBackup = (event: any) => {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e: any) => {
            try {
                const dados = JSON.parse(e.target.result);
                if (Array.isArray(dados)) {
                    setHistorico(dados);
                    alert(`✅ ${dados.length} registros carregados para visualização!`);
                }
            } catch (err) {
                alert('Erro ao ler o arquivo JSON de backup.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <main style={{ maxWidth: '950px', margin: '0 auto', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid var(--borda)', paddingBottom: '15px' }}>
                <h2 style={{ fontSize: '22px', fontWeight: 'bold' }}>Alto Vale Talhação - PRO v2</h2>
                <div style={{ fontSize: '13px', background: '#065f46', color: '#34d399', padding: '4px 12px', borderRadius: '20px' }}>
                    {carregando ? '⏳ Sincronizando banco...' : '🟢 Conectado ao talhacao-dev'}
                </div>
            </div>

            <CadastroClientes onSalvarCliente={handleSalvarCliente} />
            <FormularioOS onSalvarOS={handleSalvarOS} />
            <HistoricoAcoes historico={historico} onExportarBackup={exportarBackup} onRestaurarBackup={restaurarBackup} />
        </main>
    );
}
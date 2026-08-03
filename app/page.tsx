/**
 * ============================================================================
 * MÓDULO: page.tsx (Orquestrador Principal)
 * DESCRIÇÃO: Página principal que reúne Cadastro, Chão de Fábrica e Histórico.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * DATA/HORA DE CRIAÇÃO: 2026-08-03 11:55
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';
import CadastroClientes, { ClienteOficial } from '@/components/CadastroClientes';
import FormularioOS from '@/components/FormularioOS';
import HistoricoAcoes from '@/components/HistoricoAcoes';

export default function Home() {
    const [historico, setHistorico] = useState<any[]>([]);
    const [clientes, setClientes] = useState<ClienteOficial[]>([]);

    const handleSalvarCliente = (novoCliente: ClienteOficial) => {
        setClientes([...clientes, novoCliente]);
        alert('✅ Cliente cadastrado com sucesso!');
    };

    const handleSalvarOS = (novaOS: any) => {
        setHistorico([novaOS, ...historico]);
        alert('✅ Ordem de Serviço salva com sucesso!');
    };

    const exportarBackup = () => {
        if (historico.length === 0) return alert("Sem dados para exportar.");
        const blob = new Blob([JSON.stringify(historico, null, 2)], { type: "application/json" });
        const a = document.createElement("a");
        a.href = URL.createObjectURL(blob);
        a.download = `backup_homologacao_${new Date().toISOString().split('T')[0]}.json`;
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
                    alert(`✅ ${dados.length} registros importados com sucesso! Teste os dados reais liberado.`);
                }
            } catch (err) {
                alert('Erro ao ler o arquivo JSON de backup.');
            }
        };
        reader.readAsText(file);
    };

    return (
        <main className="container" style={{ padding: '20px' }}>
            <div className="header">
                <h2>Alto Vale Talhação - PRO v2 (Homologação)</h2>
                <div className="status-nuvem">🟢 Ambiente de Testes Ativo</div>
            </div>

            <CadastroClientes onSalvarCliente={handleSalvarCliente} />
            <FormularioOS onSalvarOS={handleSalvarOS} />
            <HistoricoAcoes historico={historico} onExportarBackup={exportarBackup} onRestaurarBackup={restaurarBackup} />
        </main>
    );
}
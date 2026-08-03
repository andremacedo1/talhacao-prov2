/**
 * ============================================================================
 * MÓDULO: CadastroClientes.tsx
 * DESCRIÇÃO: Gestão de clientes com integração Brasil API e sistema De/Para.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * DATA/HORA DE CRIAÇÃO: 2026-08-03 11:55
 * ============================================================================
 */

'use client';

import React, { useState } from 'react';

export interface ClienteOficial {
    id: string;
    cnpj: string;
    razaoSocial: string;
    apelido: string;
    aliases: string[];
    endereco?: string;
}

export default function CadastroClientes({ onSalvarCliente }: { onSalvarCliente: (c: ClienteOficial) => void }) {
    const [cnpjInput, setCnpjInput] = useState('');
    const [apelidoInput, setApelidoInput] = useState('');
    const [razaoSocialInput, setRazaoSocialInput] = useState('');
    const [enderecoInput, setEnderecoInput] = useState('');
    const [aliasNovo, setAliasNovo] = useState('');
    const [aliasesList, setAliasesList] = useState<string[]>([]);
    const [carregandoCnpj, setCarregandoCnpj] = useState(false);

    const handleBuscarCnpj = async () => {
        const limpo = cnpjInput.replace(/\D/g, '');
        if (limpo.length !== 14) {
            alert('Digite um CNPJ válido com 14 dígitos.');
            return;
        }

        setCarregandoCnpj(true);
        try {
            const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`);
            if (!response.ok) throw new Error('CNPJ não localizado');
            
            const data = await response.json();
            setRazaoSocialInput(data.razao_social || data.nome_fantasia || '');
            setEnderecoInput(`${data.logradouro || ''}, ${data.numero || ''} - ${data.bairro || ''}, ${data.municipio || ''}/${data.uf || ''}`.trim());
            if (!apelidoInput) {
                setApelidoInput(data.nome_fantasia || data.razao_social || '');
            }
        } catch (error) {
            alert('Não foi possível buscar os dados do CNPJ automaticamente.');
        } finally {
            setCarregandoCnpj(false);
        }
    };

    const handleAdicionarAlias = () => {
        if (!aliasNovo.trim()) return;
        setAliasesList([...aliasesList, aliasNovo.trim().toUpperCase()]);
        setAliasNovo('');
    };

    const handleSalvar = () => {
        if (!apelidoInput || !cnpjInput) {
            alert('Informe o CNPJ e o Apelido padrão.');
            return;
        }
        const novo: ClienteOficial = {
            id: Math.random().toString(),
            cnpj: cnpjInput.replace(/\D/g, ''),
            razaoSocial: razaoSocialInput,
            apelido: apelidoInput.toUpperCase(),
            aliases: aliasesList,
            endereco: enderecoInput
        };
        onSalvarCliente(novo);
        setCnpjInput(''); setApelidoInput(''); setRazaoSocialInput(''); setEnderecoInput(''); setAliasesList([]);
    };

    return (
        <div className="card" style={{ borderTop: '5px solid var(--azul)' }}>
            <h3>🏢 Cadastro Unificado de Clientes & De/Para (Fiscal)</h3>
            <div className="grid">
                <div>
                    <label>CNPJ da Empresa</label>
                    <div style={{ display: 'flex', gap: '5px' }}>
                        <input className="padrao" placeholder="00.000.000/0001-00" value={cnpjInput} onChange={(e) => setCnpjInput(e.target.value)} />
                        <button className="acao btn-primary" style={{ width: 'auto', padding: '10px' }} onClick={handleBuscarCnpj} disabled={carregandoCnpj}>
                            {carregandoCnpj ? '⏳' : '🔍'}
                        </button>
                    </div>
                </div>
                <div>
                    <label>Apelido / Nome Padrão (O.S.)</label>
                    <input className="padrao" placeholder="Ex: CONFECÇÕES SILVA" value={apelidoInput} onChange={(e) => setApelidoInput(e.target.value)} />
                </div>
                <div>
                    <label>Razão Social</label>
                    <input className="padrao" placeholder="Razão social oficial..." value={razaoSocialInput} onChange={(e) => setRazaoSocialInput(e.target.value)} />
                </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
                <label>Endereço Completo</label>
                <input className="padrao" placeholder="Rua, Número - Bairro, Cidade/UF" value={enderecoInput} onChange={(e) => setEnderecoInput(e.target.value)} />
            </div>

            <div style={{ background: 'rgba(0,0,0,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid var(--borda)', marginBottom: '15px' }}>
                <label style={{ color: 'var(--azul)' }}>Sistema De/Para (Variações de nomes antigos no Histórico)</label>
                <div style={{ display: 'flex', gap: '5px', marginTop: '5px' }}>
                    <input className="padrao" placeholder="Ex: CONF. SILVA..." value={aliasNovo} onChange={(e) => setAliasNovo(e.target.value)} />
                    <button className="acao btn-success" onClick={handleAdicionarAlias}>Adicionar Variação</button>
                </div>
                <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {aliasesList.map((alias, idx) => (
                        <span key={idx} style={{ background: 'var(--azul)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                            {alias}
                        </span>
                    ))}
                </div>
            </div>

            <button className="acao btn-primary" onClick={handleSalvar}>💾 SALVAR CADASTRO OFICIAL DO CLIENTE</button>
        </div>
    );
}
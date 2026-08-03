/**
 * ============================================================================
 * MÓDULO: CadastroClientes.tsx
 * DESCRIÇÃO: Gestão de clientes com integração Brasil API e sistema De/Para.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
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
            const res = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${limpo}`);
            if (!res.ok) throw new Error('CNPJ não localizado');
            const data = await res.json();
            setRazaoSocialInput(data.razao_social || data.nome_fantasia || '');
            setEnderecoInput(`${data.logradouro || ''}, ${data.numero || ''} - ${data.bairro || ''}, ${data.municipio || ''}/${data.uf || ''}`);
        } catch (err) {
            alert('Erro ao buscar dados na Brasil API. Preencha manualmente.');
        } finally {
            setCarregandoCnpj(false);
        }
    };

    const handleAdicionarAlias = () => {
        if (!aliasNovo.trim()) return;
        setAliasesList([...aliasesList, aliasNovo.trim().toUpperCase()]);
        setAliasNovo('');
    };

    const handleSalvar = (e: React.FormEvent) => {
        e.preventDefault();
        if (!apelidoInput || !razaoSocialInput) {
            alert('Preencha pelo menos o Apelido e a Razão Social.');
            return;
        }

        const novo: ClienteOficial = {
            id: Date.now().toString(),
            cnpj: cnpjInput,
            razaoSocial: razaoSocialInput,
            apelido: apelidoInput.toUpperCase(),
            aliases: aliasesList.length > 0 ? aliasesList : [apelidoInput.toUpperCase()],
            endereco: enderecoInput
        };

        onSalvarCliente(novo);
        setCnpjInput('');
        setApelidoInput('');
        setRazaoSocialInput('');
        setEnderecoInput('');
        setAliasesList([]);
    };

    return (
        <div style={{ background: 'var(--card)', padding: '20px', borderRadius: '12px', border: '1px solid var(--borda)', marginBottom: '20px' }}>
            <h3 style={{ marginBottom: '15px', color: '#38bdf8' }}>🏢 Cadastro de Clientes & Sistema De/Para (NFSe)</h3>
            <form onSubmit={handleSalvar} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                <div>
                    <label>CNPJ</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="padrao" placeholder="00.000.000/0001-00" value={cnpjInput} onChange={(e) => setCnpjInput(e.target.value)} />
                        <button type="button" className="acao btn-primary" onClick={handleBuscarCnpj} disabled={carregandoCnpj}>
                            {carregandoCnpj ? 'Buscando...' : 'Consultar'}
                        </button>
                    </div>
                </div>

                <div>
                    <label>Apelido (Nome no Chão de Fábrica)</label>
                    <input className="padrao" placeholder="Ex: MODAS ABC" value={apelidoInput} onChange={(e) => setApelidoInput(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label>Razão Social Oficial (NFe / NFSe)</label>
                    <input className="padrao" placeholder="Razão Social completa..." value={razaoSocialInput} onChange={(e) => setRazaoSocialInput(e.target.value)} required />
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <label>Endereço Completo</label>
                    <input className="padrao" placeholder="Rua, Número - Bairro, Cidade/UF" value={enderecoInput} onChange={(e) => setEnderecoInput(e.target.value)} />
                </div>

                <div style={{ gridColumn: 'span 2', background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '8px', border: '1px solid var(--borda)' }}>
                    <label style={{ color: '#38bdf8', fontSize: '12px' }}>Sistema De/Para (Variações de nomes antigos no Histórico)</label>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '5px' }}>
                        <input className="padrao" placeholder="Ex: CONF. SILVA ANTIGA..." value={aliasNovo} onChange={(e) => setAliasNovo(e.target.value)} />
                        <button type="button" className="acao btn-success" onClick={handleAdicionarAlias}>Adicionar Variação</button>
                    </div>
                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', marginTop: '8px' }}>
                        {aliasesList.map((alias, idx) => (
                            <span key={idx} style={{ background: 'var(--azul)', color: '#fff', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold' }}>
                                {alias}
                            </span>
                        ))}
                    </div>
                </div>

                <div style={{ gridColumn: 'span 2' }}>
                    <button type="submit" className="acao btn-success" style={{ width: '100%' }}>Salvar Cliente</button>
                </div>
            </form>
        </div>
    );
}
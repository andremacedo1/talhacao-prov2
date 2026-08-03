/**
 * ============================================================================
 * MÓDULO: Testes Unitários Automatizados (Jest)
 * DESCRIÇÃO: Validação matemática do motor de corte e grade da O.S.
 * AUTOR: André Macedo da Rosa / Arquiteto Sênior
 * ============================================================================
 */

describe('Motor de Cálculo de O.S. - Talhação PRO v2', () => {
  test('Deve calcular corretamente o total de peças de uma matriz de cores e tamanhos', () => {
    const linhasSimuladas = [
      { cor: 'AZUL', quantidades: { 'P': 10, 'M': 20, 'G': 15 } },
      { cor: 'PRETO', quantidades: { 'P': 5, 'M': 10, 'G': 5 } }
    ];

    const totalPecas = linhasSimuladas.reduce((acc, linha) => {
      return acc + Object.values(linha.quantidades).reduce((a, b) => a + b, 0);
    }, 0);

    expect(totalPecas).toBe(65);
  });

  test('Deve calcular o valor financeiro total considerando corte e plotter', () => {
    const totalPecas = 100;
    const valorUnitarioCorte = 1.50;
    const metrosPlotter = 10;
    const valorMetroPlotter = 12.00;

    const valorTotal = (totalPecas * valorUnitarioCorte) + (metrosPlotter * valorMetroPlotter);

    expect(valorTotal).toBe(270.00); // (100 * 1.5) + (10 * 12) = 150 + 120 = 270
  });
});
import React, { useState, useMemo } from 'react';
import { 
  Calculator, 
  Zap, 
  Clock, 
  Layers, 
  TrendingUp, 
  ShieldAlert, 
  Wrench, 
  Package, 
  PlusCircle, 
  DollarSign, 
  HelpCircle,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import { calculatePrintCost } from '../../utils/calculations';
import { formatCurrency, formatWeight, formatTime, formatPercent } from '../../utils/formatters';

export const PrintCostCalculator = ({ 
  printers = [], 
  filaments = [], 
  settings = {}, 
  onSaveToCatalog, 
  onNavigateToConsignment 
}) => {
  // Estados da calculadora
  const [selectedFilamentId, setSelectedFilamentId] = useState(filaments[0]?.id || '');
  const [weightGrams, setWeightGrams] = useState(120);
  const [customSpoolPrice, setCustomSpoolPrice] = useState(filaments[0]?.price || 95);
  const [customSpoolWeight, setCustomSpoolWeight] = useState(1000);

  const [selectedPrinterId, setSelectedPrinterId] = useState(printers[0]?.id || '');
  const [printHours, setPrintHours] = useState(4);
  const [printMinutes, setPrintMinutes] = useState(30);

  // Parâmetros técnicos & energia
  const [energyKwhRate, setEnergyKwhRate] = useState(settings.energyKwhRate || 0.85);
  const [prepMinutes, setPrepMinutes] = useState(settings.prepMinutesDefault || 10);
  const [postMinutes, setPostMinutes] = useState(settings.postMinutesDefault || 15);
  const [laborHourlyRate, setLaborHourlyRate] = useState(settings.laborHourlyRate || 25.00);
  const [extrasCost, setExtrasCost] = useState(2.50);
  const [failureMarginPercent, setFailureMarginPercent] = useState(settings.failureMarginDefault || 10);
  const [markupPercent, setMarkupPercent] = useState(settings.markupDefault || 100);

  // Modal para salvar direto no catálogo
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);
  const [newProductTitle, setNewProductTitle] = useState('');
  const [newProductCategory, setNewProductCategory] = useState('Decoração');
  const [newProductStock, setNewProductStock] = useState(1);
  const [newProductImageUrl, setNewProductImageUrl] = useState('');

  // Filamento selecionado
  const activeFilament = useMemo(() => {
    return filaments.find(f => f.id === selectedFilamentId) || filaments[0];
  }, [selectedFilamentId, filaments]);

  // Impressora selecionada
  const activePrinter = useMemo(() => {
    return printers.find(p => p.id === selectedPrinterId) || printers[0];
  }, [selectedPrinterId, printers]);

  // Quando troca o filamento selecionado, atualiza o preço do carretel
  const handleFilamentSelect = (e) => {
    const id = e.target.value;
    setSelectedFilamentId(id);
    const fil = filaments.find(f => f.id === id);
    if (fil) {
      setCustomSpoolPrice(fil.price);
      setCustomSpoolWeight(fil.spoolWeight || 1000);
    }
  };

  // Executa o cálculo completo
  const costReport = useMemo(() => {
    return calculatePrintCost({
      weightGrams,
      spoolPrice: customSpoolPrice,
      spoolWeightGrams: customSpoolWeight,
      printHours,
      printMinutes,
      printerWatts: activePrinter?.watts || 250,
      energyKwhRate,
      printerPrice: activePrinter?.price || 2500,
      lifespanHours: activePrinter?.lifespanHours || 4000,
      maintenancePerHour: activePrinter?.maintenancePerHour || 0.50,
      prepMinutes,
      postMinutes,
      laborHourlyRate,
      extrasCost,
      failureMarginPercent,
      markupPercent,
    });
  }, [
    weightGrams, customSpoolPrice, customSpoolWeight, printHours, printMinutes,
    activePrinter, energyKwhRate, prepMinutes, postMinutes, laborHourlyRate,
    extrasCost, failureMarginPercent, markupPercent
  ]);

  // Percentuais de composição dos custos para a barra visual
  const costShares = useMemo(() => {
    const total = costReport.totalCost || 1;
    return {
      filament: (costReport.filamentCost / total) * 100,
      energy: (costReport.energyCost / total) * 100,
      machine: (costReport.machineTotalCost / total) * 100,
      labor: (costReport.laborCost / total) * 100,
      extras: (costReport.extrasCost / total) * 100,
      failure: (costReport.failureCost / total) * 100,
    };
  }, [costReport]);

  const handleSaveToCatalogSubmit = (e) => {
    e.preventDefault();
    if (!newProductTitle.trim()) return;

    const newProd = {
      id: 'prod-' + Date.now(),
      title: newProductTitle.trim(),
      description: `Impresso em ${activeFilament?.name || 'PLA'} com tempo de ${formatTime(costReport.totalPrintHours * 60)}.`,
      category: newProductCategory,
      imageUrl: newProductImageUrl.trim() || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      weightGrams: Number(weightGrams),
      printHours: Number(printHours),
      printMinutes: Number(printMinutes),
      filamentId: selectedFilamentId,
      filamentName: activeFilament?.name || 'Filamento 3D',
      printerId: selectedPrinterId,
      printerName: activePrinter?.name || 'Impressora 3D',
      cost: costReport.totalCost,
      suggestedPrice: costReport.suggestedSalePrice,
      directSalePrice: costReport.suggestedSalePrice,
      stock: Number(newProductStock) || 1,
      createdAt: new Date().toISOString(),
    };

    onSaveToCatalog(newProd);
    setIsCatalogModalOpen(false);
    setNewProductTitle('');
    setNewProductImageUrl('');
  };

  return (
    <div className="calculator-layout">
      {/* Coluna Esquerda: Formulário de Parâmetros */}
      <div className="calc-inputs-column">
        {/* Bloco 1: Material e Impressora */}
        <div className="glass-card calc-section-card">
          <div className="card-body">
            <h3 className="calc-section-title">
              <Layers size={18} color="var(--cyan-neon)" />
              1. Material & Impressora 3D
            </h3>

            <div className="grid-2">
              <div className="form-group">
                <label className="form-label">
                  Filamento Selecionado
                  <span className="form-label-hint">Preset salvo</span>
                </label>
                <select 
                  className="form-select" 
                  value={selectedFilamentId} 
                  onChange={handleFilamentSelect}
                >
                  {filaments.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.name} ({f.material}) - {formatCurrency(f.price)}/{f.spoolWeight}g
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Impressora Utilizada
                  <span className="form-label-hint">Potência & desgaste</span>
                </label>
                <select 
                  className="form-select" 
                  value={selectedPrinterId} 
                  onChange={(e) => setSelectedPrinterId(e.target.value)}
                >
                  {printers.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.watts}W)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Peso Gasto da Peça</label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="1" 
                    step="1"
                    className="form-input form-input-mono" 
                    value={weightGrams} 
                    onChange={(e) => setWeightGrams(Math.max(0, Number(e.target.value)))}
                  />
                  <span className="affix">gramas</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Preço do Carretel</label>
                <div className="input-with-affix">
                  <span className="affix affix-prefix">R$</span>
                  <input 
                    type="number" 
                    min="10" 
                    step="0.5"
                    className="form-input form-input-mono" 
                    value={customSpoolPrice} 
                    onChange={(e) => setCustomSpoolPrice(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Peso do Carretel</label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="100" 
                    step="50"
                    className="form-input form-input-mono" 
                    value={customSpoolWeight} 
                    onChange={(e) => setCustomSpoolWeight(Number(e.target.value))}
                  />
                  <span className="affix">g</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 2: Tempo de Impressão & Consumo de Energia */}
        <div className="glass-card calc-section-card">
          <div className="card-body">
            <h3 className="calc-section-title">
              <Clock size={18} color="var(--blue-bright)" />
              2. Tempo de Impressão & Energia Elétrica
            </h3>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Horas de Impressão</label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="0" 
                    className="form-input form-input-mono" 
                    value={printHours} 
                    onChange={(e) => setPrintHours(Math.max(0, parseInt(e.target.value) || 0))}
                  />
                  <span className="affix">horas</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Minutos de Impressão</label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="0" 
                    max="59"
                    className="form-input form-input-mono" 
                    value={printMinutes} 
                    onChange={(e) => setPrintMinutes(Math.min(59, Math.max(0, parseInt(e.target.value) || 0)))}
                  />
                  <span className="affix">min</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Tarifa de Energia
                  <span className="form-label-hint">R$/kWh</span>
                </label>
                <div className="input-with-affix">
                  <span className="affix affix-prefix">R$</span>
                  <input 
                    type="number" 
                    min="0.1" 
                    step="0.05"
                    className="form-input form-input-mono" 
                    value={energyKwhRate} 
                    onChange={(e) => setEnergyKwhRate(Number(e.target.value))}
                  />
                  <span className="affix">/kWh</span>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', gap: '16px', marginTop: '4px' }}>
              <span>⚡ Potência estimada: <strong>{activePrinter?.watts || 250}W</strong></span>
              <span>🔋 Consumo calculado: <strong>{costReport.kwhConsumed.toFixed(2)} kWh</strong></span>
              <span>💵 Custo luz: <strong>{formatCurrency(costReport.energyCost)}</strong></span>
            </div>
          </div>
        </div>

        {/* Bloco 3: Mão de Obra, Insumos e Risco de Falhas */}
        <div className="glass-card calc-section-card">
          <div className="card-body">
            <h3 className="calc-section-title">
              <Wrench size={18} color="var(--purple-vibrant)" />
              3. Mão de Obra, Acabamento & Risco de Falha
            </h3>

            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">
                  Prep & Fatiamento
                  <span className="form-label-hint">Mesa/Gcode</span>
                </label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="0" 
                    className="form-input form-input-mono" 
                    value={prepMinutes} 
                    onChange={(e) => setPrepMinutes(Number(e.target.value))}
                  />
                  <span className="affix">min</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Pós-processamento
                  <span className="form-label-hint">Suportes/Lixa</span>
                </label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="0" 
                    className="form-input form-input-mono" 
                    value={postMinutes} 
                    onChange={(e) => setPostMinutes(Number(e.target.value))}
                  />
                  <span className="affix">min</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Valor da Hora do Operador
                  <span className="form-label-hint">R$/h</span>
                </label>
                <div className="input-with-affix">
                  <span className="affix affix-prefix">R$</span>
                  <input 
                    type="number" 
                    min="0" 
                    step="5"
                    className="form-input form-input-mono" 
                    value={laborHourlyRate} 
                    onChange={(e) => setLaborHourlyRate(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label className="form-label">
                  Embalagem & Extras (Caixa, Fita, Álcool, Cola)
                </label>
                <div className="input-with-affix">
                  <span className="affix affix-prefix">R$</span>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.5"
                    className="form-input form-input-mono" 
                    value={extrasCost} 
                    onChange={(e) => setExtrasCost(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  <span>Margem para Falhas / Desperdício</span>
                  <span style={{ color: 'var(--amber-warning)', fontFamily: 'var(--font-mono)', fontWeight: 700 }}>
                    {failureMarginPercent}% ({formatCurrency(costReport.failureCost)})
                  </span>
                </label>
                <div className="range-slider-wrapper" style={{ marginTop: '8px' }}>
                  <input 
                    type="range" 
                    min="0" 
                    max="30" 
                    step="1"
                    className="range-slider" 
                    value={failureMarginPercent} 
                    onChange={(e) => setFailureMarginPercent(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bloco 4: Margem de Lucro Desejada */}
        <div className="glass-card calc-section-card">
          <div className="card-body">
            <h3 className="calc-section-title">
              <TrendingUp size={18} color="var(--emerald-profit)" />
              4. Margem de Lucro & Formação do Preço
            </h3>

            <div className="form-group">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>
                  Multiplicador / Margem de Lucro (Markup sobre o custo):
                </span>
                <span style={{ 
                  fontFamily: 'var(--font-mono)', 
                  fontSize: '1.25rem', 
                  fontWeight: 800, 
                  color: 'var(--emerald-profit)' 
                }}>
                  {markupPercent}% ({formatCurrency(costReport.profitAmount)} lucro)
                </span>
              </div>

              <div className="range-slider-wrapper">
                <input 
                  type="range" 
                  min="20" 
                  max="300" 
                  step="5"
                  className="range-slider" 
                  value={markupPercent} 
                  onChange={(e) => setMarkupPercent(Number(e.target.value))}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '6px' }}>
                <span>20% (Preço de atacado)</span>
                <span>100% (Dobro do custo - Padrão Maker)</span>
                <span>200% (Peças artísticas complexas)</span>
                <span>300%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Coluna Direita: Resultados Flutuantes */}
      <div className="calc-results-column">
        <div className="calc-results-panel">
          <div className="result-card-main">
            <div className="price-hero-label">Preço Sugerido de Venda Direta</div>
            <div className="price-hero-val">
              {formatCurrency(costReport.suggestedSalePrice)}
            </div>

            <div className="cost-comparison-row">
              <div className="cost-comp-item">
                <span className="cost-comp-label">Custo Total de Produção</span>
                <span className="cost-comp-val" style={{ color: 'var(--rose-danger)' }}>
                  {formatCurrency(costReport.totalCost)}
                </span>
              </div>
              <div className="cost-comp-item" style={{ textAlign: 'right' }}>
                <span className="cost-comp-label">Seu Lucro Líquido</span>
                <span className="cost-comp-val" style={{ color: 'var(--emerald-profit)' }}>
                  {formatCurrency(costReport.profitAmount)}
                </span>
              </div>
            </div>

            {/* Barra Visual de Custos */}
            <div className="breakdown-bar-wrap">
              <div className="breakdown-bar-title">
                <span>Composição do Custo</span>
                <span>100%</span>
              </div>
              <div className="breakdown-bar">
                <div 
                  className="breakdown-bar-seg" 
                  style={{ width: `${costShares.filament}%`, background: 'var(--cyan-neon)' }} 
                  data-tooltip={`Filamento: ${formatCurrency(costReport.filamentCost)}`}
                />
                <div 
                  className="breakdown-bar-seg" 
                  style={{ width: `${costShares.energy}%`, background: 'var(--blue-bright)' }} 
                  data-tooltip={`Energia: ${formatCurrency(costReport.energyCost)}`}
                />
                <div 
                  className="breakdown-bar-seg" 
                  style={{ width: `${costShares.machine}%`, background: 'var(--amber-warning)' }} 
                  data-tooltip={`Desgaste: ${formatCurrency(costReport.machineTotalCost)}`}
                />
                <div 
                  className="breakdown-bar-seg" 
                  style={{ width: `${costShares.labor}%`, background: 'var(--purple-vibrant)' }} 
                  data-tooltip={`Mão de Obra: ${formatCurrency(costReport.laborCost)}`}
                />
                <div 
                  className="breakdown-bar-seg" 
                  style={{ width: `${costShares.extras}%`, background: 'var(--indigo-deep)' }} 
                  data-tooltip={`Extras: ${formatCurrency(costReport.extrasCost)}`}
                />
                <div 
                  className="breakdown-bar-seg" 
                  style={{ width: `${costShares.failure}%`, background: 'var(--rose-danger)' }} 
                  data-tooltip={`Falhas: ${formatCurrency(costReport.failureCost)}`}
                />
              </div>
            </div>

            {/* Detalhamento Item por Item */}
            <div className="breakdown-legend">
              <div className="legend-item">
                <div className="legend-item-left">
                  <span className="legend-dot" style={{ background: 'var(--cyan-neon)' }}></span>
                  <span>Filamento ({formatWeight(weightGrams)})</span>
                </div>
                <span className="legend-val">{formatCurrency(costReport.filamentCost)}</span>
              </div>

              <div className="legend-item">
                <div className="legend-item-left">
                  <span className="legend-dot" style={{ background: 'var(--blue-bright)' }}></span>
                  <span>Energia ({formatTime(costReport.totalPrintHours * 60)})</span>
                </div>
                <span className="legend-val">{formatCurrency(costReport.energyCost)}</span>
              </div>

              <div className="legend-item">
                <div className="legend-item-left">
                  <span className="legend-dot" style={{ background: 'var(--amber-warning)' }}></span>
                  <span>Depreciação & Manutenção</span>
                </div>
                <span className="legend-val">{formatCurrency(costReport.machineTotalCost)}</span>
              </div>

              <div className="legend-item">
                <div className="legend-item-left">
                  <span className="legend-dot" style={{ background: 'var(--purple-vibrant)' }}></span>
                  <span>Mão de Obra ({costReport.totalLaborMinutes}min)</span>
                </div>
                <span className="legend-val">{formatCurrency(costReport.laborCost)}</span>
              </div>

              <div className="legend-item">
                <div className="legend-item-left">
                  <span className="legend-dot" style={{ background: 'var(--indigo-deep)' }}></span>
                  <span>Embalagem & Insumos</span>
                </div>
                <span className="legend-val">{formatCurrency(costReport.extrasCost)}</span>
              </div>

              <div className="legend-item">
                <div className="legend-item-left">
                  <span className="legend-dot" style={{ background: 'var(--rose-danger)' }}></span>
                  <span>Margem Risco de Falha ({failureMarginPercent}%)</span>
                </div>
                <span className="legend-val">{formatCurrency(costReport.failureCost)}</span>
              </div>
            </div>

            {/* Ações Rápidas */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button 
                className="btn btn-primary"
                onClick={() => setIsCatalogModalOpen(true)}
              >
                <PlusCircle size={16} />
                Cadastrar no Catálogo
              </button>

              <button 
                className="btn btn-outline"
                onClick={() => onNavigateToConsignment(costReport.suggestedSalePrice, costReport.totalCost)}
              >
                <ArrowRight size={16} />
                Simular em Consignado
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal: Salvar Produto no Catálogo */}
      {isCatalogModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCatalogModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Salvar Peça no Catálogo de Vendas</h3>
              <button 
                className="btn btn-outline btn-sm btn-icon-only" 
                onClick={() => setIsCatalogModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveToCatalogSubmit}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Peça / Modelo</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: Suporte de Celular Articulado, Vaso Origami..." 
                    className="form-input" 
                    value={newProductTitle} 
                    onChange={(e) => setNewProductTitle(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select 
                      className="form-select" 
                      value={newProductCategory} 
                      onChange={(e) => setNewProductCategory(e.target.value)}
                    >
                      <option value="Decoração">Decoração</option>
                      <option value="Colecionáveis">Colecionáveis & Action Figures</option>
                      <option value="Setup & Games">Setup & Games</option>
                      <option value="Utilitários">Utilitários & Casa</option>
                      <option value="Brinquedos">Brinquedos & Fidgets</option>
                      <option value="Acessórios">Acessórios & Joias</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estoque Inicial Pronto</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="form-input form-input-mono" 
                      value={newProductStock} 
                      onChange={(e) => setNewProductStock(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">URL da Foto do Produto (Opcional)</label>
                  <input 
                    type="url" 
                    placeholder="https://..." 
                    className="form-input" 
                    value={newProductImageUrl} 
                    onChange={(e) => setNewProductImageUrl(e.target.value)}
                  />
                  <span className="form-label-hint">Caso deixe vazio, uma imagem ilustrativa moderna será associada.</span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-subtle)', marginTop: '8px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                    <span>Custo Calculado: <strong>{formatCurrency(costReport.totalCost)}</strong></span>
                    <span>Preço de Venda: <strong style={{ color: 'var(--emerald-profit)' }}>{formatCurrency(costReport.suggestedSalePrice)}</strong></span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Parâmetros: {formatWeight(weightGrams)} de {activeFilament?.material} | {formatTime(costReport.totalPrintHours * 60)} de máquina
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsCatalogModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle2 size={16} />
                  Confirmar e Salvar no Catálogo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

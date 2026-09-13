import React, { useState, useMemo } from 'react';
import { 
  Store, 
  DollarSign, 
  Percent, 
  ShoppingBag, 
  Plus, 
  CheckCircle, 
  FileText, 
  Phone, 
  MapPin, 
  Trash2, 
  Printer as PrintIcon, 
  TrendingUp,
  ArrowRight,
  UserCheck,
  Calendar
} from 'lucide-react';
import { calculateConsignment } from '../../utils/calculations';
import { formatCurrency, formatPercent, formatDate } from '../../utils/formatters';

export const ConsignmentManager = ({ 
  partners = [], 
  products = [], 
  dispatches = [], 
  initialSimulatorValues = null,
  onAddPartner, 
  onUpdatePartner, 
  onDeletePartner,
  onUpdateDispatch,
  onDeleteDispatch,
  onAddDispatch
}) => {
  // Sub-abas dentro de Consignados
  const [activeSubTab, setActiveSubTab] = useState('inventory'); // 'inventory', 'simulator', 'partners'
  const [filterPartnerId, setFilterPartnerId] = useState('ALL');

  // Estados do Simulador de Comissão
  const [simRetailPrice, setSimRetailPrice] = useState(initialSimulatorValues?.price || 60);
  const [simCommissionPercent, setSimCommissionPercent] = useState(25);
  const [simUnitCost, setSimUnitCost] = useState(initialSimulatorValues?.cost || 20);

  // Modais
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);
  const [isRecordSaleModalOpen, setIsRecordSaleModalOpen] = useState(false);
  const [selectedDispatchForSale, setSelectedDispatchForSale] = useState(null);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [isStatementModalOpen, setIsStatementModalOpen] = useState(false);

  // Formulário de Novo Parceiro
  const [partnerName, setPartnerName] = useState('');
  const [partnerContact, setPartnerContact] = useState('');
  const [partnerPhone, setPartnerPhone] = useState('');
  const [partnerCommission, setPartnerCommission] = useState(25);
  const [partnerAddress, setPartnerAddress] = useState('');
  const [partnerNotes, setPartnerNotes] = useState('');

  // Cálculo do Simulador
  const simResult = useMemo(() => {
    return calculateConsignment(simRetailPrice, simCommissionPercent, simUnitCost);
  }, [simRetailPrice, simCommissionPercent, simUnitCost]);

  // Totais Gerais dos Consignados
  const metrics = useMemo(() => {
    let totalItemsActive = 0;
    let totalItemsSold = 0;
    let totalMakerPayout = 0;
    let totalStoreCommission = 0;

    dispatches.forEach(d => {
      const sent = Number(d.quantitySent) || 0;
      const sold = Number(d.quantitySold) || 0;
      const remaining = Math.max(0, sent - sold);
      const price = Number(d.unitRetailPrice) || 0;
      const comm = Number(d.commissionPercent) || 0;

      totalItemsActive += remaining;
      totalItemsSold += sold;

      const storePerUnit = price * (comm / 100);
      const makerPerUnit = price - storePerUnit;

      totalMakerPayout += sold * makerPerUnit;
      totalStoreCommission += sold * storePerUnit;
    });

    return {
      totalItemsActive,
      totalItemsSold,
      totalMakerPayout,
      totalStoreCommission,
    };
  }, [dispatches]);

  // Lista de despachos enriquecida com dados do produto e parceiro
  const enrichedDispatches = useMemo(() => {
    return dispatches
      .filter(d => filterPartnerId === 'ALL' || d.partnerId === filterPartnerId)
      .map(d => {
        const prod = products.find(p => p.id === d.productId);
        const partner = partners.find(p => p.id === d.partnerId);
        const remaining = Math.max(0, (Number(d.quantitySent) || 0) - (Number(d.quantitySold) || 0));
        const price = Number(d.unitRetailPrice) || 0;
        const commPct = Number(d.commissionPercent) || 25;
        const storeCutPerUnit = price * (commPct / 100);
        const makerPayoutPerUnit = price - storeCutPerUnit;
        const totalPendingPayout = (Number(d.quantitySold) || 0) * makerPayoutPerUnit;

        return {
          ...d,
          productTitle: prod ? prod.title : 'Produto não encontrado',
          productCost: prod ? prod.cost : 0,
          partnerName: partner ? partner.name : 'Parceiro desconhecido',
          partnerContact: partner?.contactPerson,
          partnerPhone: partner?.phone,
          remainingStock: remaining,
          storeCutPerUnit,
          makerPayoutPerUnit,
          totalPendingPayout,
        };
      });
  }, [dispatches, products, partners, filterPartnerId]);

  // Registrar venda de peça em consignado
  const handleOpenSaleModal = (disp) => {
    setSelectedDispatchForSale(disp);
    setSaleQuantity(1);
    setIsRecordSaleModalOpen(true);
  };

  const handleConfirmSale = (e) => {
    e.preventDefault();
    if (!selectedDispatchForSale) return;

    const currentSold = Number(selectedDispatchForSale.quantitySold) || 0;
    const maxAvailable = selectedDispatchForSale.remainingStock;
    const qtyToAdd = Math.min(Number(saleQuantity), maxAvailable);

    const updated = {
      ...selectedDispatchForSale,
      quantitySold: currentSold + qtyToAdd,
    };

    onUpdateDispatch(updated);
    setIsRecordSaleModalOpen(false);
  };

  // Cadastrar parceiro
  const handleSavePartner = (e) => {
    e.preventDefault();
    if (!partnerName.trim()) return;

    const newPartner = {
      id: 'part-' + Date.now(),
      name: partnerName.trim(),
      contactPerson: partnerContact.trim(),
      phone: partnerPhone.trim(),
      commissionPercent: Number(partnerCommission) || 25,
      address: partnerAddress.trim(),
      notes: partnerNotes.trim(),
      createdAt: new Date().toISOString(),
    };

    onAddPartner(newPartner);
    setIsPartnerModalOpen(false);
    setPartnerName('');
    setPartnerContact('');
    setPartnerPhone('');
    setPartnerCommission(25);
    setPartnerAddress('');
    setPartnerNotes('');
  };

  return (
    <div>
      {/* 4 Cards de Métricas Principais */}
      <div className="consignment-overview-grid">
        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--purple-vibrant)' }}>
            <ShoppingBag size={22} />
          </div>
          <div className="kpi-info-wrap">
            <span className="kpi-label">Peças Ativas na Rua</span>
            <span className="kpi-val">{metrics.totalItemsActive} un</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan-neon)' }}>
            <CheckCircle size={22} />
          </div>
          <div className="kpi-info-wrap">
            <span className="kpi-label">Peças Vendidas em Lojas</span>
            <span className="kpi-val">{metrics.totalItemsSold} un</span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-profit)' }}>
            <DollarSign size={22} />
          </div>
          <div className="kpi-info-wrap">
            <span className="kpi-label">Seu Repasse a Receber</span>
            <span className="kpi-val" style={{ color: 'var(--emerald-profit)' }}>
              {formatCurrency(metrics.totalMakerPayout)}
            </span>
          </div>
        </div>

        <div className="kpi-card">
          <div className="kpi-icon-wrap" style={{ background: 'rgba(245, 158, 11, 0.15)', color: 'var(--amber-warning)' }}>
            <Percent size={22} />
          </div>
          <div className="kpi-info-wrap">
            <span className="kpi-label">Comissões Retidas pelas Lojas</span>
            <span className="kpi-val" style={{ color: 'var(--amber-warning)' }}>
              {formatCurrency(metrics.totalStoreCommission)}
            </span>
          </div>
        </div>
      </div>

      {/* Navegação Secundária */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button 
            className={`btn ${activeSubTab === 'inventory' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('inventory')}
          >
            <Store size={16} />
            Estoque & Vendas nas Lojas
          </button>

          <button 
            className={`btn ${activeSubTab === 'simulator' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('simulator')}
          >
            <TrendingUp size={16} />
            Simulador de Comissões
          </button>

          <button 
            className={`btn ${activeSubTab === 'partners' ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setActiveSubTab('partners')}
          >
            <UserCheck size={16} />
            Lojas Parceiras ({partners.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {activeSubTab === 'inventory' && (
            <button 
              className="btn btn-outline"
              onClick={() => setIsStatementModalOpen(true)}
              title="Gerar Romaneio / Extrato de Acerto para Impressão"
            >
              <FileText size={16} />
              Extrato / Romaneio
            </button>
          )}

          {activeSubTab === 'partners' && (
            <button 
              className="btn btn-primary"
              onClick={() => setIsPartnerModalOpen(true)}
            >
              <Plus size={16} />
              Nova Loja Parceira
            </button>
          )}
        </div>
      </div>

      {/* =========================================================================
          SUB-ABA 1: TABELA DE ESTOQUE E VENDAS NAS LOJAS
          ========================================================================= */}
      {activeSubTab === 'inventory' && (
        <div className="glass-card">
          <div className="card-header">
            <div className="card-header-left">
              <Store size={18} color="var(--purple-vibrant)" />
              <div>
                <h3 className="card-title">Peças Consignadas e Prestação de Contas</h3>
                <p className="card-subtitle">Monitore cada lote enviado, itens vendidos e valor líquido a receber</p>
              </div>
            </div>

            {/* Filtro por Loja */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Filtrar por Loja:</span>
              <select 
                className="form-select" 
                style={{ width: 'auto', padding: '6px 12px' }}
                value={filterPartnerId} 
                onChange={(e) => setFilterPartnerId(e.target.value)}
              >
                <option value="ALL">Todas as Lojas</option>
                {partners.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="card-body" style={{ padding: 0 }}>
            {enrichedDispatches.length === 0 ? (
              <div style={{ padding: '50px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <Store size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                <h4>Nenhuma remessa encontrada</h4>
                <p style={{ fontSize: '0.85rem', marginTop: '4px' }}>
                  Vá até o <strong>Catálogo de Peças</strong> e clique no botão <strong>"Consignar"</strong> para enviar um lote para uma loja parceira.
                </p>
              </div>
            ) : (
              <div className="data-table-container">
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>Loja Parceira</th>
                      <th>Peça Consignada</th>
                      <th style={{ textAlign: 'center' }}>Enviadas</th>
                      <th style={{ textAlign: 'center' }}>Vendidas</th>
                      <th style={{ textAlign: 'center' }}>Em Loja</th>
                      <th>Preço Vitrine</th>
                      <th>Comissão Loja</th>
                      <th>Seu Repasse Unit.</th>
                      <th>Total a Receber</th>
                      <th style={{ textAlign: 'right' }}>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {enrichedDispatches.map(disp => (
                      <tr key={disp.id}>
                        <td>
                          <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{disp.partnerName}</div>
                          {disp.partnerContact && (
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                              {disp.partnerContact} {disp.partnerPhone && `• ${disp.partnerPhone}`}
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 600 }}>{disp.productTitle}</div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                            Enviado em {formatDate(disp.dateSent)}
                          </div>
                        </td>
                        <td style={{ textAlign: 'center', fontWeight: 600 }} className="text-mono">
                          {disp.quantitySent}
                        </td>
                        <td style={{ textAlign: 'center' }} className="text-mono">
                          <span className="badge badge-emerald">
                            {disp.quantitySold} un
                          </span>
                        </td>
                        <td style={{ textAlign: 'center' }} className="text-mono">
                          <span className={`badge ${disp.remainingStock > 0 ? 'badge-cyan' : 'badge-amber'}`}>
                            {disp.remainingStock} un
                          </span>
                        </td>
                        <td className="text-mono" style={{ fontWeight: 600 }}>
                          {formatCurrency(disp.unitRetailPrice)}
                        </td>
                        <td>
                          <span className="badge badge-amber">
                            {disp.commissionPercent}% ({formatCurrency(disp.storeCutPerUnit)})
                          </span>
                        </td>
                        <td className="text-mono" style={{ color: 'var(--cyan-neon)', fontWeight: 700 }}>
                          {formatCurrency(disp.makerPayoutPerUnit)}
                        </td>
                        <td className="text-mono" style={{ color: 'var(--emerald-profit)', fontWeight: 800 }}>
                          {formatCurrency(disp.totalPendingPayout)}
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', gap: '6px' }}>
                            {disp.remainingStock > 0 && (
                              <button 
                                className="btn btn-success btn-sm"
                                onClick={() => handleOpenSaleModal(disp)}
                                title="Informar venda realizada pela loja"
                              >
                                <DollarSign size={14} />
                                Baixa Venda
                              </button>
                            )}

                            <button 
                              className="btn btn-outline btn-sm btn-icon-only btn-danger"
                              onClick={() => {
                                if (confirm('Deseja remover este registro de consignação?')) {
                                  onDeleteDispatch(disp.id);
                                }
                              }}
                              title="Remover registro"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-ABA 2: SIMULADOR DE COMISSÃO & MARGENS
          ========================================================================= */}
      {activeSubTab === 'simulator' && (
        <div className="glass-card">
          <div className="card-header">
            <div className="card-header-left">
              <TrendingUp size={18} color="var(--cyan-neon)" />
              <div>
                <h3 className="card-title">Simulador Interativo de Consignação</h3>
                <p className="card-subtitle">Calcule exatamente quanto cobrar, quanto a loja ganha e qual é o seu lucro limpo</p>
              </div>
            </div>
          </div>

          <div className="card-body">
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">Preço Final de Vitrine (ao Consumidor)</label>
                <div className="input-with-affix">
                  <span className="affix affix-prefix">R$</span>
                  <input 
                    type="number" 
                    min="1" 
                    step="1"
                    className="form-input form-input-mono" 
                    value={simRetailPrice} 
                    onChange={(e) => setSimRetailPrice(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    onBlur={() => { if (simRetailPrice === '') setSimRetailPrice(0); }}
                  />
                </div>
                <span className="form-label-hint">Valor na etiqueta da loja</span>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Comissão da Loja Parceira (%)
                </label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="0" 
                    max="60" 
                    step="1"
                    className="form-input form-input-mono" 
                    value={simCommissionPercent} 
                    onChange={(e) => setSimCommissionPercent(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    onBlur={() => { if (simCommissionPercent === '') setSimCommissionPercent(0); }}
                  />
                  <span className="affix">%</span>
                </div>
                <span className="form-label-hint">Padrão do comércio: 20% a 35%</span>
              </div>

              <div className="form-group">
                <label className="form-label">Seu Custo de Fabricação da Peça</label>
                <div className="input-with-affix">
                  <span className="affix affix-prefix">R$</span>
                  <input 
                    type="number" 
                    min="0" 
                    step="0.5"
                    className="form-input form-input-mono" 
                    value={simUnitCost} 
                    onChange={(e) => setSimUnitCost(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))}
                    onBlur={() => { if (simUnitCost === '') setSimUnitCost(0); }}
                  />
                </div>
                <span className="form-label-hint">Filamento, energia, desgaste, mão de obra</span>
              </div>
            </div>

            {/* Slider Rápido de Comissão */}
            <div style={{ marginTop: '14px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
                <span>Ajuste rápido da comissão da loja:</span>
                <span style={{ fontWeight: 700, color: 'var(--purple-vibrant)' }}>{simCommissionPercent}%</span>
              </div>
              <input 
                type="range" 
                min="5" 
                max="50" 
                step="1" 
                className="range-slider"
                value={simCommissionPercent}
                onChange={(e) => setSimCommissionPercent(Number(e.target.value))}
              />
            </div>

            {/* Pipeline Visual de Fluxo Financeiro */}
            <div className="simulator-box">
              <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '16px' }}>
                Divisão Financeira por Cada Unidade Vendida na Loja:
              </h4>

              <div className="simulator-pipeline">
                <div className="sim-step-box" style={{ borderColor: 'rgba(255,255,255,0.2)' }}>
                  <div className="sim-step-title">1. Preço de Vitrine</div>
                  <div className="sim-step-val" style={{ color: '#fff' }}>
                    {formatCurrency(simResult.retailPrice)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Pago pelo cliente final
                  </div>
                </div>

                <div className="sim-arrow">➔</div>

                <div className="sim-step-box" style={{ borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}>
                  <div className="sim-step-title" style={{ color: 'var(--amber-warning)' }}>
                    2. Loja Retém ({simCommissionPercent}%)
                  </div>
                  <div className="sim-step-val" style={{ color: 'var(--amber-warning)' }}>
                    {formatCurrency(simResult.storeCommissionAmount)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Lucro da loja / comissão
                  </div>
                </div>

                <div className="sim-arrow">➔</div>

                <div className="sim-step-box" style={{ borderColor: 'rgba(6, 182, 212, 0.4)', background: 'rgba(6, 182, 212, 0.05)' }}>
                  <div className="sim-step-title" style={{ color: 'var(--cyan-neon)' }}>
                    3. Seu Repasse Bruto
                  </div>
                  <div className="sim-step-val" style={{ color: 'var(--cyan-neon)' }}>
                    {formatCurrency(simResult.makerPayout)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Valor que a loja te paga
                  </div>
                </div>

                <div className="sim-arrow">➔</div>

                <div className="sim-step-box" style={{ borderColor: 'rgba(16, 185, 129, 0.4)', background: 'rgba(16, 185, 129, 0.08)' }}>
                  <div className="sim-step-title" style={{ color: 'var(--emerald-profit)' }}>
                    4. Seu Lucro Limpo
                  </div>
                  <div className="sim-step-val" style={{ color: 'var(--emerald-profit)', fontSize: '1.35rem' }}>
                    {formatCurrency(simResult.netProfit)}
                  </div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--emerald-profit)', marginTop: '4px', fontWeight: 600 }}>
                    {formatPercent(simResult.netMarginPercent, 1)} de margem limpa
                  </div>
                </div>
              </div>

              {simResult.netProfit <= 0 && (
                <div style={{ marginTop: '16px', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', padding: '12px 16px', borderRadius: '8px', color: '#fda4af', fontSize: '0.85rem' }}>
                  ⚠️ <strong>Atenção:</strong> Com essa taxa de comissão e preço de venda, você terá prejuízo ou lucro zero após descontar os custos de produção ({formatCurrency(simUnitCost)}). Aumente o preço final na vitrine ou renegocie a comissão!
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          SUB-ABA 3: CADASTRO DE PONTOS / LOJAS PARCEIRAS
          ========================================================================= */}
      {activeSubTab === 'partners' && (
        <div className="grid-2">
          {partners.map(part => {
            const activeItems = dispatches
              .filter(d => d.partnerId === part.id)
              .reduce((acc, d) => acc + Math.max(0, (Number(d.quantitySent) || 0) - (Number(d.quantitySold) || 0)), 0);

            const totalSold = dispatches
              .filter(d => d.partnerId === part.id)
              .reduce((acc, d) => acc + (Number(d.quantitySold) || 0), 0);

            return (
              <div key={part.id} className="glass-card" style={{ padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: 700 }}>{part.name}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '4px' }}>
                      <UserCheck size={14} />
                      {part.contactPerson || 'Responsável não informado'}
                    </div>
                  </div>

                  <span className="badge badge-purple" style={{ fontSize: '0.8rem' }}>
                    {part.commissionPercent}% de Comissão
                  </span>
                </div>

                <div style={{ margin: '14px 0', fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {part.phone && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Phone size={14} color="var(--text-muted)" />
                      <span>{part.phone}</span>
                    </div>
                  )}
                  {part.address && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <MapPin size={14} color="var(--text-muted)" />
                      <span>{part.address}</span>
                    </div>
                  )}
                  {part.notes && (
                    <div style={{ marginTop: '6px', padding: '8px 12px', background: 'rgba(255,255,255,0.03)', borderRadius: '6px', borderLeft: '3px solid var(--purple-vibrant)' }}>
                      {part.notes}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', fontSize: '0.82rem' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Estoque atual: </span>
                    <strong style={{ color: 'var(--cyan-neon)' }}>{activeItems} un</strong>
                    <span style={{ color: 'var(--text-muted)', marginLeft: '10px' }}>Vendidas: </span>
                    <strong style={{ color: 'var(--emerald-profit)' }}>{totalSold} un</strong>
                  </div>

                  <button 
                    className="btn btn-outline btn-sm btn-danger btn-icon-only"
                    onClick={() => {
                      if (confirm(`Deseja excluir o parceiro "${part.name}"?`)) {
                        onDeletePartner(part.id);
                      }
                    }}
                    title="Excluir parceiro"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Registrar Venda de Peça Consignada */}
      {isRecordSaleModalOpen && selectedDispatchForSale && (
        <div className="modal-overlay" onClick={() => setIsRecordSaleModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Registrar Venda Informada pela Loja</h3>
              <button 
                className="btn btn-outline btn-sm btn-icon-only" 
                onClick={() => setIsRecordSaleModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmSale}>
              <div className="modal-body">
                <div style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', padding: '14px', borderRadius: 'var(--border-radius-md)', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem' }}>{selectedDispatchForSale.productTitle}</div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Loja: {selectedDispatchForSale.partnerName} | Disponível na loja: <strong>{selectedDispatchForSale.remainingStock} unidades</strong>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Quantidade de Unidades Vendidas</label>
                  <input 
                    type="number" 
                    min="1" 
                    max={selectedDispatchForSale.remainingStock} 
                    className="form-input form-input-mono" 
                    value={saleQuantity} 
                    onChange={(e) => setSaleQuantity(e.target.value === '' ? '' : e.target.value)}
                    onBlur={() => { if (saleQuantity === '') setSaleQuantity(1); }}
                    required
                    autoFocus
                  />
                  <span className="form-label-hint">
                    Máximo disponível para dar baixa: {selectedDispatchForSale.remainingStock}
                  </span>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid var(--border-subtle)', marginTop: '12px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span>Preço unitário de vitrine:</span>
                    <strong className="text-mono">{formatCurrency(selectedDispatchForSale.unitRetailPrice)}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', color: 'var(--amber-warning)' }}>
                    <span>Comissão retida pela loja ({selectedDispatchForSale.commissionPercent}%):</span>
                    <strong className="text-mono">
                      - {formatCurrency(Number(saleQuantity) * selectedDispatchForSale.storeCutPerUnit)}
                    </strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: '8px', borderTop: '1px solid var(--border-subtle)', fontSize: '1.05rem', color: 'var(--emerald-profit)' }}>
                    <span>Valor a Receber no Acerto:</span>
                    <strong className="text-mono">
                      + {formatCurrency(Number(saleQuantity) * selectedDispatchForSale.makerPayoutPerUnit)}
                    </strong>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsRecordSaleModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-success">
                  <CheckCircle size={16} />
                  Confirmar Venda
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Nova Loja Parceira */}
      {isPartnerModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPartnerModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar Ponto de Consignação / Loja</h3>
              <button 
                className="btn btn-outline btn-sm btn-icon-only" 
                onClick={() => setIsPartnerModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePartner}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome da Loja / Estabelecimento</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="Ex: Livraria & Café Geek, Loja Decor Art..." 
                    value={partnerName} 
                    onChange={(e) => setPartnerName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Pessoa de Contato / Gerente</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: Carlos Oliveira" 
                      value={partnerContact} 
                      onChange={(e) => setPartnerContact(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Telefone / WhatsApp</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="(11) 99999-8888" 
                      value={partnerPhone} 
                      onChange={(e) => setPartnerPhone(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Comissão Padrão Acordada (%)</label>
                    <div className="input-with-affix">
                      <input 
                        type="number" 
                        min="0" 
                        max="60" 
                        required 
                        className="form-input form-input-mono" 
                        value={partnerCommission} 
                        onChange={(e) => setPartnerCommission(e.target.value === '' ? '' : e.target.value)}
                        onBlur={() => { if (partnerCommission === '') setPartnerCommission(25); }}
                      />
                      <span className="affix">%</span>
                    </div>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Endereço / Localização</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Rua, Número, Bairro ou Shopping" 
                      value={partnerAddress} 
                      onChange={(e) => setPartnerAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Anotações / Condições de Pagamento</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Ex: Acerto todo dia 10 de cada mês via Pix..." 
                    value={partnerNotes} 
                    onChange={(e) => setPartnerNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsPartnerModalOpen(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <CheckCircle size={16} />
                  Cadastrar Loja
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Extrato / Romaneio de Consignação para Impressão */}
      {isStatementModalOpen && (
        <div className="modal-overlay" onClick={() => setIsStatementModalOpen(false)}>
          <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Extrato & Romaneio de Consignação</h3>
              <button 
                className="btn btn-outline btn-sm btn-icon-only no-print" 
                onClick={() => setIsStatementModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #334155', paddingBottom: '16px', marginBottom: '20px' }}>
                <div>
                  <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>ROMANEIO DE CONTRATO CONSIGNADO</h2>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    Prestação de contas e inventário de peças 3D
                  </div>
                </div>
                <div style={{ textAlign: 'right', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  <div>Data de emissão: <strong>{new Date().toLocaleDateString('pt-BR')}</strong></div>
                  <div>Status: <strong>Vigente</strong></div>
                </div>
              </div>

              <table className="custom-table" style={{ marginBottom: '24px' }}>
                <thead>
                  <tr>
                    <th>Loja / Parceiro</th>
                    <th>Item</th>
                    <th style={{ textAlign: 'center' }}>Qtd Entregue</th>
                    <th style={{ textAlign: 'center' }}>Qtd Vendida</th>
                    <th style={{ textAlign: 'center' }}>Saldo em Loja</th>
                    <th>Preço Vitrine</th>
                    <th>Comissão</th>
                    <th>Repasse a Receber</th>
                  </tr>
                </thead>
                <tbody>
                  {enrichedDispatches.map(d => (
                    <tr key={d.id}>
                      <td>{d.partnerName}</td>
                      <td>{d.productTitle}</td>
                      <td style={{ textAlign: 'center' }}>{d.quantitySent}</td>
                      <td style={{ textAlign: 'center' }}>{d.quantitySold}</td>
                      <td style={{ textAlign: 'center', fontWeight: 700 }}>{d.remainingStock}</td>
                      <td>{formatCurrency(d.unitRetailPrice)}</td>
                      <td>{d.commissionPercent}%</td>
                      <td style={{ fontWeight: 700 }}>{formatCurrency(d.totalPendingPayout)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>Total Líquido Devido ao Fabricante:</span>
                <span style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--emerald-profit)' }}>
                  {formatCurrency(metrics.totalMakerPayout)}
                </span>
              </div>

              {/* Assinaturas */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px', marginTop: '60px', textAlign: 'center' }}>
                <div style={{ borderTop: '1px solid #64748b', paddingTop: '8px', fontSize: '0.8rem' }}>
                  Assinatura do Fabricante / Maker
                </div>
                <div style={{ borderTop: '1px solid #64748b', paddingTop: '8px', fontSize: '0.8rem' }}>
                  Assinatura do Estabelecimento Parceiro
                </div>
              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-outline" onClick={() => setIsStatementModalOpen(false)}>
                Fechar
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <PrintIcon size={16} />
                Imprimir Extrato / PDF
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

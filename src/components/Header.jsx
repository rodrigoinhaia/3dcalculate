import React from 'react';
import { Box, Layers, DollarSign, Store, Download, RefreshCw, Cpu } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

export const Header = ({ products = [], dispatches = [], partners = [], onExportBackup, onOpenSettings }) => {
  // Total de itens no catálogo
  const totalProducts = products.length;

  // Total de peças consignadas ativas na rua
  const activeConsignedItems = dispatches.reduce((acc, d) => {
    const remaining = Math.max(0, (Number(d.quantitySent) || 0) - (Number(d.quantitySold) || 0));
    return acc + remaining;
  }, 0);

  // Valor total a receber de produtos vendidos em consignado
  const totalPendingPayout = dispatches.reduce((acc, d) => {
    const sold = Number(d.quantitySold) || 0;
    const price = Number(d.unitRetailPrice) || 0;
    const comm = Number(d.commissionPercent) || 0;
    const payoutPerUnit = price * (1 - comm / 100);
    return acc + (sold * payoutPerUnit);
  }, 0);

  return (
    <header className="header-root">
      <div className="header-inner">
        <div className="logo-wrapper">
          <div className="logo-icon-box">
            <Layers size={24} />
          </div>
          <div className="logo-title-group">
            <h1>
              3D Calc & MakerPro
              <span className="logo-badge">PRO v1.0</span>
            </h1>
            <p className="logo-subtitle">Precificação 3D, Catálogo & Gestão de Consignados</p>
          </div>
        </div>

        <div className="header-quick-stats">
          <div className="stat-pill" title="Total de modelos cadastrados no catálogo">
            <div className="stat-pill-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--cyan-neon)' }}>
              <Box size={16} />
            </div>
            <div>
              <div className="stat-pill-label">Catálogo</div>
              <div className="stat-pill-val">{totalProducts} itens</div>
            </div>
          </div>

          <div className="stat-pill" title="Total de peças físicas expostas em lojas parceiras">
            <div className="stat-pill-icon" style={{ background: 'rgba(139, 92, 246, 0.15)', color: 'var(--purple-vibrant)' }}>
              <Store size={16} />
            </div>
            <div>
              <div className="stat-pill-label">Em Consignação</div>
              <div className="stat-pill-val">{activeConsignedItems} un</div>
            </div>
          </div>

          <div className="stat-pill" title="Total acumulado em vendas de consignados">
            <div className="stat-pill-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--emerald-profit)' }}>
              <DollarSign size={16} />
            </div>
            <div>
              <div className="stat-pill-label">Faturado Consignado</div>
              <div className="stat-pill-val">{formatCurrency(totalPendingPayout)}</div>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button 
            className="btn btn-outline btn-sm" 
            onClick={onExportBackup}
            title="Exportar todos os dados em arquivo JSON para backup seguro"
          >
            <Download size={14} />
            Backup JSON
          </button>
        </div>
      </div>
    </header>
  );
};

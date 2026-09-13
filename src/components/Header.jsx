import React, { useState, useEffect } from 'react';
import { Box, Layers, DollarSign, Store, Download, Cloud, CloudOff, RefreshCw, User, LogOut, LogIn } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';
import { useAuth } from '../context/AuthContext';
import { syncManager } from '../storage/syncManager';

export const Header = ({ products = [], dispatches = [], partners = [], onExportBackup, onOpenSettings }) => {
  const { user, isAuthenticated, logout, openAuthModal, isOnline } = useAuth();
  const [syncState, setSyncState] = useState(() => ({
    status: syncManager.getStatus(),
    pendingCount: syncManager.pendingCount,
  }));

  useEffect(() => {
    const unsubscribe = syncManager.subscribe((state) => {
      setSyncState(state);
    });
    return () => unsubscribe();
  }, []);

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

  const handleSyncClick = () => {
    if (!isAuthenticated) {
      openAuthModal('login');
      return;
    }
    syncManager.sync();
  };

  return (
    <header className="header-root">
      <div className="header-inner">
        {/* Logo e Título */}
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

        {/* Estatísticas Rápidas */}
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

        {/* Ações, Sync Status & Usuário */}
        <div className="header-actions">
          {/* Badge de Sincronização / Modo Offline */}
          <button 
            type="button"
            className={`sync-status-badge status-${syncState.status}`}
            onClick={handleSyncClick}
            title={
              !isAuthenticated 
                ? 'Modo Local Ativo. Clique para entrar ou cadastrar e sincronizar com o banco PostgreSQL.' 
                : syncState.status === 'offline'
                  ? `Offline: ${syncState.pendingCount} alterações salvas localmente no navegador.`
                  : syncState.status === 'syncing'
                    ? 'Sincronizando com o PostgreSQL...'
                    : 'Online: Todos os dados sincronizados com o PostgreSQL.'
            }
          >
            {syncState.status === 'syncing' ? (
              <>
                <RefreshCw size={14} className="spin-animation text-amber" />
                <span className="sync-text">Sincronizando...</span>
              </>
            ) : !isAuthenticated ? (
              <>
                <CloudOff size={14} className="text-secondary" />
                <span className="sync-text">Modo Local</span>
              </>
            ) : !isOnline || syncState.status === 'offline' ? (
              <>
                <CloudOff size={14} className="text-rose" />
                <span className="sync-text">Offline ({syncState.pendingCount})</span>
              </>
            ) : (
              <>
                <Cloud size={14} className="text-emerald" />
                <span className="sync-text">Sincronizado</span>
              </>
            )}
          </button>

          {/* Backup JSON */}
          <button 
            className="btn btn-outline btn-sm" 
            onClick={onExportBackup}
            title="Exportar todos os dados em arquivo JSON para backup seguro"
          >
            <Download size={14} />
            Backup
          </button>

          {/* Área do Usuário */}
          {isAuthenticated ? (
            <div className="user-profile-widget">
              <div className="user-avatar-badge" title={`Conectado como: ${user?.name || user?.email}`}>
                <User size={14} />
                <span className="user-name-truncated">{user?.name?.split(' ')[0] || 'Maker'}</span>
              </div>
              <button 
                type="button" 
                className="btn-user-logout" 
                onClick={logout} 
                title="Sair da conta"
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="btn btn-primary btn-sm"
              onClick={() => openAuthModal('login')}
            >
              <LogIn size={14} />
              Entrar
            </button>
          )}
        </div>
      </div>
    </header>
  );
};

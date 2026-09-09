import React from 'react';
import { Calculator, Package, Store, Sliders, Sparkles } from 'lucide-react';

export const Navigation = ({ activeTab, onTabChange, counts = {} }) => {
  const tabs = [
    {
      id: 'calculator',
      label: 'Calculadora de Custos',
      icon: Calculator,
      badge: null,
    },
    {
      id: 'catalog',
      label: 'Catálogo de Peças',
      icon: Package,
      badge: counts.products || 0,
    },
    {
      id: 'consignment',
      label: 'Consignados & Comissões',
      icon: Store,
      badge: counts.dispatches || 0,
    },
    {
      id: 'settings',
      label: 'Filamentos & Impressoras',
      icon: Sliders,
      badge: null,
    },
  ];

  return (
    <nav className="nav-tabs-wrapper">
      <div className="nav-tabs-inner">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              className={`nav-tab-btn ${isActive ? 'active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
              {tab.badge !== null && (
                <span className="nav-tab-badge">{tab.badge}</span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};

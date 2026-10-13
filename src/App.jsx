import React, { useState, useEffect } from 'react';
import { db } from './storage/db';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { PrintCostCalculator } from './components/Calculator/PrintCostCalculator';
import { ProductCatalog } from './components/Catalog/ProductCatalog';
import { ConsignmentManager } from './components/Consignment/ConsignmentManager';
import { PrintersFilamentsSettings } from './components/Settings/PrintersFilamentsSettings';
import { AuthProvider } from './context/AuthContext';
import { AuthModal } from './components/Auth/AuthModal';
import { StoreApp } from './components/Store/StoreApp';

function AppContent() {
  const [activeTab, setActiveTab] = useState('calculator');

  // Estado dos dados locais
  const [products, setProducts] = useState(() => db.getProducts());
  const [partners, setPartners] = useState(() => db.getPartners());
  const [dispatches, setDispatches] = useState(() => db.getDispatches());
  const [partnerSales, setPartnerSales] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('3dcalc_partner_sales_v1') || '[]');
    } catch {
      return [];
    }
  });
  const [partnerPrices, setPartnerPrices] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('3dcalc_partner_prices_v1') || '[]');
    } catch {
      return [];
    }
  });
  const [filaments, setFilaments] = useState(() => db.getFilaments());
  const [printers, setPrinters] = useState(() => db.getPrinters());
  const [settings, setSettings] = useState(() => db.getSettings());

  // Valores transferidos da calculadora para o simulador de consignado
  const [simulatorPreload, setSimulatorPreload] = useState(null);

  // Sincronização ao disparar eventos de atualização
  useEffect(() => {
    const handleStorageUpdate = () => {
      setProducts(db.getProducts());
      setPartners(db.getPartners());
      setDispatches(db.getDispatches());
      setFilaments(db.getFilaments());
      setPrinters(db.getPrinters());
      setSettings(db.getSettings());
      try {
        setPartnerSales(JSON.parse(localStorage.getItem('3dcalc_partner_sales_v1') || '[]'));
        setPartnerPrices(JSON.parse(localStorage.getItem('3dcalc_partner_prices_v1') || '[]'));
      } catch {
        setPartnerSales([]);
        setPartnerPrices([]);
      }
    };

    window.addEventListener('3dcalc_storage_updated', handleStorageUpdate);
    return () => window.removeEventListener('3dcalc_storage_updated', handleStorageUpdate);
  }, []);

  // Handlers para Produtos
  const handleAddProduct = (newProduct) => {
    const updated = [newProduct, ...products];
    db.saveProducts(updated);
    setProducts(updated);
  };

  const handleUpdateProduct = (updatedProduct) => {
    const updated = products.map(p => p.id === updatedProduct.id ? updatedProduct : p);
    db.saveProducts(updated);
    setProducts(updated);
  };

  const handleDeleteProduct = (id) => {
    const updated = products.filter(p => p.id !== id);
    db.saveProducts(updated);
    setProducts(updated);
  };

  // Handlers para Despacho em Consignado
  const handleAddDispatch = (newDispatch) => {
    const updated = [newDispatch, ...dispatches];
    db.saveDispatches(updated);
    setDispatches(updated);
  };

  const handleBulkDispatch = (newDispatches, stockUpdates) => {
    const updatedDispatches = [...newDispatches, ...dispatches];
    db.saveDispatches(updatedDispatches);
    setDispatches(updatedDispatches);
    const updatedProducts = products.map((product) => (
      stockUpdates[product.id] == null ? product : { ...product, stock: stockUpdates[product.id] }
    ));
    db.saveProducts(updatedProducts);
    setProducts(updatedProducts);
  };

  const handleUpdateDispatch = (updatedDispatch) => {
    const updated = dispatches.map(d => d.id === updatedDispatch.id ? updatedDispatch : d);
    db.saveDispatches(updated);
    setDispatches(updated);
  };

  const handleDeleteDispatch = (id) => {
    const updated = dispatches.filter(d => d.id !== id);
    db.saveDispatches(updated);
    setDispatches(updated);
  };

  // Handlers para Parceiros
  const handleAddPartner = (newPartner) => {
    const updated = [...partners, newPartner];
    db.savePartners(updated);
    setPartners(updated);
  };

  const handleUpdatePartner = (updatedPartner) => {
    const updated = partners.map(p => p.id === updatedPartner.id ? updatedPartner : p);
    db.savePartners(updated);
    setPartners(updated);
    const commissionPercent = Number(updatedPartner.commissionPercent) || 0;
    const commissionMode = updatedPartner.commissionMode === 'added' ? 'added' : 'included';
    const updatedDispatches = dispatches.map((dispatch) => (
      dispatch.partnerId === updatedPartner.id
        ? { ...dispatch, commissionPercent, commissionMode }
        : dispatch
    ));
    db.saveDispatches(updatedDispatches);
    setDispatches(updatedDispatches);
  };

  const handleDeletePartner = (id) => {
    const updated = partners.filter(p => p.id !== id);
    db.savePartners(updated);
    setPartners(updated);
  };

  // Handlers para Impressoras e Filamentos
  const handleAddPrinter = (printer) => {
    const updated = [...printers, printer];
    db.savePrinters(updated);
    setPrinters(updated);
  };

  const handleDeletePrinter = (id) => {
    const updated = printers.filter(p => p.id !== id);
    db.savePrinters(updated);
    setPrinters(updated);
  };

  const handleAddFilament = (filament) => {
    const updated = [...filaments, filament];
    db.saveFilaments(updated);
    setFilaments(updated);
  };

  const handleDeleteFilament = (id) => {
    const updated = filaments.filter(f => f.id !== id);
    db.saveFilaments(updated);
    setFilaments(updated);
  };

  const handleSaveSettings = (newSettings) => {
    db.saveSettings(newSettings);
    setSettings(newSettings);
  };

  const handleResetDemo = () => {
    db.resetToDefaults();
    setProducts(db.getProducts());
    setPartners(db.getPartners());
    setDispatches(db.getDispatches());
    setFilaments(db.getFilaments());
    setPrinters(db.getPrinters());
    setSettings(db.getSettings());
  };

  const handleImportBackup = (jsonData) => {
    const result = db.importBackup(jsonData);
    if (result.success) {
      setProducts(db.getProducts());
      setPartners(db.getPartners());
      setDispatches(db.getDispatches());
      setFilaments(db.getFilaments());
      setPrinters(db.getPrinters());
      setSettings(db.getSettings());
    }
  };

  // Ação de navegar da calculadora para simular no consignado
  const handleNavigateToConsignment = (price, cost) => {
    setSimulatorPreload({ price, cost });
    setActiveTab('consignment');
  };

  return (
    <div className="app-container">
      {/* Header Fixo com Indicadores e Backup */}
      <Header 
        products={products} 
        dispatches={dispatches} 
        partners={partners}
        onExportBackup={db.exportBackup}
        onOpenSettings={() => setActiveTab('settings')}
      />

      {/* Navegação em Abas Modernas */}
      <Navigation 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        counts={{
          products: products.length,
          dispatches: dispatches.reduce((acc, d) => acc + Math.max(0, (Number(d.quantitySent) || 0) - (Number(d.quantitySold) || 0)), 0),
        }}
      />

      {/* Conteúdo Principal Dinâmico */}
      <main className="main-content">
        {activeTab === 'calculator' && (
          <PrintCostCalculator 
            printers={printers}
            filaments={filaments}
            settings={settings}
            onSaveToCatalog={(newProd) => {
              handleAddProduct(newProd);
              setActiveTab('catalog');
            }}
            onNavigateToConsignment={handleNavigateToConsignment}
          />
        )}

        {activeTab === 'catalog' && (
          <ProductCatalog 
            products={products}
            partners={partners}
            filaments={filaments}
            printers={printers}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onDispatchToPartner={handleAddDispatch}
            onBulkDispatch={handleBulkDispatch}
          />
        )}

        {activeTab === 'consignment' && (
          <ConsignmentManager 
            partners={partners}
            products={products}
            dispatches={dispatches}
            initialSimulatorValues={simulatorPreload}
            onAddPartner={handleAddPartner}
            onUpdatePartner={handleUpdatePartner}
            onDeletePartner={handleDeletePartner}
            onUpdateDispatch={handleUpdateDispatch}
            onDeleteDispatch={handleDeleteDispatch}
            onAddDispatch={handleAddDispatch}
            partnerSales={partnerSales}
            partnerPrices={partnerPrices}
          />
        )}

        {activeTab === 'settings' && (
          <PrintersFilamentsSettings 
            printers={printers}
            filaments={filaments}
            settings={settings}
            onSaveSettings={handleSaveSettings}
            onAddPrinter={handleAddPrinter}
            onDeletePrinter={handleDeletePrinter}
            onAddFilament={handleAddFilament}
            onDeleteFilament={handleDeleteFilament}
            onExportBackup={db.exportBackup}
            onImportBackup={handleImportBackup}
            onResetDemo={handleResetDemo}
          />
        )}
      </main>

      {/* Modal de Autenticação / Cadastro */}
      <AuthModal />
    </div>
  );
}

export function App() {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/loja')) {
    return <StoreApp />;
  }
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;

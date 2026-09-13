import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Package, 
  Clock, 
  Weight, 
  Printer, 
  Layers, 
  Store, 
  Trash2, 
  Edit3, 
  Printer as PrintIcon, 
  ExternalLink,
  Check,
  AlertCircle
} from 'lucide-react';
import { formatCurrency, formatWeight, formatTime } from '../../utils/formatters';
import { ImageUploader } from '../Common/ImageUploader';

export const ProductCatalog = ({ 
  products = [], 
  partners = [], 
  filaments = [], 
  printers = [],
  onAddProduct, 
  onUpdateProduct, 
  onDeleteProduct,
  onDispatchToPartner 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  // Modais
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [isDispatchModalOpen, setIsDispatchModalOpen] = useState(false);
  const [selectedProductForDispatch, setSelectedProductForDispatch] = useState(null);
  const [isPrintSpecModalOpen, setIsPrintSpecModalOpen] = useState(false);
  const [productForSpec, setProductForSpec] = useState(null);

  // Formulário de Remessa para Consignado
  const [dispatchPartnerId, setDispatchPartnerId] = useState(partners[0]?.id || '');
  const [dispatchQuantity, setDispatchQuantity] = useState(3);
  const [dispatchRetailPrice, setDispatchRetailPrice] = useState(0);
  const [dispatchNotes, setDispatchNotes] = useState('');

  // Formulário de Criação/Edição Direta de Produto
  const [editingProductId, setEditingProductId] = useState(null);
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Decoração');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formWeight, setFormWeight] = useState(100);
  const [formHours, setFormHours] = useState(3);
  const [formMinutes, setFormMinutes] = useState(0);
  const [formFilamentName, setFormFilamentName] = useState('PLA Premium');
  const [formCost, setFormCost] = useState(18.00);
  const [formPrice, setFormPrice] = useState(50.00);
  const [formStock, setFormStock] = useState(2);

  // Lista única de categorias
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.category).filter(Boolean));
    return ['Todas', ...Array.from(set)];
  }, [products]);

  // Produtos filtrados
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (p.filamentName && p.filamentName.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchCat = selectedCategory === 'Todas' || p.category === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, selectedCategory]);

  // Alterar estoque rápido (+ / -)
  const handleStockChange = (product, delta) => {
    const newStock = Math.max(0, (product.stock || 0) + delta);
    onUpdateProduct({ ...product, stock: newStock });
  };

  // Abrir modal de envio para consignado
  const openDispatchModal = (prod) => {
    setSelectedProductForDispatch(prod);
    setDispatchPartnerId(partners[0]?.id || '');
    setDispatchQuantity(Math.min(prod.stock || 1, 3) || 1);
    setDispatchRetailPrice(prod.directSalePrice || prod.suggestedPrice || 50);
    setDispatchNotes('Remessa enviada para exposição na loja.');
    setIsDispatchModalOpen(true);
  };

  const handleConfirmDispatch = (e) => {
    e.preventDefault();
    if (!selectedProductForDispatch || !dispatchPartnerId) return;

    const partner = partners.find(p => p.id === dispatchPartnerId);

    onDispatchToPartner({
      id: 'disp-' + Date.now(),
      partnerId: dispatchPartnerId,
      productId: selectedProductForDispatch.id,
      quantitySent: Number(dispatchQuantity),
      quantitySold: 0,
      unitRetailPrice: Number(dispatchRetailPrice),
      commissionPercent: partner?.commissionPercent || 25,
      dateSent: new Date().toISOString(),
      notes: dispatchNotes,
    });

    // Diminui o estoque local disponível
    const remainingStock = Math.max(0, (selectedProductForDispatch.stock || 0) - Number(dispatchQuantity));
    onUpdateProduct({ ...selectedProductForDispatch, stock: remainingStock });

    setIsDispatchModalOpen(false);
  };

  // Salvar formulário de criação/edição
  const handleSaveProductForm = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) return;

    const productPayload = {
      id: editingProductId || 'prod-' + Date.now(),
      title: formTitle.trim(),
      category: formCategory,
      description: formDescription,
      imageUrl: (formImageUrl || '').trim() || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80',
      weightGrams: Number(formWeight) || 0,
      printHours: Number(formHours) || 0,
      printMinutes: Number(formMinutes) || 0,
      filamentName: formFilamentName,
      cost: Number(formCost) || 0,
      suggestedPrice: Number(formPrice) || 0,
      directSalePrice: Number(formPrice) || 0,
      stock: Number(formStock) || 0,
      createdAt: new Date().toISOString(),
    };

    if (editingProductId) {
      onUpdateProduct(productPayload);
    } else {
      onAddProduct(productPayload);
    }

    setIsNewProductModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setEditingProductId(null);
    setFormTitle('');
    setFormCategory('Decoração');
    setFormDescription('');
    setFormImageUrl('');
    setFormWeight(100);
    setFormHours(3);
    setFormMinutes(0);
    setFormCost(18.00);
    setFormPrice(50.00);
    setFormStock(2);
  };

  const openEditModal = (prod) => {
    setEditingProductId(prod.id);
    setFormTitle(prod.title);
    setFormCategory(prod.category || 'Decoração');
    setFormDescription(prod.description || '');
    setFormImageUrl(prod.imageUrl || '');
    setFormWeight(prod.weightGrams || 100);
    setFormHours(prod.printHours || 0);
    setFormMinutes(prod.printMinutes || 0);
    setFormFilamentName(prod.filamentName || 'PLA');
    setFormCost(prod.cost || 20);
    setFormPrice(prod.directSalePrice || prod.suggestedPrice || 50);
    setFormStock(prod.stock || 0);
    setIsNewProductModalOpen(true);
  };

  return (
    <div>
      {/* Barra de Ferramentas / Busca & Filtros */}
      <div className="catalog-toolbar">
        <div className="catalog-search-wrap">
          <div className="input-with-affix" style={{ flex: 1 }}>
            <span className="affix affix-prefix">
              <Search size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Buscar por nome, filamento ou categoria..." 
              className="form-input" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <select 
            className="form-select" 
            style={{ width: 'auto' }}
            value={selectedCategory} 
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        <button 
          className="btn btn-primary" 
          onClick={() => { resetForm(); setIsNewProductModalOpen(true); }}
        >
          <Plus size={16} />
          Cadastrar Nova Peça
        </button>
      </div>

      {/* Grid de Produtos */}
      {filteredProducts.length === 0 ? (
        <div className="glass-card" style={{ padding: '60px 20px', textAlign: 'center' }}>
          <Package size={48} color="var(--text-muted)" style={{ margin: '0 auto 16px' }} />
          <h3>Nenhuma peça encontrada</h3>
          <p style={{ color: 'var(--text-muted)', marginTop: '6px' }}>
            {searchTerm ? 'Tente ajustar os filtros de busca ou categoria.' : 'Cadastre sua primeira peça ou utilize a calculadora para salvar um modelo.'}
          </p>
        </div>
      ) : (
        <div className="product-grid">
          {filteredProducts.map(prod => {
            const hasStock = (prod.stock || 0) > 0;
            const profitVal = (prod.directSalePrice || prod.suggestedPrice || 0) - (prod.cost || 0);
            const marginPct = (prod.directSalePrice || prod.suggestedPrice) > 0 ? (profitVal / (prod.directSalePrice || prod.suggestedPrice)) * 100 : 0;

            return (
              <div key={prod.id} className="product-card">
                <div className="product-thumb-container">
                  <img 
                    src={prod.imageUrl} 
                    alt={prod.title} 
                    className="product-thumb"
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=500&auto=format&fit=crop&q=80';
                    }}
                  />
                  <span className="product-badge-cat">{prod.category}</span>
                  <span className={`product-stock-badge ${hasStock ? 'stock-in' : 'stock-out'}`}>
                    {hasStock ? `${prod.stock} em estoque` : 'Sob encomenda'}
                  </span>
                </div>

                <div className="product-info-wrap">
                  <h4 className="product-title">{prod.title}</h4>
                  <p className="product-desc">{prod.description}</p>

                  <div className="product-metrics-chips">
                    <span className="metric-chip" title="Tempo de impressão">
                      <Clock size={12} />
                      {formatTime((Number(prod.printHours || 0) * 60) + Number(prod.printMinutes || 0))}
                    </span>
                    <span className="metric-chip" title="Peso de filamento">
                      <Weight size={12} />
                      {formatWeight(prod.weightGrams || 0)}
                    </span>
                    <span className="metric-chip" title="Material utilizado">
                      <Layers size={12} />
                      {prod.filamentName || 'PLA'}
                    </span>
                  </div>

                  {/* Controle de Estoque Rápido */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', background: 'rgba(255,255,255,0.03)', padding: '6px 10px', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Pronta Entrega:</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button 
                        className="btn btn-outline btn-sm btn-icon-only" 
                        onClick={() => handleStockChange(prod, -1)}
                        title="Diminuir estoque"
                      >
                        -
                      </button>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, minWidth: '24px', textAlign: 'center' }}>
                        {prod.stock || 0}
                      </span>
                      <button 
                        className="btn btn-outline btn-sm btn-icon-only" 
                        onClick={() => handleStockChange(prod, 1)}
                        title="Aumentar estoque"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  <div className="product-pricing-bar">
                    <div className="product-price-box">
                      <span className="product-price-cost">Custo: {formatCurrency(prod.cost)}</span>
                      <span className="product-price-sell">{formatCurrency(prod.directSalePrice || prod.suggestedPrice)}</span>
                      <span style={{ fontSize: '0.7rem', color: 'var(--emerald-profit)', fontFamily: 'var(--font-mono)' }}>
                        +{formatCurrency(profitVal)} ({marginPct.toFixed(0)}%)
                      </span>
                    </div>

                    <div className="product-actions-bar">
                      <button 
                        className="btn btn-outline btn-sm" 
                        onClick={() => openDispatchModal(prod)}
                        title="Enviar remessa para loja em consignação"
                        style={{ borderColor: 'rgba(139, 92, 246, 0.4)', color: 'var(--purple-vibrant)' }}
                      >
                        <Store size={14} />
                        Consignar
                      </button>

                      <button 
                        className="btn btn-outline btn-sm btn-icon-only" 
                        onClick={() => { setProductForSpec(prod); setIsPrintSpecModalOpen(true); }}
                        title="Ver Ficha Técnica"
                      >
                        <PrintIcon size={14} />
                      </button>

                      <button 
                        className="btn btn-outline btn-sm btn-icon-only" 
                        onClick={() => openEditModal(prod)}
                        title="Editar peça"
                      >
                        <Edit3 size={14} />
                      </button>

                      <button 
                        className="btn btn-outline btn-sm btn-icon-only btn-danger" 
                        onClick={() => {
                          if (confirm(`Deseja remover "${prod.title}" do catálogo?`)) {
                            onDeleteProduct(prod.id);
                          }
                        }}
                        title="Excluir produto"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Enviar para Loja Consignada */}
      {isDispatchModalOpen && selectedProductForDispatch && (
        <div className="modal-overlay" onClick={() => setIsDispatchModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Store size={20} color="var(--purple-vibrant)" />
                Enviar Peça para Loja Consignada
              </h3>
              <button 
                className="btn btn-outline btn-sm btn-icon-only" 
                onClick={() => setIsDispatchModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleConfirmDispatch}>
              <div className="modal-body">
                <div style={{ background: 'rgba(139, 92, 246, 0.1)', border: '1px solid rgba(139, 92, 246, 0.25)', padding: '12px 16px', borderRadius: 'var(--border-radius-md)', marginBottom: '16px' }}>
                  <div style={{ fontWeight: 700, color: '#fff' }}>{selectedProductForDispatch.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    Custo unitário: {formatCurrency(selectedProductForDispatch.cost)} | Estoque atual no ateliê: {selectedProductForDispatch.stock} un
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Loja / Ponto de Consignação Parceiro</label>
                  <select 
                    className="form-select" 
                    value={dispatchPartnerId} 
                    onChange={(e) => setDispatchPartnerId(e.target.value)}
                    required
                  >
                    {partners.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} (Comissão acordada: {p.commissionPercent}%)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Quantidade Enviada</label>
                    <input 
                      type="number" 
                      min="1" 
                      max={Math.max(1, selectedProductForDispatch.stock || 10)}
                      className="form-input form-input-mono" 
                      value={dispatchQuantity} 
                      onChange={(e) => setDispatchQuantity(e.target.value === '' ? '' : e.target.value)}
                      onBlur={() => { if (dispatchQuantity === '') setDispatchQuantity(1); }}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preço Final na Vitrine da Loja</label>
                    <div className="input-with-affix">
                      <span className="affix affix-prefix">R$</span>
                      <input 
                        type="number" 
                        step="0.5"
                        min="1" 
                        className="form-input form-input-mono" 
                        value={dispatchRetailPrice} 
                        onChange={(e) => setDispatchRetailPrice(e.target.value === '' ? '' : e.target.value)}
                        onBlur={() => { if (dispatchRetailPrice === '') setDispatchRetailPrice(0); }}
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Previsão de Repasse */}
                {(() => {
                  const partner = partners.find(p => p.id === dispatchPartnerId);
                  const commPct = partner?.commissionPercent || 25;
                  const storeCut = Number(dispatchRetailPrice) * (commPct / 100);
                  const makerPayout = Number(dispatchRetailPrice) - storeCut;
                  const netProfit = makerPayout - (selectedProductForDispatch.cost || 0);

                  return (
                    <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: 'var(--border-radius-md)', border: '1px solid var(--border-subtle)', marginTop: '8px' }}>
                      <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
                        Simulação do Acerto por Unidade Vendida:
                      </div>
                      <div className="grid-3" style={{ textAlign: 'center' }}>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Loja retém ({commPct}%)</div>
                          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--amber-warning)', fontWeight: 700 }}>
                            {formatCurrency(storeCut)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Você recebe (Repasse)</div>
                          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--cyan-neon)', fontWeight: 700 }}>
                            {formatCurrency(makerPayout)}
                          </div>
                        </div>
                        <div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Seu Lucro Líquido</div>
                          <div style={{ fontFamily: 'var(--font-mono)', color: 'var(--emerald-profit)', fontWeight: 700 }}>
                            {formatCurrency(netProfit)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                <div className="form-group" style={{ marginTop: '14px' }}>
                  <label className="form-label">Observações / Romaneio</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Ex: Peça em expositor de acrílico com tag de preço..."
                    value={dispatchNotes} 
                    onChange={(e) => setDispatchNotes(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsDispatchModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary" style={{ background: 'var(--grad-primary)' }}>
                  <Check size={16} />
                  Confirmar Envio Consignado
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo / Editar Produto */}
      {isNewProductModalOpen && (
        <div className="modal-overlay" onClick={() => setIsNewProductModalOpen(false)}>
          <div className="modal-dialog modal-dialog-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {editingProductId ? 'Editar Peça' : 'Cadastrar Nova Peça no Catálogo'}
              </h3>
              <button 
                className="btn btn-outline btn-sm btn-icon-only" 
                onClick={() => setIsNewProductModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveProductForm}>
              <div className="modal-body">
                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Título da Peça</label>
                    <input 
                      type="text" 
                      required 
                      className="form-input" 
                      placeholder="Ex: Luminária Lua 3D" 
                      value={formTitle} 
                      onChange={(e) => setFormTitle(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Categoria</label>
                    <select 
                      className="form-select" 
                      value={formCategory} 
                      onChange={(e) => setFormCategory(e.target.value)}
                    >
                      <option value="Decoração">Decoração</option>
                      <option value="Colecionáveis">Colecionáveis & Action Figures</option>
                      <option value="Setup & Games">Setup & Games</option>
                      <option value="Utilitários">Utilitários & Casa</option>
                      <option value="Brinquedos">Brinquedos & Fidgets</option>
                      <option value="Acessórios">Acessórios & Joias</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Descrição Curta</label>
                  <textarea 
                    className="form-textarea" 
                    placeholder="Descreva detalhes, acabamento ou função da peça..."
                    value={formDescription} 
                    onChange={(e) => setFormDescription(e.target.value)}
                  />
                </div>

                <ImageUploader 
                  value={formImageUrl} 
                  onChange={setFormImageUrl} 
                  label="Foto da Peça / Produto" 
                  hint="Envie uma foto do seu dispositivo ou use um link externo. A imagem é otimizada e funciona offline."
                />

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Peso Gasto (g)</label>
                    <input 
                      type="number" 
                      min="1" 
                      className="form-input form-input-mono" 
                      value={formWeight} 
                      onChange={(e) => setFormWeight(e.target.value === '' ? '' : e.target.value)}
                      onBlur={() => { if (formWeight === '') setFormWeight(0); }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Horas de Máquina</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="form-input form-input-mono" 
                      value={formHours} 
                      onChange={(e) => setFormHours(e.target.value === '' ? '' : e.target.value)}
                      onBlur={() => { if (formHours === '') setFormHours(0); }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Filamento / Material</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: PLA Preto, PETG..."
                      value={formFilamentName} 
                      onChange={(e) => setFormFilamentName(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-3">
                  <div className="form-group">
                    <label className="form-label">Custo de Fabricação (R$)</label>
                    <input 
                      type="number" 
                      step="0.1" 
                      className="form-input form-input-mono" 
                      value={formCost} 
                      onChange={(e) => setFormCost(e.target.value === '' ? '' : e.target.value)}
                      onBlur={() => { if (formCost === '') setFormCost(0); }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preço de Venda Direta (R$)</label>
                    <input 
                      type="number" 
                      step="0.5" 
                      className="form-input form-input-mono" 
                      value={formPrice} 
                      onChange={(e) => setFormPrice(e.target.value === '' ? '' : e.target.value)}
                      onBlur={() => { if (formPrice === '') setFormPrice(0); }}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Estoque Disponível (un)</label>
                    <input 
                      type="number" 
                      min="0" 
                      className="form-input form-input-mono" 
                      value={formStock} 
                      onChange={(e) => setFormStock(e.target.value === '' ? '' : e.target.value)}
                      onBlur={() => { if (formStock === '') setFormStock(0); }}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-outline" 
                  onClick={() => setIsNewProductModalOpen(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={16} />
                  Salvar Peça
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Ficha Técnica para Impressão */}
      {isPrintSpecModalOpen && productForSpec && (
        <div className="modal-overlay" onClick={() => setIsPrintSpecModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Ficha Técnica & Etiqueta de Produto</h3>
              <button 
                className="btn btn-outline btn-sm btn-icon-only no-print" 
                onClick={() => setIsPrintSpecModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ padding: '28px' }}>
              <div style={{ textAlign: 'center', borderBottom: '2px solid #334155', paddingBottom: '16px', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{productForSpec.title}</h2>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Categoria: {productForSpec.category} | Código: #{productForSpec.id.slice(-6).toUpperCase()}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: '20px', alignItems: 'center', marginBottom: '24px' }}>
                <img 
                  src={productForSpec.imageUrl} 
                  alt={productForSpec.title} 
                  style={{ width: '120px', height: '120px', objectFit: 'cover', borderRadius: '12px', border: '1px solid var(--border-subtle)' }} 
                />
                <div>
                  <p style={{ fontSize: '0.9rem', marginBottom: '8px' }}>{productForSpec.description}</p>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    <div>• Material: <strong>{productForSpec.filamentName || 'PLA'}</strong></div>
                    <div>• Peso da Peça: <strong>{formatWeight(productForSpec.weightGrams)}</strong></div>
                    <div>• Tempo de Produção: <strong>{formatTime((Number(productForSpec.printHours || 0) * 60) + Number(productForSpec.printMinutes || 0))}</strong></div>
                  </div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', padding: '16px', borderRadius: '12px', textAlign: 'center' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                  Preço Sugerido ao Consumidor
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, fontFamily: 'var(--font-mono)', color: 'var(--emerald-profit)', marginTop: '4px' }}>
                  {formatCurrency(productForSpec.directSalePrice || productForSpec.suggestedPrice)}
                </div>
              </div>
            </div>

            <div className="modal-footer no-print">
              <button className="btn btn-outline" onClick={() => setIsPrintSpecModalOpen(false)}>
                Fechar
              </button>
              <button className="btn btn-primary" onClick={() => window.print()}>
                <PrintIcon size={16} />
                Imprimir Ficha
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

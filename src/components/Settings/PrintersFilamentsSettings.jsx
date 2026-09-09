import React, { useState } from 'react';
import { 
  Printer, 
  Layers, 
  Settings as SettingsIcon, 
  Plus, 
  Trash2, 
  Save, 
  Download, 
  Upload, 
  RotateCcw,
  Zap,
  Clock,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { formatCurrency, formatWeight } from '../../utils/formatters';

export const PrintersFilamentsSettings = ({ 
  printers = [], 
  filaments = [], 
  settings = {}, 
  onSaveSettings, 
  onAddPrinter, 
  onDeletePrinter,
  onAddFilament, 
  onDeleteFilament,
  onExportBackup,
  onImportBackup,
  onResetDemo
}) => {
  // Configurações gerais
  const [localSettings, setLocalSettings] = useState({ ...settings });
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Modal de Nova Impressora
  const [isPrinterModalOpen, setIsPrinterModalOpen] = useState(false);
  const [pName, setPName] = useState('');
  const [pWatts, setPWatts] = useState(250);
  const [pPrice, setPPrice] = useState(2200);
  const [pLifespan, setPLifespan] = useState(4000);
  const [pMaintenance, setPMaintenance] = useState(0.50);

  // Modal de Novo Filamento
  const [isFilamentModalOpen, setIsFilamentModalOpen] = useState(false);
  const [fName, setFName] = useState('');
  const [fBrand, setFBrand] = useState('Voolt3D');
  const [fMaterial, setFMaterial] = useState('PLA');
  const [fWeight, setFWeight] = useState(1000);
  const [fPrice, setFPrice] = useState(95.00);

  const handleSettingsSubmit = (e) => {
    e.preventDefault();
    onSaveSettings(localSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleCreatePrinter = (e) => {
    e.preventDefault();
    if (!pName.trim()) return;

    onAddPrinter({
      id: 'prt-' + Date.now(),
      name: pName.trim(),
      watts: Number(pWatts) || 250,
      price: Number(pPrice) || 2000,
      lifespanHours: Number(pLifespan) || 4000,
      maintenancePerHour: Number(pMaintenance) || 0.50,
    });

    setIsPrinterModalOpen(false);
    setPName('');
  };

  const handleCreateFilament = (e) => {
    e.preventDefault();
    if (!fName.trim()) return;

    onAddFilament({
      id: 'fil-' + Date.now(),
      name: fName.trim(),
      brand: fBrand.trim(),
      material: fMaterial.trim(),
      spoolWeight: Number(fWeight) || 1000,
      price: Number(fPrice) || 95.00,
    });

    setIsFilamentModalOpen(false);
    setFName('');
  };

  const handleFileInput = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result);
        onImportBackup(json);
        alert('Backup importado com sucesso!');
      } catch (err) {
        alert('Arquivo JSON inválido: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Bloco 1: Parâmetros Globais de Custos */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-header-left">
            <SettingsIcon size={18} color="var(--cyan-neon)" />
            <div>
              <h3 className="card-title">Parâmetros Globais de Precificação</h3>
              <p className="card-subtitle">Valores padrão aplicados automaticamente em todos os novos cálculos</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSettingsSubmit}>
          <div className="card-body">
            <div className="grid-3">
              <div className="form-group">
                <label className="form-label">
                  Tarifa de Energia Elétrica
                  <span className="form-label-hint">R$/kWh</span>
                </label>
                <div className="input-with-affix">
                  <span className="affix affix-prefix">R$</span>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0.1"
                    className="form-input form-input-mono"
                    value={localSettings.energyKwhRate || 0.85}
                    onChange={(e) => setLocalSettings({ ...localSettings, energyKwhRate: Number(e.target.value) })}
                  />
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
                    step="1" 
                    min="0"
                    className="form-input form-input-mono"
                    value={localSettings.laborHourlyRate || 25.00}
                    onChange={(e) => setLocalSettings({ ...localSettings, laborHourlyRate: Number(e.target.value) })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">
                  Margem Padrão de Falhas de Impressão
                  <span className="form-label-hint">%</span>
                </label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    step="1" 
                    min="0"
                    max="50"
                    className="form-input form-input-mono"
                    value={localSettings.failureMarginDefault || 10}
                    onChange={(e) => setLocalSettings({ ...localSettings, failureMarginDefault: Number(e.target.value) })}
                  />
                  <span className="affix">%</span>
                </div>
              </div>
            </div>

            <div className="grid-3" style={{ marginTop: '10px' }}>
              <div className="form-group">
                <label className="form-label">Tempo Médio Prep/Fatiamento</label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="0"
                    className="form-input form-input-mono"
                    value={localSettings.prepMinutesDefault || 10}
                    onChange={(e) => setLocalSettings({ ...localSettings, prepMinutesDefault: Number(e.target.value) })}
                  />
                  <span className="affix">min</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Tempo Médio Pós-Processo/Acabamento</label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="0"
                    className="form-input form-input-mono"
                    value={localSettings.postMinutesDefault || 15}
                    onChange={(e) => setLocalSettings({ ...localSettings, postMinutesDefault: Number(e.target.value) })}
                  />
                  <span className="affix">min</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Margem de Lucro Padrão (Markup)</label>
                <div className="input-with-affix">
                  <input 
                    type="number" 
                    min="10"
                    max="500"
                    className="form-input form-input-mono"
                    value={localSettings.markupDefault || 100}
                    onChange={(e) => setLocalSettings({ ...localSettings, markupDefault: Number(e.target.value) })}
                  />
                  <span className="affix">%</span>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '16px', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '12px' }}>
              {saveSuccess && (
                <span style={{ color: 'var(--emerald-profit)', fontSize: '0.85rem', fontWeight: 600 }}>
                  ✓ Configurações salvas com sucesso!
                </span>
              )}
              <button type="submit" className="btn btn-primary">
                <Save size={16} />
                Salvar Parâmetros Globais
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Bloco 2: Gestão de Impressoras 3D */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-header-left">
            <Printer size={18} color="var(--blue-bright)" />
            <div>
              <h3 className="card-title">Minhas Impressoras 3D</h3>
              <p className="card-subtitle">Cadastre suas máquinas para cálculo preciso de consumo elétrico e depreciação</p>
            </div>
          </div>

          <button className="btn btn-outline btn-sm" onClick={() => setIsPrinterModalOpen(true)}>
            <Plus size={14} />
            Adicionar Impressora
          </button>
        </div>

        <div className="card-body">
          <div className="grid-3">
            {printers.map(p => (
              <div key={p.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius-md)', padding: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{p.name}</h4>
                  <button 
                    className="btn btn-outline btn-sm btn-icon-only btn-danger"
                    onClick={() => {
                      if (confirm(`Remover impressora "${p.name}"?`)) onDeletePrinter(p.id);
                    }}
                  >
                    <Trash2 size={12} />
                  </button>
                </div>

                <div style={{ marginTop: '10px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <div>⚡ Potência: <strong style={{ color: 'var(--cyan-neon)' }}>{p.watts}W</strong></div>
                  <div>💰 Valor de Compra: <strong>{formatCurrency(p.price)}</strong></div>
                  <div>⏳ Vida Útil: <strong>{p.lifespanHours} horas</strong></div>
                  <div>🔧 Custo Manutenção: <strong>{formatCurrency(p.maintenancePerHour)}/h</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bloco 3: Gestão de Filamentos & Materiais */}
      <div className="glass-card">
        <div className="card-header">
          <div className="card-header-left">
            <Layers size={18} color="var(--purple-vibrant)" />
            <div>
              <h3 className="card-title">Estoque de Filamentos & Materiais</h3>
              <p className="card-subtitle">Carretéis cadastrados para puxar o preço por grama instantaneamente na calculadora</p>
            </div>
          </div>

          <button className="btn btn-outline btn-sm" onClick={() => setIsFilamentModalOpen(true)}>
            <Plus size={14} />
            Adicionar Filamento
          </button>
        </div>

        <div className="card-body">
          <div className="grid-3">
            {filaments.map(f => {
              const costPerGram = f.spoolWeight > 0 ? (f.price / f.spoolWeight) : 0;

              return (
                <div key={f.id} style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--border-radius-md)', padding: '16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <h4 style={{ fontWeight: 700, fontSize: '0.95rem' }}>{f.name}</h4>
                      <span className="badge badge-purple" style={{ marginTop: '4px' }}>{f.material} ({f.brand})</span>
                    </div>
                    <button 
                      className="btn btn-outline btn-sm btn-icon-only btn-danger"
                      onClick={() => {
                        if (confirm(`Remover filamento "${f.name}"?`)) onDeleteFilament(f.id);
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>

                  <div style={{ marginTop: '12px', fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div>📦 Peso do Carretel: <strong>{formatWeight(f.spoolWeight)}</strong></div>
                    <div>💵 Preço do Carretel: <strong>{formatCurrency(f.price)}</strong></div>
                    <div style={{ color: 'var(--emerald-profit)', fontWeight: 700 }}>
                      🎯 Custo por grama: {formatCurrency(costPerGram)}/g
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Bloco 4: Backup, Importação e Reset */}
      <div className="glass-card" style={{ borderColor: 'rgba(245, 158, 11, 0.3)' }}>
        <div className="card-header">
          <div className="card-header-left">
            <Download size={18} color="var(--amber-warning)" />
            <div>
              <h3 className="card-title">Segurança de Dados & Backup</h3>
              <p className="card-subtitle">Exporte todos os seus produtos, cálculos e lojas consignadas em arquivo seguro</p>
            </div>
          </div>
        </div>

        <div className="card-body">
          <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={onExportBackup}>
              <Download size={16} />
              Baixar Backup Completo (.JSON)
            </button>

            <label className="btn btn-outline" style={{ cursor: 'pointer' }}>
              <Upload size={16} />
              Restaurar de Arquivo JSON
              <input 
                type="file" 
                accept=".json" 
                onChange={handleFileInput} 
                style={{ display: 'none' }} 
              />
            </label>

            <button 
              className="btn btn-outline btn-danger" 
              onClick={() => {
                if (confirm('Atenção: Isso restaurará todos os dados para os exemplos iniciais. Deseja continuar?')) {
                  onResetDemo();
                }
              }}
            >
              <RotateCcw size={16} />
              Restaurar Dados Padrão (Demonstração)
            </button>
          </div>
        </div>
      </div>

      {/* Modal: Nova Impressora */}
      {isPrinterModalOpen && (
        <div className="modal-overlay" onClick={() => setIsPrinterModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar Impressora 3D</h3>
              <button className="btn btn-outline btn-sm btn-icon-only" onClick={() => setIsPrinterModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreatePrinter}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Modelo / Nome da Impressora</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="Ex: Bambu Lab A1 Mini, Creality K1, Voron 2.4..."
                    value={pName} 
                    onChange={(e) => setPName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Potência Média (Watts)</label>
                    <input 
                      type="number" 
                      min="50" 
                      max="1500" 
                      required 
                      className="form-input form-input-mono"
                      value={pWatts} 
                      onChange={(e) => setPWatts(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Valor Pago de Aquisição (R$)</label>
                    <input 
                      type="number" 
                      min="100" 
                      required 
                      className="form-input form-input-mono"
                      value={pPrice} 
                      onChange={(e) => setPPrice(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Vida Útil Estimada (Horas)</label>
                    <input 
                      type="number" 
                      min="500" 
                      className="form-input form-input-mono"
                      value={pLifespan} 
                      onChange={(e) => setPLifespan(e.target.value)}
                    />
                    <span className="form-label-hint">Geralmente 3.000h a 5.000h</span>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Custo Manutenção/Bicos por Hora (R$)</label>
                    <input 
                      type="number" 
                      step="0.05"
                      min="0" 
                      className="form-input form-input-mono"
                      value={pMaintenance} 
                      onChange={(e) => setPMaintenance(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsPrinterModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Impressora</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Novo Filamento */}
      {isFilamentModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFilamentModalOpen(false)}>
          <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">Cadastrar Novo Filamento</h3>
              <button className="btn btn-outline btn-sm btn-icon-only" onClick={() => setIsFilamentModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateFilament}>
              <div className="modal-body">
                <div className="form-group">
                  <label className="form-label">Nome de Identificação</label>
                  <input 
                    type="text" 
                    required 
                    className="form-input" 
                    placeholder="Ex: PLA Vermelho Rubi, PETG Preto..."
                    value={fName} 
                    onChange={(e) => setFName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Marca / Fabricante</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      placeholder="Ex: Voolt3D, 3D Fila, Creality..."
                      value={fBrand} 
                      onChange={(e) => setFBrand(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Material</label>
                    <select 
                      className="form-select" 
                      value={fMaterial} 
                      onChange={(e) => setFMaterial(e.target.value)}
                    >
                      <option value="PLA">PLA</option>
                      <option value="PLA Silk">PLA Silk (Seda)</option>
                      <option value="PETG">PETG</option>
                      <option value="ABS">ABS</option>
                      <option value="ASA">ASA</option>
                      <option value="TPU">TPU (Flexível)</option>
                      <option value="Resina">Resina UV</option>
                      <option value="Nylon">Nylon / PA-CF</option>
                    </select>
                  </div>
                </div>

                <div className="grid-2">
                  <div className="form-group">
                    <label className="form-label">Peso do Carretel (gramas)</label>
                    <input 
                      type="number" 
                      min="250" 
                      step="50"
                      className="form-input form-input-mono"
                      value={fWeight} 
                      onChange={(e) => setFWeight(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Preço Pago no Carretel (R$)</label>
                    <input 
                      type="number" 
                      min="10" 
                      step="0.5"
                      className="form-input form-input-mono"
                      value={fPrice} 
                      onChange={(e) => setFPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-outline" onClick={() => setIsFilamentModalOpen(false)}>Cancelar</button>
                <button type="submit" className="btn btn-primary">Salvar Filamento</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

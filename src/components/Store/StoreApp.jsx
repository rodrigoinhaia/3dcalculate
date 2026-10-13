import React, { useEffect, useMemo, useState } from 'react';
import { formatCurrency } from '../../utils/formatters';

const TOKEN_KEY = '3dcalc_partner_token';
const PARTNER_KEY = '3dcalc_partner_profile';
const PAYMENTS = [
  { id: 'dinheiro', label: 'Dinheiro' },
  { id: 'pix', label: 'Pix' },
  { id: 'debito', label: 'Cartão de débito' },
  { id: 'credito', label: 'Cartão de crédito' },
];

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${localStorage.getItem(TOKEN_KEY)}`,
  };
}

function quoteLine(row, mode, markupPercent, markupAmount) {
  const seller = Number(row.sellerPrice) || 0;
  const percent = Number(row.commissionPercent) || 0;
  const added = row.commissionMode === 'added';
  let shelf = seller;
  if (mode === 'markup') shelf = seller * (1 + (Number(markupPercent) || 0) / 100);
  if (mode === 'amount') shelf = seller + (Number(markupAmount) || 0);
  shelf = Math.round(shelf * 100) / 100;
  const maker = added && percent > 0 ? seller / (1 + percent / 100) : seller * (1 - percent / 100);
  const storeGain = Math.max(0, shelf - maker);
  const marginPercent = shelf > 0 ? (storeGain / shelf) * 100 : 0;
  return { shelf, maker, storeGain, marginPercent };
}

function groupByProduct(items) {
  const map = new Map();
  for (const item of items) {
    const current = map.get(item.productId);
    if (!current) {
      map.set(item.productId, { ...item, available: Number(item.available) || 0 });
    } else {
      current.available += Number(item.available) || 0;
    }
  }
  return [...map.values()];
}

export function StoreApp() {
  const [partner, setPartner] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(PARTNER_KEY) || 'null');
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [screen, setScreen] = useState('pdv');
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({});
  const [payment, setPayment] = useState('pix');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');

  const priceRows = useMemo(() => groupByProduct(items), [items]);

  async function loadCatalog() {
    const res = await fetch('/api/partner/catalog', { headers: authHeaders() });
    if (res.status === 401) {
      logout();
      return;
    }
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Falha ao carregar o catálogo.');
    setItems(data.items || []);
    if (data.partnerName) {
      const next = { ...(partner || {}), name: data.partnerName };
      setPartner(next);
      localStorage.setItem(PARTNER_KEY, JSON.stringify(next));
    }
  }

  useEffect(() => {
    if (!token) return;
    loadCatalog().catch((err) => setError(err.message));
  }, [token]);

  function logout() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(PARTNER_KEY);
    setToken(null);
    setPartner(null);
    setItems([]);
    setCart({});
  }

  async function handleLogin(e) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const res = await fetch('/api/partner/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível entrar.');
      localStorage.setItem(TOKEN_KEY, data.token);
      localStorage.setItem(PARTNER_KEY, JSON.stringify(data.partner));
      setPartner(data.partner);
      setToken(data.token);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function savePrice(row, mode, markupPercent, markupAmount) {
    setError('');
    try {
    const res = await fetch('/api/partner/prices', {
      method: 'PUT',
      headers: authHeaders(),
      body: JSON.stringify({ productId: row.productId, mode, markupPercent, markupAmount }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Não foi possível salvar o preço.');
    await loadCatalog();
    } catch (err) {
      setError(err.message);
    }
  }

  function addToCart(item) {
    setCart((current) => {
      const qty = current[item.dispatchId]?.quantity || 0;
      if (qty >= item.available) return current;
      return {
        ...current,
        [item.dispatchId]: { ...item, quantity: qty + 1 },
      };
    });
  }

  function changeQty(dispatchId, next) {
    setCart((current) => {
      const line = current[dispatchId];
      if (!line) return current;
      if (next <= 0) {
        const copy = { ...current };
        delete copy[dispatchId];
        return copy;
      }
      return {
        ...current,
        [dispatchId]: { ...line, quantity: Math.min(next, line.available) },
      };
    });
  }

  const cartLines = Object.values(cart);
  const cartTotal = cartLines.reduce((sum, line) => sum + line.quantity * Number(line.shelfPrice), 0);

  async function checkout() {
    if (cartLines.length === 0) return;
    setBusy(true);
    setError('');
    setNotice('');
    try {
      const res = await fetch('/api/partner/sales', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          paymentMethod: payment,
          items: cartLines.map((line) => ({ dispatchId: line.dispatchId, quantity: line.quantity })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Não foi possível registrar a venda.');
      setCart({});
      setNotice('Venda registrada.');
      await loadCatalog();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <div className="app-container">
        <main className="main-content" style={{ maxWidth: 420, margin: '48px auto' }}>
          <div className="glass-card" style={{ padding: 24 }}>
            <h1 style={{ fontSize: '1.4rem', marginBottom: 8 }}>Loja parceira</h1>
            <p style={{ color: 'var(--text-muted)', marginBottom: 16 }}>
              Entre para ver o estoque consignado e registrar vendas.
            </p>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input className="form-input" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input className="form-input" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              {error && <p style={{ color: 'var(--rose-danger)', marginBottom: 12 }}>{error}</p>}
              <button className="btn btn-primary" type="submit" disabled={busy}>Entrar</button>
            </form>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="app-container">
      <header className="app-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 24px' }}>
        <div>
          <strong>{partner?.name || 'Loja parceira'}</strong>
          <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Consignado</div>
        </div>
        <button className="btn btn-outline btn-sm" type="button" onClick={logout}>Sair</button>
      </header>
      <div style={{ display: 'flex', gap: 8, padding: '0 24px 12px' }}>
        <button type="button" className={`btn ${screen === 'prices' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setScreen('prices')}>Preços</button>
        <button type="button" className={`btn ${screen === 'pdv' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setScreen('pdv')}>PDV</button>
      </div>
      <main className="main-content">
        {error && <p style={{ color: 'var(--rose-danger)', marginBottom: 12 }}>{error}</p>}
        {notice && <p style={{ color: 'var(--emerald-profit)', marginBottom: 12 }}>{notice}</p>}

        {screen === 'prices' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <StoreDashboard rows={items} />
            {priceRows.length === 0 && <p style={{ color: '#f8fafc' }}>Nenhum produto consignado nesta loja.</p>}
            {priceRows.map((row) => (
              <PriceCard key={row.productId} row={row} onSave={savePrice} />
            ))}
          </div>
        )}

        {screen === 'pdv' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 320px', gap: 16 }}>
            <div className="store-product-grid">
              {items.length === 0 && <p>Nenhum produto disponível para venda.</p>}
              {items.map((item) => (
                <button
                  key={item.dispatchId}
                  type="button"
                  className="glass-card store-product-card"
                  onClick={() => addToCart(item)}
                >
                  {item.imageUrl
                    ? <img className="store-product-photo" src={item.imageUrl} alt={item.title} />
                    : <div className="store-product-photo" />}
                  <strong style={{ display: 'block', color: '#f8fafc', lineHeight: 1.3 }}>{item.title}</strong>
                  <div style={{ color: '#f8fafc', marginTop: 4 }}>{formatCurrency(item.shelfPrice)}</div>
                  <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{item.available} em estoque</div>
                </button>
              ))}
            </div>
            <aside className="glass-card" style={{ padding: 16, alignSelf: 'start', color: '#f8fafc' }}>
              <h2 style={{ fontSize: '1.1rem', marginBottom: 12, color: '#f8fafc' }}>Venda</h2>
              {cartLines.length === 0 && <p style={{ color: '#cbd5e1' }}>Toque em um produto para incluir.</p>}
              {cartLines.map((line) => (
                <div key={line.dispatchId} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 10, alignItems: 'center' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ color: '#f8fafc' }}>{line.title}</div>
                    <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>{formatCurrency(line.quantity * line.shelfPrice)}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => changeQty(line.dispatchId, line.quantity - 1)}>−</button>
                    <span>{line.quantity}</span>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => changeQty(line.dispatchId, line.quantity + 1)} disabled={line.quantity >= line.available}>+</button>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => changeQty(line.dispatchId, 0)}>Remover</button>
                  </div>
                </div>
              ))}
              <div style={{ fontWeight: 700, margin: '12px 0' }}>Total {formatCurrency(cartTotal)}</div>
              <div className="form-group">
                <label className="form-label">Forma de pagamento</label>
                <select className="form-select" value={payment} onChange={(e) => setPayment(e.target.value)}>
                  {PAYMENTS.map((option) => (
                    <option key={option.id} value={option.id}>{option.label}</option>
                  ))}
                </select>
              </div>
              <button className="btn btn-success" type="button" disabled={busy || cartLines.length === 0} onClick={checkout}>
                Registrar venda
              </button>
            </aside>
          </div>
        )}
      </main>
    </div>
  );
}

function StoreDashboard({ rows }) {
  const summary = rows.reduce((acc, row) => {
    const quote = quoteLine(row, row.priceMode, row.markupPercent, row.markupAmount);
    acc.units += Number(row.available) || 0;
    acc.gain += quote.storeGain * (Number(row.available) || 0);
    return acc;
  }, { units: 0, gain: 0 });

  return (
    <div className="glass-card" style={{ padding: 16, color: '#f8fafc', display: 'flex', gap: 24, flexWrap: 'wrap' }}>
      <div>
        <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Peças na loja</div>
        <strong>{summary.units}</strong>
      </div>
      <div>
        <div style={{ color: '#cbd5e1', fontSize: '0.8rem' }}>Sua margem se vender o estoque</div>
        <strong style={{ color: '#34d399' }}>{formatCurrency(summary.gain)}</strong>
      </div>
    </div>
  );
}

function PriceCard({ row, onSave }) {
  const [mode, setMode] = useState(row.priceMode === 'amount' || row.priceMode === 'markup' ? row.priceMode : 'seller');
  const [markup, setMarkup] = useState(row.markupPercent || 0);
  const [amount, setAmount] = useState(row.markupAmount || 0);
  const [saving, setSaving] = useState(false);
  const quote = quoteLine(row, mode, markup, amount);

  return (
    <div className="glass-card store-price-card">
      {row.imageUrl
        ? <img className="store-product-photo" src={row.imageUrl} alt={row.title} />
        : <div className="store-product-photo" />}
      <div>
      <strong style={{ color: '#f8fafc' }}>{row.title}</strong>
      <p style={{ color: '#cbd5e1', margin: '8px 0' }}>
        Preço do vendedor: {formatCurrency(row.sellerPrice)} · {row.available} un
      </p>
      <label style={{ display: 'block', marginBottom: 6 }}>
        <input type="radio" checked={mode === 'seller'} onChange={() => setMode('seller')} /> Vender pelo preço do vendedor
      </label>
      <label style={{ display: 'block', marginBottom: 8 }}>
        <input type="radio" checked={mode === 'markup'} onChange={() => setMode('markup')} /> Acrescentar margem (%)
      </label>
      <label style={{ display: 'block', marginBottom: 8 }}>
        <input type="radio" checked={mode === 'amount'} onChange={() => setMode('amount')} /> Acrescentar um valor (R$)
      </label>
      {mode === 'markup' && (
        <div className="form-group">
          <label className="form-label">Margem (%)</label>
          <input className="form-input" type="number" min="0" max="500" value={markup} onChange={(e) => setMarkup(e.target.value)} />
        </div>
      )}
      {mode === 'amount' && (
        <div className="form-group">
          <label className="form-label">Valor a mais (R$)</label>
          <input className="form-input" type="number" min="0" step="0.5" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </div>
      )}
      <p style={{ marginBottom: 4, color: '#f8fafc' }}>Preço de prateleira: <strong>{formatCurrency(quote.shelf)}</strong></p>
      <p style={{ marginBottom: 4, color: '#cbd5e1' }}>Repasse de quem consignou: {formatCurrency(quote.maker)} · não muda com a sua margem</p>
      <p style={{ marginBottom: 12, color: '#34d399' }}>Sua margem neste produto: {formatCurrency(quote.storeGain)} ({quote.marginPercent.toFixed(0)}%)</p>
      <button
        className="btn btn-primary btn-sm"
        type="button"
        disabled={saving}
        onClick={async () => {
          setSaving(true);
          try {
            await onSave(row, mode, markup, amount);
          } finally {
            setSaving(false);
          }
        }}
      >
        Salvar preço
      </button>
      </div>
    </div>
  );
}

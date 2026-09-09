/**
 * Utilitários de Formatação para Moeda, Pesos e Tempo
 */

// Formata valores numéricos para Real Brasileiro (R$ 0,00)
export const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

// Formata gramas (ex: 120g ou 1.25kg)
export const formatWeight = (grams) => {
  const g = Number(grams) || 0;
  if (g >= 1000) {
    return `${(g / 1000).toFixed(2).replace('.', ',')} kg`;
  }
  return `${g.toFixed(0)} g`;
};

// Formata tempo em horas e minutos (ex: 4h 30m)
export const formatTime = (totalMinutes) => {
  const mins = Math.round(Number(totalMinutes) || 0);
  const hours = Math.floor(mins / 60);
  const remainingMins = mins % 60;

  if (hours === 0) {
    return `${remainingMins}m`;
  }
  if (remainingMins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMins}m`;
};

// Formata porcentagem (ex: 25%)
export const formatPercent = (value, decimals = 0) => {
  const num = Number(value) || 0;
  return `${num.toFixed(decimals).replace('.', ',')}%`;
};

// Formata data amigável (ex: 08/09/2026)
export const formatDate = (isoString) => {
  if (!isoString) return '-';
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  } catch (e) {
    return isoString;
  }
};

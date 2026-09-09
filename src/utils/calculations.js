/**
 * Mecanismo de Cálculo de Custos de Impressão 3D e Margens de Consignação
 */

export const calculatePrintCost = (params) => {
  const {
    weightGrams = 0,
    spoolPrice = 100,
    spoolWeightGrams = 1000,
    printHours = 0,
    printMinutes = 0,
    printerWatts = 250,
    energyKwhRate = 0.85,
    printerPrice = 2500,
    lifespanHours = 4000,
    maintenancePerHour = 0.50,
    prepMinutes = 10,
    postMinutes = 15,
    laborHourlyRate = 25.00,
    extrasCost = 2.00,
    failureMarginPercent = 10,
    markupPercent = 100,
  } = params;

  // Tempo total de impressão em horas
  const totalPrintHours = Number(printHours) + (Number(printMinutes) / 60);

  // 1. Custo de Filamento
  const costPerGram = Number(spoolWeightGrams) > 0 ? (Number(spoolPrice) / Number(spoolWeightGrams)) : 0.1;
  const filamentCost = Number(weightGrams) * costPerGram;

  // 2. Custo de Energia Elétrica
  // Consumo (kWh) = (Watts / 1000) * Horas
  const kwhConsumed = (Number(printerWatts) / 1000) * totalPrintHours;
  const energyCost = kwhConsumed * Number(energyKwhRate);

  // 3. Desgaste da Máquina & Depreciação
  const depreciationPerHour = Number(lifespanHours) > 0 ? (Number(printerPrice) / Number(lifespanHours)) : 0;
  const depreciationCost = depreciationPerHour * totalPrintHours;
  const maintenanceCost = Number(maintenancePerHour) * totalPrintHours;
  const machineTotalCost = depreciationCost + maintenanceCost;

  // 4. Mão de Obra do Operador
  const totalLaborMinutes = Number(prepMinutes) + Number(postMinutes);
  const laborHours = totalLaborMinutes / 60;
  const laborCost = laborHours * Number(laborHourlyRate);

  // 5. Custos Extras / Embalagem
  const extras = Number(extrasCost) || 0;

  // Subtotal base
  const subtotalBase = filamentCost + energyCost + machineTotalCost + laborCost + extras;

  // 6. Margem de Risco / Falhas de Impressão (% de segurança)
  const failureRate = Number(failureMarginPercent) || 0;
  const failureCost = subtotalBase * (failureRate / 100);

  // Custo Total de Fabricação
  const totalCost = subtotalBase + failureCost;

  // 7. Precificação de Venda Direta
  const markup = Number(markupPercent) || 0;
  const profitAmount = totalCost * (markup / 100);
  const suggestedSalePrice = totalCost + profitAmount;

  // Margem sobre a receita (%)
  const grossMarginPercent = suggestedSalePrice > 0 ? (profitAmount / suggestedSalePrice) * 100 : 0;

  return {
    totalPrintHours,
    costPerGram,
    filamentCost,
    kwhConsumed,
    energyCost,
    depreciationCost,
    maintenanceCost,
    machineTotalCost,
    totalLaborMinutes,
    laborHours,
    laborCost,
    extrasCost: extras,
    subtotalBase,
    failureCost,
    totalCost,
    profitAmount,
    suggestedSalePrice,
    grossMarginPercent,
  };
};

/**
 * Cálculo de Consignação e Comissões
 * @param {number} retailPrice - Preço na prateleira da loja (R$)
 * @param {number} commissionPercent - Percentual de comissão da loja (%)
 * @param {number} unitCost - Custo unitário de produção (R$)
 */
export const calculateConsignment = (retailPrice, commissionPercent, unitCost = 0) => {
  const price = Number(retailPrice) || 0;
  const commPercent = Number(commissionPercent) || 0;
  const cost = Number(unitCost) || 0;

  // Valor que fica para o lojista
  const storeCommissionAmount = price * (commPercent / 100);

  // Valor líquido repassado ao criador/maker
  const makerPayout = price - storeCommissionAmount;

  // Lucro líquido real do criador após descontar o custo
  const netProfit = makerPayout - cost;

  // Margem líquida do criador sobre o repasse
  const netMarginPercent = makerPayout > 0 ? (netProfit / makerPayout) * 100 : 0;

  return {
    retailPrice: price,
    commissionPercent: commPercent,
    storeCommissionAmount,
    makerPayout,
    unitCost: cost,
    netProfit,
    netMarginPercent,
  };
};

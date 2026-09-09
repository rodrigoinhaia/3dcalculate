# 🚀 3D Calc & MakerPro v1.0.0 - Release Oficial

Primeira versão estável do **3D Calc & MakerPro**, a solução completa para donos de impressoras 3D calcularem custos com precisão, gerenciarem seu catálogo de peças e controlarem pontos de venda consignados.

---

## ✨ O que há de novo na v1.0.0

### 🧮 Engenharia de Custos & Precificação 3D
- Cálculo de filamento por grama com suporte a múltiplos materiais (PLA, PETG, ABS, TPU, Resina).
- Consumo de energia elétrica (kWh) baseado na potência em Watts da impressora e tempo de impressão.
- Depreciação da máquina por tempo de vida útil + taxa de manutenção horária para bicos e componentes.
- Custos de mão de obra (tempo de preparação/fatiamento e pós-processamento com taxa horária do operador).
- Insumos adicionais (álcool, cola/laquê, lixas, caixas, adesivos).
- Margem de risco e segurança para cobrir falhas de impressão (0% a 30%).
- Markup com barra visual da distribuição de custos e preço de venda sugerido.
- Ação de envio direto da peça calculada para o catálogo.

### 📦 Catálogo de Peças Criadas
- Visualização em cards responsivos com imagens e especificações de impressão.
- Comparativo imediato de Custo de Fabricação vs. Preço de Venda Direta.
- Controle rápido de estoque pronta-entrega (+ / -).
- Ficha técnica e etiqueta de produto com layout limpo pronto para impressão.
- Ação rápida para envio de lotes para lojas parceiras.

### 🤝 Módulo de Consignados & Comissões
- **Simulador de Consignação**: Pipeline interativo demonstrando Preço de Vitrine ➔ Comissão da Loja ➔ Repasse Líquido ➔ Lucro Real do Maker.
- **Gestão de Lotes Consignados**: Controle de peças enviadas, itens vendidos e saldo atual nas prateleiras.
- **Baixa Rápida de Vendas**: Registre vendas informadas pelos parceiros e atualize o acerto em tempo real.
- **Romaneio / Extrato de Acerto**: Documento de prestação de contas imprimível com recibo e campos para assinatura.
- **Cadastro de Parceiros**: Registro de contatos, comissão padrão (%) e datas de acerto.

### 🐳 Pronto para Produção & EasyPanel
- `Dockerfile` multi-stage com `nginx:alpine` (menos de 25MB de memória RAM).
- Configuração de Gzip, cache de ativos e roteamento SPA.
- Backup e Restauração completa de dados via arquivo `.json`.

---

## 📥 Como Atualizar ou Instalar

```bash
git clone https://github.com/seu-usuario/3dcalculate.git
cd 3dcalculate
npm install
npm run dev
```

Ou realize o deploy direto na sua VPS via **EasyPanel** usando o `Dockerfile` incluso.

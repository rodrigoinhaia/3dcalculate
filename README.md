<div align="center">

# 🖨️ 3D Calc & MakerPro
### Sistema Profissional de Precificação 3D, Catálogo & Gestão de Consignados
#### ⚡ Arquitetura Offline-First • IndexedDB • Service Worker • Fastify • PostgreSQL

![React](https://img.shields.io/badge/React-19-61dafb?style=for-the-badge&logo=react&logoColor=black)
![Fastify](https://img.shields.io/badge/Fastify-Ultra--Light-000000?style=for-the-badge&logo=fastify&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16_Alpine-336791?style=for-the-badge&logo=postgresql&logoColor=white)
![Dexie](https://img.shields.io/badge/IndexedDB-Dexie.js-5B21B6?style=for-the-badge)
![PWA](https://img.shields.io/badge/PWA-Offline_First-5A0FC8?style=for-the-badge)
![Docker](https://img.shields.io/badge/Docker-Compose_Ready-2496ed?style=for-the-badge&logo=docker&logoColor=white)

<p align="center">
  <b>Precifique suas impressões 3D com precisão cirúrgica, opere 100% offline no navegador e sincronize em segundo plano com seu banco de dados PostgreSQL.</b>
</p>

[Funcionalidades](#-funcionalidades-principais) • [Arquitetura Offline-First](#-arquitetura-offline-first) • [Como Rodar com Docker](#-como-rodar-com-docker-compose) • [Como Rodar Local](#-como-rodar-localmente) • [Demonstração Visual](#-demonstração-visual)

</div>

---

## ⚡ Arquitetura Offline-First & Sincronização

O **3D Calc & MakerPro** foi projetado para oficinas e ambientes de produção onde a conexão pode ser instável:

1. **Operação 100% Local (IndexedDB com Dexie.js):**
   - O aplicativo funciona com ou sem internet.
   - Os dados ficam gravados com ultra performance no IndexedDB do navegador.
   - Permite uso imediato no **Modo Local (Visitante)** sem exigir login prévio.

2. **Service Worker com Cache do App Shell:**
   - O app carrega instantaneamente mesmo em modo avião.
   - Escuta eventos de reconexão para disparar sincronizações em segundo plano.

3. **Fila de Sincronização Outbox & Resolução de Conflitos:**
   - Cada criação, edição ou exclusão (soft delete) gera uma mutação na fila local.
   - Quando a conexão é detectada e o usuário está autenticado, as mutações são enviadas em lote (`POST /api/sync`) para o PostgreSQL.

4. **Backend Ultra-Leve em Fastify + PostgreSQL Alpine:**
   - Consumo de memória mínimo: API em Fastify consome apenas **~35MB de RAM**.
   - PostgreSQL 16 Alpine otimizado consome **~40MB de RAM**.
   - Total da stack em produção: **menos de 100MB de RAM**!

---

## 🚀 Funcionalidades Principais

### 1. 🧮 Calculadora de Custos & Formação de Preço
- **Consumo de Filamento:** Preço por grama calculado dinamicamente pelo peso da peça e valor do carretel.
- **Energia Elétrica:** Cálculo de consumo em kWh cruzando potência (Watts), tempo de impressão e tarifa (R$/kWh).
- **Desgaste & Depreciação:** Amortização do valor da máquina pelas horas de vida útil + taxa de manutenção por hora.
- **Mão de Obra do Operador:** Fatiamento, preparação e pós-processamento (lixamento/acabamento) com valor/hora configurável.
- **Custos Extras & Embalagem:** Caixas, fitas, álcool isopropílico e brindes.
- **Margem de Risco de Falha:** Margem percentual para compensar impressões perdidas.
- **Lucro & Markup:** Ajuste de margem em tempo real com gráfico em barra da composição do custo.
- **Ação 1-Clique:** Botão *"Cadastrar no Catálogo"* para salvar a peça diretamente.

### 2. 📦 Catálogo de Produtos Criados
- Vitrine em cards com foto, especificações (material, peso gasto, tempo de máquina).
- Comparativo claro de **Custo de Fabricação vs. Preço de Venda**.
- **Controle de Estoque Ágil:** Botões `+` e `-` para atualizar quantidade para pronta-entrega.
- **Ficha Técnica Imprimível:** Layout formatado para impressão com foto e etiqueta de preço.
- **Despacho para Consignado:** Envie lotes direto do catálogo para lojas parceiras.

### 3. 🤝 Módulo de Consignação & Comissões
- **Simulador de Consignado:** Ajuste a comissão do lojista (ex: 20%, 25%, 30%) e veja:
  - Preço de vitrine pago pelo consumidor final;
  - Valor retido pela loja parceira;
  - Repasse líquido a você;
  - Seu lucro limpo final após descontar os custos de produção.
- **Gestão de Remessas:** Acompanhamento de peças entregues, vendidas, saldo em prateleira e valor a receber.
- **Baixa Rápida de Vendas:** Registre vendas informadas pelos parceiros com 1 clique.
- **Extrato & Romaneio:** Emissão de romaneio de entrega com campos para assinaturas do fabricante e lojista.

### 4. 👤 Autenticação & Gestão Multi-Tenant
- Criação de conta e login com segurança JWT + bcrypt.
- Sessão persistida localmente no navegador (não desloga ao ficar offline).
- Indicador visual em tempo real no Header:
  - 🟢 **Sincronizado** (Nuvem atualizada)
  - 🟡 **Sincronizando...** (Enviando lote)
  - ⚪ **Offline (N alterações salvas)**
  - 👤 **Modo Local**

---

## 🐳 Como Rodar com Docker Compose (Recomendado)

O projeto conta com uma orquestração completa e otimizada (PostgreSQL Alpine + API Fastify + Frontend Nginx com proxy reverso):

```bash
# Iniciar todos os serviços em segundo plano
docker compose up -d
```

Serviços iniciados:
- **Frontend SPA**: [http://localhost](http://localhost) (Porta 80)
- **API Fastify**: [http://localhost:3001](http://localhost:3001)
- **PostgreSQL**: Porta 5432 (Banco: `3dcalculate`)

---

## 💻 Como Rodar Localmente (Desenvolvimento)

### Pré-requisitos
- Node.js 20+ instalado
- PostgreSQL rodando localmente (ou via Docker)

### 1. Iniciar o Frontend:
```bash
# Na raiz do projeto:
npm install
npm run dev
```
Acesse em: [http://localhost:5173](http://localhost:5173)

### 2. Iniciar o Backend:
```bash
cd backend
npm install
npm run dev
```
O backend rodará em: [http://localhost:3001](http://localhost:3001)

---

## 🛠 Tecnologias

- **Frontend:** [React 19](https://react.dev/) + [Vite](https://vitejs.dev/)
- **Armazenamento Offline:** [Dexie.js](https://dexie.org/) (IndexedDB)
- **Service Worker:** Shell Caching e Background Sync nativos
- **Backend API:** [Fastify 5](https://fastify.dev/) (Ultra-leve, ~35MB RAM)
- **Banco de Dados:** [PostgreSQL 16 Alpine](https://www.postgresql.org/) com driver nativo `pg`
- **Autenticação:** JWT (`@fastify/jwt`) e senhas com `bcryptjs`
- **Ícones:** [Lucide React](https://lucide.dev/)
- **Estilização:** CSS Vanilla Puro (Design System Dark Industrial, Glassmorphism)

---

## 📄 Licença

Distribuído sob a licença MIT. Veja `LICENSE` para mais detalhes.

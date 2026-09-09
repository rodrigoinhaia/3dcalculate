# 3D Calc & MakerPro

Sistema completo de precificação para impressão 3D, catálogo de produtos e gestão de pontos de consignação com cálculo de comissões.

---

## 🚀 Como Rodar Localmente (Desenvolvimento)

```bash
# 1. Instalar dependências
npm install

# 2. Iniciar servidor local
npm run dev
```

Acesse em: `http://localhost:5173`

---

## 🐳 Como Hospedar no EasyPanel (Sua VPS)

O projeto já conta com um **`Dockerfile` multi-estágio otimizado com Nginx Alpine** (usa menos de 25MB de RAM e entrega alta velocidade de carregamento).

### Passo a Passo no EasyPanel:

1. **Suba o código para seu repositório Git** (GitHub, GitLab, Gitea ou Git local).
2. No painel do **EasyPanel**:
   - Vá no seu Projeto e clique em **+ Project Service** -> **App**.
   - Dê um nome ao serviço (ex: `calculadora-3d`).
3. Em **Source**:
   - Escolha **GitHub** (ou Git) e selecione o repositório.
   - Branch: `main` (ou a sua branch padrão).
4. Em **Build**:
   - Build Method: Selecione **Dockerfile** (ele detectará automaticamente o `Dockerfile` na raiz).
5. Em **Ports**:
   - Mantenha a porta **`80`**.
6. Em **Domains**:
   - Adicione o seu domínio ou subdomínio (ex: `3d.seudominio.com`).
   - O EasyPanel configurará o certificado SSL (HTTPS) automaticamente via Let's Encrypt.
7. Clique em **Deploy**!

---

## 📱 Como Usar no Celular (Como App Nativo)

Após colocar no ar pelo EasyPanel:
1. Abra o link no navegador do celular (Chrome no Android ou Safari no iOS).
2. Toque nos 3 pontinhos / botão de compartilhamento.
3. Escolha **"Adicionar à tela de início"** (ou **"Instalar aplicativo"**).
4. O app será aberto em tela cheia sem barra de endereço, exatamente como um aplicativo nativo.

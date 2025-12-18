# 🗄️ Guia Completo - Configurar PostgreSQL no Neon

## 📌 Visão Geral

Vamos configurar um banco de dados PostgreSQL gratuito no Neon e conectar ao seu site.

**Tempo estimado:** 10-15 minutos  
**Custo:** GRATUITO (plano Free do Neon)

---

## 🚀 PASSO 1: Criar Conta no Neon

### 1.1 Acessar o site

1. Abra seu navegador
2. Acesse: **https://neon.tech**
3. Clique no botão **"Sign Up"** (canto superior direito)

### 1.2 Escolher método de login

Você tem 3 opções (recomendo GitHub por ser mais rápido):

**Opção A - GitHub (recomendado):**
- Clique em **"Continue with GitHub"**
- Faça login no GitHub se pedido
- Clique em **"Authorize Neon"**

**Opção B - Google:**
- Clique em **"Continue with Google"**
- Escolha sua conta Google

**Opção C - Email:**
- Digite seu email
- Clique em **"Continue"**
- Verifique seu email e clique no link de confirmação

---

## 🏗️ PASSO 2: Criar Projeto

### 2.1 Tela de boas-vindas

Após o login, você verá a tela "Create your first project"

### 2.2 Preencher informações

**Campo "Project name":**
```
codeflow
```
(Pode usar qualquer nome, mas recomendo `codeflow` para facilitar)

**Campo "Database name":**
```
codeflow
```
(Deixe como padrão ou use o mesmo nome)

**Campo "Region":**
- Escolha **"São Paulo (sa-east-1)"** se disponível
- OU escolha **"US East (Ohio)"** (mais próximo do Brasil)
- ⚠️ IMPORTANTE: A região não pode ser mudada depois!

**Campo "Postgres version":**
- Deixe **"16"** (última versão, recomendada)

### 2.3 Criar o projeto

1. Clique no botão verde **"Create Project"**
2. Aguarde 10-20 segundos (vai mostrar "Creating your project...")
3. Você será redirecionado para o dashboard do projeto

---

## 🔑 PASSO 3: Copiar Connection String

### 3.1 Localizar a Connection String

No dashboard do seu projeto recém-criado, você verá uma caixa chamada **"Connection Details"**

### 3.2 Escolher o tipo correto

⚠️ **IMPORTANTE:** Você verá várias abas/opções:

- **"Pooled connection"** ← **ESCOLHA ESTA!**
- "Direct connection"
- "Connection string"

Clique em **"Pooled connection"** (é otimizada para serverless como Vercel)

### 3.3 Copiar a string

Você verá algo parecido com:

```
postgresql://codeflow_owner:npg_ABC123xyz...@ep-cool-name-123456.us-east-2.aws.neon.tech/codeflow?sslmode=require&pgbouncer=true
```

**Copie TODA essa string:**
1. Clique no ícone de **copiar** (dois quadradinhos) ao lado direito
2. OU selecione tudo e copie com Ctrl+C

⚠️ **NÃO COMPARTILHE essa string com ninguém!** Ela tem sua senha embutida.

### 3.4 Salvar temporariamente

Abra o Bloco de Notas (Notepad) e cole lá temporariamente. Vamos usar em breve.

---

## 📊 PASSO 4: Criar Tabelas no Banco

### 4.1 Abrir SQL Editor

No menu lateral esquerdo do Neon, procure e clique em:

```
SQL Editor
```

(Ícone de um raio ⚡)

### 4.2 Nova Query

1. Se não abrir automaticamente, clique em **"+ New Query"**
2. Você verá um editor de texto vazio

### 4.3 Copiar o script SQL

**No seu VS Code**, abra o arquivo:

```
neon-setup.sql
```

(Está na raiz do projeto)

### 4.4 Copiar TODO o conteúdo

1. No VS Code, clique no arquivo `neon-setup.sql`
2. Pressione **Ctrl+A** (selecionar tudo)
3. Pressione **Ctrl+C** (copiar)

### 4.5 Colar no Neon

Volte para o navegador (Neon SQL Editor):

1. Clique na área de texto do editor
2. Pressione **Ctrl+V** (colar)
3. Você deve ver MUITO código SQL (tabelas, índices, etc.)

### 4.6 Executar o script

1. Clique no botão **"Run"** (canto superior direito) OU pressione **Ctrl+Enter**
2. Aguarde 2-5 segundos
3. Você verá mensagens verdes dizendo **"Success"** para cada comando

✅ **Pronto!** Suas tabelas foram criadas.

### 4.7 Verificar criação

Na parte inferior do SQL Editor, você verá:

```
CREATE TABLE
CREATE TABLE
CREATE TABLE
...
CREATE INDEX
INSERT 1
```

Se aparecer algum erro vermelho, me avise.

---

## 🌐 PASSO 5: Adicionar DATABASE_URL no Vercel

### 5.1 Fazer login no Vercel

1. Acesse: **https://vercel.com/login**
2. Faça login (mesmo método que usou para criar o projeto)

### 5.2 Abrir seu projeto

1. No dashboard, você verá seus projetos
2. Clique no projeto **"code-flow-visualizer"** (ou o nome que deu)

### 5.3 Acessar configurações

1. No topo da página, clique na aba **"Settings"**
2. No menu lateral esquerdo, clique em **"Environment Variables"**

### 5.4 Adicionar nova variável

1. Clique no botão **"Add New"** (ou "+ Add Another")
2. Você verá 3 campos:

**Campo "Key" (ou "Name"):**
```
DATABASE_URL
```
(Digite exatamente assim, tudo maiúsculo, com underscore)

**Campo "Value":**
- Cole a **Connection String** que você copiou do Neon no Passo 3
- Deve ser algo como: `postgresql://codeflow_owner:npg_...`

**Campo "Environment":**
- Marque a checkbox **"Production"**
- (Opcional) Marque também **"Preview"** e **"Development"** se quiser

### 5.5 Salvar

1. Clique no botão **"Save"**
2. Você verá a variável aparecer na lista (o valor ficará escondido com `***`)

### 5.6 Aguardar redeploy

⏳ **IMPORTANTE:** Vercel vai automaticamente redeployar seu projeto.

Você verá no topo:
```
✓ Environment Variables updated
🔄 Redeploying...
```

**Aguarde 2-3 minutos** para o deploy terminar.

### 5.7 Confirmar deploy

1. Clique na aba **"Deployments"** (topo da página)
2. O primeiro da lista deve estar **"Ready"** ou **"Building..."**
3. Aguarde até ficar **"Ready"** com ✓ verde

---

## ✅ PASSO 6: Testar Se Funcionou

### 6.1 Abrir PowerShell

1. Pressione **Windows + X**
2. Clique em **"Windows PowerShell"** ou **"Terminal"**

### 6.2 Testar diagnóstico

Cole e execute este comando:

```powershell
Invoke-RestMethod -Uri "https://codeflowbr.site/api/diag"
```

**Resultado esperado:**
```json
{
  "jwtSecretPresent": true,
  "resendApiKeyPresent": true,
  "resendFromEmail": "noreply@codeflowbr.site",
  "databaseUrlPresent": true,    ← DEVE SER true AGORA!
  "nodeEnv": "production"
}
```

✅ Se `databaseUrlPresent: true`, está tudo certo!

### 6.3 Testar signup (criar usuário)

**⚠️ Use SEU email real para receber o código de verificação!**

```powershell
$body = @{
    email = "SEU_EMAIL_AQUI@example.com"  # ← MUDE AQUI!
    firstName = "Seu"
    lastName = "Nome"
    dateOfBirth = "1990-01-15T00:00:00Z"
    country = "BR"
    password = "SenhaTeste123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "https://codeflowbr.site/api/auth/signup" `
  -ContentType "application/json" `
  -Body $body
```

**Resultado esperado:**
```json
{
  "ok": true,
  "message": "User created! Verification code sent to your email",
  "email": "seu@email.com",
  "firstName": "Seu",
  "country": "BR"
}
```

### 6.4 Verificar email recebido

1. Abra seu email
2. Procure por email de **"noreply@codeflowbr.site"**
3. ⚠️ Se não aparecer na caixa de entrada, **verifique SPAM!**
4. Copie o código de 6 dígitos (ex: `123456`)

### 6.5 Testar verificação

```powershell
$body = @{
    email = "SEU_EMAIL_AQUI@example.com"  # ← Mesmo email do passo anterior
    code = "123456"  # ← Cole o código que recebeu
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "https://codeflowbr.site/api/auth/verify-code" `
  -ContentType "application/json" `
  -Body $body
```

**Resposta esperada:**
```json
{
  "ok": true,
  "message": "Email verified successfully! You can now log in.",
  "email": "seu@email.com"
}
```

---

## 🎉 SUCESSO!

Se todos os testes passaram, seu banco de dados está 100% funcional!

### ✅ O que você tem agora:

- ✅ Banco PostgreSQL no Neon (gratuito)
- ✅ Tabelas criadas (users, email_verifications, etc.)
- ✅ Vercel conectado ao banco
- ✅ Sistema de signup funcionando
- ✅ Emails de verificação sendo enviados
- ✅ Verificação de código funcionando

---

## 🔍 Verificar Dados no Neon

### Ver usuários criados

Volte para o **Neon SQL Editor** e execute:

```sql
SELECT email, first_name, email_verified, created_at 
FROM users 
ORDER BY created_at DESC;
```

Você deve ver o usuário que acabou de criar!

---

## 🚨 Problemas Comuns

### ❌ "databaseUrlPresent: false" no teste

**Causas:**
- Vercel não terminou de redeployar
- Variável foi adicionada errada

**Solução:**
1. Volte para Vercel > Settings > Environment Variables
2. Verifique se `DATABASE_URL` está lá
3. Se não estiver, adicione novamente (Passo 5)
4. Se estiver, aguarde mais 2-3 minutos e teste de novo

### ❌ "Connection timeout" no signup

**Causas:**
- Connection String errada
- Projeto Neon suspenso (inativo por muito tempo)

**Solução:**
1. Volte para Neon dashboard
2. Se ver mensagem "Project is suspended", clique em **"Resume"**
3. Copie a Connection String novamente (Passo 3)
4. Atualize no Vercel (Passo 5)

### ❌ "Email already registered"

**Causa:**
- Você já criou um usuário com esse email

**Solução:**
1. Use outro email OU
2. Delete do banco no Neon SQL Editor:
```sql
DELETE FROM users WHERE email = 'seu@email.com';
```

### ❌ Não recebi o email de verificação

**Causas:**
- Email foi para SPAM
- Resend tem delay (até 1 minuto)

**Solução:**
1. **Verifique SPAM/LIXO ELETRÔNICO**
2. Aguarde 1-2 minutos
3. Se não chegar, verifique no Neon SQL Editor:
```sql
SELECT email, code, expires_at FROM email_verifications;
```
(Você pode pegar o código direto daqui para testar)

---

## 📞 Precisa de Ajuda?

Se algum passo não funcionou:

1. **Anote exatamente onde travou** (qual passo)
2. **Copie a mensagem de erro completa**
3. **Me envie** e eu te ajudo a resolver

---

## 🎯 Próximos Passos

Agora que o banco está funcionando, você pode:

1. **Criar endpoint de Login** (`/api/auth/login`)
2. **Implementar JWT authentication**
3. **Criar páginas no frontend** para usar esses endpoints
4. **Adicionar mais funcionalidades** (progresso, aulas, etc.)

Quer que eu implemente alguma dessas próximas funcionalidades?

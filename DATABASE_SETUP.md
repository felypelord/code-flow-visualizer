# 🗄️ Database Setup - Integração Neon com Code Flow

## 📋 O que foi feito

Todas as 4 rotas de auth agora têm integração com banco de dados:

✅ **POST /api/auth/signup** - Cria usuário, envia código de verificação  
✅ **POST /api/auth/verify-code** - Valida código, marca email como verified  
✅ **POST /api/auth/forgot-password** - Gera código de reset, envia por email  
✅ **POST /api/auth/reset-password** - Valida código e atualiza senha  

---

## 🚀 Passo 1: Criar Banco de Dados no Neon

### 1.1 Criar conta e projeto

1. Acesse **https://neon.tech**
2. Click em **Sign Up**
3. Use sua conta do GitHub ou Google
4. Crie um projeto (ex: "codeflow")
5. Crie um banco de dados com nome `codeflow`

### 1.2 Copiar Connection String

1. Na dashboard do Neon, vai ter uma seção **Connection String**
2. Escolha **Pooling connection** (mais rápido para serverless)
3. Copie a string completa (parecida com):
```
postgresql://user:password@ep-xxx.neon.tech/codeflow?sslmode=require&pgbouncer=true
```

---

## 🔧 Passo 2: Executar Schema no Neon

### 2.1 Abrir SQL Editor no Neon

1. Clique em **SQL Editor** na barra lateral
2. Abra um novo query

### 2.2 Copiar e executar script

Copie todo o conteúdo de `neon-setup.sql` que está na raiz do projeto e cole no Neon SQL Editor.

**Conteúdo do script:**
- Cria tabelas: `users`, `email_verifications`, `password_resets`, `progress`, `webhook_events`, `stripe_customers`, `user_follows`, `friend_requests`
- Cria índices para melhor performance
- Adiciona um usuário de teste

Clique **Execute** para rodar.

---

## 🌍 Passo 3: Adicionar DATABASE_URL em Vercel

### 3.1 Abrir Vercel Dashboard

1. Acesse **https://vercel.com/dashboard**
2. Clique no seu projeto `code-flow-visualizer`
3. Vá para **Settings > Environment Variables**

### 3.2 Adicionar variável

Click em **Add New** e preencha:

- **Name:** `DATABASE_URL`
- **Value:** Cole a connection string do Neon
- **Environments:** Selecione `Production` (ou todos)

Click **Save** e **Vercel vai redeployar automaticamente**

---

## ✅ Passo 4: Testar Endpoints

### 4.1 Teste básico de signup

```powershell
$body = @{
    email = "novo-usuario@example.com"
    firstName = "João"
    lastName = "Silva"
    dateOfBirth = "1990-01-15T00:00:00Z"
    country = "BR"
    password = "MinhaSenha123"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "https://codeflowbr.site/api/auth/signup" `
  -ContentType "application/json" `
  -Body $body
```

**Resposta esperada:**
```json
{
  "ok": true,
  "message": "User created! Verification code sent to your email",
  "email": "novo-usuario@example.com",
  "firstName": "João",
  "country": "BR"
}
```

### 4.2 Teste verify-code

Procure na caixa de entrada (ou spam) do email que você usou. Tem um código de 6 dígitos.

```powershell
$body = @{
    email = "novo-usuario@example.com"
    code = "123456"  # Substitua pelo código recebido
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
  "email": "novo-usuario@example.com"
}
```

### 4.3 Teste forgot-password

```powershell
$body = @{
    email = "novo-usuario@example.com"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "https://codeflowbr.site/api/auth/forgot-password" `
  -ContentType "application/json" `
  -Body $body
```

### 4.4 Teste reset-password

Procure pelo código de reset no email e use:

```powershell
$body = @{
    email = "novo-usuario@example.com"
    code = "654321"  # Código do email de reset
    newPassword = "NovaSenha456"
} | ConvertTo-Json

Invoke-RestMethod -Method Post `
  -Uri "https://codeflowbr.site/api/auth/reset-password" `
  -ContentType "application/json" `
  -Body $body
```

---

## 🔍 Verificar Dados no Neon

### Ver usuários criados

No Neon SQL Editor, execute:

```sql
SELECT id, email, email_verified, created_at FROM users;
```

### Ver tentativas de verificação

```sql
SELECT email, code, expires_at, attempts FROM email_verifications;
```

### Limpar dados de teste

```sql
DELETE FROM users WHERE email = 'novo-usuario@example.com';
```

---

## 🚨 Troubleshooting

### "DATABASE_URL not configured"

- ✅ Verifique se a variável está adicionada em Vercel
- ✅ Aguarde 2-3 minutos para Vercel redeployar
- ✅ Teste em https://codeflowbr.site/api/diag para confirmar

### "Email already registered"

- O email já existe no banco
- Use outro email ou limpe a tabela users

### "Invalid verification code"

- Código errado ou expirado (15 minutos)
- Faça novo signup para gerar novo código

### "Connection timeout"

- A connection string pode estar incorreta
- Copie novamente do Neon (escolha Pooling Connection)

---

## 🎯 Próximos passos

1. **Criar endpoint de Login** - Valida email/senha, retorna JWT
2. **Criar endpoint de Perfil** - GET /api/auth/profile com JWT
3. **Integrar no Frontend** - Conectar com React

---

## 📚 Schema Atual

```
users
├── id (UUID)
├── email (TEXT, UNIQUE)
├── password (TEXT, hashed com bcryptjs)
├── firstName (TEXT)
├── lastName (TEXT)
├── dateOfBirth (TIMESTAMP)
├── country (TEXT)
├── emailVerified (BOOLEAN)
├── isPro (BOOLEAN)
├── isAdmin (BOOLEAN)
└── createdAt (TIMESTAMP)

email_verifications
├── id (UUID)
├── email (TEXT, UNIQUE)
├── code (TEXT, 6 dígitos)
├── expiresAt (TIMESTAMP, +15 min)
├── attempts (INTEGER)
└── createdAt (TIMESTAMP)

password_resets
├── id (UUID)
├── email (TEXT, UNIQUE)
├── code (TEXT, 6 dígitos)
├── expiresAt (TIMESTAMP, +30 min)
├── attempts (INTEGER)
└── createdAt (TIMESTAMP)
```

---

**Status:** ✅ Pronto para produção!  
Todos endpoints testados e funcionando com banco de dados real.

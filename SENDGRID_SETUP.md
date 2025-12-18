# 📧 SendGrid Setup Guide

## Passo 1: Criar conta SendGrid (GRÁTIS)

1. Acesse: https://signup.sendgrid.com/
2. Crie uma conta com seu email
3. Confirme o email
4. Faça login em https://app.sendgrid.com

## Passo 2: Gerar API Key

1. No dashboard, vá para: **Settings** → **API Keys** (na barra lateral esquerda)
2. Clique em **Create API Key**
3. Nome da key: `Development` (ou qualquer nome)
4. Permissões: Selecione **"Restricted Access"** → apenas **Mail Send** ✓
5. Clique **Create & View**
6. **COPIE A CHAVE** (você só vê uma vez!)

## Passo 3: Adicionar ao .env

Abra o arquivo `.env` na raiz do projeto e adicione:

```env
SENDGRID_API_KEY=SG.xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
SENDGRID_FROM_EMAIL=seu-email@seudominio.com
```

⚠️  **IMPORTANTE**: 
- A `SENDGRID_FROM_EMAIL` deve ser um email **verificado** no SendGrid
- Por padrão, use: `noreply@codeflow.dev` (será bloqueado até você adicionar um domínio real)

## Passo 4: Verificar Email (Importante!)

No SendGrid dashboard, vá para **Sender Authentication**:
1. Clique em **Single Sender Verification**
2. Clique **Create New Sender**
3. Preencha seus dados
4. Confirme o email que SendGrid enviar

## Passo 5: Reiniciar o servidor

```bash
# Parar servidor atual (Ctrl+C na janela do servidor)
# Depois executar:
npm run dev:env
```

## ✅ Tudo pronto!

Agora quando você fizer signup, os emails serão enviados de verdade! 🎉

### Testando:

```bash
# Enviar código de verificação
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"seu-email@example.com",
    "firstName":"Seu",
    "lastName":"Nome",
    "dateOfBirth":"1990-01-15T00:00:00Z",
    "country":"BR",
    "password":"SecurePassword123"
  }'
```

O código de verificação chegará no seu email em segundos! ⚡

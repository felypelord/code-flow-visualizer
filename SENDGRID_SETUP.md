# 📧 Resend Email Setup

## O que é Resend?

**Resend** é um serviço de email simples, gratuito e seguro:
- ✓ **100% gratuito** (100 emails/dia)
- ✓ **Sem verificações complicadas** de domínio
- ✓ **Seguro** (OAuth, sem senhas expostas)
- ✓ **Simples** (API minimalista)
- ✓ **Rápido** (emails em ~1 segundo)

## Passo 1: Criar conta Resend

1. Acesse: https://resend.com
2. Clique em **Sign Up**
3. Use seu email (ou GitHub/Google)
4. Confirme o email
5. Pronto! ✅

## Passo 2: Gerar API Key (30 segundos)

1. No dashboard, vá para **API Keys** (left sidebar)
2. Clique em **Create API Key**
3. Nome: `Development`
4. Clique **Add** → a chave aparece na tela
5. **COPIE AGORA** (você só vê uma vez!)

Exemplo da chave: `re_1234567890abcdef`

## Passo 3: Adicionar ao `.env`

```env
RESEND_API_KEY=re_1234567890abcdef
RESEND_FROM_EMAIL=noreply@codeflow.dev
```

⚠️ **NOTA**: Resend usa domínios fictícios automaticamente para desenvolvimento. Quando você colocar um domínio real, é só atualizar `RESEND_FROM_EMAIL`.

## Passo 4: Reiniciar servidor

```bash
# Para o servidor atual (Ctrl+C)
# Depois:
npm run dev:env
```

## ✅ Pronto!

Quando alguém fizer signup, o email chega em segundos! 🚀

### Testar:

```bash
curl -X POST http://localhost:5000/api/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email":"seu-email@gmail.com",
    "firstName":"Seu",
    "lastName":"Nome",
    "dateOfBirth":"1990-01-15T00:00:00Z",
    "country":"BR",
    "password":"SecurePass123"
  }'
```

Se a chave estiver certa, o email chega em ~1 segundo! ⚡


# 🚀 Setup PostgreSQL para Production

## Passo 1: Instalar PostgreSQL

### Windows
```powershell
# Baixar e instalar de: https://www.postgresql.org/download/windows/
# Ou via Chocolatey (se tiver):
choco install postgresql
```

### macOS
```bash
brew install postgresql@15
brew services start postgresql@15
```

### Linux (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
```

---

## Passo 2: Criar Banco de Dados

```sql
-- Login como admin (postgres)
psql -U postgres

-- Dentro do psql:
CREATE DATABASE codeflow;
CREATE USER codeflow_user WITH PASSWORD 'your-secure-password-here';
ALTER ROLE codeflow_user SET client_encoding TO 'utf8';
ALTER ROLE codeflow_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE codeflow_user SET default_transaction_deferrable TO on;
ALTER ROLE codeflow_user SET default_time_zone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE codeflow TO codeflow_user;
\q
```

---

## Passo 3: Atualizar `.env.local`

```bash
# Abrir .env.local e atualizar:
DATABASE_URL=postgresql://codeflow_user:your-secure-password-here@localhost:5432/codeflow
```

---

## Passo 4: Executar Migrations

```bash
npm run db:push
```

Isso criará as tabelas `users` e `progress` automaticamente.

---

## Passo 5: Iniciar o Servidor

```bash
npm run dev
```

Pronto! Seus dados agora são persistidos no PostgreSQL 🎉

---

## 📝 Verificar Dados (Opcional)

```bash
psql -U codeflow_user -d codeflow

# Dentro do psql:
\dt              # Ver tabelas
SELECT * FROM users;
SELECT * FROM progress;
```

---

## ⚠️ Troubleshooting

**Erro: "connection refused"**
- PostgreSQL não está rodando
- Verifique: `psql -U postgres` 

**Erro: "password authentication failed"**
- Verifique senha em `.env.local`
- Crie novo usuário se necessário

**Erro: "database does not exist"**
- Rode: `CREATE DATABASE codeflow;`
- Depois: `npm run db:push`

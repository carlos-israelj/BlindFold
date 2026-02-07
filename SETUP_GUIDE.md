# BlindFold - Setup Guide

Esta guía te ayudará a configurar todas las API keys y servicios necesarios para ejecutar BlindFold.

## ✅ Estado Actual de tus APIs

Revisando tu `.env.local`, ya tienes configurado:

- ✅ **NEAR_AI_API_KEY** - Configurado y listo
- ✅ **NOVA_API_KEY** - Configurado y listo
- ✅ **NOVA_ACCOUNT_ID** - `cijimene5.nova-sdk.near` ✓
- ✅ **NEAR Network** - Mainnet configurado

**Lo que necesitas agregar para producción:**

1. ❌ **DATABASE_URL** - Para Better Auth (sesiones de usuario)
2. ❌ **AUTH_SECRET** - Para encriptar sesiones
3. ❌ **NEXT_PUBLIC_CONTRACT_ID** - Cuando despliegues el contrato

---

## 🔧 Configuración Pendiente

### 1. DATABASE_URL - Vercel Postgres (REQUERIDO para producción)

**¿Qué es?** Base de datos PostgreSQL para almacenar sesiones de Better Auth (login con wallet).

**Opción A: Vercel Postgres (Recomendado - Gratis)**

1. **Entra a tu proyecto en Vercel Dashboard**
2. **Storage → Create Database → Postgres**
3. **Selecciona región:** US East (iad1) recomendada
4. **Plan:** Free tier (256 MB, suficiente para MVP)
5. **Copia la `DATABASE_URL`:**
   - Vercel te mostrará varias URLs, usa la que dice `POSTGRES_URL`
   - Formato: `postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb`

6. **Agregar a `.env.local`:**
   ```env
   DATABASE_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"
   ```

7. **Ejecutar migraciones Prisma:**
   ```bash
   npx prisma generate
   npx prisma migrate deploy
   ```

**Opción B: PostgreSQL Local (Solo desarrollo)**

```bash
# Instalar PostgreSQL localmente
# macOS: brew install postgresql
# Ubuntu: sudo apt-get install postgresql

# Crear base de datos
createdb blindfold

# Agregar a .env.local
DATABASE_URL="postgresql://localhost:5432/blindfold"
```

**Opción C: Railway PostgreSQL (Alternativa gratis)**

1. Ve a [https://railway.app](https://railway.app)
2. New Project → Provision PostgreSQL
3. Copia el `DATABASE_URL` de las variables
4. Agrégalo a tu `.env.local`

---

### 2. AUTH_SECRET - Generar Ahora (30 segundos)

**¿Qué es?** Clave secreta para encriptar las sesiones de Better Auth.

**Cómo generarla:**

```bash
# En tu terminal, ejecuta:
openssl rand -base64 32
```

**Resultado ejemplo:**
```
J8fK3mN9pQ2rS5tU8vW1xY4zA7bC0dE6fG9hI2jK5lM=
```

**Agregar a `.env.local`:**
```env
AUTH_SECRET="J8fK3mN9pQ2rS5tU8vW1xY4zA7bC0dE6fG9hI2jK5lM="
```

⚠️ **IMPORTANTE:** Esta clave debe ser diferente en desarrollo y producción. Genera una nueva para Vercel.

---

### 3. NEXT_PUBLIC_CONTRACT_ID - Cuando despliegues el contrato

**¿Qué es?** ID de tu smart contract desplegado en NEAR.

**Para testnet:**
```env
NEXT_PUBLIC_CONTRACT_ID=blindfold.testnet
```

**Para mainnet (producción):**
```env
NEXT_PUBLIC_CONTRACT_ID=tu-cuenta.near
```

**Cómo desplegar el contrato:**

```bash
# 1. Crear cuenta en testnet
near create-account blindfold.testnet --useFaucet

# 2. Compilar el contrato
cd contract
./build.sh

# 3. Desplegar
near deploy \
  --accountId blindfold.testnet \
  --wasmFile target/wasm32-unknown-unknown/release/blindfold_contract.wasm

# 4. Inicializar
near call blindfold.testnet new \
  '{"owner":"blindfold.testnet"}' \
  --accountId blindfold.testnet

# 5. Agregar a .env.local
NEXT_PUBLIC_CONTRACT_ID=blindfold.testnet
```

---

## ✅ APIs que ya tienes configuradas

### NEAR AI Cloud API Key (Ya configurada ✓)

**Tu key actual:** `sk-8920ddc89c22472ea80d0fe7beb85871`

**Verificar créditos:**
- Ve a [https://cloud.near.ai](https://cloud.near.ai)
- Revisa sección "Credits" para ver balance
- Agregar créditos si es necesario

**Modelos disponibles:**
- DeepSeek V3.1: ~$1.05/M tokens input, ~$3.10/M tokens output
- GPT OSS 120B: ~$0.15/M tokens input, ~$0.55/M tokens output (más barato)

---

### NOVA SDK (Ya configurada ✓)

**Tu configuración actual:**
- API Key: `nova_sk_36Py4LqkeHsNvM8rntiMP7aHxsSJ2fM6` ✓
- Account ID: `cijimene5.nova-sdk.near` ✓

**Verificar balance NEAR:**
```bash
near state cijimene5.nova-sdk.near
```

**Agregar fondos si es necesario:**
- Las operaciones NOVA requieren NEAR tokens
- Costos aproximados:
  - Crear vault: ~0.05 NEAR
  - Upload data: ~0.01 NEAR
  - Retrieve: ~0.001 NEAR

**Obtener NEAR para testnet:**
```bash
# Usar faucet oficial
https://near-faucet.io
```

**Documentación:** [https://nova-25.gitbook.io/nova-docs/](https://nova-25.gitbook.io/nova-docs/)

---

---

## 📝 Configuración Completa de .env.local

Tu archivo `.env.local` debe verse así después de agregar lo que falta:

```env
# NEAR AI Cloud (✓ Ya configurado)
NEAR_AI_API_KEY=sk-8920ddc89c22472ea80d0fe7beb85871

# NOVA (✓ Ya configurado)
NOVA_API_KEY=nova_sk_36Py4LqkeHsNvM8rntiMP7aHxsSJ2fM6
NOVA_ACCOUNT_ID=cijimene5.nova-sdk.near

# Database (❌ AGREGAR - Vercel Postgres)
DATABASE_URL="postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb"

# Better Auth (❌ AGREGAR - Generar con: openssl rand -base64 32)
AUTH_SECRET="tu_secreto_generado_aqui"
AUTH_URL="http://localhost:3000"

# NEAR Network (✓ Ya configurado)
NEXT_PUBLIC_NEAR_NETWORK=mainnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.mainnet.near.org

# Smart Contract (❌ AGREGAR - Cuando despliegues)
NEXT_PUBLIC_CONTRACT_ID=blindfold.testnet

# App (✓ Ya configurado)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## Verificación de Setup

Una vez que tengas las API keys configuradas:

1. **Verifica que el archivo .env.local existe:**
   ```bash
   ls -la .env.local
   ```

2. **Ejecuta el servidor de desarrollo:**
   ```bash
   npm run dev
   ```

3. **Abre el navegador en:** [http://localhost:3000](http://localhost:3000)

4. **Prueba la conexión:**
   - Ingresa un NEAR account ID (ejemplo: `alice.near`)
   - El sistema debería:
     - Conectar tu wallet
     - Obtener datos del portfolio desde NEAR RPC
     - Crear un vault en NOVA
     - Permitirte hacer preguntas al AI advisor

---

## Costos Estimados para Testing

| Servicio | Operación | Costo Aproximado |
|----------|-----------|------------------|
| NEAR AI Cloud | 100 queries (DeepSeek V3.1) | ~$0.11 |
| NEAR AI Cloud | 100 queries (GPT OSS 120B) | ~$0.02 |
| NOVA | Crear vault | ~0.05 NEAR (~$0.15) |
| NOVA | 10 uploads | ~0.1 NEAR (~$0.30) |
| **Total para MVP testing** | | **< $1 USD** |

---

## Troubleshooting

### Error: "NEAR_AI_API_KEY is not configured"
- Verifica que el archivo `.env.local` existe
- Verifica que la key está en el formato correcto
- Reinicia el servidor de desarrollo (`npm run dev`)

### Error: "NOVA_API_KEY is not set"
- Asegúrate de haber copiado ambos valores (API_KEY y ACCOUNT_ID)
- Verifica que el ACCOUNT_ID tiene el formato `xxx.nova-sdk.near`

### Error: "Failed to fetch portfolio"
- El NEAR account ID debe existir en mainnet
- Usa un account real de NEAR (no un nombre inventado)
- El formato debe ser `nombre.near`

---

## Links Útiles

- **NEAR AI Cloud Dashboard:** [https://cloud.near.ai](https://cloud.near.ai)
- **NEAR AI Docs:** [https://docs.near.ai](https://docs.near.ai)
- **NOVA SDK:** [https://nova-sdk.com](https://nova-sdk.com)
- **NOVA Docs:** [https://nova-25.gitbook.io/nova-docs/](https://nova-25.gitbook.io/nova-docs/)
- **NEAR Protocol:** [https://near.org](https://near.org)
- **GitHub Repo:** [https://github.com/carlos-israelj/BlindFold](https://github.com/carlos-israelj/BlindFold)

---

## 🚀 Deployment en Vercel (Producción)

### Paso 1: Configurar Base de Datos

1. **Crear Vercel Postgres** (en Vercel Dashboard)
   - Storage → Create Database → Postgres
   - Free tier (256 MB)
   - Copia el `POSTGRES_URL`

### Paso 2: Preparar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables, agrega:

```env
# Database (de Vercel Postgres)
DATABASE_URL=postgres://default:xxx@xxx.postgres.vercel-storage.com:5432/verceldb

# NEAR AI Cloud (copiar de .env.local)
NEAR_AI_API_KEY=sk-8920ddc89c22472ea80d0fe7beb85871

# NOVA (copiar de .env.local)
NOVA_API_KEY=nova_sk_36Py4LqkeHsNvM8rntiMP7aHxsSJ2fM6
NOVA_ACCOUNT_ID=cijimene5.nova-sdk.near

# Better Auth (GENERAR NUEVA - NO usar la de desarrollo)
AUTH_SECRET=genera_nueva_con_openssl_rand_base64_32
AUTH_URL=https://tu-app.vercel.app

# NEAR Network
NEXT_PUBLIC_NEAR_NETWORK=testnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.testnet.near.org

# Smart Contract (cuando lo despliegues)
NEXT_PUBLIC_CONTRACT_ID=blindfold.testnet

# App URL (actualizar después del deploy)
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### Paso 3: Deploy

1. Push a GitHub: `git push origin master`
2. Vercel → Import Repository
3. Framework: Next.js (detectado automáticamente)
4. **Build Command:** `prisma generate && next build`
5. Deploy!

### Paso 4: Después del Deploy

1. **Actualizar AUTH_URL y NEXT_PUBLIC_APP_URL:**
   - Usa la URL que Vercel te asignó
   - Ej: `https://blindfold.vercel.app`
   - Actualiza las variables en Vercel
   - Redeploy (Settings → Redeploy)

2. **Ejecutar migraciones Prisma:**
   - Vercel lo hace automáticamente en build
   - Verificar en Deployment Logs

---

## 🔧 Configurar TEE Relayer (Railway)

El relayer necesita estar corriendo 24/7 para procesar requests del contrato.

### Paso 1: Crear Cuenta Relayer en NEAR

```bash
# Crear cuenta
near create-account relayer-blindfold.testnet --useFaucet

# Verificar
near state relayer-blindfold.testnet

# Exportar clave (GUARDAR EN SECRETO)
cat ~/.near-credentials/testnet/relayer-blindfold.testnet.json
```

### Paso 2: Deploy en Railway

1. **Ve a [https://railway.app](https://railway.app)**
2. **New Project → Deploy from GitHub**
3. **Selecciona tu repositorio**
4. **Root Directory:** `relayer`

### Paso 3: Variables de Entorno en Railway

```env
CONTRACT_ID=blindfold.testnet
NEAR_NETWORK=testnet
RELAYER_ACCOUNT_ID=relayer-blindfold.testnet
RELAYER_PRIVATE_KEY=ed25519:xxx (de ~/.near-credentials)
NEAR_AI_API_KEY=sk-8920ddc89c22472ea80d0fe7beb85871
NEAR_AI_MODEL=deepseek-ai/DeepSeek-V3.1
POLL_INTERVAL_MS=5000
NODE_ENV=production
```

### Paso 4: Verificar Logs

En Railway → View Logs, deberías ver:

```
🚀 TEE Relayer started
   Polling every 5000ms
   Environment: production

✓ Relayer polling active
```

---

## ✅ Checklist Final

Antes de ir a producción:

- [ ] DATABASE_URL configurado (Vercel Postgres)
- [ ] AUTH_SECRET generado (diferente para dev/prod)
- [ ] Smart contract desplegado en testnet
- [ ] NEXT_PUBLIC_CONTRACT_ID actualizado
- [ ] Relayer corriendo en Railway
- [ ] Relayer tiene fondos (>1 NEAR)
- [ ] Variables de entorno en Vercel
- [ ] Frontend desplegado y funcionando
- [ ] Prueba E2E: wallet → chat → verificación

---

## 💡 Tips de Producción

### Seguridad

- ✅ Nunca commitear `.env.local` al repositorio
- ✅ Usar AUTH_SECRET diferente en prod
- ✅ Marcar RELAYER_PRIVATE_KEY como "Sensitive" en Railway
- ✅ Regenerar API keys si se exponen

### Monitoreo

- **Frontend:** Vercel Analytics (gratis)
- **Relayer:** Railway Logs en tiempo real
- **Smart Contract:** `near view blindfold.testnet get_stats '{}'`

### Costos

- **Vercel:** Free tier (suficiente para MVP)
- **Railway:** $5 crédito inicial
- **NEAR Gas:** ~0.01 NEAR por request
- **NEAR AI Cloud:** Pay-as-you-go (~$0.001/query)

**Total estimado:** ~$5-10/mes para producción ligera

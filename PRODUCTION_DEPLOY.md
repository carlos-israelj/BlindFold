# 🚀 Guía de Despliegue en Producción

Esta guía te llevará paso a paso para desplegar BlindFold en producción usando Vercel + servicios complementarios.

---

## 📋 Prerequisitos

Antes de empezar, asegúrate de tener:

- [ ] Cuenta de GitHub con el repositorio
- [ ] Cuenta de Vercel (https://vercel.com)
- [ ] Cuenta de Railway.app o Render.com (para el relayer)
- [ ] NEAR testnet account con fondos (~2 NEAR)
- [ ] NEAR AI Cloud API key (https://cloud.near.ai)
- [ ] NOVA API key (https://nova-sdk.com)

---

## 🎯 Arquitectura de Producción

```
┌─────────────────────────────────────────────────────────┐
│                     VERCEL (Frontend)                    │
│  - Next.js App Router                                   │
│  - API Routes (/api/chat, /api/wallet, /api/vault)     │
│  - Vercel Postgres (Better Auth sessions)              │
│  - Edge Functions                                       │
└─────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────┐
│              RAILWAY/RENDER (TEE Relayer)               │
│  - Background worker 24/7                               │
│  - Polls smart contract every 5s                        │
│  - Forwards to NEAR AI Cloud TEE                        │
│  - Stores verifications on-chain                        │
└─────────────────────────────────────────────────────────┘
                            │
                            │ RPC
                            ▼
┌─────────────────────────────────────────────────────────┐
│                 NEAR BLOCKCHAIN (Testnet)                │
│  - Smart Contract: blindfold.testnet                    │
│  - On-chain verification registry                       │
│  - Yield/resume AI advisor                              │
└─────────────────────────────────────────────────────────┘
```

---

## 🔧 PASO 1: Configurar Cuentas NEAR

### 1.1 Cuenta del Smart Contract

```bash
# Instalar NEAR CLI
npm install -g near-cli

# Crear cuenta del contrato
near create-account blindfold.testnet --useFaucet

# Verificar balance (debe tener ~2 NEAR)
near state blindfold.testnet
```

### 1.2 Cuenta del Relayer

```bash
# Crear cuenta para el relayer
near create-account relayer-blindfold.testnet --useFaucet

# Exportar clave privada (¡GUARDAR EN SECRETO!)
cat ~/.near-credentials/testnet/relayer-blindfold.testnet.json
```

**Guardar esta información:**
- `account_id`: `relayer-blindfold.testnet`
- `private_key`: `ed25519:XXXXX...` (usar en variable de entorno)

---

## 🔧 PASO 2: Desplegar Smart Contract

```bash
cd contract

# Build el contrato
./build.sh

# Deploy a testnet
near deploy \
  --accountId blindfold.testnet \
  --wasmFile target/wasm32-unknown-unknown/release/blindfold_contract.wasm

# Inicializar el contrato
near call blindfold.testnet new \
  '{"owner":"blindfold.testnet"}' \
  --accountId blindfold.testnet

# Verificar que está desplegado
near view blindfold.testnet get_stats '{}'
```

**Salida esperada:**
```
[ '0', '0', '0' ]  // [total_requests, total_verifications, next_request_id]
```

---

## 🔧 PASO 3: Configurar Base de Datos (Vercel Postgres)

### 3.1 Crear Base de Datos en Vercel

1. Ve a tu proyecto en Vercel Dashboard
2. Storage → Create Database → Postgres
3. Copia el `DATABASE_URL` (formato: `postgres://...`)

### 3.2 Migrar Schema de Prisma

```bash
# Configurar DATABASE_URL localmente (temporal)
export DATABASE_URL="postgres://..."

# Generar Prisma Client
npx prisma generate

# Crear tablas
npx prisma migrate deploy
```

---

## 🔧 PASO 4: Desplegar Frontend en Vercel

### 4.1 Conectar Repositorio

1. Ve a https://vercel.com/new
2. Import Git Repository
3. Selecciona tu repo de GitHub
4. Framework Preset: **Next.js**
5. Root Directory: `.` (raíz del proyecto)

### 4.2 Configurar Variables de Entorno

En Vercel Dashboard → Settings → Environment Variables, agrega:

```bash
# Database
DATABASE_URL=postgres://vercel-postgres-url

# NEAR AI Cloud
NEAR_AI_API_KEY=tu_api_key_de_cloud.near.ai

# NOVA
NOVA_API_KEY=tu_api_key_de_nova-sdk.com
NOVA_ACCOUNT_ID=tu-cuenta.nova-sdk.near

# NEAR Network
NEXT_PUBLIC_NEAR_NETWORK=testnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.testnet.near.org
NEXT_PUBLIC_CONTRACT_ID=blindfold.testnet

# Better Auth (generar con: openssl rand -base64 32)
AUTH_SECRET=tu_secreto_aleatorio_de_32_caracteres
AUTH_URL=https://tu-app.vercel.app

# App
NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
```

### 4.3 Configurar Build Settings

```
Build Command: prisma generate && next build
Output Directory: .next
Install Command: npm install
```

### 4.4 Deploy

- Click **Deploy**
- Espera ~2-3 minutos
- Vercel te dará una URL: `https://tu-app.vercel.app`

---

## 🔧 PASO 5: Desplegar TEE Relayer (Railway.app)

### 5.1 Crear Proyecto en Railway

1. Ve a https://railway.app
2. New Project → Deploy from GitHub
3. Selecciona tu repositorio

### 5.2 Configurar Root Directory

- Settings → Root Directory: `relayer`

### 5.3 Configurar Variables de Entorno

```bash
CONTRACT_ID=blindfold.testnet
NEAR_NETWORK=testnet
RELAYER_ACCOUNT_ID=relayer-blindfold.testnet
RELAYER_PRIVATE_KEY=ed25519:tu_clave_privada_aqui
NEAR_AI_API_KEY=tu_api_key
NEAR_AI_MODEL=deepseek-ai/DeepSeek-V3.1
POLL_INTERVAL_MS=5000
NODE_ENV=production
```

⚠️ **IMPORTANTE:** El `RELAYER_PRIVATE_KEY` debe ser la clave que guardaste en el PASO 1.2

### 5.4 Deploy

- Railway detectará el Dockerfile automáticamente
- Click **Deploy**
- Espera ~2 minutos

### 5.5 Verificar Logs

```bash
# En Railway Dashboard → View Logs
# Deberías ver:
🚀 TEE Relayer started
   Polling every 5000ms
   Environment: production

✓ Relayer polling active
```

---

## 🔧 PASO 6: Verificación de Producción

### 6.1 Verificar Smart Contract

```bash
near view blindfold.testnet get_stats '{}'
```

### 6.2 Verificar Relayer

En Railway logs, confirma que está corriendo sin errores.

### 6.3 Verificar Frontend

1. Abre `https://tu-app.vercel.app`
2. Click "Connect Wallet"
3. Conecta tu NEAR wallet
4. Verifica que carga tu portfolio

### 6.4 Probar Flujo Completo (E2E)

1. **Frontend:** Haz una pregunta al AI advisor
2. **Smart Contract:** El request se crea on-chain
3. **Relayer:** Procesa el request (ver logs en Railway)
4. **TEE:** NEAR AI Cloud genera respuesta
5. **Relayer:** Almacena verificación on-chain
6. **Frontend:** Muestra respuesta con badge "Verified in TEE"

**Comando para verificar en blockchain:**
```bash
near view blindfold.testnet get_verification '{"verification_id":0}'
```

---

## 🔧 PASO 7: Monitoreo y Mantenimiento

### 7.1 Monitorear Relayer

**Railway Dashboard:**
- Logs en tiempo real
- CPU/Memory usage
- Restart automático si falla

**Comandos útiles:**
```bash
# Ver logs
railway logs --follow

# Restart manual
railway restart
```

### 7.2 Monitorear Smart Contract

```bash
# Total de requests procesados
near view blindfold.testnet get_stats '{}'

# Ver requests pendientes
near view blindfold.testnet get_pending_requests '{}'

# Ver verificaciones de un usuario
near view blindfold.testnet get_user_requests '{"user":"alice.testnet"}'
```

### 7.3 Monitorear Frontend (Vercel)

- Vercel Dashboard → Analytics
- Ver errores en tiempo real
- Logs de API routes

---

## 🔐 Seguridad en Producción

### Checklist de Seguridad:

- [ ] `RELAYER_PRIVATE_KEY` solo en variables de entorno (NUNCA en código)
- [ ] `AUTH_SECRET` generado con `openssl rand -base64 32`
- [ ] `DATABASE_URL` encriptado en Vercel
- [ ] CORS configurado correctamente en API routes
- [ ] Rate limiting activo (100 req/hora en Better Auth)
- [ ] HTTPS obligatorio (Vercel lo hace automático)
- [ ] Secrets en Vercel marcados como "Sensitive"

---

## 💰 Costos Estimados

### Gratis (Hackathon/MVP):
- **Vercel:** Hobby plan (gratis)
- **Railway:** $5 crédito inicial (suficiente para ~1 mes)
- **Vercel Postgres:** 256 MB gratis
- **NEAR Gas:** ~0.01 NEAR por request (~$0.02)
- **NEAR AI Cloud:** Pay-as-you-go (~$0.001 por query)

**Total mensual (estimado):** ~$5-10

### Producción:
- **Vercel Pro:** $20/mes
- **Railway Pro:** $5/mes
- **Vercel Postgres:** Incluido en Pro
- **NEAR Gas:** Escala con uso

---

## 🆘 Troubleshooting

### Error: "Relayer not processing requests"

**Verificar:**
```bash
# 1. Relayer tiene fondos?
near state relayer-blindfold.testnet

# 2. Hay requests pendientes?
near view blindfold.testnet get_pending_requests '{}'

# 3. Logs del relayer en Railway
# Debe mostrar polling cada 5 segundos
```

### Error: "Signature verification failed"

- Revisar que `NEAR_AI_API_KEY` es válida
- Verificar que el modelo existe: `deepseek-ai/DeepSeek-V3.1`
- Confirmar créditos en https://cloud.near.ai

### Error: "Database connection failed"

```bash
# Verificar DATABASE_URL
echo $DATABASE_URL

# Re-generar Prisma Client
npx prisma generate

# Re-aplicar migraciones
npx prisma migrate deploy
```

### Error: "Insufficient gas"

```bash
# El relayer necesita más NEAR
near send tu-cuenta.testnet relayer-blindfold.testnet 1

# Verificar balance
near state relayer-blindfold.testnet
```

---

## ✅ Checklist Final de Producción

Antes de presentar/publicar:

- [ ] Smart contract desplegado y verificado
- [ ] Relayer corriendo 24/7 en Railway
- [ ] Frontend desplegado en Vercel con dominio custom (opcional)
- [ ] Base de datos configurada y migraciones aplicadas
- [ ] Todas las env vars configuradas correctamente
- [ ] Prueba E2E completa (wallet → chat → verificación)
- [ ] Logs del relayer sin errores por 24 horas
- [ ] Balance del relayer > 1 NEAR
- [ ] NEAR AI Cloud tiene créditos
- [ ] NOVA vault funcional
- [ ] Verificación on-chain visible en NearBlocks

---

## 🎉 URLs de Producción

Una vez desplegado, tendrás:

- **Frontend:** `https://tu-app.vercel.app`
- **Smart Contract:** `https://testnet.nearblocks.io/address/blindfold.testnet`
- **Relayer Logs:** Railway Dashboard
- **Database:** Vercel Postgres Dashboard

---

## 📊 Demo para Jueces

Para demostrar el proyecto:

1. **Mostrar arquitectura:** Explica los 3 componentes (Vercel + Railway + NEAR)
2. **Conectar wallet:** Usa tu cuenta de testnet
3. **Ver portfolio:** Muestra el análisis de riesgo (HHI, concentration)
4. **Hacer pregunta al AI:** "What's my risk exposure?"
5. **Mostrar verificación:**
   - Click en badge "Verified in TEE"
   - Expandir hashes y firma
   - Abrir link a NearBlocks
   - Mostrar transaction on-chain
6. **Explicar privacidad:** TLS termina en TEE, no hay leak de datos
7. **Mostrar swap modal:** HOT Protocol integration (si HOT SDK está disponible)

---

**¡Listo para producción!** 🚀

Si tienes problemas, revisa los logs en:
- Vercel: Deployment Logs
- Railway: Application Logs
- NEAR: `near view blindfold.testnet get_stats '{}'`

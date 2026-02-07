# 🚀 Guía Rápida de Despliegue (5 minutos)

## Requisitos Previos
- Cuenta GitHub
- Cuenta Vercel
- Cuenta Railway.app
- NEAR testnet account
- API keys: NEAR AI Cloud + NOVA

---

## PASO 1: Desplegar Smart Contract (2 min)

```bash
# Crear cuenta
near create-account blindfold.testnet --useFaucet

# Deploy contrato
cd contract
./build.sh
near deploy --accountId blindfold.testnet --wasmFile target/wasm32-unknown-unknown/release/blindfold_contract.wasm

# Inicializar
near call blindfold.testnet new '{"owner":"blindfold.testnet"}' --accountId blindfold.testnet
```

---

## PASO 2: Desplegar Frontend en Vercel (2 min)

1. **Push a GitHub:**
   ```bash
   git push origin master
   ```

2. **Import en Vercel:**
   - Ve a https://vercel.com/new
   - Import tu repositorio
   - Framework: Next.js
   - Click Deploy

3. **Agregar Variables de Entorno** (Vercel Dashboard → Settings → Environment Variables):
   ```
   DATABASE_URL=postgres://... (crear Vercel Postgres primero)
   NEAR_AI_API_KEY=tu_key
   NOVA_API_KEY=tu_key
   NOVA_ACCOUNT_ID=tu-cuenta.nova-sdk.near
   NEXT_PUBLIC_NEAR_NETWORK=testnet
   NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.testnet.near.org
   NEXT_PUBLIC_CONTRACT_ID=blindfold.testnet
   AUTH_SECRET=genera_con_openssl_rand_base64_32
   AUTH_URL=https://tu-app.vercel.app
   NEXT_PUBLIC_APP_URL=https://tu-app.vercel.app
   ```

4. **Redeploy** después de agregar variables

---

## PASO 3: Desplegar Relayer en Railway (1 min)

1. **Crear cuenta relayer:**
   ```bash
   near create-account relayer.testnet --useFaucet
   ```

2. **Deploy en Railway:**
   - Ve a https://railway.app
   - New Project → Deploy from GitHub
   - Selecciona el repo
   - Root Directory: `relayer`

3. **Variables de Entorno:**
   ```
   CONTRACT_ID=blindfold.testnet
   NEAR_NETWORK=testnet
   RELAYER_ACCOUNT_ID=relayer.testnet
   RELAYER_PRIVATE_KEY=ed25519:... (de ~/.near-credentials/testnet/relayer.testnet.json)
   NEAR_AI_API_KEY=tu_key
   NEAR_AI_MODEL=deepseek-ai/DeepSeek-V3.1
   POLL_INTERVAL_MS=5000
   NODE_ENV=production
   ```

4. **Deploy** (Railway lo hace automáticamente)

---

## PASO 4: Verificar (30 seg)

1. **Frontend:** Abre tu URL de Vercel
2. **Relayer:** Ver logs en Railway (debe mostrar polling)
3. **Contrato:** `near view blindfold.testnet get_stats '{}'`

---

## ✅ Listo!

Tu app está en producción:
- **Frontend:** https://tu-app.vercel.app
- **Relayer:** Corriendo 24/7 en Railway
- **Contrato:** blindfold.testnet

---

Para guía detallada, ver: `PRODUCTION_DEPLOY.md`

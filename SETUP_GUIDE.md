# BlindFold - Setup Guide

Esta guía te ayudará a obtener las API keys necesarias para ejecutar BlindFold.

## API Keys Necesarias

### 1. NEAR AI Cloud API Key

**¿Qué es?** NEAR AI Cloud proporciona inferencia privada con TEEs (Trusted Execution Environments) usando Intel TDX + NVIDIA H200 GPUs.

**Pasos para obtenerla:**

1. Ve a [https://cloud.near.ai](https://cloud.near.ai)
2. Haz clic en "Sign up" o "Log in" (puedes usar Google, GitHub, o email)
3. Una vez dentro del dashboard:
   - Ve a la sección "Credits" o "API Keys"
   - Haz clic en "Generate API Key" o "New API Key"
   - Copia la key generada (formato: `near_ai_xxxxxxxxx`)
4. Guarda esta key en tu archivo `.env.local`:
   ```
   NEAR_AI_API_KEY=tu_key_aqui
   ```

**Notas:**
- Necesitarás credits para usar la API. NEAR AI Cloud puede ofrecer credits gratuitos para empezar
- Los precios varían por modelo:
  - DeepSeek V3.1: ~$1.05/M tokens input, ~$3.10/M tokens output
  - GPT OSS 120B: ~$0.15/M tokens input, ~$0.55/M tokens output

**Documentación:** [https://docs.near.ai/cloud](https://docs.near.ai/cloud)

---

### 2. NOVA API Key

**¿Qué es?** NOVA proporciona almacenamiento encriptado con AES-256-GCM, con keys manejadas en Shade TEEs.

**Pasos para obtenerla:**

1. Ve a [https://nova-sdk.com](https://nova-sdk.com)
2. Haz clic en "Login" (puedes usar Email, Google, Apple, o GitHub)
3. Una vez dentro:
   - Ve a "Manage Account" o "Settings"
   - Busca la sección "API Keys"
   - Haz clic en "Generate API Key"
   - Copia la key generada
4. También necesitarás tu NOVA Account ID (formato: `xxx.nova-sdk.near`)
   - Esto se crea automáticamente cuando haces login
   - Lo encontrarás en tu perfil o dashboard
5. Guarda ambos valores en tu `.env.local`:
   ```
   NOVA_API_KEY=tu_nova_key_aqui
   NOVA_ACCOUNT_ID=tu_cuenta.nova-sdk.near
   ```

**Notas:**
- NOVA opera en NEAR blockchain
- Las operaciones tienen pequeños costos en NEAR tokens:
  - Crear vault (register group): ~0.05 NEAR (~$0.15)
  - Upload data: ~0.01 NEAR por upload
  - Retrieve data: ~0.001 NEAR por query

**Documentación:** [https://nova-25.gitbook.io/nova-docs/](https://nova-25.gitbook.io/nova-docs/)

---

### 3. Configuración Final del .env.local

Tu archivo `.env.local` debe verse así:

```env
# NEAR AI Cloud (from cloud.near.ai dashboard)
NEAR_AI_API_KEY=tu_near_ai_key_aqui

# NOVA (from nova-sdk.com)
NOVA_API_KEY=tu_nova_key_aqui
NOVA_ACCOUNT_ID=tu_cuenta.nova-sdk.near

# NEAR Network (ya configurado)
NEXT_PUBLIC_NEAR_NETWORK=mainnet
NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.mainnet.near.org

# App (ya configurado)
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

## Siguiente Paso: Deployment en Vercel

Una vez que tengas todo funcionando localmente, puedes deployar a Vercel:

1. Push tu código a GitHub (ya hecho)
2. Ve a [https://vercel.com](https://vercel.com)
3. Importa tu repositorio
4. Configura las mismas environment variables en Vercel:
   - `NEAR_AI_API_KEY`
   - `NOVA_API_KEY`
   - `NOVA_ACCOUNT_ID`
5. Deploy!

Vercel detectará automáticamente que es un proyecto Next.js y lo configurará correctamente.

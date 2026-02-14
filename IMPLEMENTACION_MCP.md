# Implementación Completa del MCP Server

## Resumen de la Solución

Hemos creado una infraestructura completa para que NOVA SDK funcione con nuestro propio sistema de derivación de keys en TEE:

```
Usuario → Frontend → NOVA SDK → MCP Server (Railway) → Shade Agent (Phala TEE) → Deriva Key → Regresa
```

## Cambios Realizados

### 1. Shade Agent (Phala TEE)

**Archivos modificados:**
- `shade-agent/src/shade-key-api.ts` (NUEVO)
- `shade-agent/src/index.ts`
- `shade-agent/docker-compose.yml`
- `shade-agent/package.json`

**Funcionalidad agregada:**
- ✅ Servidor HTTP en puerto 3001
- ✅ Endpoint `POST /api/key-management/get_key`
- ✅ Endpoint `GET /health`
- ✅ Derivación determinística de keys usando HMAC-SHA256
- ✅ Keys basadas en: `HMAC(NOVA_API_KEY, account_id:group_id)`

**Nueva versión:** v1.0.6

### 2. MCP Server (Railway)

**Directorio:** `nova-mcp-server/`

**Archivos creados:**
- `server.py` - Servidor FastMCP
- `requirements.txt` - Dependencias Python
- `Dockerfile` - Para deployment
- `.env` - Configuración
- `README.md` - Documentación
- `DEPLOYMENT_GUIDE.md` - Guía paso a paso
- `railway.json` - Config de Railway

**Funcionalidad:**
- ✅ Tool `prepare_upload` - Obtiene encryption key
- ✅ Tool `finalize_upload` - Sube a IPFS vía Pinata
- ✅ Tool `prepare_retrieve` - Obtiene decryption key y descarga de IPFS

## Pasos para Deployment

### Paso 1: Build y Deploy Shade Agent v1.0.6

```bash
cd shade-agent

# Build
npm run build

# Build Docker image
docker build -t ghcr.io/carlos-israelj/blindfold-shade-agent:v1.0.6 .

# Login a GitHub Container Registry
echo $GITHUB_TOKEN | docker login ghcr.io -u carlos-israelj --password-stdin

# Push
docker push ghcr.io/carlos-israelj/blindfold-shade-agent:v1.0.6
```

### Paso 2: Actualizar Deployment en Phala

El `docker-compose.yml` ya tiene la configuración correcta con:
- Puerto 3001 expuesto
- Variable `SHADE_API_PORT=3001`
- Variable `PHALA_TEE=true`

**Actualizar en Phala Cloud Dashboard:**
1. Ve a tu deployment
2. Actualiza la imagen a `v1.0.6`
3. Asegúrate que el puerto 3001 está expuesto públicamente
4. Guarda la URL pública (ej: `https://xxx.phala.network`)

### Paso 3: Deploy MCP Server en Railway

```bash
cd nova-mcp-server

# Inicializar git
git init
git add .
git commit -m "Initial commit: NOVA MCP Server"

# Crear repo en GitHub y pushear
git remote add origin https://github.com/carlos-israelj/nova-mcp-server.git
git branch -M main
git push -u origin main
```

**En Railway:**
1. Ve a https://railway.app
2. New Project → Deploy from GitHub
3. Selecciona `nova-mcp-server`
4. Agrega variables de entorno:
   ```
   SHADE_API_URL=https://TU-DEPLOYMENT.phala.network:3001
   PINATA_API_KEY=c192386416bc897d0e8a
   PINATA_SECRET_KEY=c89935debb1910906c64dd5325685614fdd7553e2c039078af3e69adf5d57fd6
   PINATA_JWT=eyJhbGci...
   ```
5. Deploy
6. Settings → Networking → Generate Domain
7. Copia la URL (ej: `https://nova-mcp-server-production.up.railway.app`)

### Paso 4: Actualizar Frontend

Busca TODOS los lugares donde se inicializa `NovaSdk`:

```bash
cd /mnt/c/Users/CarlosIsraelJiménezJ/Documents/Near
grep -r "new NovaSdk" --include="*.ts" --include="*.tsx"
```

Actualiza cada instancia para usar tu MCP URL:

```typescript
// ANTES
const nova = new NovaSdk('ecuador10.nova-sdk.near', {
  apiKey: 'nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j',
  rpcUrl: 'https://rpc.testnet.near.org',
});

// DESPUÉS
const nova = new NovaSdk('ecuador10.nova-sdk.near', {
  apiKey: 'nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j',
  mcpUrl: 'https://nova-mcp-server-production.up.railway.app',  // ← TU URL
  rpcUrl: 'https://rpc.testnet.near.org',
});
```

Archivos probables a actualizar:
- `app/api/vault/portfolio/route.ts`
- Cualquier otro lugar que use NOVA SDK

### Paso 5: Deploy Frontend

```bash
# Commit cambios
git add .
git commit -m "feat: Use custom NOVA MCP Server with TEE key derivation"
git push

# Vercel lo deployará automáticamente
```

## Verificación

### 1. Test Shade Agent

```bash
# Reemplaza con tu URL real
curl https://TU-DEPLOYMENT.phala.network:3001/health
```

Debería responder:
```json
{
  "status": "healthy",
  "service": "shade-key-api",
  "timestamp": "2026-02-13T...",
  "tee_enabled": true
}
```

### 2. Test MCP Server

```bash
curl https://tu-mcp-server.railway.app/health
```

### 3. Test Key Derivation

```bash
curl -X POST https://TU-DEPLOYMENT.phala.network:3001/api/key-management/get_key \
  -H "Content-Type: application/json" \
  -d '{
    "account_id": "3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae",
    "group_id": "vault.3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae"
  }'
```

Debería responder con:
```json
{
  "shade_key": "base64_encoded_key...",
  "derived_at": "2026-02-13T..."
}
```

### 4. Test Flujo Completo

1. Ve a https://blindfold.lat/chat
2. Sube un nuevo portfolio
3. Revisa los logs:
   - **Railway**: Debería mostrar llamadas a `prepare_upload` y `finalize_upload`
   - **Phala**: Debería mostrar derivación de keys
4. Intenta recuperar el portfolio
5. Revisa los logs de `prepare_retrieve`

## Arquitectura Final

```
┌──────────────────────────────────────────────┐
│   Frontend (blindfold.lat - Vercel)         │
│   - Usuario interact con portfolio           │
│   - Usa NOVA SDK con mcpUrl custom          │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│   NOVA SDK (JavaScript en browser)          │
│   - Encripta/desencripta localmente          │
│   - Llama a MCP Server para keys             │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│   MCP Server (Railway - Python)              │
│   URL: nova-mcp-server-production.up.railway.app
│   - Tool: prepare_upload                     │
│   - Tool: finalize_upload                    │
│   - Tool: prepare_retrieve                   │
│   - Sube/baja de IPFS vía Pinata             │
└──────────────┬───────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│   Shade Agent (Phala TEE - Node.js)          │
│   URL: xxx.phala.network:3001                │
│   - POST /api/key-management/get_key         │
│   - Deriva keys: HMAC(API_KEY, account:group)│
│   - Keys nunca salen del TEE                 │
└──────────────────────────────────────────────┘
               │
               ▼
┌──────────────────────────────────────────────┐
│   IPFS (Pinata)                              │
│   - Almacena portfolios encriptados          │
│   - Acceso público pero sin utilidad         │
│     sin la key del TEE                       │
└──────────────────────────────────────────────┘
```

## Seguridad

✅ **Keys derivadas en TEE**: Las keys se generan en Phala usando HMAC con el API key secreto
✅ **Determinístico**: Mismo account+group siempre genera la misma key
✅ **Aislamiento**: Diferentes accounts/groups tienen keys diferentes
✅ **Nunca almacenadas**: Las keys se derivan on-demand y nunca se persisten
✅ **Encriptación client-side**: Los archivos se encriptan/desencriptan en el browser
✅ **IPFS público pero inútil**: Los archivos están encriptados, nadie puede leerlos sin la key

## Próximos Pasos

1. ✅ Build Shade Agent v1.0.6
2. ✅ Push imagen a ghcr.io
3. ⏳ Actualizar deployment en Phala
4. ⏳ Obtener URL pública de Phala
5. ⏳ Deploy MCP Server en Railway
6. ⏳ Actualizar frontend con mcpUrl
7. ⏳ Test end-to-end

## Troubleshooting

Ver guía completa en: `nova-mcp-server/DEPLOYMENT_GUIDE.md`

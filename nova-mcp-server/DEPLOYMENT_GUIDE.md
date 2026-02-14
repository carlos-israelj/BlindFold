# Guía de Deployment - NOVA MCP Server

## Paso 1: Obtener URL pública del Shade Agent en Phala

Primero necesitas la URL pública de tu Shade Agent que está corriendo en Phala Cloud.

### Opción A: Phala Cloud Dashboard
1. Ve a https://dashboard.phala.cloud
2. Busca tu deployment `blindfold-shade-agent`
3. Copia la URL pública (algo como `https://xxx.phala.network` o similar)

### Opción B: CLI de Phala
```bash
cd shade-agent
npx @phala/cli cvms get blindfold-shade-agent
```

Busca en el output la URL pública. Debería verse algo así:
```
Public URL: https://blindfold-shade-agent-xxx.phala.network
```

**⚠️ IMPORTANTE**: Esta URL debe terminar en `:3001` porque es el puerto del Shade Key API.
Ejemplo: `https://blindfold-shade-agent-xxx.phala.network:3001`

---

## Paso 2: Desplegar MCP Server en Railway

### 2.1 Preparar el repositorio

```bash
cd nova-mcp-server

# Inicializar git si no existe
git init
git add .
git commit -m "Initial commit: NOVA MCP Server"

# Crear repositorio en GitHub
# Ve a https://github.com/new
# Nombre: nova-mcp-server
# Pushea el código:
git remote add origin https://github.com/TU_USUARIO/nova-mcp-server.git
git branch -M main
git push -u origin main
```

### 2.2 Desplegar en Railway

1. **Crear cuenta**
   - Ve a https://railway.app
   - Sign up con GitHub

2. **Crear nuevo proyecto**
   - Click "New Project"
   - Selecciona "Deploy from GitHub repo"
   - Autoriza Railway a acceder a tus repos
   - Selecciona `nova-mcp-server`

3. **Configurar variables de entorno**

   En Railway dashboard, ve a tu proyecto → Settings → Variables:

   ```bash
   SHADE_API_URL=https://TU-SHADE-AGENT-URL.phala.network:3001
   PINATA_API_KEY=c192386416bc897d0e8a
   PINATA_SECRET_KEY=c89935debb1910906c64dd5325685614fdd7553e2c039078af3e69adf5d57fd6
   PINATA_JWT=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiI0MmQ2NzFmNC02ZWZlLTQzN2UtOTA0NC01OGJkNGM3YjY4YjEiLCJlbWFpbCI6ImN0amltZW5lemphcmFAZ21haWwuY29tIiwiZW1haWxfdmVyaWZpZWQiOnRydWUsInBpbl9wb2xpY3kiOnsicmVnaW9ucyI6W3siZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiRlJBMSJ9LHsiZGVzaXJlZFJlcGxpY2F0aW9uQ291bnQiOjEsImlkIjoiTllDMSJ9XSwidmVyc2lvbiI6MX0sIm1mYV9lbmFibGVkIjpmYWxzZSwic3RhdHVzIjoiQUNUSVZFIn0sImF1dGhlbnRpY2F0aW9uVHlwZSI6InNjb3BlZEtleSIsInNjb3BlZEtleUtleSI6ImMxOTIzODY0MTZiYzg5N2QwZThhIiwic2NvcGVkS2V5U2VjcmV0IjoiYzg5OTM1ZGViYjE5MTA5MDZjNjRkZDUzMjU2ODU2MTRmZGQ3NTUzZTJjMDM5MDc4YWYzZTY5YWRmNWQ1N2ZkNiIsImV4cCI6MTc3MjA2NzQwM30.TwQXY-sjNpfAtbGwi0vBt6Qs6JuTh6B5X4EIunNQc4I
   ```

4. **Deploy**
   - Railway detectará automáticamente el Dockerfile
   - Click "Deploy"
   - Espera unos 2-3 minutos

5. **Obtener URL pública**
   - Ve a Settings → Networking
   - Click "Generate Domain"
   - Copia la URL (ejemplo: `https://nova-mcp-server-production.up.railway.app`)

---

## Paso 3: Actualizar Frontend para usar tu MCP Server

Ahora necesitas actualizar el frontend para que use TU MCP Server en lugar del público.

### 3.1 Actualizar configuración de NOVA SDK

Edita el archivo donde inicializas NOVA SDK (probablemente en `app/api/vault/portfolio/route.ts`):

```typescript
// ANTES (usando MCP Server público que no funciona)
const nova = new NovaSdk('ecuador10.nova-sdk.near', {
  apiKey: 'nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j',
  rpcUrl: 'https://rpc.testnet.near.org',
});

// DESPUÉS (usando TU MCP Server)
const nova = new NovaSdk('ecuador10.nova-sdk.near', {
  apiKey: 'nova_sk_csdk39oEwHNjb3WNdlgC6V3tu0FqPk4j',
  mcpUrl: 'https://nova-mcp-server-production.up.railway.app', // ← Tu Railway URL
  rpcUrl: 'https://rpc.testnet.near.org',
});
```

### 3.2 Buscar todas las instancias de NovaSdk

```bash
cd /mnt/c/Users/CarlosIsraelJiménezJ/Documents/Near
grep -r "new NovaSdk" --include="*.ts" --include="*.tsx"
```

Actualiza TODAS las instancias para usar tu `mcpUrl`.

---

## Paso 4: Rebuild y Deploy del Shade Agent

El Shade Agent necesita exponer el puerto 3001 públicamente en Phala.

### 4.1 Build nueva versión

```bash
cd shade-agent

# Build
npm run build

# Build Docker image
docker build -t ghcr.io/carlos-israelj/blindfold-shade-agent:v1.0.6 .

# Push to GitHub Container Registry
docker push ghcr.io/carlos-israelj/blindfold-shade-agent:v1.0.6
```

### 4.2 Actualizar deployment en Phala

El `docker-compose.yml` ya está configurado con el puerto 3001 expuesto.

Si ya está desplegado en Phala, necesitas:
1. Actualizar la imagen a v1.0.6
2. Asegurarte que Phala expone el puerto 3001 públicamente

**Comando para actualizar:**
```bash
# Actualizar deployment en Phala
npx @phala/cli cvms update blindfold-shade-agent \
  --compose ./docker-compose.yml
```

---

## Paso 5: Verificar que todo funciona

### 5.1 Test Shade Agent API

```bash
# Reemplaza con tu URL real de Phala
curl https://TU-SHADE-AGENT.phala.network:3001/health

# Debería responder:
# {
#   "status": "healthy",
#   "service": "shade-key-api",
#   "timestamp": "2026-02-13T...",
#   "tee_enabled": true
# }
```

### 5.2 Test MCP Server

```bash
# Reemplaza con tu Railway URL
curl https://nova-mcp-server-production.up.railway.app/health

# Debería responder con status 200
```

### 5.3 Test del flujo completo

1. Ve a https://blindfold.lat/chat
2. Sube un portfolio nuevo
3. Verifica en logs de Railway que el MCP Server recibe las llamadas
4. Verifica en logs de Phala que el Shade Agent deriva las keys

---

## Troubleshooting

### Error: "Cannot connect to Shade Agent"

**Causa**: El MCP Server no puede alcanzar el Shade Agent en Phala

**Solución**:
1. Verifica que `SHADE_API_URL` en Railway apunta a la URL correcta
2. Verifica que Phala expone el puerto 3001 públicamente
3. Test con curl desde tu máquina local

### Error: "Shade key fetch failed: Internal Server Error"

**Causa**: El Shade Agent no puede derivar la key (probablemente NOVA SDK issue)

**Solución**:
1. Revisa logs del Shade Agent en Phala
2. Verifica que las variables NOVA_* están configuradas correctamente

### Error: "Pinata upload failed"

**Causa**: Credenciales de Pinata incorrectas o expiradas

**Solución**:
1. Verifica las credenciales en Railway
2. Regenera las credenciales en https://pinata.cloud si es necesario

---

## Resumen de URLs

Después del deployment, tendrás:

```
Frontend:        https://blindfold.lat
Shade Agent:     https://TU-DEPLOYMENT.phala.network:3001
MCP Server:      https://nova-mcp-server-production.up.railway.app
```

El flujo de datos será:
```
Usuario → Frontend → NOVA SDK → MCP Server → Shade Agent (TEE) → Devuelve key → MCP Server → IPFS
```

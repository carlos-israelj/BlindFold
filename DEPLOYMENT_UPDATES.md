# BlindFold - Deployment Updates

## Nuevas Funcionalidades Implementadas

### 1. Automatización de CID para Phala Cloud ✅

**Problema anterior:** Tenías que actualizar manualmente la variable de entorno `PORTFOLIO_CID` en Phala cada vez que actualizabas el portfolio.

**Solución implementada:**
- El Shade Agent ahora consulta automáticamente el CID más reciente desde el frontend
- Ya no necesitas actualizar la variable de entorno `PORTFOLIO_CID` manualmente
- El CID se actualiza automáticamente en la base de datos cada vez que subes un portfolio

**Cómo funciona:**
1. Usuario sube portfolio → El CID se guarda en la tabla `Vault` en PostgreSQL
2. Shade Agent ejecuta análisis → Consulta `/api/vault/latest-cid` para obtener el CID más reciente
3. Shade Agent descarga el portfolio desde NOVA usando el CID automáticamente

### 2. Alertas Visibles en el Frontend ✅

**Problema anterior:** Las alertas del Shade Agent solo aparecían en los logs del servidor Phala.

**Solución implementada:**
- Nuevo componente `AlertBanner` que muestra alertas críticas en la UI
- Las alertas se almacenan en la base de datos PostgreSQL (tabla `RiskAlert`)
- El Shade Agent envía alertas via webhook al endpoint `/api/agents/alerts`
- Polling automático cada 30 segundos para mostrar nuevas alertas

**Ubicación:** Las alertas aparecen en la parte superior de `/chat` cuando hay riesgo detectado.

### 3. Recomendaciones de Swap Específicas ✅

**Problema anterior:** El agente solo mostraba el HHI y el nivel de concentración, sin sugerencias concretas.

**Solución implementada:**
- El algoritmo de análisis de riesgo ahora genera recomendaciones específicas de rebalanceo
- Para cada asset sobreconcentrado (>25%), sugiere:
  - **SELL**: Qué token vender y cuánto ($USD)
  - **BUY**: Qué tokens comprar para diversificar
  - Porcentajes objetivo (current → target)
  - Razón de la recomendación

**Ejemplo de recomendación:**
```
📉 SELL NEAR
   Current: 100% → Target: 20%
   Amount: $3.20
   Reason: Reduce concentration from 100% to 20%

📈 BUY BTC
   Current: 0% → Target: 15%
   Amount: $1.60
   Reason: Add new asset for better diversification
```

### 4. Integración con SwapModal ✅

**Nueva funcionalidad:**
- Botón "Execute" en cada recomendación del AlertBanner
- Al hacer clic, abre el SwapModal pre-configurado con:
  - Token de origen/destino según la recomendación
  - Cantidad sugerida en USD
  - Banner informativo mostrando el objetivo de la AI
- El usuario solo necesita confirmar el swap con HOT Kit

---

## Pasos de Deployment

### 1. Actualizar Base de Datos

Ejecuta la migración de Prisma para crear la nueva tabla `RiskAlert`:

```bash
cd /mnt/c/Users/CarlosIsraelJiménezJ/Documents/Near
npx prisma migrate dev --name add_risk_alerts
npx prisma generate
```

### 2. Actualizar Variables de Entorno del Frontend

Asegúrate de tener estas variables en `.env`:

```bash
# Existing variables...

# No changes needed - everything works with existing variables!
```

### 3. Actualizar Variables de Entorno de Phala Cloud (Shade Agent)

Actualiza el archivo `.env` del Shade Agent:

```bash
# NEAR Configuration
NEAR_ACCOUNT_ID=3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae
NEAR_PRIVATE_KEY=<tu_private_key>
NEAR_NETWORK=mainnet

# NOVA Configuration
NOVA_ACCOUNT_ID=ecuador10.nova-sdk.near
NOVA_API_KEY=<tu_nova_api_key>
NOVA_GROUP_ID=vault.3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae

# ⭐ NUEVA: URL del frontend para consultar el CID automáticamente
FRONTEND_URL=https://blindfold.lat

# OPCIONAL: Ya no necesitas PORTFOLIO_CID (se obtiene automáticamente)
# PORTFOLIO_CID=QmYCsVNnBE3DDFhLsoz1BU48WxqFguxTpUALyLUb1YtWik

# Monitoring Configuration
SCHEDULE_CRON=0 9 * * *
MONITORING_ENABLED=true
```

### 4. Rebuild y Deploy del Shade Agent

```bash
cd shade-agent

# Build la nueva imagen Docker con las mejoras
docker build -t ghcr.io/carlos-israelj/blindfold-shade-agent:v1.0.4 .

# Push to GitHub Container Registry
docker push ghcr.io/carlos-israelj/blindfold-shade-agent:v1.0.4

# Deploy en Phala Cloud
# 1. Ve a Phala Cloud Dashboard
# 2. Actualiza la aplicación con la nueva imagen: v1.0.4
# 3. Actualiza las variables de entorno (agrega FRONTEND_URL)
# 4. Restart el container
```

### 5. Deploy del Frontend (Vercel)

```bash
# Commit los cambios
git add .
git commit -m "feat: Add automatic CID sync, risk alerts UI, and swap recommendations"

# Push a GitHub (trigger Vercel auto-deploy)
git push origin master
```

---

## Verificación del Deployment

### 1. Verifica que el Frontend esté actualizado

1. Ve a https://blindfold.lat/chat
2. Conecta tu wallet
3. Sube un portfolio nuevo
4. Deberías ver un mensaje: `Portfolio updated successfully! CID: Qm...`

### 2. Verifica que el Shade Agent consulte el CID automáticamente

Revisa los logs de Phala Cloud:

```
📡 Fetching latest CID from API: https://blindfold.lat/api/vault/latest-cid?accountId=...
✅ Latest CID from API: QmYCsVNnBE3DDFhLsoz1BU48WxqFguxTpUALyLUb1YtWik
   Last updated: 2026-02-13T20:50:50.256Z
Analyzing portfolio CID: QmYCsVNnBE3DDFhLsoz1BU48WxqFguxTpUALyLUb1YtWik
```

Si ves `⚠️  API returned 404`, significa que aún no hay portfolio subido.

### 3. Verifica que las alertas lleguen al frontend

1. Espera a que el Shade Agent ejecute el análisis (cada día a las 9 AM, o manualmente)
2. Los logs de Phala deberían mostrar:
```
✅ Alert sent to frontend successfully
```

3. En el frontend (`/chat`), deberías ver el `AlertBanner` con:
   - Severidad (CRITICAL/WARNING/INFO)
   - Mensaje de riesgo
   - HHI, concentración, assets, total value
   - Botón "View X Rebalancing Recommendations"

### 4. Verifica las recomendaciones de swap

1. Haz clic en "View Rebalancing Recommendations" en el AlertBanner
2. Deberías ver una lista como:
```
📉 SELL NEAR
   Current: 100% → Target: 20%
   Amount: $3.20
   Reason: Reduce concentration from 100% to 20%
   [Execute Button]
```

3. Haz clic en "Execute"
4. El SwapModal debería abrirse pre-configurado con:
   - Token FROM: NEAR (si es SELL)
   - Token TO: USDC (default)
   - Amount: 3.20
   - Banner azul explicando la recomendación

### 5. Trigger manual del análisis (para testing)

Si quieres probar sin esperar al cron job:

```bash
# Opción 1: Restart el container de Phala (ejecuta el análisis al inicio)
docker-compose restart

# Opción 2: Usa el endpoint del frontend (próximamente)
curl -X POST https://blindfold.lat/api/agents \
  -H "Content-Type: application/json" \
  -d '{"accountId": "tu-account.near", "action": "execute_analysis", "groupId": "vault.xxx"}'
```

---

## Troubleshooting

### El Shade Agent no encuentra el CID

**Síntomas:**
```
⚠️  Failed to fetch from API: fetch failed
Falling back to environment variable...
⚠️  No PORTFOLIO_CID available from API or environment.
```

**Soluciones:**
1. Verifica que `FRONTEND_URL` esté configurado correctamente en Phala Cloud
2. Verifica que el frontend esté desplegado y accesible
3. Asegúrate de que el usuario haya subido al menos un portfolio

### Las alertas no aparecen en el frontend

**Síntomas:** El Shade Agent dice `✅ Alert sent to frontend successfully` pero no aparecen en la UI.

**Soluciones:**
1. Verifica que la migración de Prisma se haya ejecutado (`RiskAlert` table exists)
2. Revisa los logs del endpoint `/api/agents/alerts` en Vercel
3. Verifica que el `accountId` sea correcto en el webhook

### El SwapModal no se abre con las recomendaciones

**Soluciones:**
1. Verifica que el componente `AlertBanner` esté importado en `/app/chat/page.tsx`
2. Revisa la consola del navegador para errores de JavaScript
3. Asegúrate de que `SwapModal` acepte el prop `recommendation`

---

## Arquitectura Actualizada

```
┌─────────────────────────────────────────────────────────┐
│         User's Browser (Vercel)                         │
│  - AlertBanner (muestra alertas del Shade Agent)        │
│  - SwapModal (pre-configurado con recomendaciones)      │
└─────────────────────────────────────────────────────────┘
                        ↑
                        │ Polling /api/agents/alerts
                        │
┌───────────────────────┼─────────────────────────────────┐
│         PostgreSQL (Neon)                               │
│  - RiskAlert table (almacena alertas)                   │
│  - Vault table (almacena CIDs)                          │
└─────────────────────────────────────────────────────────┘
                        ↑
                        │ POST /api/agents/alerts (webhook)
                        │ GET /api/vault/latest-cid
                        │
┌───────────────────────┼─────────────────────────────────┐
│    Shade Agent (Phala Cloud TEE)                        │
│  1. Consulta CID automáticamente desde API              │
│  2. Descarga portfolio desde NOVA                       │
│  3. Calcula HHI y genera recomendaciones                │
│  4. Envía alertas via webhook al frontend               │
└─────────────────────────────────────────────────────────┘
```

---

## Beneficios de las Mejoras

1. **Automatización completa**: No más variables de entorno manuales
2. **Visibilidad total**: Las alertas críticas son imposibles de ignorar
3. **Recomendaciones accionables**: Swaps pre-configurados listos para ejecutar
4. **Experiencia mejorada**: Flujo completo desde alerta → recomendación → ejecución
5. **Trazabilidad**: Todas las alertas quedan registradas en la base de datos

---

## Próximos Pasos (Opcional)

- [ ] Webhook adicional para notificaciones por email/Telegram
- [ ] Dashboard de historial de alertas
- [ ] Modo "Auto-Rebalance" (ejecuta swaps automáticamente)
- [ ] Backtesting de recomendaciones históricas
- [ ] Alertas personalizables (umbral de HHI)

---

**Versión del Shade Agent:** v1.0.4
**Fecha de implementación:** 2026-02-13
**Autor:** Claude Code Assistant

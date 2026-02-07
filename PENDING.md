# BlindFold - Tareas Pendientes

## ✅ Completado

### Base de Datos
- [x] Configurar Neon PostgreSQL
- [x] Aplicar migraciones de Prisma
- [x] Crear tablas: User, Session, Vault, VaultSnapshot, RateLimitEntry
- [x] Verificar conexión con DATABASE_URL

### Smart Contract
- [x] Actualizar a near-sdk 5.24.0
- [x] Compilar contrato (261KB WASM)
- [x] Desplegar a ecuador5.near en mainnet
- [x] Transacción verificada: https://www.nearblocks.io/txns/9bGL19b3x3eqdhNByNmphX2htv5FPhKPV3wudt6hoxw

### Configuración Local
- [x] Actualizar .env.local con mainnet
- [x] Configurar NEAR_AI_API_KEY
- [x] Configurar NOVA_API_KEY y NOVA_ACCOUNT_ID
- [x] Generar AUTH_SECRET
- [x] Instalar near-cli globalmente
- [x] Push de commits a GitHub

---

## ⚠️ Problemas Actuales

### Smart Contract - Error de Deserialización
**Prioridad: CRÍTICA**

El contrato desplegado en `ecuador5.near` tiene un error al ejecutar cualquier método:
```
Error: CompilationError(PrepareError(Deserialization))
```

**Posibles causas:**
1. Incompatibilidad entre near-sdk 5.24.0 y el runtime de NEAR mainnet
2. Problema con las colecciones `UnorderedMap` en near_sdk::store
3. Falta de inicialización del estado del contrato

**Soluciones a intentar:**
- [ ] Downgrade a near-sdk 5.0.0 o 5.1.0 (versiones más estables)
- [ ] Usar `IterableMap` en lugar de `UnorderedMap` (deprecation warning)
- [ ] Verificar que el WASM sea válido con `wasm-opt`
- [ ] Desplegar en testnet primero para debuggear
- [ ] Revisar ejemplos oficiales de NEAR con near-sdk 5.24.0

**Estado:** Sin inicializar, todos los métodos fallan

---

## 🔧 Tareas Pendientes

### 1. Smart Contract (Prioridad: ALTA)

#### Opción A: Resolver error actual
- [ ] Investigar issue de deserialización con near-sdk 5.24.0
- [ ] Probar compilación con diferentes flags de optimización
- [ ] Verificar compatibilidad del WASM con mainnet runtime
- [ ] Inicializar contrato: `near call ecuador5.near new '{"owner":"ecuador5.near"}' --accountId ecuador5.near --networkId mainnet`

#### Opción B: Recompilar con versión estable
- [ ] Cambiar Cargo.toml a near-sdk 5.0.0 o 5.1.0
- [ ] Actualizar sintaxis si es necesario
- [ ] Recompilar y redesplegar
- [ ] Inicializar contrato

#### Opción C: Usar testnet para debugging
- [ ] Crear cuenta en testnet: `near create-account blindfold-ecuador.testnet --useFaucet`
- [ ] Desplegar contrato en testnet
- [ ] Debuggear con logs más detallados
- [ ] Una vez funcional, migrar a mainnet

**Métodos del contrato a verificar:**
- [ ] `new(owner: AccountId)` - Inicialización
- [ ] `ask_advisor(question, portfolio_data)` - Crear request
- [ ] `mark_processing(request_id)` - Marcar como procesando
- [ ] `store_verification(...)` - Guardar verificación
- [ ] `get_pending_requests()` - Ver requests pendientes
- [ ] `get_stats()` - Ver estadísticas

---

### 2. Relayer Configuration (Prioridad: ALTA)

#### Preparación Local
- [ ] Actualizar `relayer/.env` con credenciales correctas
- [ ] Configurar CONTRACT_ID=ecuador5.near
- [ ] Configurar NEAR_NETWORK=mainnet
- [ ] Crear cuenta relayer si es necesario

#### Variables de Entorno para Railway
```env
CONTRACT_ID=ecuador5.near
NEAR_NETWORK=mainnet
RELAYER_ACCOUNT_ID=<crear_cuenta_relayer>
RELAYER_PRIVATE_KEY=<generar_clave>
NEAR_AI_API_KEY=sk-8920ddc89c22472ea80d0fe7beb85871
NEAR_AI_MODEL=deepseek-ai/DeepSeek-V3.1
POLL_INTERVAL_MS=5000
NODE_ENV=production
```

#### Deployment
- [ ] Crear cuenta relayer en mainnet (o usar ecuador5.near como relayer)
- [ ] Exportar private key: `cat ~/.near-credentials/mainnet/relayer.near.json`
- [ ] Deploy en Railway:
  - [ ] Ir a https://railway.app
  - [ ] New Project → Deploy from GitHub
  - [ ] Seleccionar repositorio BlindFold
  - [ ] Root Directory: `relayer`
  - [ ] Agregar variables de entorno
  - [ ] Deploy
- [ ] Verificar logs en Railway
- [ ] Confirmar polling activo

---

### 3. Frontend Deployment (Prioridad: MEDIA)

#### Pre-deployment
- [ ] Verificar que `npm run build` funciona localmente
- [ ] Revisar que no hay errores de TypeScript
- [ ] Probar conexión de wallet localmente

#### Vercel Deployment
- [ ] Ir a https://vercel.com/new
- [ ] Import repositorio desde GitHub
- [ ] Framework: Next.js (detectado automáticamente)
- [ ] Root Directory: `.` (raíz del proyecto)
- [ ] Build Command: `npx prisma generate && next build`
- [ ] Agregar variables de entorno:
  ```
  DATABASE_URL=<copiar de .env.local>
  NEAR_AI_API_KEY=sk-8920ddc89c22472ea80d0fe7beb85871
  NOVA_API_KEY=nova_sk_36Py4LqkeHsNvM8rntiMP7aHxsSJ2fM6
  NOVA_ACCOUNT_ID=cijimene5.nova-sdk.near
  AUTH_SECRET=<GENERAR NUEVO - NO usar el de dev>
  AUTH_URL=https://<tu-app>.vercel.app
  NEXT_PUBLIC_NEAR_NETWORK=mainnet
  NEXT_PUBLIC_NEAR_RPC_URL=https://rpc.mainnet.near.org
  NEXT_PUBLIC_CONTRACT_ID=ecuador5.near
  NEXT_PUBLIC_APP_URL=https://<tu-app>.vercel.app
  ```
- [ ] Deploy
- [ ] Actualizar AUTH_URL y NEXT_PUBLIC_APP_URL con URL real
- [ ] Redeploy con URLs actualizadas

---

### 4. Testing End-to-End (Prioridad: MEDIA)

#### Flujo Completo
1. **Conectar Wallet**
   - [ ] Abrir https://<tu-app>.vercel.app
   - [ ] Click "Connect Wallet"
   - [ ] Conectar con Meteor wallet (ecuador5.near)
   - [ ] Verificar sesión persistente

2. **Cargar Portfolio**
   - [ ] Verificar que FastNEAR API trae datos
   - [ ] Confirmar que se muestra balance de NEAR
   - [ ] Ver tokens FT si existen
   - [ ] Calcular HHI y mostrar risk score

3. **Crear Vault NOVA**
   - [ ] Click "Create Vault"
   - [ ] Verificar que se crea en NOVA
   - [ ] Confirmar que datos se encriptan
   - [ ] Ver CID en IPFS

4. **Hacer Pregunta al AI**
   - [ ] Escribir: "What's my risk exposure?"
   - [ ] Verificar que se crea request en contrato
   - [ ] Confirmar que relayer procesa
   - [ ] Ver respuesta streaming desde NEAR AI Cloud
   - [ ] Verificar firma TEE

5. **Verificación On-Chain**
   - [ ] Click badge "Verified in TEE"
   - [ ] Ver SHA-256 hashes
   - [ ] Ver firma ECDSA
   - [ ] Click "View on NearBlocks"
   - [ ] Confirmar transacción visible públicamente

---

### 5. Documentation Updates (Prioridad: BAJA)

- [ ] Actualizar README.md con:
  - [ ] URL de producción
  - [ ] Pasos de deployment reales
  - [ ] Troubleshooting basado en problemas encontrados
- [ ] Actualizar SETUP_GUIDE.md:
  - [ ] Marcar como completado lo que ya está hecho
  - [ ] Agregar sección de problemas conocidos
- [ ] Crear TROUBLESHOOTING.md:
  - [ ] Error de deserialización del contrato
  - [ ] Problemas de conexión con wallet
  - [ ] Issues con NOVA
  - [ ] Problemas del relayer

---

### 6. Monitoring & Maintenance (Prioridad: BAJA)

#### Setup Monitoring
- [ ] Configurar Vercel Analytics
- [ ] Monitorear logs del relayer en Railway
- [ ] Revisar métricas de NEAR AI Cloud (uso de créditos)
- [ ] Verificar storage usado en NOVA

#### Smart Contract Monitoring
- [ ] Verificar balance de ecuador5.near periódicamente
- [ ] Monitorear gas usado por transacciones
- [ ] Revisar número de requests procesados: `near view ecuador5.near get_stats '{}'`

---

## 📊 Costos Estimados

### Setup Inicial
- ✅ NEAR Testnet: $0 (faucet gratuito)
- ✅ Neon Database: $0 (free tier)
- ✅ Vercel: $0 (hobby plan)
- ⏳ Railway: $5 crédito inicial
- ⏳ NEAR Mainnet Gas: ~0.01 NEAR por request (~$0.025)

### Mensual (Producción Ligera)
- Vercel: $0 (free tier suficiente)
- Railway: ~$5/mes
- NEAR AI Cloud: ~$0.001/query (pay-as-you-go)
- NEAR Gas: ~$0.50/mes (50 requests)
- **Total: ~$5-6/mes**

---

## 🚨 Blockers

### CRÍTICO
1. **Smart Contract no inicializado** - Impide toda la funcionalidad
   - Sin el contrato funcional, el relayer no puede procesar requests
   - La app frontend puede conectarse pero no ejecutar acciones

### ALTO
2. **Relayer no desplegado** - Necesario para procesar requests del contrato
3. **Frontend no en producción** - No se puede probar el flujo completo

---

## 📅 Próximos Pasos Recomendados

### Corto Plazo (Hoy)
1. ✅ Push de commits a GitHub
2. ⏳ Resolver error del smart contract (escoger opción A, B o C)
3. ⏳ Inicializar contrato exitosamente
4. ⏳ Desplegar relayer en Railway

### Mediano Plazo (Esta Semana)
1. Desplegar frontend en Vercel
2. Testing E2E completo
3. Documentar problemas encontrados
4. Ajustar configuración según sea necesario

### Largo Plazo (Antes de Producción)
1. Setup monitoring y alertas
2. Optimizar costos
3. Agregar más features según feedback
4. Preparar para NEARCON 2026 demo

---

**Última actualización:** 2026-02-07
**Estado del proyecto:** 60% completado, bloqueado por error de contrato
**Próxima acción:** Resolver deserialización del smart contract

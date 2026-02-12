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

## ✅ Problemas Resueltos

### Smart Contract - Error de Deserialización
**Estado: RESUELTO ✅**

El contrato estaba compilado con Rust 1.93.0, incompatible con el runtime de NEAR.

**Solución aplicada:**
- [x] Downgrade de Rust a 1.86.0
- [x] Recompilación con `cargo-near build non-reproducible-wasm`
- [x] Redespliegue exitoso a ecuador5.near
- [x] Inicialización del contrato: `near call ecuador5.near new '{"owner":"ecuador5.near"}' --accountId ecuador5.near --networkId mainnet`

**Estado:** ✅ Contrato funcional en mainnet

### Relayer - Dependencias y Deploy
**Estado: RESUELTO ✅**

**Problemas encontrados y resueltos:**
- [x] tsx no estaba en dependencies (movido de devDependencies)
- [x] near-kit v0.1.0 incompatible con Node.js 22 (actualizado a v0.8.2)
- [x] API de near-kit cambió (eliminada clase Account, usar Near directamente)
- [x] Deploy exitoso a Render: https://blindfold-relayer.onrender.com

**Estado:** ✅ Relayer funcional en producción

---

## 🔧 Tareas Pendientes

### 1. Smart Contract (Prioridad: ✅ COMPLETADO)

- [x] Downgrade de Rust a 1.86.0
- [x] Recompilar con cargo-near
- [x] Redesplegar a ecuador5.near
- [x] Inicializar contrato exitosamente

**Métodos del contrato verificados:**
- [x] `new(owner: AccountId)` - Inicializado ✅
- [x] Contrato desplegado en: ecuador5.near
- [x] Transacción de inicialización verificada en NearBlocks

---

### 2. Relayer Configuration (Prioridad: ✅ COMPLETADO)

#### Preparación Local
- [x] Actualizar `relayer/.env` con credenciales correctas
- [x] Configurar CONTRACT_ID=ecuador5.near
- [x] Configurar NEAR_NETWORK=mainnet
- [x] Actualizar near-kit a v0.8.2
- [x] Migrar código a nueva API de near-kit

#### Variables de Entorno (Render)
```env
CONTRACT_ID=ecuador5.near
NEAR_NETWORK=mainnet
RELAYER_ACCOUNT_ID=ecuador5.near
RELAYER_PRIVATE_KEY=<configurado en Render>
NEAR_AI_API_KEY=sk-8920ddc89c22472ea80d0fe7beb85871
NEAR_AI_MODEL=deepseek-ai/DeepSeek-V3.1
POLL_INTERVAL_MS=5000
NODE_ENV=production
PORT=3001
```

#### Deployment
- [x] Deploy en Render (cambio de Railway a Render)
- [x] Configurar Web Service desde GitHub
- [x] Agregar variables de entorno
- [x] Deploy exitoso
- [x] URL: https://blindfold-relayer.onrender.com
- [x] Health check endpoint: /health
- [x] Verificar logs en Render
- [x] Confirmar polling activo

---

### 3. Frontend Deployment (Prioridad: 🔄 EN PROGRESO)

#### Pre-deployment
- [x] Instalar @hot-labs/kit y @hot-labs/omni-sdk
- [x] Configurar HOT Kit para multi-chain wallet support
- [x] Simplificar Better Auth configuration
- [x] Resolver error de prismaAdapter (necesita provider: "postgresql")
- [x] Verificar que `npm run build` funciona localmente ✅
- [x] Revisar que no hay errores de TypeScript ✅
- [x] Integrar HOT Protocol wallet connection en UI ✅
- [x] Resolver errores de webpack con módulos ESM ✅
- [ ] Probar conexión de wallet localmente

#### Configuración Completada
- [x] Better Auth configurado con prismaAdapter
- [x] HOT Kit API keys configurados
- [x] transpilePackages agregados a next.config.js para @hot-labs/kit

#### Vercel Deployment
- [ ] Ir a https://vercel.com/new
- [ ] Import repositorio desde GitHub
- [ ] Framework: Next.js (detectado automáticamente)
- [ ] Root Directory: `.` (raíz del proyecto)
- [ ] Build Command: `npx prisma generate && next build`
- [ ] Agregar variables de entorno (ver VERCEL_DEPLOY.md - NO commitear)
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

### ✅ RESUELTO - Smart Contract
~~**Smart Contract no inicializado**~~ - ✅ COMPLETADO
- ✅ Contrato funcional y desplegado en ecuador5.near
- ✅ Inicialización exitosa en mainnet

### ✅ RESUELTO - Relayer
~~**Relayer no desplegado**~~ - ✅ COMPLETADO
- ✅ Relayer funcional en https://blindfold-relayer.onrender.com
- ✅ Polling activo para procesar requests

### 🔄 EN PROGRESO
**Frontend deployment a Vercel** - Build exitoso ✅
- [x] Better Auth configurado correctamente
- [x] HOT Kit packages instalados
- [x] Resolver errores finales de build ✅
- [x] HOT Protocol wallet connection integrado ✅
- [x] Webpack configurado para módulos ESM ✅
- [ ] Deploy a Vercel
- [ ] Testing E2E

---

## 📅 Próximos Pasos Recomendados

### Corto Plazo (Hoy)
1. ✅ Push de commits a GitHub
2. ✅ Resolver error del smart contract (Opción B ejecutada: downgrade Rust a 1.86.0)
3. ✅ Inicializar contrato exitosamente
4. ✅ Desplegar relayer en Render
5. 🔄 Resolver errores finales de build frontend
6. ⏳ Desplegar frontend en Vercel

### Mediano Plazo (Esta Semana)
1. 🔄 Desplegar frontend en Vercel (en progreso)
2. ⏳ Verificar HOT Kit API y actualizar integración
3. ⏳ Testing E2E completo
4. ⏳ Documentar problemas encontrados
5. ⏳ Ajustar configuración según sea necesario

### Largo Plazo (Antes de Producción)
1. Setup monitoring y alertas
2. Optimizar costos
3. Agregar más features según feedback
4. Preparar para NEARCON 2026 demo

---

**Última actualización:** 2026-02-10
**Estado del proyecto:** 85% completado
**Componentes operacionales:**
- ✅ Smart Contract (ecuador5.near) - Funcional en mainnet
- ✅ Relayer (Render) - https://blindfold-relayer.onrender.com
- ✅ Database (Neon PostgreSQL) - Configurado con Prisma
- ✅ HOT Kit - Packages instalados
- 🔄 Frontend - Build en progreso

**Próxima acción:** Resolver errores finales de build y desplegar a Vercel

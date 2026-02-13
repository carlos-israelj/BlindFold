# Plan de Pruebas - NOVA Vault Integration

## Estado Actual

✅ Código completo y listo
✅ Base de datos actualizada (migración aplicada)
✅ Sin errores de TypeScript
⏳ Pendiente: Push a GitHub y despliegue a Vercel

## Pasos para Probar

### 1. Push a GitHub (Manual)

Desde tu terminal local, ejecuta:

```bash
cd /mnt/c/Users/CarlosIsraelJiménezJ/Documents/Near
git push origin master
```

Esto hará que Vercel detecte automáticamente los cambios y comience el despliegue.

### 2. Probar el Flujo Completo en Vercel

Una vez desplegado, sigue estos pasos:

#### A. Configurar NOVA

1. Ve a tu aplicación en Vercel
2. Inicia sesión con tu wallet NEAR (`ecuador5.near`)
3. Verás el banner: **"Enable NOVA Encrypted Vault"**
4. Click en **"Setup NOVA"**
5. Ingresa:
   - NOVA Account ID: `ecuador5.nova-sdk.near`
   - API Key: [tu API key de NOVA]
6. Click **"Save"**

#### B. Configurar Grupo

El banner cambiará automáticamente a: **"Configure Your Vault Group"**

**Opción 1: Unirse a grupo existente (GRATIS)**
1. Click **"Configure Group"**
2. Selecciona: "Join Existing Group"
3. Ingresa: `ecuador5-portfolio-vault`
4. Click **"Continue"**

**Opción 2: Crear grupo nuevo (~1.3 NEAR)**
1. Click **"Configure Group"**
2. Selecciona: "Create New Private Group"
3. Ingresa un nombre único: `mi-portfolio-vault`
4. Click **"Continue"**
5. Confirma la transacción en tu wallet

#### C. Subir Portfolio

El banner cambiará a: **"Add Your Portfolio"**

1. Click **"Add Portfolio"**
2. Ingresa tus activos, por ejemplo:
   ```
   Asset 1:
   - Name: Bitcoin
   - Amount: 0.5
   - Value: 30000

   Asset 2:
   - Name: Ethereum
   - Amount: 5
   - Value: 10000

   Asset 3:
   - Name: NEAR
   - Amount: 1000
   - Value: 5000
   ```
3. Click **"+ Add Asset"** para agregar más
4. Verifica el total calculado automáticamente
5. Click **"💾 Save to NOVA Vault"**

✅ El banner desaparecerá y verás el botón **"Update Portfolio"** en el header

### 3. Actualizar Portfolio (Opcional)

En cualquier momento puedes:
1. Click en **"Update Portfolio"** en el header
2. Modifica los valores de tus activos
3. Agrega o elimina activos
4. Click **"Save to NOVA Vault"**

Esto creará una nueva versión de tu portfolio en NOVA.

## Verificar Shade Agent en Phala Cloud TEE

### Opción A: Via Phala Dashboard

1. Ve a: https://dashboard.phala.network
2. Inicia sesión
3. Ve a tus containers
4. Click en tu Shade Agent container
5. Ve a "Logs"

**Deberías ver:**
```
✅ NOVA Client initialized successfully
🔍 Checking for portfolio updates...
📊 Portfolio found for ecuador5.near
💰 Total value: $45,000
📈 HHI: 0.4444 (Medium concentration)
```

### Opción B: Via Script

Desde tu terminal local:

```bash
cd shade-agent
./check-logs.sh
```

Esto mostrará los logs más recientes del Shade Agent.

## Verificar Datos en NOVA

### Usando NOVA CLI

```bash
# Instalar NOVA CLI (si no lo tienes)
npm install -g @calimero-is-near/nova-sdk

# Listar transacciones del grupo
nova-cli list-transactions --group-id ecuador5-portfolio-vault

# Ver el CID más reciente
nova-cli get-file --group-id ecuador5-portfolio-vault --cid <CID_DE_LA_RESPUESTA>
```

### Verificación Manual

1. Ve a NEAR Explorer: https://nearblocks.io/address/ecuador5.near
2. Busca transacciones recientes a `nova-sdk.near`
3. Verifica que hay una transacción de "upload" exitosa

## Expected Results

### Frontend (Vercel)

✅ Banner de setup progresivo funciona
✅ Modal de selección de grupo muestra costos claramente
✅ Formulario de portfolio valida correctamente
✅ Datos se suben a NOVA exitosamente
✅ Botón "Update Portfolio" aparece después del setup
✅ Se muestra CID del portfolio en la respuesta

### Backend (NOVA)

✅ Datos encriptados en IPFS
✅ Metadata incluye timestamp y accountId
✅ Formato JSON compatible con Shade Agent:
```json
{
  "assets": [
    {"symbol": "Bitcoin", "balance": 0.5, "value": 30000},
    {"symbol": "Ethereum", "balance": 5, "value": 10000},
    {"symbol": "NEAR", "balance": 1000, "value": 5000}
  ],
  "metadata": {
    "uploadedAt": "2026-02-13T15:00:00Z",
    "uploadedBy": "ecuador5.near",
    "version": "1.0"
  }
}
```

### Shade Agent (Phala TEE)

✅ Se conecta a NOVA correctamente
✅ Lee datos encriptados del grupo
✅ Desencripta el portfolio
✅ Calcula HHI (índice de concentración)
✅ Imprime análisis en logs

**HHI Formula:**
```
HHI = Σ(market_share_i)²

Example:
BTC: 30000/45000 = 66.67% → 0.4444
ETH: 10000/45000 = 22.22% → 0.0494
NEAR: 5000/45000 = 11.11% → 0.0123
HHI = 0.5061 (Medium concentration)
```

**Risk Levels:**
- HHI < 0.15: Low risk (well diversified)
- HHI 0.15-0.25: Moderate risk
- HHI > 0.25: High risk (concentrated)

## Troubleshooting

### Error: "Group does not exist"
**Causa:** El grupo no ha sido creado aún
**Solución:** Crear grupo primero usando "Create New Private Group"

### Error: "NOVA not configured"
**Causa:** No se han guardado las credenciales de NOVA
**Solución:** Completar paso de "Setup NOVA" primero

### Error: "Authentication failed"
**Causa:** API key incorrecta o expirada
**Solución:** Verificar API key en NOVA dashboard y actualizar

### Shade Agent no lee datos
**Causa:** Posibles razones:
1. Container no está corriendo
2. Variables de entorno incorrectas
3. Grupo ID incorrecto

**Solución:**
```bash
# Verificar container
cd shade-agent
docker-compose ps

# Verificar logs
./check-logs.sh

# Reiniciar container
docker-compose restart
```

## Success Criteria

✅ Usuario puede completar el flujo en menos de 2 minutos
✅ Datos se suben correctamente a NOVA
✅ Shade Agent puede leer y analizar el portfolio
✅ HHI se calcula correctamente
✅ No hay errores en consola o logs

## Next Steps After Testing

Si todo funciona correctamente:

1. **Documentación para usuarios finales**
   - Screenshots del flujo
   - Video tutorial
   - FAQ

2. **Features adicionales**
   - Mostrar histórico de portfolios
   - Gráficas de HHI en el tiempo
   - Alertas cuando HHI > threshold
   - Import desde CSV/Excel

3. **Optimizaciones**
   - Listar grupos disponibles automáticamente
   - Auto-fetch precios de CoinGecko
   - Calcular HHI en frontend (preview)

---

**Fecha de prueba**: Febrero 13, 2026
**Versión**: 1.0.0
**Tester**: ecuador5.near

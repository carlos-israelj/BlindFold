# ✅ NOVA Vault Setup - Completado

## 📋 Resumen de Cambios

Se actualizó el sistema para manejar correctamente la asociación entre:
- **Wallet Address** (dirección hexadecimal larga que se conecta)
- **NOVA Account ID** (cuenta NEAR creada por NOVA SDK: `username.nova-sdk.near`)

## 🔄 Cambios Realizados

### 1. Base de Datos (Prisma Schema)
- ✅ Agregado campo `novaAccountId` al modelo `User`
- ✅ Migración aplicada: `20260213014146_add_nova_account_id`

```prisma
model User {
  id             String   @id @default(cuid())
  accountId      String   @unique  // Wallet address (hex)
  publicKey      String
  novaApiKey     String?  // Encrypted NOVA API key
  novaAccountId  String?  // NOVA account (username.nova-sdk.near)
  // ...
}
```

### 2. Frontend - NovaSetupModal

#### Mejoras en las Instrucciones:
- ✅ **Paso 2 actualizado**: Ahora explica claramente que NOVA crea una cuenta con formato `username.nova-sdk.near`
- ✅ **Paso 4 mejorado**: Se muestra advertencia clara sobre fondos mínimos requeridos:
  - Crear vault: ~0.67 NEAR
  - Subir archivo: ~0.01 NEAR
  - **Recomendado: 1 NEAR mínimo**

#### Nuevos Campos:
- ✅ Agregado input para **NOVA Account ID** (`yourname.nova-sdk.near`)
- ✅ Input existente para **NOVA API Key**
- ✅ Validación de formato para ambos campos

### 3. Backend - API `/api/user/nova`

#### POST - Guardar Credenciales:
- ✅ Ahora acepta `novaApiKey` y `novaAccountId`
- ✅ Validación de formato:
  - API Key debe comenzar con `nova_sk_`
  - Account ID debe terminar con `.nova-sdk.near`
- ✅ Guarda ambos valores encriptados/seguros en la base de datos

#### GET - Verificar Estado:
- ✅ Retorna si tiene API key configurada
- ✅ Retorna el NOVA Account ID si existe

### 4. Librería NOVA (`lib/nova.ts`)

- ✅ Actualizado `getNovaClient()` para usar `novaAccountId` de la base de datos
- ✅ Ya no asume que el accountId es el NOVA account
- ✅ Separa correctamente:
  - `accountId` = Wallet address (para buscar usuario)
  - `novaAccountId` = Cuenta NOVA (para crear cliente SDK)

## 🎯 Flujo de Usuario Actualizado

### 1. Conexión de Wallet
```
Usuario conecta con wallet:
3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae
↓
Sistema busca/crea usuario con ese accountId
↓
Si no tiene NOVA API key → Muestra modal de setup
```

### 2. Setup NOVA (Modal)
```
Usuario ve instrucciones:
1. Ir a nova-sdk.com
2. Crear cuenta (NOVA asigna: username.nova-sdk.near)
3. Generar API key
4. Agregar fondos (mínimo 1 NEAR recomendado)

Usuario ingresa:
- NOVA Account ID: ecuador10.nova-sdk.near
- API Key: nova_sk_l63lwEFHcp7GkgDZOXjLU4Suf5dI0LqC

Sistema valida y guarda en DB (encriptado)
```

### 3. Creación de Vault
```
Sistema usa:
- accountId: 3bcde97e... (para buscar usuario)
- novaAccountId: ecuador10.nova-sdk.near (para NOVA SDK)
- novaApiKey: nova_sk_l63l... (desencriptado)

Crea vault:
vault.3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae

Operaciones de NOVA se hacen con: ecuador10.nova-sdk.near
```

## ✅ Estado Actual del Sistema

### Usuario de Prueba
- **Wallet**: `3bcde97e49d49079d2325fc28bc11d9a55317c292852f710dae34f344e53c5ae`
- **NOVA Account**: `ecuador10.nova-sdk.near`
- **API Key**: Configurada ✅
- **Vault**: Creado ✅
- **CID**: `QmWQxaWJuXQ6fcq5xffQD2uPwFBprkaWF3YBdwLJ3x68MH`

### Funcionalidades Verificadas
- ✅ Crear vault
- ✅ Subir archivos
- ✅ Recuperar archivos
- ✅ Asociación wallet ↔ NOVA account

## 📝 Información Importante para Usuarios

### Requisitos de Fondos
- La cuenta NOVA (`username.nova-sdk.near`) necesita fondos NEAR
- **Mínimo recomendado**: 1 NEAR
- Costos aproximados:
  - Crear vault: ~0.67 NEAR (una sola vez)
  - Subir archivo: ~0.01 NEAR (por archivo)
  - Recuperar archivo: Gratis

### Proceso de Setup
1. Usuario conecta su wallet (cualquier formato de dirección NEAR)
2. Usuario crea cuenta en NOVA SDK (obtiene `username.nova-sdk.near`)
3. Usuario genera API key en NOVA
4. Usuario agrega fondos a su cuenta NOVA
5. Sistema automáticamente:
   - Asocia wallet → NOVA account
   - Crea vault usando NOVA account
   - Encripta y guarda credenciales

### Seguridad
- ✅ API keys encriptadas en base de datos
- ✅ Datos en vault encriptados en NOVA
- ✅ Solo el usuario con API key puede acceder
- ✅ Separación clara entre wallet de usuario y cuenta NOVA

## 🔧 Scripts Útiles

```bash
# Verificar estado de usuario
npx tsx scripts/check-user-data.ts

# Probar subida/descarga de archivos
npx tsx scripts/test-vault-upload.ts

# Actualizar API key manualmente (si es necesario)
npx tsx scripts/update-nova-key.ts

# Actualizar NOVA Account ID (si es necesario)
npx tsx scripts/update-nova-account-id.ts
```

## 🚀 Próximos Pasos

El sistema está completamente funcional. Los usuarios pueden:

1. ✅ Conectar su wallet (cualquier dirección NEAR)
2. ✅ Configurar NOVA fácilmente con instrucciones claras
3. ✅ Entender requisitos de fondos desde el inicio
4. ✅ Usar vault encriptado para datos sensibles
5. ✅ Sistema maneja correctamente la asociación wallet ↔ NOVA

---

**Fecha de Completación**: 2026-02-13
**Estado**: ✅ Completamente Funcional

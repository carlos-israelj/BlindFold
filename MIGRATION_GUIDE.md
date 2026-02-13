# Guía para Aplicar Migración en Producción

## Nueva Migración
- **Nombre**: `20260213014146_add_nova_account_id`
- **Cambios**: Agrega campo `novaAccountId` a la tabla `User`

## Opción 1: Automático via Vercel (Recomendado)

Vercel detecta automáticamente las migraciones nuevas y las aplica durante el deploy.

**Verificar que se aplicó:**
1. Ve a Vercel Dashboard → Tu Proyecto → Deployments
2. Click en el deployment más reciente
3. Ve a "Build Logs"
4. Busca: `Prisma Migrate` o `Running migrations`

Si no ves logs de migración, Vercel podría no estar ejecutándolas automáticamente.

## Opción 2: Manual desde Local

Si necesitas aplicar la migración manualmente:

```bash
# 1. Obtén la DATABASE_URL de producción desde Vercel
#    Vercel Dashboard → Settings → Environment Variables → DATABASE_URL

# 2. Exporta temporalmente (NO guardes esto en archivos!)
export DATABASE_URL="postgresql://..."

# 3. Aplica la migración
npx prisma migrate deploy

# 4. Verifica
npx prisma db push --skip-generate
```

## Opción 3: Desde Vercel CLI

```bash
# 1. Instala Vercel CLI (si no lo tienes)
npm i -g vercel

# 2. Login
vercel login

# 3. Link al proyecto
vercel link

# 4. Pull environment variables
vercel env pull .env.vercel

# 5. Aplica migración
DATABASE_URL=$(grep DATABASE_URL .env.vercel | cut -d '=' -f2-) npx prisma migrate deploy

# 6. Elimina .env.vercel (contiene secretos!)
rm .env.vercel
```

## Verificar que la Migración se Aplicó

### Opción A: Desde la aplicación
1. Ve a https://blindfold.lat
2. Abre Developer Tools (F12)
3. Ve a Console
4. Intenta conectar tu wallet
5. Si el modal de NOVA aparece y puedes ingresar el NOVA Account ID, la migración funcionó

### Opción B: Directamente en la base de datos
```sql
-- Conecta a tu base de datos de producción
-- En Neon, PostgreSQL, etc.

-- Verifica que el campo existe
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'User' AND column_name = 'novaAccountId';

-- Debería retornar:
-- column_name   | data_type
-- novaAccountId | text
```

## Estado Actual

- ✅ Migración creada localmente
- ✅ Migración commiteada al repositorio
- ✅ Push al repositorio remoto
- ⏳ **Pendiente**: Verificar que se aplicó en producción
- ⏳ **Pendiente**: Probar en https://blindfold.lat

## Troubleshooting

### Error: "Column 'novaAccountId' does not exist"
→ La migración no se ha aplicado. Usa una de las opciones de arriba.

### Error: "Prisma Client validation failed"
→ El Prisma Client no está actualizado. En Vercel, esto debería resolverse automáticamente en el siguiente deploy.

### Modal de NOVA no muestra campo "NOVA Account ID"
→ El frontend no se actualizó. Fuerza un redeploy en Vercel o espera unos minutos.

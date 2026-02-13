#!/bin/bash

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🔄 Aplicar Migración a Base de Datos de Producción"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Esta migración agrega el campo 'novaAccountId' a la tabla User"
echo ""
echo "⚠️  IMPORTANTE: Necesitas la DATABASE_URL de producción"
echo "   Encuéntrala en: Vercel Dashboard → Settings → Environment Variables"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
read -p "¿Ya tienes la DATABASE_URL lista? (y/n) " -n 1 -r
echo ""
echo ""

if [[ ! $REPLY =~ ^[Yy]$ ]]
then
    echo "❌ Proceso cancelado"
    echo ""
    echo "Cuando la tengas, ejecuta:"
    echo "  DATABASE_URL='tu_url_aqui' npx prisma migrate deploy"
    exit 1
fi

echo "Ingresa la DATABASE_URL de producción:"
echo "(El texto no se mostrará por seguridad)"
read -s DATABASE_URL
echo ""

if [ -z "$DATABASE_URL" ]; then
    echo "❌ Error: DATABASE_URL vacía"
    exit 1
fi

export DATABASE_URL

echo "🔄 Aplicando migración..."
echo ""

npx prisma migrate deploy

if [ $? -eq 0 ]; then
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ✅ Migración aplicada exitosamente!"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📝 Próximos pasos:"
    echo "  1. Verifica en https://blindfold.lat"
    echo "  2. Conecta tu wallet"
    echo "  3. El modal NOVA debería mostrar el campo 'NOVA Account ID'"
    echo ""
else
    echo ""
    echo "❌ Error al aplicar la migración"
    echo ""
    echo "Verifica:"
    echo "  - La DATABASE_URL sea correcta"
    echo "  - Tengas permisos en la base de datos"
    echo "  - La base de datos esté accesible"
    echo ""
fi

# Limpia la variable
unset DATABASE_URL

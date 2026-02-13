#!/bin/bash

# Script para verificar logs del Shade Agent en Phala Cloud
# Uso: ./check-logs.sh

APP_ID="a24524b21160793c2054c610a2e9a300f97a8ae3"
PHALA_API_KEY="phak_wqZCtK-vjaO9jmkc4a5SQ3HUZnWvCzE62T40Y9-sSDo"

echo "🔍 Verificando logs del Shade Agent en Phala Cloud..."
echo "App ID: $APP_ID"
echo ""

# Intentar obtener logs usando la API de Phala
# Nota: La API exacta puede variar, este es un ejemplo

curl -s -X GET \
  "https://api.phala.network/v1/apps/${APP_ID}/logs" \
  -H "Authorization: Bearer ${PHALA_API_KEY}" \
  -H "Content-Type: application/json" | jq '.'

echo ""
echo "Si esto no funciona, ve directamente al dashboard:"
echo "https://cloud.phala.com/dashboard"
echo ""
echo "Busca estos mensajes en los logs:"
echo "✅ 'Shade Agent initialized'"
echo "✅ 'NOVA client connected'"
echo "✅ 'Monitoring started'"
echo "✅ 'Portfolio analysis completed'"

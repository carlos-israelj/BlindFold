# Cómo obtener la URL pública de tu Shade Agent en Phala

## Método 1: Dashboard de Phala Cloud (Recomendado)

1. **Ir al Dashboard**
   - Ve a https://cloud.phala.com/dashboard
   - Login con tu cuenta

2. **Buscar tu deployment**
   - Busca el CVM llamado `blindfold-shade-agent` o similar
   - Haz click en él

3. **Obtener la URL pública**

   Phala Cloud tiene varias formas de exponer servicios:

   ### Opción A: dstack Gateway (si está habilitado)
   - En la sección "Network" o "Endpoints"
   - Busca algo como:
     ```
     Gateway URL: https://xxx-xxx-xxx.dstack.phala.network
     ```
   - O:
     ```
     Public URL: https://[deployment-id].phala.network
     ```

   ### Opción B: Port Forwarding
   - En la sección "Ports" o "Networking"
   - Verifica que el puerto `3001` esté expuesto
   - Busca la URL pública asociada

   ### Opción C: Instance IP
   - En "Instance Info" o "Details"
   - Busca "Public IP" o "External IP"
   - La URL sería: `http://[IP]:3001`

4. **Formato esperado**

   Tu URL debe verse algo como:
   ```
   https://blindfold-shade-agent-abc123.phala.network:3001
   ```

   O si tiene Gateway:
   ```
   https://abc123.dstack.phala.network
   ```

## Método 2: Verificar desde logs

Si ya está deployado, los logs del Shade Agent deberían mostrar en qué puerto está escuchando:

1. Ve a Dashboard → Tu CVM → Logs
2. Busca estas líneas al inicio:
   ```
   🔑 Shade Key API Server started
   📍 Listening on port 3001
   ```

## Método 3: Usar el API Key para consultar

Si Phala Cloud tiene API:

```bash
curl -H "Authorization: Bearer phak_wqZCtK-vjaO9jmkc4a5SQ3HUZnWvCzE62T40Y9-sSDo" \
  https://api.phala.cloud/v1/deployments
```

## Método 4: Si no tienes URL pública

Si Phala Cloud no expone URLs públicas automáticamente, tienes 2 opciones:

### A. Configurar Port Forwarding en Phala
1. Ve a tu deployment settings
2. Busca "Network" o "Ports"
3. Agrega port forwarding:
   - Container Port: `3001`
   - Public Port: `3001` (o cualquier puerto disponible)
   - Protocol: `HTTP` o `TCP`

### B. Usar Ngrok/Cloudflare Tunnel (temporal para testing)

Si Phala no soporta ports públicos directamente:

```bash
# En el container de Phala (si tienes acceso shell)
ngrok http 3001
```

## ⚠️ Problema potencial: Phala puede no exponer puertos HTTP

Si Phala Cloud **no permite exponer puertos HTTP públicamente**, tendrías que:

1. **Desplegar el Shade Agent en otro servicio** que soporte ports públicos:
   - Railway
   - Render
   - Fly.io
   - DigitalOcean App Platform

2. **O modificar la arquitectura**:
   - El Shade Agent corre en Phala (privado)
   - Crear un "Proxy Agent" en Railway que:
     - Tiene acceso al Shade Agent interno de Phala
     - Expone el endpoint `/api/key-management/get_key` públicamente
     - Hace proxy de las requests al Shade Agent en Phala

## Verificar si la URL funciona

Una vez que tengas la URL, verifica que funcione:

```bash
# Reemplaza con tu URL
curl https://TU-URL.phala.network:3001/health

# Debería responder:
# {
#   "status": "healthy",
#   "service": "shade-key-api",
#   "timestamp": "2026-02-14T...",
#   "tee_enabled": true
# }
```

## Si no encuentras la URL

Dime qué ves en tu dashboard de Phala y te ayudo a:
1. Configurar el networking correctamente
2. O ajustar la arquitectura si Phala no soporta HTTP público

# NOVA MCP Server - BlindFold

Custom NOVA MCP Server deployment for the BlindFold project.

## ¿Qué es esto?

Este es un servidor MCP (Model Context Protocol) personalizado que maneja la encriptación/desencriptación de archivos para NOVA SDK.

**Problema original**: El MCP Server público de NOVA (`https://nova-mcp.fastmcp.app`) no funciona porque no tiene configurado el `SHADE_API_URL` para llamar a nuestro Shade Agent.

**Solución**: Desplegamos nuestro propio MCP Server que llama a nuestro Shade Agent (corriendo en Phala TEE).

## Arquitectura

```
┌─────────────────────────────────────────────┐
│   Frontend (blindfold.lat)                  │
│   - Usuario sube portfolio                   │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   NOVA SDK (JavaScript)                     │
│   - Llama a MCP Server para encrypt/decrypt │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   MCP Server (Railway - este proyecto)      │  ← Estás aquí
│   - Recibe requests del SDK                  │
│   - Llama a Shade Agent para obtener keys   │
│   - Sube/baja archivos de IPFS (Pinata)     │
└──────────────┬──────────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────────┐
│   Shade Agent (Phala TEE)                   │
│   - Deriva keys usando TEE attestation       │
│   - Devuelve key al MCP Server               │
└─────────────────────────────────────────────┘
```

## Flujo de Datos

### Upload (Subir archivo)

1. Frontend llama `nova.upload(groupId, data, filename)`
2. NOVA SDK llama `POST /tools/prepare_upload` al MCP Server
3. MCP Server llama `POST /api/key-management/get_key` al Shade Agent
4. Shade Agent deriva la key en el TEE y la devuelve
5. MCP Server devuelve la key al SDK
6. SDK encripta el archivo localmente (AES-256-GCM)
7. SDK llama `POST /tools/finalize_upload` al MCP Server
8. MCP Server sube el archivo encriptado a IPFS vía Pinata
9. Devuelve el CID al SDK

### Retrieve (Descargar archivo)

1. Frontend llama `nova.retrieve(groupId, ipfsHash)`
2. NOVA SDK llama `POST /tools/prepare_retrieve` al MCP Server
3. MCP Server llama al Shade Agent para obtener la key
4. MCP Server descarga el archivo encriptado de IPFS
5. Devuelve key + archivo encriptado al SDK
6. SDK desencripta el archivo localmente
7. Devuelve el archivo desencriptado al Frontend

## Deployment

Sigue la guía completa en [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md)

Resumen rápido:

1. **Obtener URL del Shade Agent en Phala**
2. **Pushear este código a GitHub**
3. **Desplegar en Railway** (o Render/Fly.io)
4. **Configurar variables de entorno** en Railway
5. **Actualizar frontend** para usar tu MCP URL

## Variables de Entorno

```bash
# URL del Shade Agent (debe ser accesible públicamente desde Railway)
SHADE_API_URL=https://tu-shade-agent.phala.network:3001

# Credenciales de Pinata para IPFS
PINATA_API_KEY=c192386416bc897d0e8a
PINATA_SECRET_KEY=c89935debb1910906c64dd5325685614fdd7553e2c039078af3e69adf5d57fd6
PINATA_JWT=eyJhbGci...
```

## Endpoints

### `POST /tools/prepare_upload`

Prepara la subida de un archivo (obtiene key de encriptación)

**Request:**
```json
{
  "account_id": "3bcde97e...",
  "group_id": "vault.3bcde97e...",
  "filename": "portfolio.json"
}
```

**Response:**
```json
{
  "key": "base64_encoded_encryption_key",
  "upload_id": "abc123..."
}
```

### `POST /tools/finalize_upload`

Finaliza la subida (sube archivo encriptado a IPFS)

**Request:**
```json
{
  "account_id": "3bcde97e...",
  "group_id": "vault.3bcde97e...",
  "encrypted_data_b64": "base64_encrypted_data",
  "file_hash": "sha256_hash",
  "filename": "portfolio.json"
}
```

**Response:**
```json
{
  "ipfs_hash": "QmXxx...",
  "file_hash": "sha256_hash"
}
```

### `POST /tools/prepare_retrieve`

Prepara la descarga de un archivo (obtiene key y descarga de IPFS)

**Request:**
```json
{
  "account_id": "3bcde97e...",
  "group_id": "vault.3bcde97e...",
  "ipfs_hash": "QmXxx..."
}
```

**Response:**
```json
{
  "key": "base64_decryption_key",
  "encrypted_b64": "base64_encrypted_data",
  "ipfs_hash": "QmXxx...",
  "group_id": "vault.3bcde97e..."
}
```

## Testing Local

```bash
# Instalar dependencias
pip install -r requirements.txt

# Configurar variables
cp .env.example .env
# Editar .env con tus valores

# Correr servidor
python server.py
```

El servidor correrá en `http://localhost:8000`

## Logs

En Railway, los logs mostrarán:

```
🔑 Requesting Shade key from https://shade-agent.phala.network:3001/api/key-management/get_key
   Account: 3bcde97e...
   Group: vault.3bcde97e...
✅ Shade key received successfully
📌 Uploading to Pinata...
✅ Uploaded to IPFS: QmXxx...
```

## Troubleshooting

Ver sección completa en [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md#troubleshooting)

## Seguridad

- ✅ Las keys se derivan en el TEE (Phala) de forma segura
- ✅ El MCP Server NUNCA almacena las keys, solo las pasa
- ✅ La encriptación/desencriptación ocurre en el cliente (NOVA SDK)
- ✅ Los archivos se almacenan encriptados en IPFS
- ✅ Solo usuarios autorizados pueden derivar keys

## Stack Tecnológico

- **Python 3.11**
- **FastMCP** - Framework para MCP servers
- **httpx** - Cliente HTTP async
- **Pinata** - Gateway IPFS
- **Railway** - Hosting (recomendado)

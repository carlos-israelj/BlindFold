"""
NOVA MCP Server - REST API Version for NOVA SDK Compatibility

This server provides REST endpoints that the NOVA SDK expects,
calling our Shade Agent (running in Phala TEE) to get decryption keys.
"""

import os
import json
import hashlib
import httpx
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

load_dotenv()

# Environment configuration
SHADE_API_URL = os.getenv("SHADE_API_URL", "http://shade-agent:3001")
PINATA_API_KEY = os.getenv("PINATA_API_KEY")
PINATA_SECRET_KEY = os.getenv("PINATA_SECRET_KEY")
PINATA_JWT = os.getenv("PINATA_JWT")

# Validate required environment variables
if not all([PINATA_API_KEY, PINATA_SECRET_KEY, PINATA_JWT]):
    raise ValueError("Missing Pinata credentials: PINATA_API_KEY, PINATA_SECRET_KEY, PINATA_JWT required")

# Create FastAPI app
app = FastAPI(title="NOVA MCP Server - BlindFold")


async def _get_shade_key(account_id: str, group_id: str) -> str:
    """Get Shade key from Shade Agent (running in TEE)"""
    async with httpx.AsyncClient() as client:
        try:
            request_body = {
                "account_id": account_id,
                "group_id": group_id
            }

            print(f"🔑 Requesting Shade key from {SHADE_API_URL}/api/key-management/get_key")
            print(f"   Account: {account_id}")
            print(f"   Group: {group_id}")

            shade_response = await client.post(
                f"{SHADE_API_URL}/api/key-management/get_key",
                json=request_body,
                timeout=15
            )

            if shade_response.status_code != 200:
                error_text = shade_response.text
                print(f"❌ Shade Agent error ({shade_response.status_code}): {error_text}")
                raise Exception(f"Shade key fetch failed: {error_text}")

            data = shade_response.json()
            shade_key = data.get("shade_key")

            if not shade_key:
                raise Exception("Shade key not found in response")

            print(f"✅ Shade key received successfully")
            return shade_key

        except httpx.TimeoutException:
            print(f"❌ Timeout calling Shade Agent at {SHADE_API_URL}")
            raise Exception("Shade Agent timeout")
        except httpx.ConnectError as e:
            print(f"❌ Cannot connect to Shade Agent at {SHADE_API_URL}: {e}")
            raise Exception(f"Shade Agent connection failed: {e}")
        except Exception as e:
            print(f"❌ Error getting Shade key: {e}")
            raise


@app.post("/mcp/tools/register_group")
async def register_group(request: Request):
    """
    Register a new group for encrypted file sharing

    REST endpoint matching NOVA SDK expectations:
    POST /mcp/tools/register_group
    Body: {"group_id": "vault.accountId"}
    Headers: {"X-Account-Id": "accountId"}
    """
    try:
        data = await request.json()
        account_id = request.headers.get("X-Account-Id", "")
        group_id = data.get("group_id", "")

        print(f"\n📝 register_group called:")
        print(f"   Account: {account_id}")
        print(f"   Group: {group_id}")

        # The actual group registration happens on NEAR blockchain via SDK
        # This MCP tool just acknowledges the group for encryption operations
        print(f"✅ Group registered (blockchain operation handled by SDK)")

        return JSONResponse(content={
            "success": True,
            "group_id": group_id,
            "message": "Group registered successfully"
        })

    except Exception as e:
        print(f"❌ register_group error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mcp/tools/prepare_upload")
async def prepare_upload(request: Request):
    """Prepare for file upload by generating encryption key"""
    try:
        data = await request.json()
        account_id = request.headers.get("X-Account-Id", "")
        group_id = data.get("group_id", "")
        filename = data.get("filename", "")

        print(f"\n📤 prepare_upload called:")
        print(f"   Account: {account_id}")
        print(f"   Group: {group_id}")
        print(f"   Filename: {filename}")

        # Get Shade key from TEE
        shade_key = await _get_shade_key(account_id, group_id)

        # Generate upload ID
        upload_id = hashlib.sha256(f"{account_id}{group_id}".encode()).hexdigest()[:16]

        return JSONResponse(content={
            "key": shade_key,
            "upload_id": upload_id
        })

    except Exception as e:
        print(f"❌ prepare_upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


async def _finalize_upload_handler(request: Request):
    """Shared handler for finalize upload logic"""
    try:
        data = await request.json()
        account_id = request.headers.get("X-Account-Id", "")

        print(f"\n📤 finalize_upload called:")
        print(f"   Account: {account_id}")
        print(f"   Received data keys: {list(data.keys())}")

        # SDK sends: upload_id, encrypted_data, file_hash
        # We need to extract the data in the format SDK provides
        upload_id = data.get("upload_id", "")
        encrypted_data_b64 = data.get("encrypted_data", "")  # SDK uses 'encrypted_data', not 'encrypted_data_b64'
        file_hash = data.get("file_hash", "")

        # Generate filename from upload_id if not provided
        filename = data.get("filename", f"file-{upload_id}.enc")

        print(f"   Upload ID: {upload_id}")
        print(f"   File hash: {file_hash}")
        print(f"   Filename: {filename}")
        print(f"   Has encrypted data: {bool(encrypted_data_b64)}")

        if not encrypted_data_b64:
            raise Exception("Missing encrypted_data in request")

        import base64
        encrypted_data = base64.b64decode(encrypted_data_b64)

        # Upload to Pinata
        async with httpx.AsyncClient() as client:
            files = {
                'file': (filename, encrypted_data, 'application/octet-stream')
            }
            headers = {
                'pinata_api_key': PINATA_API_KEY,
                'pinata_secret_api_key': PINATA_SECRET_KEY
            }

            print(f"📌 Uploading to Pinata...")
            response = await client.post(
                'https://api.pinata.cloud/pinning/pinFileToIPFS',
                files=files,
                headers=headers,
                timeout=30
            )

            if response.status_code != 200:
                error_text = response.text
                print(f"❌ Pinata upload failed ({response.status_code}): {error_text}")
                raise Exception(f"Pinata upload failed: {error_text}")

            result = response.json()
            ipfs_hash = result['IpfsHash']

            print(f"✅ Uploaded to IPFS: {ipfs_hash}")

            # Return in format expected by NOVA SDK
            # SDK expects: cid (IPFS hash), trans_id, file_hash
            return JSONResponse(content={
                "cid": ipfs_hash,  # SDK expects 'cid', not 'ipfs_hash'
                "ipfs_hash": ipfs_hash,  # Keep for backwards compatibility
                "file_hash": file_hash
            })

    except Exception as e:
        print(f"❌ finalize_upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/mcp/tools/finalize_upload")
async def finalize_upload(request: Request):
    """Finalize upload by storing encrypted data to IPFS via Pinata"""
    return await _finalize_upload_handler(request)


@app.post("/mcp/api/finalize-upload")
async def finalize_upload_api_path(request: Request):
    """Alias endpoint for NOVA SDK compatibility - SDK uses /api/ path"""
    return await _finalize_upload_handler(request)


@app.post("/mcp/tools/prepare_retrieve")
async def prepare_retrieve(request: Request):
    """Prepare for file retrieval by fetching encrypted data and decryption key"""
    try:
        data = await request.json()
        account_id = request.headers.get("X-Account-Id", "")
        group_id = data.get("group_id", "")
        ipfs_hash = data.get("ipfs_hash", "")

        print(f"\n📥 prepare_retrieve called:")
        print(f"   Account: {account_id}")
        print(f"   Group: {group_id}")
        print(f"   IPFS Hash: {ipfs_hash}")

        # Get Shade key from TEE
        print(f"🔑 Fetching Shade key from TEE...")
        shade_key = await _get_shade_key(account_id, group_id)

        # Fetch encrypted data from Pinata/IPFS
        print(f"📌 Fetching encrypted data from IPFS...")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://gateway.pinata.cloud/ipfs/{ipfs_hash}",
                timeout=30
            )

            if response.status_code != 200:
                error_text = response.text
                print(f"❌ IPFS fetch failed ({response.status_code}): {error_text}")
                raise Exception(f"IPFS fetch failed: {error_text}")

            encrypted_data = response.content

            import base64
            encrypted_data_b64 = base64.b64encode(encrypted_data).decode('utf-8')

            print(f"✅ Encrypted data fetched ({len(encrypted_data)} bytes)")

            return JSONResponse(content={
                "key": shade_key,
                "encrypted_b64": encrypted_data_b64,
                "ipfs_hash": ipfs_hash,
                "group_id": group_id
            })

    except Exception as e:
        print(f"❌ prepare_retrieve error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/")
async def root():
    """Health check endpoint"""
    return {"status": "ok", "service": "NOVA MCP Server - BlindFold"}


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("🚀 Starting NOVA MCP Server - BlindFold (REST API)")
    print("=" * 60)
    print(f"Shade Agent URL: {SHADE_API_URL}")
    print(f"Pinata configured: ✅")
    print("=" * 60)

    # Get port from environment (Render uses PORT env var)
    port = int(os.getenv("PORT", 8000))

    print(f"🌐 Starting server on 0.0.0.0:{port}...")

    uvicorn.run(app, host="0.0.0.0", port=port)

"""
NOVA MCP Server - Custom deployment for BlindFold

This MCP server handles encryption/decryption for NOVA SDK.
It calls our Shade Agent (running in Phala TEE) to get decryption keys.

Based on: https://github.com/jcarbonnell/nova/tree/main/mcp-server
"""

import os
import json
import hashlib
import httpx
from fastmcp import FastMCP
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

# Create MCP server
mcp = FastMCP("NOVA MCP Server - BlindFold")

async def _get_shade_key(account_id: str, group_id: str) -> str:
    """
    Get Shade key from Shade Agent (running in TEE)

    This calls our Shade Agent which is running in Phala TEE
    to derive the decryption key for the given account and group.
    """
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


@mcp.tool()
async def prepare_upload(account_id: str, group_id: str, filename: str = "") -> dict:
    """
    Prepare for file upload by generating encryption key

    Args:
        account_id: NEAR account ID
        group_id: Group ID for the upload
        filename: Filename (optional)

    Returns:
        dict with 'key' and 'upload_id' (matching NOVA SDK expectations)
    """
    print(f"\n📤 prepare_upload called:")
    print(f"   Account: {account_id}")
    print(f"   Group: {group_id}")
    print(f"   Filename: {filename}")

    try:
        # Get Shade key from TEE
        shade_key = await _get_shade_key(account_id, group_id)

        # Generate upload ID
        upload_id = hashlib.sha256(f"{account_id}{group_id}".encode()).hexdigest()[:16]

        return {
            "key": shade_key,  # SDK expects 'key', not 'encryption_key'
            "upload_id": upload_id
        }
    except Exception as e:
        print(f"❌ prepare_upload error: {e}")
        raise


@mcp.tool()
async def finalize_upload(
    account_id: str,
    group_id: str,
    encrypted_data_b64: str,
    file_hash: str,
    filename: str
) -> dict:
    """
    Finalize upload by storing encrypted data to IPFS via Pinata

    Args:
        account_id: NEAR account ID
        group_id: Group ID
        encrypted_data_b64: Base64-encoded encrypted data
        file_hash: SHA256 hash of original file
        filename: Original filename

    Returns:
        dict with ipfs_hash (CID) and file_hash
    """
    print(f"\n📤 finalize_upload called:")
    print(f"   Account: {account_id}")
    print(f"   Group: {group_id}")
    print(f"   Filename: {filename}")
    print(f"   File hash: {file_hash}")

    try:
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

            return {
                "ipfs_hash": ipfs_hash,
                "file_hash": file_hash
            }

    except Exception as e:
        print(f"❌ finalize_upload error: {e}")
        raise


@mcp.tool()
async def prepare_retrieve(account_id: str, group_id: str, ipfs_hash: str) -> dict:
    """
    Prepare for file retrieval by fetching encrypted data and decryption key

    Args:
        account_id: NEAR account ID
        group_id: Group ID
        ipfs_hash: IPFS CID of the encrypted file

    Returns:
        dict with 'key', 'encrypted_b64', 'ipfs_hash', and 'group_id' (matching NOVA SDK expectations)
    """
    print(f"\n📥 prepare_retrieve called:")
    print(f"   Account: {account_id}")
    print(f"   Group: {group_id}")
    print(f"   IPFS Hash: {ipfs_hash}")

    try:
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

            # SDK expects these exact field names
            return {
                "key": shade_key,  # Not 'decryption_key'
                "encrypted_b64": encrypted_data_b64,  # Not 'encrypted_data_b64'
                "ipfs_hash": ipfs_hash,
                "group_id": group_id
            }

    except Exception as e:
        print(f"❌ prepare_retrieve error: {e}")
        raise


if __name__ == "__main__":
    import uvicorn

    print("=" * 60)
    print("🚀 Starting NOVA MCP Server - BlindFold")
    print("=" * 60)
    print(f"Shade Agent URL: {SHADE_API_URL}")
    print(f"Pinata configured: ✅")
    print("=" * 60)

    # Get port from environment (Render uses PORT env var)
    port = int(os.getenv("PORT", 8000))

    # Run the MCP server with Uvicorn for production
    uvicorn.run(
        mcp.get_asgi_app(),
        host="0.0.0.0",
        port=port,
        log_level="info"
    )

#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building BlindFold Smart Contract...${NC}"

# Check if cargo is installed
if ! command -v cargo &> /dev/null; then
    echo -e "${RED}Error: cargo is not installed${NC}"
    echo "Install Rust from https://rustup.rs/"
    exit 1
fi

# Check if near CLI is installed
if ! command -v near &> /dev/null; then
    echo -e "${YELLOW}Warning: NEAR CLI is not installed${NC}"
    echo "Install with: npm install -g near-cli"
fi

# Build the contract
echo -e "${GREEN}Compiling contract...${NC}"
cd "$(dirname "$0")"
cargo build --target wasm32-unknown-unknown --release

# Check if build was successful
if [ -f "target/wasm32-unknown-unknown/release/blindfold_contract.wasm" ]; then
    # Create output directory
    mkdir -p ../out

    # Copy the WASM file
    cp target/wasm32-unknown-unknown/release/blindfold_contract.wasm ../out/contract.wasm

    # Get file size
    SIZE=$(wc -c < ../out/contract.wasm)
    SIZE_KB=$((SIZE / 1024))

    echo -e "${GREEN}✓ Contract built successfully!${NC}"
    echo -e "  Output: ${YELLOW}out/contract.wasm${NC}"
    echo -e "  Size: ${YELLOW}${SIZE_KB} KB${NC}"

    if [ $SIZE_KB -gt 500 ]; then
        echo -e "${YELLOW}  Warning: Contract size is large. Consider optimizing.${NC}"
    fi
else
    echo -e "${RED}✗ Build failed${NC}"
    exit 1
fi

echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "  1. Deploy to testnet: ${YELLOW}near deploy --accountId your-account.testnet --wasmFile out/contract.wasm${NC}"
echo -e "  2. Initialize: ${YELLOW}near call your-account.testnet new '{\"owner\": \"your-account.testnet\"}' --accountId your-account.testnet${NC}"

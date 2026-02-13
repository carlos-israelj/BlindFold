# 🔐 NOVA Vault Integration Guide

## 📦 Components Created

### 1. GroupSelectionModal Component
**Location**: `/components/GroupSelectionModal.tsx`

Allows users to choose between joining an existing NOVA group or creating a new one.

**Features**:
- ✅ Join existing group (FREE)
- ✅ Create new private group (~1.3 NEAR)
- ✅ Input validation
- ✅ Cost breakdown display
- ✅ User-friendly UI

**Usage**:
```tsx
import GroupSelectionModal from '@/components/GroupSelectionModal';

function MyComponent() {
  const [showGroupModal, setShowGroupModal] = useState(false);

  const handleGroupSelected = async (groupId: string, isNew: boolean) => {
    // Call API to create/join group
    const response = await fetch('/api/vault/group', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, groupId, isNew }),
    });

    const data = await response.json();
    console.log('Group configured:', data);
  };

  return (
    <GroupSelectionModal
      isOpen={showGroupModal}
      onClose={() => setShowGroupModal(false)}
      onGroupSelected={handleGroupSelected}
      accountId={user.accountId}
    />
  );
}
```

### 2. PortfolioForm Component
**Location**: `/components/PortfolioForm.tsx`

Visual form for users to input their portfolio assets.

**Features**:
- ✅ Add/remove assets dynamically
- ✅ Real-time total calculation
- ✅ Input validation
- ✅ JSON preview
- ✅ Formatted currency display

**Data Format**:
```json
{
  "assets": [
    {
      "symbol": "Bitcoin",
      "balance": 1.5,
      "value": 75000
    },
    {
      "symbol": "Ethereum",
      "balance": 20,
      "value": 40000
    }
  ]
}
```

**Usage**:
```tsx
import PortfolioForm from '@/components/PortfolioForm';

function MyComponent() {
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);

  const handleSavePortfolio = async (assets: PortfolioAsset[]) => {
    // Call API to upload portfolio
    const response = await fetch('/api/vault/portfolio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accountId, groupId, assets }),
    });

    const data = await response.json();
    console.log('Portfolio saved:', data);
  };

  return (
    <PortfolioForm
      isOpen={showPortfolioForm}
      onClose={() => setShowPortfolioForm(false)}
      onSave={handleSavePortfolio}
      groupId="my-portfolio-vault"
    />
  );
}
```

## 🔌 API Routes Created

### 1. Group Operations
**Endpoint**: `/api/vault/group`

#### POST - Create or Join Group
```typescript
// Request
{
  "accountId": "user.near",
  "groupId": "my-portfolio-vault",
  "isNew": true  // true = create, false = join
}

// Response
{
  "success": true,
  "groupId": "my-portfolio-vault",
  "message": "Successfully created group: my-portfolio-vault",
  "cost": 1.3  // NEAR tokens
}
```

#### GET - Check Group Status
```typescript
// Request
GET /api/vault/group?accountId=user.near

// Response
{
  "hasGroup": true,
  "groupId": "my-portfolio-vault"
}
```

### 2. Portfolio Operations
**Endpoint**: `/api/vault/portfolio`

#### POST - Upload Portfolio
```typescript
// Request
{
  "accountId": "user.near",
  "groupId": "my-portfolio-vault",
  "assets": [
    { "symbol": "BTC", "balance": 1.5, "value": 75000 },
    { "symbol": "ETH", "balance": 20, "value": 40000 }
  ]
}

// Response
{
  "success": true,
  "cid": "QmXyz123...",
  "transactionId": "abc123...",
  "groupId": "my-portfolio-vault",
  "assetsCount": 2,
  "totalValue": 115000,
  "message": "Portfolio uploaded successfully to NOVA vault"
}
```

#### GET - Retrieve Portfolio
```typescript
// Request
GET /api/vault/portfolio?accountId=user.near&groupId=my-portfolio-vault

// Response
{
  "hasPortfolio": true,
  "portfolio": {
    "assets": [...],
    "metadata": {
      "uploadedAt": "2026-02-13T07:00:00Z",
      "uploadedBy": "user.near",
      "version": "1.0"
    }
  },
  "cid": "QmXyz123...",
  "transactionId": "abc123..."
}
```

## 🎯 Integration Flow

### Complete User Journey

```
1. User Signs In with NEAR
   ↓
2. Setup NOVA (NovaSetupModal)
   - Enter NOVA Account ID
   - Enter API Key
   ↓
3. Configure Group (GroupSelectionModal)
   - Option A: Join existing group (FREE)
   - Option B: Create new group (~1.3 NEAR)
   ↓
4. Add Portfolio (PortfolioForm)
   - Input assets
   - Enter values
   - Save to vault
   ↓
5. Shade Agent Monitors
   - Reads encrypted data from vault
   - Calculates HHI risk score
   - Sends alerts if needed
```

## 💻 Example Dashboard Integration

```tsx
'use client';

import { useState, useEffect } from 'react';
import GroupSelectionModal from '@/components/GroupSelectionModal';
import PortfolioForm from '@/components/PortfolioForm';

export default function VaultDashboard({ user }: { user: User }) {
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [hasNova, setHasNova] = useState(false);

  // Check if user has NOVA configured
  useEffect(() => {
    async function checkNovaStatus() {
      const response = await fetch(`/api/vault/group?accountId=${user.accountId}`);
      const data = await response.json();

      setGroupId(data.groupId);
      setHasNova(data.hasGroup);
    }

    checkNovaStatus();
  }, [user.accountId]);

  const handleGroupSelected = async (selectedGroupId: string, isNew: boolean) => {
    try {
      const response = await fetch('/api/vault/group', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: user.accountId,
          groupId: selectedGroupId,
          isNew,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setGroupId(selectedGroupId);
        setHasNova(true);
        setShowGroupModal(false);
        alert(data.message);
      }
    } catch (error) {
      console.error('Error configuring group:', error);
      alert('Failed to configure group');
    }
  };

  const handleSavePortfolio = async (assets: PortfolioAsset[]) => {
    try {
      const response = await fetch('/api/vault/portfolio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountId: user.accountId,
          groupId,
          assets,
        }),
      });

      const data = await response.json();

      if (data.success) {
        alert(`Portfolio saved! CID: ${data.cid}`);
      }
    } catch (error) {
      console.error('Error saving portfolio:', error);
      alert('Failed to save portfolio');
    }
  };

  return (
    <div className="p-6">
      <h1>NOVA Vault Dashboard</h1>

      {!hasNova && (
        <button
          onClick={() => setShowGroupModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg"
        >
          Configure NOVA Group
        </button>
      )}

      {hasNova && (
        <button
          onClick={() => setShowPortfolioForm(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
        >
          Add Portfolio
        </button>
      )}

      {/* Modals */}
      <GroupSelectionModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onGroupSelected={handleGroupSelected}
        accountId={user.accountId}
      />

      <PortfolioForm
        isOpen={showPortfolioForm}
        onClose={() => setShowPortfolioForm(false)}
        onSave={handleSavePortfolio}
        groupId={groupId || ''}
      />
    </div>
  );
}
```

## 🔒 Security Notes

1. **Encryption**: All portfolio data is encrypted end-to-end by NOVA SDK
2. **Access Control**: Only authorized group members can decrypt data
3. **Private Keys**: Never stored on server - managed by NOVA TEE
4. **API Keys**: Encrypted in database using AES-256-GCM

## 📝 Database Schema

The user table needs these fields:

```prisma
model User {
  id            String   @id @default(cuid())
  accountId     String   @unique  // NEAR wallet address
  novaApiKey    String?              // Encrypted NOVA API key
  novaAccountId String?              // NOVA account (xxx.nova-sdk.near)
  novaVaultId   String?              // Group ID where portfolio is stored
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
```

## ✅ Next Steps

1. **Integrate in your dashboard page**
   - Import the components
   - Add buttons to trigger modals
   - Handle success/error states

2. **Test the flow**
   - Create a test group
   - Upload a test portfolio
   - Verify Shade Agent can read it

3. **Customize styling**
   - Adjust colors to match your brand
   - Add custom animations
   - Enhance error messages

4. **Add monitoring**
   - Track group creation events
   - Monitor portfolio uploads
   - Log Shade Agent analysis results

## 🎉 Features Summary

✅ User-friendly group selection
✅ Visual portfolio input form
✅ Real-time validation
✅ JSON preview
✅ Cost transparency
✅ Error handling
✅ Encrypted storage
✅ Shade Agent compatible
✅ Full NOVA SDK integration

---

**Ready to deploy!** 🚀

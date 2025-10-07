# Subscription Upgrade Implementation Guide

## ✅ What's Been Configured

### Environment Variables
- **Access Pass ID**: `prod_RnrOkr6tAwSWq` (Premium tier)  
- **Plan ID**: `plan_nox6lp5V6fd2A` (Monthly $4.99 subscription)

Added to [frontend/.env.local](frontend/.env.local:7):
```
NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_nox6lp5V6fd2A
```

## How It Works

### User Flow:
1. **User sees "Upgrade to Premium" button** in news feed  
2. **Clicks button** → Whop's native payment modal opens (handled by Whop SDK)  
3. **Completes payment** → Whop processes transaction securely  
4. **Gets instant access** → Backend detects Premium tier automatically

### Technical Implementation:

The "Upgrade to Premium" button in [NewsFeeds.tsx](frontend/components/NewsFeeds.tsx:284) will:

```typescript
import { useIframeSdk } from '@whop/react';

const iframeSdk = useIframeSdk();

const handleUpgrade = async () => {
  const result = await iframeSdk.inAppPurchase({
    planId: process.env.NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID!,
  });

  if (result.status === 'ok') {
    // Success! User is now Premium
    console.log('Receipt:', result.data.receipt_id);
    window.location.reload(); // Refresh to update tier
  } else {
    // Purchase cancelled or failed
    console.error('Error:', result.error);
  }
};
```

## Testing the Subscription Flow

### Step 1: Add Plan ID to Frontend (✅ Done)

Already added to `.env.local`:
```bash
NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID=plan_nox6lp5V6fd2A
```

### Step 2: Update NewsFeeds Component

Replace the upgrade button `<span>` with a clickable `<button>`:

**Find this code** ([NewsFeeds.tsx](frontend/components/NewsFeeds.tsx:283)):
```tsx
<span className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-400 hover:to-purple-400 transition-all duration-300 cursor-pointer hover:scale-105 shadow-lg">
  <span className="text-sm font-bold text-white">
    Upgrade to Premium ($4.99/mo) for Real-Time
  </span>
</span>
```

**Replace with**:
```tsx
<button
  onClick={handleUpgrade}
  className="px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-400 hover:to-purple-400 transition-all duration-300 hover:scale-105 shadow-lg"
>
  <span className="text-sm font-bold text-white">
    Upgrade to Premium ($4.99/mo) for Real-Time
  </span>
</button>
```

**Add these imports** at the top:
```tsx
import { useIframeSdk } from '@whop/react';
```

**Add this function** inside the `NewsFeeds` component:
```tsx
const iframeSdk = useIframeSdk();
const [purchaseError, setPurchaseError] = useState<string | null>(null);

const handleUpgrade = async () => {
  try {
    setPurchaseError(null);
    const result = await iframeSdk.inAppPurchase({
      planId: process.env.NEXT_PUBLIC_WHOP_PREMIUM_PLAN_ID!,
    });

    if (result.status === 'ok') {
      console.log('✅ Purchase successful! Receipt:', result.data.receipt_id);
      alert('🎉 Welcome to Premium! You now have real-time news access.');
      window.location.reload();
    } else {
      setPurchaseError(result.error || 'Purchase cancelled');
      console.error('❌ Purchase failed:', result.error);
    }
  } catch (err) {
    setPurchaseError('Failed to initiate purchase');
    console.error('Purchase error:', err);
  }
};
```

### Step 3: Restart Frontend

```bash
# Stop the frontend (Ctrl+C)
# Restart to load new environment variable
cd frontend
npm run dev
```

### Step 4: Test the Flow

1. **Open the app**: http://localhost:3000
2. **Click "Upgrade to Premium" button**
3. **Whop payment modal should open**
4. **Complete test purchase** (Whop Test Mode)
5. **App refreshes**, user now has Premium tier

## Assigning Premium Access for Testing

### Option 1: Through Whop Dashboard

1. Go to **Whop Dashboard** → **Members**
2. Find user: `user_4qA1XSxyMURpW` (your agent user)
3. Click **"Grant Access"**
4. Select **Premium Access Pass** (`prod_RnrOkr6tAwSWq`)
5. Select plan: **Premium Monthly** (`plan_nox6lp5V6fd2A`)
6. **Save**

Now test the tier check:
```bash
curl http://localhost:3001/api/tier/user_4qA1XSxyMURpW
```

Should return:
```json
{
  "userId": "user_4qA1XSxyMURpW",
  "tier": "premium",
  "isPremium": true,
  "deliveryDelay": 0,
  "deliveryDelayMinutes": 0
}
```

### Option 2: Test Purchase (Whop Test Mode)

Whop provides test mode for development:
1. Enable **Test Mode** in Whop Dashboard
2. Use test card: `4242 4242 4242 4242`
3. Any future expiry date
4. Any CVC

## What Happens After Purchase

1. **Whop processes payment** and creates membership
2. **Backend tier check** (`whopTierService.ts`) detects Premium access
3. **News delivery** changes from 15-minute delay to instant
4. **User sees real-time news** without delays

## Implementation Checklist

- [x] Access Pass created (`prod_RnrOkr6tAwSWq`)
- [x] Pricing Plan created ($4.99/mo - `plan_nox6lp5V6fd2A`)
- [x] Plan ID added to `.env.local`
- [ ] NewsFeeds component updated with upgrade button
- [ ] Frontend restarted
- [ ] Upgrade button tested (opens Whop modal)
- [ ] Test purchase completed
- [ ] Tier check verified (should show `premium`)
- [ ] Real-time news delivery verified (0 delay)

## Next Steps

1. **Update NewsFeeds.tsx** with the code above
2. **Restart frontend** to load Plan ID
3. **Test the upgrade button** (should open Whop modal)
4. **Complete a test purchase** or manually assign Premium
5. **Verify tier changes** with curl command

---

**Need Help?**
- Whop Docs: https://docs.whop.com/apps/features/subscriptions
- Tier Service: [backend/src/services/whopTierService.ts](backend/src/services/whopTierService.ts)
- Environment Config: [frontend/.env.local](frontend/.env.local)

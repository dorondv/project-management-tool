# PayPal Payment & Subscription Implementation Plan

## Overview
This document outlines the implementation plan for integrating PayPal payments, subscription management, and an admin panel based on the mockup design at `/Users/amirgeva/Documents/sollo-base`.

## Executive Summary - Admin Panel Requirements

### 🔐 Access Control & Authentication:
- **Supabase Integration**: Admin panel uses Supabase for authentication
- **Database**: PostgreSQL via Prisma for all user/subscription data
- **Role-Based Access**: Only users with `role = 'admin'` can access admin panel
- **Route Protection**: Frontend and backend protection for admin routes

### 🆓 Free User Management:
- **Free Access**: Admin can grant free access with expiration date (required)
- **Access Restrictions**: After expiration, free users can ONLY access `/settings` and `/pricing` pages
- **All Other Routes**: Redirect to `/settings` with upgrade message
- **Trial Coupons**: Coupons grant free trial periods (e.g., "tryout30" = 30 days), not discounts

### 🎫 Coupon System:
- **Purpose**: Trial periods only (NOT discounts - PayPal plans are fixed)
- **Example**: "tryout30" coupon grants 30 days free access
- **After Expiration**: User must upgrade to paid plan
- **No Discount Coupons**: Since PayPal plans are fixed, coupons only provide trial access

### ✅ Requirements That Are Fully Supported:
1. **Registration date** - Available from User model
2. **Payment date** - Available from BillingHistory (first payment)
3. **User status** - Can be determined from Subscription status
4. **Plan details** - Stored in Subscription model
5. **Payment details** - Available from BillingHistory aggregation
6. **Manual user addition** - Can be implemented (create user + free subscription)
7. **Free access granting** - Can be implemented (set price to $0, no PayPal needed)
8. **Refunds** - Supported via PayPal API (< 180 days) or PayPal dashboard

### ⚠️ Requirements That Need Workarounds:
1. **Coupon code tracking** - PayPal doesn't track coupons, must store in our database
2. **Trial period coupons** - Coupons grant free access for specific periods (e.g., "tryout30" = 30 days), not discounts
3. **List all subscriptions** - PayPal has no "list all" endpoint, must maintain our own database
4. **Free user access control** - Must implement route protection to restrict free users to settings/pricing pages only

### ❌ PayPal Limitations to Be Aware Of:
- No direct "list all subscriptions" API endpoint → Must sync via webhooks and maintain local database
- No built-in coupon tracking → Must implement coupon system ourselves
- Subscription modifications require customer confirmation → Can't change plans directly
- Refunds only via API within 180 days → After that, must use PayPal dashboard manually
- No pause/resume subscriptions → Must use suspend/reactivate or manage access in our system

### 📋 Implementation Strategy:
- **Data Source**: Our database (not PayPal API) for admin panel display
- **Actions**: PayPal API for cancel, suspend, reactivate, refund operations
- **Sync**: Webhooks + periodic verification to keep database in sync with PayPal
- **Coupons**: Custom implementation for trial periods (not discounts) - grants free access for X days
- **Access Control**: Supabase authentication + role-based access control (admin vs regular users)
- **Free Users**: Restricted access - only settings and pricing pages after expiration date

---

## 1. Flow Analysis from Mockup

### 1.1 User Flow
1. **Settings Page** → User sees subscription status card with "Manage Subscription" button
2. **Pricing Page** → User selects Monthly ($12.90) or Annual ($9.90/month, $118.80/year with 30% off) plan
3. **Payment Page** → PayPal SDK loads, user completes payment via PayPal buttons
4. **Backend Processing** → `linkPaypalSubscription` function links subscription to user
5. **Success/Failure** → User redirected to home or shown error

### 1.2 Key Components from Mockup

#### Frontend:
- **Settings Page** (`/settings`):
  - SubscriptionStatus component showing trial/active/cancelled status
  - Countdown timer for trial/subscription end date
  - Button linking to `/pricing`
  
- **Pricing Page** (`/pricing`):
  - Two plan cards:
    - **Monthly Plan**: $12.90/month
    - **Annual Plan**: $9.90/month (displayed as "30% Off"), billed annually at $118.80/year
  - Plan selection navigates to `/payment?plan={monthly|annual}`
  
- **Payment Page** (`/payment`):
  - Loads PayPal SDK dynamically using Client ID from backend
  - Shows plan summary and billing details
  - PayPal subscription buttons rendered via SDK
  - Handles `onApprove` callback to link subscription

#### Backend (from mockup):
- `getPaypalClientId()` - Returns PayPal Client ID for SDK loading
- `linkPaypalSubscription({ subscriptionID, planType })` - Links PayPal subscription to user account

#### Missing in Mockup (to be implemented):
- Admin panel for viewing subscription statuses
- WebSocket for real-time payment status updates
- PayPal webhook handler for payment confirmations/failures
- Subscription cancellation handling

---

## 2. Database Schema Changes

### 2.1 New Models Required

```prisma
model Subscription {
  id                String   @id @default(uuid())
  userId            String
  planType          String   // 'monthly' | 'annual' | 'free' | 'trial'
  status            String   // 'trial' | 'active' | 'cancelled' | 'expired' | 'churned' | 'free'
  paypalSubscriptionId String? @unique // PayPal subscription ID
  paypalPlanId      String?   // PayPal plan ID (P-771756107T669132ENFBLY7Y, P-9EG97204XL0481249NFBMDTQ)
  startDate         DateTime
  endDate           DateTime? // Expiration date for free/trial subscriptions
  trialEndDate      DateTime? // For trial period (legacy, use endDate for free users)
  price             Float     // Store actual price: 12.90 for monthly, 118.80 for annual, 0 for free
  currency          String   @default("USD")
  couponCode        String?  // Coupon code used (e.g., "tryout30")
  isFreeAccess      Boolean  @default(false) // Manually granted free access
  isTrialCoupon     Boolean  @default(false) // True if subscription was created via trial coupon
  grantedByAdminId   String?  // Admin user ID who granted free access
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  billingHistory BillingHistory[]
  
  @@map("subscriptions")
}

model BillingHistory {
  id                String   @id @default(uuid())
  subscriptionId    String
  invoiceNumber     String
  paypalTransactionId String? // PayPal transaction ID
  amount            Float
  currency          String   @default("USD")
  status            String   // 'paid' | 'pending' | 'failed' | 'refunded'
  paymentDate       DateTime
  invoiceUrl        String?  // Link to invoice PDF
  createdAt         DateTime @default(now())
  
  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  @@map("billing_history")
}

model PaymentWebhook {
  id                String   @id @default(uuid())
  paypalEventId     String   @unique
  eventType         String   // 'BILLING.SUBSCRIPTION.CREATED' | 'BILLING.SUBSCRIPTION.CANCELLED' | 'PAYMENT.SALE.COMPLETED' | etc.
  payload           Json     // Full webhook payload
  processed         Boolean  @default(false)
  processedAt       DateTime?
  error             String?
  createdAt         DateTime @default(now())
  
  @@map("payment_webhooks")
}
```

### 2.2 User Model Updates

```prisma
model User {
  // ... existing fields ...
  
  subscription Subscription?
  
  // ... rest of relations ...
}
```

---

## 3. Backend Implementation

### 3.1 PayPal Integration Setup

#### Required Environment Variables:
```env
PAYPAL_CLIENT_ID=AZDKkdrOJ62nh-cTcn29iq949ogQNdna5CaPCyt0JLLEImFiMslF_WDVSdEIQn8eVi9pfLXDvErBAA_N
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # or 'live' for production
PAYPAL_WEBHOOK_ID=your_webhook_id
```

#### PayPal Plan IDs (Actual Plans from PayPal):
- **Monthly Plan**: `P-771756107T669132ENFBLY7Y` → $12.90/month
  - Plan Name: "Sollo Monthly Subscription"
  - Billing: Monthly recurring
  
- **Annual Plan**: `P-9EG97204XL0481249NFBMDTQ` → $118.80/year ($9.90/month)
  - Plan Name: "Sollo Yearly Plan"
  - Billing: Paid Yearly
  - Display: Show as "30% Off - $9.90 per month" on Pricing page

### 3.2 New Backend Routes

#### `/server/routes/subscriptions.ts`
- `GET /api/subscriptions/status` - Get current user's subscription status
- `GET /api/subscriptions/client-id` - Get PayPal Client ID
- `POST /api/subscriptions/link` - Link PayPal subscription to user
- `POST /api/subscriptions/cancel` - Cancel subscription
- `GET /api/subscriptions/billing-history` - Get billing history

#### `/server/routes/payments.ts`
- `POST /api/payments/webhook` - PayPal webhook endpoint
- `GET /api/payments/invoice/:id` - Download invoice PDF

#### `/server/routes/admin.ts` (New)
- `GET /api/admin/subscriptions` - List all subscriptions (admin only)
- `GET /api/admin/subscriptions/stats` - Subscription statistics
- `POST /api/admin/subscriptions/:id/cancel` - Admin cancel subscription
- `GET /api/admin/customers` - List all customers with subscription status

### 3.3 PayPal Service Utilities

#### `/server/utils/paypalService.ts`
- PayPal API client initialization
- Create subscription plans
- Get subscription details
- Cancel subscription
- Verify webhook signatures
- Generate access tokens

#### `/server/utils/subscriptionService.ts`
- Create subscription record
- Update subscription status
- Calculate trial end date (7 days from signup)
- Check subscription expiry
- Handle subscription renewal

---

## 4. Frontend Implementation

### 4.1 Settings Page Updates

#### Component: `src/components/settings/SubscriptionStatus.tsx` (New)
- Display subscription status (trial/active/cancelled)
- Show countdown timer for trial/end date
- Button to navigate to pricing page
- Similar to mockup: `/Users/amirgeva/Documents/sollo-base/src/components/settings/SubscriptionStatus.jsx`

#### Update: `src/pages/Settings.tsx`
- Add SubscriptionStatus component
- Fetch subscription status from backend
- Replace mock countdown with real data

### 4.2 Pricing Page Updates

#### Update: `src/pages/Pricing.tsx`
- Update plan prices to match actual PayPal plans:
  - **Monthly Plan**: 
    - Display: $12.90/month
    - Description: "Renewing monthly charge"
    - PayPal Plan ID: `P-771756107T669132ENFBLY7Y`
  
  - **Annual Plan**: 
    - Primary Display: $9.90/month (large, prominent)
    - Badge: "30% Off" or "Save 30%"
    - Subtitle: "$118.80 Paid Yearly" or "Per month (annual billing)"
    - Description: "The best value, maximum savings"
    - PayPal Plan ID: `P-9EG97204XL0481249NFBMDTQ`
    - **Note**: User pays $118.80 upfront for the year, but display emphasizes monthly equivalent

- Ensure navigation to `/payment?plan={plan}` works correctly
- Map plan selection to correct PayPal Plan IDs:
  - `monthly` → `P-771756107T669132ENFBLY7Y`
  - `annual` → `P-9EG97204XL0481249NFBMDTQ`

- **Pricing Display Logic**:
  ```typescript
  const plans = {
    monthly: {
      price: 12.90,
      displayPrice: '$12.90',
      period: 'per month',
      planId: 'P-771756107T669132ENFBLY7Y'
    },
    annual: {
      price: 118.80, // Actual yearly price
      displayPrice: '$9.90', // Monthly equivalent for display
      displayPeriod: 'per month',
      actualPeriod: 'Paid Yearly ($118.80)',
      discount: '30% Off',
      planId: 'P-9EG97204XL0481249NFBMDTQ'
    }
  };
  ```

### 4.3 Payment Page Implementation

#### Update: `src/pages/Payment.tsx`
- Load PayPal SDK dynamically:
  ```typescript
  // Fetch PayPal Client ID from backend
  const { data } = await api.subscriptions.getClientId();
  const clientId = data.clientId;
  
  // Load PayPal SDK script
  const script = document.createElement('script');
  script.src = `https://www.paypal.com/sdk/js?client-id=${clientId}&vault=true&intent=subscription`;
  document.head.appendChild(script);
  ```

- Render PayPal buttons:
  ```typescript
  // Map plan type to PayPal Plan ID
  const planIdMap = {
    monthly: 'P-771756107T669132ENFBLY7Y',
    annual: 'P-9EG97204XL0481249NFBMDTQ'
  };
  
  const planId = planIdMap[plan];
  
  window.paypal.Buttons({
    style: {
      shape: 'rect',
      color: 'white',
      layout: 'vertical',
      label: 'subscribe'
    },
    createSubscription: function(data, actions) {
      return actions.subscription.create({
        plan_id: planId
      });
    },
    onApprove: async function(data, actions) {
      // Link subscription to user account
      await api.subscriptions.link({
        subscriptionID: data.subscriptionID,
        planType: plan
      });
      // Redirect to success page or home
    },
    onError: function(err) {
      // Handle error
    }
  }).render('#paypal-button-container');
  ```
  
- **Note**: PayPal SDK script should include:
  - `client-id`: From environment variable or backend API
  - `vault=true`: Required for subscriptions
  - `intent=subscription`: Required for subscription payments

- Match mockup UI design exactly

### 4.4 API Client Updates

#### Update: `src/utils/api.ts`
- Add subscription endpoints:
  ```typescript
  subscriptions: {
    getStatus: () => api.get('/subscriptions/status'),
    getClientId: () => api.get('/subscriptions/client-id'),
    link: (data) => api.post('/subscriptions/link', data),
    cancel: () => api.post('/subscriptions/cancel'),
    getBillingHistory: () => api.get('/subscriptions/billing-history'),
    redeemCoupon: (code: string) => api.post('/subscriptions/redeem-coupon', { code }),
    checkAccess: () => api.get('/subscriptions/check-access'),
  }
  ```

### 4.5 Route Protection for Free Users

#### Update: `src/App.tsx` or create `src/components/common/ProtectedRoute.tsx`
```typescript
// Protected route wrapper that checks subscription access
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  // Always allowed routes (no subscription needed)
  const publicRoutes = ['/settings', '/pricing'];
  const isPublicRoute = publicRoutes.includes(location.pathname);
  
  useEffect(() => {
    const subscription = state.subscription;
    
    // If public route, always allow
    if (isPublicRoute) {
      return;
    }
    
    // Check if user has active access
    const hasAccess = checkUserAccess(subscription);
    
    if (!hasAccess.hasFullAccess) {
      // Redirect to settings with upgrade message
      navigate('/settings');
      toast.error('Your free trial has expired. Please upgrade to continue.');
    }
  }, [state.subscription, location.pathname, navigate, isPublicRoute]);
  
  // If public route or has access, render children
  if (isPublicRoute || checkUserAccess(state.subscription).hasFullAccess) {
    return <>{children}</>;
  }
  
  // Otherwise, show loading or nothing (will redirect)
  return null;
}

// Usage in App.tsx
<Route path="/dashboard" element={
  <ProtectedRoute>
    <Dashboard />
  </ProtectedRoute>
} />
<Route path="/projects" element={
  <ProtectedRoute>
    <Projects />
  </ProtectedRoute>
} />
// ... all other routes except /settings and /pricing
```

#### Access Check Utility:
```typescript
// src/utils/accessControl.ts
export function checkUserAccess(subscription: Subscription | null): {
  hasFullAccess: boolean;
  canAccessSettings: boolean;
  canAccessPricing: boolean;
  expirationDate: Date | null;
  status: 'active' | 'trial' | 'expired' | 'none';
} {
  const canAccessSettings = true; // Always allowed
  const canAccessPricing = true; // Always allowed
  
  if (!subscription) {
    return {
      hasFullAccess: false,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: null,
      status: 'none'
    };
  }
  
  // Paid subscription - full access
  if (subscription.status === 'active' && subscription.paypalSubscriptionId) {
    return {
      hasFullAccess: true,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: subscription.endDate || null,
      status: 'active'
    };
  }
  
  // Free/Trial subscription - check expiration
  if (subscription.planType === 'free' || subscription.planType === 'trial') {
    const isExpired = subscription.endDate 
      ? subscription.endDate <= new Date()
      : false;
    
    return {
      hasFullAccess: !isExpired,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: subscription.endDate || null,
      status: isExpired ? 'expired' : 'trial'
    };
  }
  
  // Expired or cancelled - limited access
  return {
    hasFullAccess: false,
    canAccessSettings: true,
    canAccessPricing: true,
    expirationDate: subscription.endDate || null,
    status: 'expired'
  };
}
```

---

## 5. WebSocket Implementation

### 5.1 Real-time Payment Status Updates

#### Purpose:
- Notify user immediately when payment is confirmed/failed
- Update subscription status in real-time
- Admin panel updates for new subscriptions/cancellations

#### Implementation:
- Use Socket.io or native WebSocket
- Server emits events:
  - `payment:confirmed` - Payment successful
  - `payment:failed` - Payment failed
  - `subscription:cancelled` - Subscription cancelled
  - `subscription:renewed` - Subscription renewed

#### Frontend:
- Listen for payment events in Payment page
- Update subscription status in Settings page
- Show toast notifications

---

## 6. Admin Panel Implementation

### 6.1 Admin Panel Requirements

#### Required Fields/Data:
1. **Registration date** - From User model `createdAt`
2. **Payment date** - From BillingHistory `paymentDate` (first payment)
3. **User status** - Free trial, Active user (Paid), Churned, Free access
4. **Details of purchased plan** - Monthly, Annual, Free, or Trial plan type
5. **Payment details** - Total amount paid (sum from BillingHistory)
6. **Coupon code used** - Yes/No flag (trial coupon, not discount)
7. **Trial period end date** - If coupon was used, show expiration date
8. **Free access end date** - For manually granted free access

#### Required Capabilities:
1. **View all users** with subscription and payment information
2. **Manually add users** and grant free access
3. **Issue refunds** to customers (via PayPal API or manual process)
4. **Filter and search** users by status, plan, payment date, etc.
5. **Export data** for reporting

### 6.2 PayPal Capabilities & Limitations

#### ✅ What PayPal API CAN Do:
- **Get subscription details**: `GET /v1/billing/subscriptions/{subscription_id}`
- **Cancel subscription**: `POST /v1/billing/subscriptions/{subscription_id}/cancel`
- **Suspend subscription**: `POST /v1/billing/subscriptions/{subscription_id}/suspend`
- **Reactivate subscription**: `POST /v1/billing/subscriptions/{subscription_id}/activate`
- **Refund transactions**: `POST /v1/payments/sale/{sale_id}/refund` (within 180 days)
- **Get transaction details**: Via webhooks and transaction APIs

#### ❌ What PayPal API CANNOT Do:
- **List all subscriptions**: No direct endpoint to list all subscriptions. **Solution**: Maintain our own database and sync via webhooks.
- **Track coupon codes**: PayPal subscriptions don't have built-in coupon tracking. **Solution**: Store coupon usage in our database.
- **Modify subscription plans**: Requires customer confirmation via PayPal. **Solution**: Cancel old subscription, create new one.
- **Pause subscriptions**: Not supported. **Solution**: Suspend instead, or manage access in our system.
- **Direct refunds after 180 days**: Must use PayPal dashboard or "Send Money" feature.

### 6.3 Database Schema Updates for Admin Requirements

#### Update Subscription Model:
```prisma
model Subscription {
  id                String   @id @default(uuid())
  userId            String
  planType          String   // 'monthly' | 'annual' | 'free'
  status            String   // 'trial' | 'active' | 'cancelled' | 'expired' | 'churned' | 'free'
  paypalSubscriptionId String? @unique
  paypalPlanId      String?
  startDate         DateTime
  endDate           DateTime?
  trialEndDate      DateTime?
  price             Float    // Store actual price: 12.90 for monthly, 118.80 for annual, 0 for free
  currency          String   @default("USD")
  couponCode        String?  // Coupon code used (if any)
  discountAmount    Float?   // Discount amount in currency (if coupon used)
  isFreeAccess      Boolean  @default(false) // Manually granted free access
  grantedByAdminId  String?  // Admin user ID who granted free access
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  billingHistory BillingHistory[]
  
  @@map("subscriptions")
}
```

#### Update BillingHistory Model:
```prisma
model BillingHistory {
  id                String   @id @default(uuid())
  subscriptionId    String
  invoiceNumber     String
  paypalTransactionId String? @unique // PayPal transaction ID (for refunds)
  paypalSaleId      String?  // PayPal sale ID (for refund API)
  amount            Float
  currency          String   @default("USD")
  status            String   // 'paid' | 'pending' | 'failed' | 'refunded' | 'partially_refunded'
  paymentDate       DateTime
  refundedAmount   Float?    // Amount refunded (if any)
  refundedDate     DateTime? // Date refund was issued
  refundReason     String?   // Reason for refund
  invoiceUrl        String?
  createdAt         DateTime @default(now())
  
  subscription Subscription @relation(fields: [subscriptionId], references: [id], onDelete: Cascade)
  
  @@map("billing_history")
}
```

#### New Coupon Model (Trial Period Coupons):
```prisma
model Coupon {
  id                String   @id @default(uuid())
  code              String   @unique // e.g., "tryout30", "tryout7", "tryout14"
  trialDays         Int      // Number of free trial days (e.g., 30 for "tryout30")
  description       String?  // Description of the trial offer
  validFrom         DateTime @default(now())
  validUntil        DateTime? // Optional expiration date for coupon validity
  maxUses           Int?     // Maximum number of times coupon can be used
  currentUses       Int      @default(0)
  isActive          Boolean  @default(true)
  createdAt         DateTime @default(now())
  updatedAt         DateTime @updatedAt
  
  subscriptions     Subscription[]
  
  @@map("coupons")
}
```

**Note**: Coupons are for **trial periods only**, not discounts. They grant free access for a specific number of days. After expiration, users must upgrade to a paid plan.

### 6.4 Admin Panel Page Implementation

#### New: `src/pages/Admin.tsx`
- **Dashboard Overview**:
  - Total users count
  - Active subscriptions count
  - Trial users count
  - Churned users count
  - Total revenue (sum of all payments)
  - Monthly recurring revenue (MRR)

#### Components:
- **`src/components/admin/UserManagement.tsx`** - Main user list table
  - Columns:
    - User Name/Email
    - Registration Date
    - Payment Date (first payment)
    - User Status (Free trial, Active user (Paid), Churned)
    - Plan Type (Monthly/Annual/Free)
    - Total Paid Amount
    - Coupon Used (Yes/No)
    - Discount Amount (if applicable)
    - Actions (View Details, Grant Free Access, Issue Refund, Cancel Subscription)
  
- **`src/components/admin/UserDetailsModal.tsx`** - Detailed user view
  - Full subscription history
  - Payment history with transaction IDs
  - Coupon details (if used)
  - Ability to grant free access
  - Refund history
  
- **`src/components/admin/AddUserModal.tsx`** - Manually add user with free access
  - Create user account
  - Grant free subscription immediately
  - Set expiration date (optional)
  
- **`src/components/admin/RefundModal.tsx`** - Issue refund interface
  - Select transaction to refund
  - Full or partial refund
  - Refund reason
  - Process via PayPal API

#### Features:
- **Filtering**:
  - By status (Free trial, Active user (Paid), Churned, Free access)
  - By plan type (Monthly, Annual, Free, Trial)
  - By date range (registration date, payment date, expiration date)
  - By coupon usage (Yes/No)
  - By access status (Has full access, Expired, Active)
  
- **Search**:
  - By user email/name
  - By PayPal subscription ID
  - By transaction ID
  
- **Actions**:
  - View user details
  - Grant free access (with expiration date)
  - Extend free access expiration date
  - Revoke free access
  - Cancel subscription (via PayPal API)
  - Suspend/Reactivate subscription
  - Issue refund (via PayPal API)
  - Create/manage trial coupons
  - Export data (CSV/Excel)

### 6.5 Admin Backend Routes

#### `/server/routes/admin.ts`
```typescript
// User Management
GET    /api/admin/users                    // List all users with subscription data
GET    /api/admin/users/:id                 // Get user details with full history
POST   /api/admin/users                     // Manually add user
PUT    /api/admin/users/:id/free-access     // Grant free access to user (with end date)
DELETE /api/admin/users/:id/free-access     // Revoke free access

// Subscription Management
GET    /api/admin/subscriptions             // List all subscriptions
GET    /api/admin/subscriptions/stats       // Subscription statistics
POST   /api/admin/subscriptions/:id/cancel  // Cancel subscription via PayPal
POST   /api/admin/subscriptions/:id/suspend // Suspend subscription via PayPal
POST   /api/admin/subscriptions/:id/activate // Reactivate subscription via PayPal

// Coupon Management
GET    /api/admin/coupons                   // List all coupons
POST   /api/admin/coupons                   // Create new trial coupon
PUT    /api/admin/coupons/:id               // Update coupon
DELETE /api/admin/coupons/:id               // Delete/deactivate coupon
GET    /api/admin/coupons/:code/usage       // Get coupon usage statistics

// Payment Management
GET    /api/admin/payments                  // List all payments
GET    /api/admin/payments/stats            // Payment statistics
POST   /api/admin/payments/:id/refund       // Issue refund via PayPal API
GET    /api/admin/payments/refund-history   // Refund history

// Export
GET    /api/admin/export/users              // Export users data (CSV)
GET    /api/admin/export/payments           // Export payments data (CSV)
GET    /api/admin/export/subscriptions      // Export subscriptions data (CSV)
```

#### Public Route (for coupon redemption):
```typescript
// Subscription Routes (public, but requires authentication)
POST   /api/subscriptions/redeem-coupon    // Redeem trial coupon code
GET    /api/subscriptions/check-access      // Check if user has active access
```

### 6.6 Admin Panel Implementation Details

#### User Status Logic:
```typescript
// Determine user status based on subscription
function getUserStatus(subscription: Subscription | null): 'Free trial' | 'Active user (Paid)' | 'Churned' | 'Free access' {
  if (!subscription) {
    return 'Churned'; // No subscription = no access
  }
  
  // Manually granted free access
  if (subscription.isFreeAccess && subscription.planType === 'free') {
    const isExpired = subscription.endDate 
      ? subscription.endDate <= new Date()
      : false;
    return isExpired ? 'Churned' : 'Free access';
  }
  
  // Trial coupon subscription
  if (subscription.isTrialCoupon && subscription.planType === 'trial') {
    const isExpired = subscription.endDate 
      ? subscription.endDate <= new Date()
      : false;
    return isExpired ? 'Churned' : 'Free trial';
  }
  
  // Paid subscription
  if (subscription.status === 'active' && subscription.paypalSubscriptionId) {
    return 'Active user (Paid)';
  }
  
  // Expired or cancelled
  if (subscription.status === 'cancelled' || subscription.status === 'expired') {
    return 'Churned';
  }
  
  // Check if free/trial subscription is expired
  if ((subscription.planType === 'free' || subscription.planType === 'trial') && subscription.endDate) {
    if (subscription.endDate <= new Date()) {
      return 'Churned';
    }
    return subscription.isFreeAccess ? 'Free access' : 'Free trial';
  }
  
  return 'Churned';
}
```

#### Payment Date Logic:
```typescript
// Get first payment date
const firstPayment = await prisma.billingHistory.findFirst({
  where: { subscriptionId: subscription.id, status: 'paid' },
  orderBy: { paymentDate: 'asc' }
});
const paymentDate = firstPayment?.paymentDate || null;
```

#### Total Paid Amount:
```typescript
// Calculate total paid
const totalPaid = await prisma.billingHistory.aggregate({
  where: { 
    subscriptionId: subscription.id,
    status: { in: ['paid', 'refunded'] }
  },
  _sum: { amount: true }
});
```

### 6.7 Granting Free Access & Trial Coupons

#### Implementation - Manual Free Access:
1. **Create Free Subscription**:
   - Set `planType` to `'free'`
   - Set `price` to `0`
   - Set `isFreeAccess` to `true`
   - Set `status` to `'active'`
   - Set `grantedByAdminId` to current admin user ID
   - Set `endDate` to specific expiration date (required)

2. **No PayPal Integration Required**:
   - Free access is managed entirely in our database
   - No PayPal subscription ID needed
   - User gets full access until `endDate`

3. **After Expiration**:
   - User can only access `/settings` and `/pricing` pages
   - All other routes redirect to `/settings` with upgrade message
   - User must upgrade to paid plan to regain full access

#### Implementation - Trial Coupon System:
1. **Coupon Creation** (Admin):
   - Create coupon with code (e.g., "tryout30")
   - Set `trialDays` (e.g., 30)
   - Set `maxUses` (optional limit)
   - Set `validUntil` (optional expiration)

2. **User Redeems Coupon**:
   - User enters coupon code during signup or in settings
   - Validate coupon:
     - Check if coupon exists and is active
     - Check if `validUntil` hasn't passed
     - Check if `currentUses < maxUses` (if maxUses set)
   
3. **Create Trial Subscription**:
   - Set `planType` to `'trial'`
   - Set `price` to `0`
   - Set `couponCode` to coupon code used
   - Set `isTrialCoupon` to `true`
   - Set `status` to `'active'`
   - Set `endDate` to `now() + trialDays`
   - Increment coupon `currentUses`

4. **After Trial Expires**:
   - Same restrictions as free access expiration
   - User must upgrade to paid plan

#### Coupon Redemption Flow:
```typescript
// Backend: POST /api/subscriptions/redeem-coupon
async function redeemCoupon(userId: string, couponCode: string) {
  // 1. Validate coupon
  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode }
  });
  
  if (!coupon || !coupon.isActive) {
    throw new Error('Invalid coupon code');
  }
  
  if (coupon.validUntil && coupon.validUntil < new Date()) {
    throw new Error('Coupon has expired');
  }
  
  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
    throw new Error('Coupon usage limit reached');
  }
  
  // 2. Check if user already has active subscription
  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId,
      status: { in: ['active', 'trial'] },
      endDate: { gt: new Date() }
    }
  });
  
  if (existingSubscription) {
    throw new Error('User already has an active subscription');
  }
  
  // 3. Create trial subscription
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + coupon.trialDays);
  
  const subscription = await prisma.subscription.create({
    data: {
      userId,
      planType: 'trial',
      status: 'active',
      price: 0,
      couponCode: coupon.code,
      isTrialCoupon: true,
      startDate: new Date(),
      endDate: endDate,
      currency: 'USD'
    }
  });
  
  // 4. Increment coupon usage
  await prisma.coupon.update({
    where: { id: coupon.id },
    data: { currentUses: { increment: 1 } }
  });
  
  return subscription;
}
```

#### Free User Access Restrictions:
```typescript
// Check subscription status and restrict access
function checkUserAccess(subscription: Subscription | null): {
  hasFullAccess: boolean;
  canAccessSettings: boolean;
  canAccessPricing: boolean;
  expirationDate: Date | null;
} {
  const canAccessSettings = true; // Always allowed
  const canAccessPricing = true; // Always allowed
  
  if (!subscription) {
    return {
      hasFullAccess: false,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: null
    };
  }
  
  // Paid subscription - full access
  if (subscription.status === 'active' && subscription.paypalSubscriptionId) {
    return {
      hasFullAccess: true,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: subscription.endDate
    };
  }
  
  // Free/Trial subscription - check expiration
  if (subscription.planType === 'free' || subscription.planType === 'trial') {
    const isExpired = subscription.endDate 
      ? subscription.endDate <= new Date()
      : false;
    
    return {
      hasFullAccess: !isExpired,
      canAccessSettings: true,
      canAccessPricing: true,
      expirationDate: subscription.endDate
    };
  }
  
  // Expired or cancelled - limited access
  return {
    hasFullAccess: false,
    canAccessSettings: true,
    canAccessPricing: true,
    expirationDate: subscription.endDate
  };
}
```

### 6.8 Refund Implementation

#### Via PayPal API (Recommended for < 180 days):
```typescript
// Refund a payment via PayPal API
POST /v1/payments/sale/{sale_id}/refund

// Required:
{
  "amount": {
    "total": "12.90",
    "currency": "USD"
  },
  "invoice_id": "INV-12345",
  "note_to_payer": "Refund reason"
}

// Response includes refund_id
```

#### Implementation Steps:
1. **Get Transaction Details**:
   - Retrieve `paypalSaleId` from BillingHistory
   - Verify transaction is refundable (< 180 days old)

2. **Issue Refund**:
   - Call PayPal Refund API
   - Update BillingHistory:
     - Set `status` to `'refunded'` or `'partially_refunded'`
     - Set `refundedAmount`
     - Set `refundedDate`
     - Set `refundReason`

3. **Handle Subscription**:
   - If full refund: Cancel subscription
   - If partial refund: Keep subscription active
   - Update user access accordingly

#### Manual Refund Process (After 180 days):
1. Log into PayPal Business account
2. Navigate to Activity → Find transaction
3. Click "Refund this payment"
4. Enter refund amount and reason
5. Manually update database:
   - Mark transaction as refunded
   - Update subscription status if needed

### 6.9 Admin Routes Protection & Access Control

#### Backend Middleware (Express):
```typescript
// Middleware to verify Supabase session and get user
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    
    // Verify token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    
    // Get user from database
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    
    if (!dbUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    req.user = dbUser;
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authentication failed' });
  }
}

// Check if user is admin
function requireAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

// Apply authentication to all admin routes
app.use('/api/admin', authenticateUser, requireAdmin);
```

#### Frontend Route Protection (React Router):
```typescript
// Protected route component for admin pages
function AdminRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (!state.user) {
      navigate('/');
      return;
    }
    
    if (state.user.role !== 'admin') {
      navigate('/');
      toast.error('Admin access required');
    }
  }, [state.user, navigate]);
  
  if (!state.user || state.user.role !== 'admin') {
    return null;
  }
  
  return <>{children}</>;
}

// Usage in App.tsx
<Route path="/admin" element={
  <AdminRoute>
    <Admin />
  </AdminRoute>
} />
```

#### Free User Access Control:
```typescript
// Check if user has active subscription (paid or within free period)
function hasActiveAccess(subscription: Subscription | null): boolean {
  if (!subscription) return false;
  
  // Paid subscription is active
  if (subscription.status === 'active' && subscription.paypalSubscriptionId) {
    return true;
  }
  
  // Free/trial subscription is within expiration date
  if (subscription.planType === 'free' || subscription.planType === 'trial') {
    if (subscription.endDate && subscription.endDate > new Date()) {
      return true;
    }
    return false; // Expired free access
  }
  
  return false;
}

// Route protection for free users (only allow settings and pricing)
function FreeUserRoute({ children }: { children: React.ReactNode }) {
  const { state } = useApp();
  const location = useLocation();
  const navigate = useNavigate();
  
  const allowedRoutes = ['/settings', '/pricing'];
  const isAllowedRoute = allowedRoutes.includes(location.pathname);
  
  useEffect(() => {
    const subscription = state.subscription;
    const hasAccess = hasActiveAccess(subscription);
    
    // If user has active access, allow all routes
    if (hasAccess) {
      return;
    }
    
    // If user doesn't have access and trying to access restricted route
    if (!hasAccess && !isAllowedRoute) {
      navigate('/settings');
      toast.error('Your free trial has expired. Please upgrade to continue.');
    }
  }, [state.subscription, location.pathname, navigate, isAllowedRoute]);
  
  return <>{children}</>;
}
```

### 6.10 Supabase Integration for Admin Panel

#### Database Connection:
- **Primary Database**: PostgreSQL via Prisma (existing setup)
- **Authentication**: Supabase Auth (existing setup)
- **User Management**: Store user data in PostgreSQL, authenticate via Supabase

#### Admin Panel Data Flow:
1. **User Authentication**: Supabase handles login/signup
2. **User Data**: Stored in PostgreSQL via Prisma
3. **Role Check**: Verify `user.role === 'admin'` from database
4. **Admin Actions**: All admin operations query PostgreSQL database
5. **Real-time Updates**: Use WebSocket or polling for live updates

#### Supabase RLS (Row Level Security) - Optional:
If using Supabase Postgres directly, can add RLS policies:
```sql
-- Admin users can read all user data
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);
```

**Note**: Since we're using Prisma with PostgreSQL, RLS is optional. We'll handle access control in application code.

### 6.10 Export Functionality

#### CSV Export Format:
```csv
User Email,Registration Date,Payment Date,Status,Plan Type,Total Paid,Coupon Used,Discount Amount,PayPal Subscription ID
user@example.com,2025-01-15,2025-01-22,Active user (Paid),Monthly,$12.90,No,$0.00,I-BW452GLLEP1G
```

#### Implementation:
- Use `csv-writer` or `papaparse` library
- Generate CSV from database queries
- Include all required fields
- Support date range filtering

---

## 7. PayPal Webhook Handler

### 7.1 Webhook Events to Handle

1. **BILLING.SUBSCRIPTION.CREATED**
   - Create subscription record
   - Set status to 'active'
   - Set trial end date if applicable

2. **BILLING.SUBSCRIPTION.CANCELLED**
   - Update subscription status to 'cancelled'
   - Set end date
   - Notify user via WebSocket

3. **BILLING.SUBSCRIPTION.EXPIRED**
   - Update subscription status to 'expired'
   - Revoke access

4. **PAYMENT.SALE.COMPLETED**
   - Create billing history record
   - Update subscription renewal date
   - Generate invoice

5. **PAYMENT.SALE.DENIED**
   - Mark payment as failed
   - Notify user
   - Handle retry logic

### 7.2 Webhook Security
- Verify PayPal webhook signatures
- Validate event payloads
- Idempotency handling (prevent duplicate processing)

---

## 8. Implementation Steps

### Phase 1: Database & Backend Foundation
1. ✅ Create Prisma schema for Subscription, BillingHistory, PaymentWebhook
2. ✅ Run migrations
3. ✅ Create PayPal service utilities
4. ✅ Create subscription service utilities
5. ✅ Create backend routes for subscriptions
6. ✅ Create backend routes for payments/webhooks
7. ✅ Add admin routes

### Phase 2: PayPal Integration
1. ✅ PayPal Developer account already set up
2. ✅ Subscription plans already created in PayPal:
   - Monthly: P-771756107T669132ENFBLY7Y ($12.90/month)
   - Annual: P-9EG97204XL0481249NFBMDTQ ($118.80/year)
3. ✅ Configure PayPal webhooks
4. ✅ Implement PayPal API client
5. ✅ Test PayPal sandbox integration

### Phase 3: Frontend Integration
1. ✅ Update Settings page with SubscriptionStatus component
2. ✅ Update Payment page with PayPal SDK integration
3. ✅ Add subscription API client methods
4. ✅ Test payment flow end-to-end

### Phase 4: WebSocket & Real-time Updates
1. ✅ Set up WebSocket server
2. ✅ Implement payment status events
3. ✅ Add WebSocket client to frontend
4. ✅ Test real-time updates

### Phase 5: Admin Panel
1. ✅ Create Admin page
2. ✅ Create admin components
3. ✅ Add admin API endpoints
4. ✅ Test admin functionality

### Phase 6: Testing & Polish
1. ✅ Test all payment scenarios
2. ✅ Test subscription lifecycle
3. ✅ Test webhook handling
4. ✅ Test admin panel
5. ✅ UI/UX polish
6. ✅ Error handling improvements

---

## 9. Testing Checklist

### Payment Flow:
- [ ] User can select plan on Pricing page
- [ ] Payment page loads PayPal SDK correctly
- [ ] PayPal buttons render correctly
- [ ] User can complete payment via PayPal
- [ ] Subscription is linked to user account
- [ ] User is redirected after successful payment
- [ ] Error handling works for failed payments

### Subscription Management:
- [ ] Subscription status displays correctly in Settings
- [ ] Countdown timer works for trial/end dates
- [ ] User can cancel subscription
- [ ] Subscription expiry is handled correctly
- [ ] Billing history displays correctly

### Webhooks:
- [ ] Webhook endpoint receives PayPal events
- [ ] Webhook signatures are verified
- [ ] Subscription created event is processed
- [ ] Payment completed event creates billing record
- [ ] Cancellation event updates subscription status
- [ ] Duplicate events are handled (idempotency)

### Admin Panel:
- [ ] Admin can view all users with required fields:
  - [ ] Registration date
  - [ ] Payment date (first payment)
  - [ ] User status (Free trial, Active user (Paid), Churned)
  - [ ] Plan type details
  - [ ] Total payment amount
  - [ ] Coupon usage (Yes/No)
  - [ ] Discount amount (if coupon used)
- [ ] Admin can filter by status, plan type, date range
- [ ] Admin can search by email/name/subscription ID
- [ ] Admin can manually add users
- [ ] Admin can grant free access to users
- [ ] Admin can cancel subscriptions via PayPal API
- [ ] Admin can suspend/reactivate subscriptions
- [ ] Admin can issue refunds via PayPal API (< 180 days)
- [ ] Refund history is tracked correctly
- [ ] Statistics display correctly (MRR, total revenue, etc.)
- [ ] Export functionality works (CSV)
- [ ] Admin-only access is enforced

### WebSocket:
- [ ] Payment confirmation updates in real-time
- [ ] Payment failure notifications work
- [ ] Subscription status updates in real-time
- [ ] Admin panel updates in real-time

---

## 10. Security Considerations

1. **PayPal Credentials**: Store securely in environment variables
2. **Webhook Verification**: Always verify PayPal webhook signatures
3. **Admin Access**: Enforce role-based access control
4. **Subscription Data**: Encrypt sensitive subscription data
5. **Rate Limiting**: Implement rate limiting on payment endpoints
6. **Input Validation**: Validate all PayPal webhook payloads
7. **Error Handling**: Don't expose sensitive error details to frontend

---

## 11. Environment Variables Required

```env
# PayPal Configuration
PAYPAL_CLIENT_ID=AZDKkdrOJ62nh-cTcn29iq949ogQNdna5CaPCyt0JLLEImFiMslF_WDVSdEIQn8eVi9pfLXDvErBAA_N
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Change to 'live' for production
PAYPAL_WEBHOOK_ID=your_webhook_id

# PayPal Plan IDs (Actual Plans from PayPal Dashboard)
PAYPAL_PLAN_MONTHLY=P-771756107T669132ENFBLY7Y
PAYPAL_PLAN_ANNUAL=P-9EG97204XL0481249NFBMDTQ

# Admin Configuration
ADMIN_EMAIL=admin@example.com
```

---

## 12. Notes from Mockup Investigation

### What Works in Mockup:
- ✅ Settings → Pricing → Payment flow is clear
- ✅ PayPal SDK integration pattern is established
- ✅ Subscription status display with countdown
- ✅ UI/UX design is consistent

### What's Missing/Broken in Mockup:
- ❌ No admin panel exists
- ❌ No WebSocket implementation
- ❌ Webhook handling not visible
- ❌ Payment confirmation flow incomplete
- ❌ Error handling needs improvement

### What We Need to Build:
- ✅ Complete PayPal webhook handler
- ✅ Real-time WebSocket updates
- ✅ Admin panel from scratch
- ✅ Comprehensive error handling
- ✅ Invoice generation/download
- ✅ Subscription cancellation flow

---

## 13. Dependencies to Install

### Backend:
```bash
npm install @paypal/checkout-server-sdk
npm install socket.io
npm install jsonwebtoken
```

### Frontend:
```bash
# PayPal SDK is loaded dynamically, no npm package needed
npm install socket.io-client
```

---

## 14. Next Steps

1. **Review this plan** with the team
2. **Set up PayPal Developer account** and create plans
3. **Start with Phase 1** (Database & Backend Foundation)
4. **Test incrementally** after each phase
5. **Deploy to staging** before production

---

## 15. PayPal Plan Details (Confirmed)

### Monthly Plan
- **Plan ID**: `P-771756107T669132ENFBLY7Y`
- **Name**: "Sollo Monthly Subscription"
- **Price**: $12.90 per month
- **Billing**: Monthly recurring
- **PayPal Client ID**: `AZDKkdrOJ62nh-cTcn29iq949ogQNdna5CaPCyt0JLLEImFiMslF_WDVSdEIQn8eVi9pfLXDvErBAA_N`

### Annual Plan
- **Plan ID**: `P-9EG97204XL0481249NFBMDTQ`
- **Name**: "Sollo Yearly Plan"
- **Price**: $118.80 Paid Yearly
- **Display Price**: $9.90 per month (with "30% Off" badge)
- **Billing**: Paid Yearly (one-time annual payment)
- **Savings**: 30% discount compared to monthly plan
- **PayPal Client ID**: `AZDKkdrOJ62nh-cTcn29iq949ogQNdna5CaPCyt0JLLEImFiMslF_WDVSdEIQn8eVi9pfLXDvErBAA_N`

### PayPal SDK Configuration
- **SDK URL**: `https://www.paypal.com/sdk/js?client-id={CLIENT_ID}&vault=true&intent=subscription`
- **Button Style**: 
  - Shape: `rect`
  - Color: `white`
  - Layout: `vertical`
  - Label: `subscribe`

### Implementation Notes
- Both plans use the same PayPal Client ID
- PayPal SDK must be loaded with `vault=true` and `intent=subscription` parameters
- Button container IDs should be unique per plan (e.g., `paypal-button-container-P-771756107T669132ENFBLY7Y`)
- On approval, `data.subscriptionID` contains the PayPal subscription ID to link to user account

---

## 16. Refund Process Documentation

### 16.1 How to Issue Refunds

#### Via PayPal API (Within 180 Days):
1. **Get Transaction Details**:
   - Retrieve `paypalSaleId` from BillingHistory record
   - Verify transaction is less than 180 days old
   - Check current refund status

2. **Call PayPal Refund API**:
   ```typescript
   POST /v1/payments/sale/{sale_id}/refund
   
   Headers:
   Authorization: Bearer {access_token}
   Content-Type: application/json
   
   Body:
   {
     "amount": {
       "total": "12.90",
       "currency": "USD"
     },
     "invoice_id": "INV-12345",
     "note_to_payer": "Refund reason here"
   }
   ```

3. **Update Database**:
   - Update BillingHistory record:
     - `status` → `'refunded'` or `'partially_refunded'`
     - `refundedAmount` → refund amount
     - `refundedDate` → current date
     - `refundReason` → reason provided
   - If full refund: Cancel subscription
   - If partial refund: Keep subscription active

4. **Notify User**:
   - Send email notification
   - Update subscription status
   - Emit WebSocket event

#### Via PayPal Dashboard (After 180 Days or Manual):
1. **Log into PayPal Business Account**
2. **Navigate to Activity**:
   - Go to https://www.paypal.com/businessmanage/account/activity
   - Find the transaction by date, amount, or customer email
3. **Click on Transaction**:
   - View transaction details
   - Click "Refund this payment" button
4. **Enter Refund Details**:
   - Select full or partial refund
   - Enter refund amount
   - Add refund reason (optional)
   - Confirm refund
5. **Manually Update Database**:
   - Update BillingHistory record with refund details
   - Update subscription status if needed
   - Document refund in admin notes

#### Important Notes:
- **Refund Window**: PayPal allows refunds within 180 days of original payment
- **Transaction Fees**: Original transaction fee is NOT returned to seller
- **Partial Refunds**: Supported, but subscription remains active
- **Full Refunds**: Should cancel subscription to prevent future charges
- **Refund Processing Time**: Usually 3-5 business days to customer's account
- **Refund Limits**: No limit on number of refunds, but must be within 180 days

### 16.2 Refund Scenarios

#### Scenario 1: Customer Requests Refund
1. Customer contacts support requesting refund
2. Admin verifies subscription and payment details
3. Admin checks if refund is within 180 days
4. Admin issues refund via API or PayPal dashboard
5. System updates database and notifies customer
6. Subscription is cancelled if full refund

#### Scenario 2: Subscription Cancellation with Refund
1. Customer cancels subscription
2. Admin checks if customer is eligible for refund (within refund window)
3. If eligible, process refund for remaining period
4. Update subscription status to cancelled
5. Record refund in billing history

#### Scenario 3: Payment Failure Refund
1. Payment fails but was initially processed
2. PayPal automatically retries payment
3. If customer disputes, issue refund
4. Update subscription status accordingly

### 16.3 Refund API Integration

#### Backend Route: `POST /api/admin/payments/:id/refund`
```typescript
// Request
{
  "amount": 12.90,  // Optional: omit for full refund
  "reason": "Customer requested refund"
}

// Response
{
  "success": true,
  "refundId": "REF-12345",
  "refundAmount": 12.90,
  "message": "Refund processed successfully"
}
```

#### Error Handling:
- Transaction too old (> 180 days)
- Transaction already refunded
- Insufficient funds
- Invalid transaction ID
- PayPal API errors

---

## 17. PayPal Limitations & Workarounds

### 17.1 What PayPal CANNOT Do (and Our Solutions)

| Limitation | Impact | Our Solution |
|------------|--------|--------------|
| **No list all subscriptions endpoint** | Can't fetch all subscriptions from PayPal | Maintain our own database, sync via webhooks |
| **No built-in coupon tracking** | Can't track discounts via PayPal | Store coupon codes and discounts in our database |
| **Subscription modifications require customer confirmation** | Can't change plans directly | Cancel old subscription, create new one (with customer approval) |
| **No pause/resume subscriptions** | Can't temporarily pause subscriptions | Use suspend/reactivate, or manage access in our system |
| **Refunds only within 180 days** | Can't refund older transactions via API | Use PayPal dashboard for manual refunds after 180 days |
| **No direct subscription upgrade/downgrade** | Can't change plan type easily | Cancel current subscription, create new one |
| **Rate limiting on API calls** | Too many requests may be throttled | Implement caching, batch operations, exponential backoff |

### 17.2 What PayPal CAN Do (via API)

✅ **Get subscription details** - `GET /v1/billing/subscriptions/{id}`  
✅ **Cancel subscription** - `POST /v1/billing/subscriptions/{id}/cancel`  
✅ **Suspend subscription** - `POST /v1/billing/subscriptions/{id}/suspend`  
✅ **Reactivate subscription** - `POST /v1/billing/subscriptions/{id}/activate`  
✅ **Refund transactions** - `POST /v1/payments/sale/{sale_id}/refund`  
✅ **Get transaction details** - Via webhooks and transaction APIs  
✅ **Webhook events** - Real-time notifications for subscription changes  

### 17.3 Database Sync Strategy

Since PayPal doesn't provide a "list all subscriptions" endpoint, we must:

1. **Store All Subscriptions Locally**:
   - When subscription is created → Store in database
   - When webhook received → Update database
   - When admin action taken → Update database

2. **Sync with PayPal**:
   - Periodically fetch subscription details for active subscriptions
   - Use webhooks to stay updated in real-time
   - Handle discrepancies between our DB and PayPal

3. **Admin Panel Data Source**:
   - Always query our database (not PayPal API)
   - Use PayPal API only for actions (cancel, suspend, refund)
   - Display data from our database with PayPal status verification

---

## 18. Questions to Resolve

1. What is the trial period duration? (Mockup suggests 7 days)
2. Should we support subscription upgrades/downgrades?
3. What happens when a payment fails? (Retry logic?)
4. Should invoices be auto-generated or manual?
5. What admin features are priority?
6. Should we support multiple currencies?
7. What is the refund policy implementation?
8. Should the annual plan show monthly equivalent ($9.90/month) or yearly total ($118.80/year) as primary price?
9. **Coupon System**: ✅ **RESOLVED** - Coupons are for trial periods only (e.g., "tryout30" = 30 days free). No discount coupons since PayPal plans are fixed.
10. **Free Access Duration**: ✅ **RESOLVED** - Free access must have an expiration date. After expiration, users can only access settings and pricing pages.
11. **Churned Status**: How long after cancellation should a user be considered "Churned"? (Immediately, after 30 days, etc.)
12. **Refund Policy**: What is the official refund policy? (Full refund within X days, prorated refunds, etc.)
13. **Admin Permissions**: Should there be different admin roles (super admin, support admin) with different permissions?
14. **Route Protection**: ✅ **RESOLVED** - Free users after expiration can only access `/settings` and `/pricing` pages. All other routes redirect to settings with upgrade message.
15. **Supabase Integration**: ✅ **RESOLVED** - Admin panel uses Supabase for authentication, PostgreSQL (via Prisma) for data storage, role-based access control for admin-only routes.

---

**End of Implementation Plan**


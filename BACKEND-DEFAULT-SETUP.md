# Backend-Based Default Setup

## Overview

Instead of using Supabase triggers, the backend handles setting up default categories and payment methods for new users.

## How It Works

```
1. User signs up (Supabase handles this)
2. User verifies email
3. User signs in
4. Frontend detects SIGNED_IN event
5. Frontend calls POST /api/users/initialize-defaults
6. Backend sets up defaults:
   - Categories with is_default=true → User opted IN
   - Categories with is_default=false → User opted OUT
   - Payment methods with is_default=true → User opted IN
   - Payment methods with is_default=false → User opted OUT
7. User sees only default items
```

## Setup Instructions

### Step 1: Add is_default Column

Run this SQL in [Supabase SQL Editor](https://supabase.com/dashboard/project/qioipnpbecxnmmlymxet/sql):

```sql
-- Add is_default column to categories
ALTER TABLE categories 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT true;

-- Add is_default column to payment_methods
ALTER TABLE payment_methods 
ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT true;

-- Mark all existing as default
UPDATE categories SET is_default = true WHERE is_default IS NULL;
UPDATE payment_methods SET is_default = true WHERE is_default IS NULL;
```

Or just run the file: `add-is-default-column.sql`

### Step 2: Mark Non-Default Items (Optional)

If you want some items hidden for new users:

```sql
-- Hide specific categories
UPDATE categories 
SET is_default = false 
WHERE name IN ('Advanced Category', 'Special Category');

-- Hide specific payment methods
UPDATE payment_methods 
SET is_default = false 
WHERE name IN ('Crypto', 'Wire Transfer');
```

### Step 3: Restart Backend

```bash
cd backend
npm run dev
```

### Step 4: Test

1. Sign up with a new user
2. Verify email
3. Sign in
4. Check browser console → Should see "✅ User defaults initialized"
5. Check categories → Should see only default ones
6. Check payment methods → Should see only default ones

## API Endpoint

### POST /api/users/initialize-defaults

**Authentication:** Required (Bearer token)

**Description:** Initializes default categories and payment methods for the authenticated user.

**Request:**
```
POST /api/users/initialize-defaults
Authorization: Bearer <token>
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Defaults initialized successfully",
  "stats": {
    "categories": 10,
    "paymentMethods": 5
  }
}
```

**Response (Error):**
```json
{
  "error": "Failed to fetch categories"
}
```

## When It Runs

The initialization runs automatically when:
- User signs in for the first time (after email verification)
- User updates their profile
- Auth state changes to SIGNED_IN

It's safe to call multiple times - it won't duplicate entries.

## Managing Defaults

### View Current Defaults

```sql
-- View default categories
SELECT id, name, type, is_default 
FROM categories 
ORDER BY is_default DESC, name;

-- View default payment methods
SELECT id, name, is_default 
FROM payment_methods 
ORDER BY is_default DESC, name;
```

### Mark as Default

```sql
UPDATE categories 
SET is_default = true 
WHERE name = 'Food';

UPDATE payment_methods 
SET is_default = true 
WHERE name = 'Cash';
```

### Mark as Non-Default (Hidden)

```sql
UPDATE categories 
SET is_default = false 
WHERE name = 'Advanced Category';

UPDATE payment_methods 
SET is_default = false 
WHERE name = 'Crypto';
```

## Backend Logic

The backend endpoint:

1. **Fetches all categories and payment methods** with their `is_default` flag
2. **For each item:**
   - If `is_default = true` → Add user to `opted_in_users` array
   - If `is_default = false` → Add user to `opted_out_users` array
3. **Creates or updates** `user_categories` and `user_payment_methods` records
4. **Returns success** with stats

## Advantages Over Supabase Triggers

### ✅ Pros
- **More control** - Can add custom logic easily
- **Easier debugging** - Can see logs in backend
- **Flexible** - Can call manually if needed
- **Testable** - Can test endpoint directly
- **No SQL knowledge needed** - Just TypeScript

### ❌ Cons
- **Requires backend** - Must be running
- **Network call** - Slightly slower than trigger
- **Manual invocation** - Relies on frontend calling it

## Testing

### Test Endpoint Directly

```bash
# Get auth token first by signing in
# Then call endpoint:

curl -X POST http://localhost:4000/api/users/initialize-defaults \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Test with New User

1. Sign up: `test@example.com`
2. Verify email
3. Sign in
4. Open browser console
5. Should see: "✅ User defaults initialized"
6. Check categories and payment methods

### Verify in Database

```sql
-- Check user's opted-in categories
SELECT c.name, c.is_default,
       'USER_ID' = ANY(uc.opted_in_users) as opted_in,
       'USER_ID' = ANY(uc.opted_out_users) as opted_out
FROM categories c
LEFT JOIN user_categories uc ON c.id = uc.category_id
ORDER BY c.is_default DESC, c.name;
```

## Troubleshooting

### Endpoint Returns 401

**Cause:** User not authenticated

**Fix:** Make sure user is signed in and token is valid

### Endpoint Returns 500

**Cause:** Database error

**Fix:** Check backend logs for error details

### Defaults Not Applied

**Cause:** Endpoint not being called

**Fix:** Check browser console for "✅ User defaults initialized"

### Items Still Hidden

**Cause:** `is_default` not set correctly

**Fix:** Check database:
```sql
SELECT name, is_default FROM categories;
```

## Manual Initialization

If you need to manually initialize defaults for an existing user:

1. Sign in as that user
2. Open browser console
3. Run:
```javascript
const API_URL = 'http://localhost:4000/api';
const { data: { session } } = await supabase.auth.getSession();

fetch(`${API_URL}/users/initialize-defaults`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  }
}).then(r => r.json()).then(console.log);
```

## Summary

✅ **Backend-controlled** - All logic in TypeScript
✅ **Automatic** - Runs on first signin
✅ **Flexible** - Easy to customize
✅ **Testable** - Can test endpoint directly
✅ **Safe** - Won't duplicate entries

The backend now handles all default setup automatically!

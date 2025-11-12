# Email Architecture - Backend Only

## Current Architecture (Already Backend-Only!)

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  User fills signup form                                     │ │
│  │  (email, password, fullName)                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│                              │ POST /api/auth/signup            │
│                              ▼                                   │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTP Request
                               │
┌──────────────────────────────▼──────────────────────────────────┐
│                         BACKEND API                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  1. Validate input (email, password)                        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  2. Create user in Supabase (email_confirm: false)         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  3. Create user profile (is_admin: false)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  4. Generate verification link (Supabase Admin API)        │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  5. Generate HTML email (custom template)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  6. Send email via backend                                 │ │
│  │     - Dev: Log to console                                  │ │
│  │     - Prod: Send via email service (Resend/SendGrid)       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                              │                                   │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  7. Return success response to frontend                    │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ Response
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Show success message:                                      │ │
│  │  "Please check your email to verify your account"          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Key Points

### ✅ What Frontend Does:
- Collects user input (email, password, name)
- Calls backend API endpoint
- Shows success/error messages
- **Does NOT send emails**
- **Does NOT generate verification links**
- **Does NOT access Supabase directly for signup**

### ✅ What Backend Does:
- Validates input
- Creates user in Supabase
- Generates verification link
- Creates custom HTML email
- **Sends email** (console in dev, email service in prod)
- Returns response to frontend

## Code Flow

### Frontend (`src/lib/auth-service.ts`)
```typescript
static async signUp(email: string, password: string, fullName?: string) {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000/api';
  
  // Just calls backend - no email logic here!
  const response = await fetch(`${API_URL}/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName }),
  });
  
  return await response.json();
}
```

### Backend (`backend/app/api/auth/signup/route.ts`)
```typescript
export async function POST(request: NextRequest) {
  // 1. Validate
  const { email, password, fullName } = validation.data;
  
  // 2. Create user
  await supabaseAdmin.auth.admin.createUser({ ... });
  
  // 3. Generate link
  const { data: linkData } = await supabaseAdmin.auth.admin.generateLink({ ... });
  
  // 4. Send email FROM BACKEND
  const emailHtml = generateVerificationEmail(email, link, fullName);
  await sendEmail({
    to: email,
    subject: 'Verify Your Email',
    html: emailHtml,
  });
  
  // 5. Return response
  return NextResponse.json({ success: true });
}
```

### Email Service (`backend/lib/email.ts`)
```typescript
export async function sendEmail(options: EmailOptions) {
  // Development: Log to console
  if (process.env.NODE_ENV === 'development') {
    console.log('=== EMAIL SENT ===');
    console.log('To:', options.to);
    console.log('Body:', options.html);
    return true;
  }
  
  // Production: Send via email service
  const resend = new Resend(process.env.RESEND_API_KEY);
  await resend.emails.send({ ... });
}
```

## Why This Architecture?

### Security
- ✅ Email service credentials stay on backend
- ✅ Supabase service role key never exposed to frontend
- ✅ Frontend can't bypass email verification

### Control
- ✅ Centralized email logic
- ✅ Easy to change email provider
- ✅ Easy to customize email templates
- ✅ Backend can log/track email sends

### Simplicity
- ✅ Frontend just calls one API endpoint
- ✅ All complexity hidden in backend
- ✅ Easy to test (console logs in dev)

## Testing

### Development
```bash
# Terminal 1: Start backend
cd backend && npm run dev

# Terminal 2: Start frontend  
npm run dev

# Sign up → Check backend terminal for email
# You'll see:
# === EMAIL SENT ===
# To: user@example.com
# Body: [HTML with verification link]
```

### Production
```bash
# Backend sends real emails via Resend/SendGrid
# User receives email in inbox
# Clicks link → Email verified
```

## Summary

**Yes, emails are sent from backend only!** 

The frontend never touches email sending logic. It just:
1. Calls `/api/auth/signup`
2. Shows success message
3. That's it!

All email generation, sending, and verification link creation happens on the backend.

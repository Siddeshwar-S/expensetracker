import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, generateVerificationEmail } from '@/lib/email';
import { z } from 'zod';

const resendSchema = z.object({
  email: z.string().email('Invalid email address'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = resendSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email } = validation.data;

    // Check if user exists
    const { data: users, error: userError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (userError) {
      return NextResponse.json(
        { error: 'Failed to verify user' },
        { status: 500 }
      );
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      // Don't reveal if user exists or not for security
      return NextResponse.json({
        success: true,
        message: 'If an account exists with this email, a verification link has been sent.',
      });
    }

    // Check if already verified
    if (user.email_confirmed_at) {
      return NextResponse.json(
        { error: 'Email is already verified. You can sign in.' },
        { status: 400 }
      );
    }

    // Get redirect URL
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173';
    const redirectUrl = `${origin}/auth/callback`;

    // Generate new verification link
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: email,
      options: {
        redirectTo: redirectUrl,
      },
    });

    if (linkError || !linkData) {
      console.error('Link generation error:', linkError);
      return NextResponse.json(
        { error: 'Failed to generate verification link' },
        { status: 500 }
      );
    }

    // Send verification email
    if (linkData?.properties?.action_link) {
      const emailHtml = generateVerificationEmail(
        email,
        linkData.properties.action_link,
        user.user_metadata?.full_name
      );

      const emailSent = await sendEmail({
        to: email,
        subject: 'Verify Your Email - Finance Tracker',
        html: emailHtml,
      });

      if (!emailSent) {
        return NextResponse.json(
          { error: 'Failed to send verification email' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

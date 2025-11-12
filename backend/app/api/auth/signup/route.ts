import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { sendEmail, generateVerificationEmail } from '@/lib/email';
import { z } from 'zod';

const signupSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  fullName: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = signupSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { error: validation.error.errors[0].message },
        { status: 400 }
      );
    }

    const { email, password, fullName } = validation.data;

    // Get the redirect URL from environment or request origin
    const origin = request.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:5173';
    const redirectUrl = `${origin}/auth/callback`;

    // Check if user already exists (including soft-deleted users)
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users.find(u => u.email === email);

    if (existingUser) {
      // If user exists, delete them completely first
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(existingUser.id);
      
      if (deleteError) {
        console.error('Error deleting existing user:', deleteError);
        return NextResponse.json(
          { error: 'Email already registered. Please use a different email or contact support.' },
          { status: 400 }
        );
      }

      // Also delete from user_profiles table
      await supabaseAdmin
        .from('user_profiles')
        .delete()
        .eq('id', existingUser.id);
    }

    // Create user with email already confirmed (simpler approach)
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name: fullName || email.split('@')[0],
      },
    });

    if (error) {
      console.error('Signup error:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Failed to create user' },
        { status: 500 }
      );
    }

    // Create user profile with default values (is_admin: false, is_active: true)
    // The database trigger should handle this, but we'll verify
    const { error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .upsert({
        id: data.user.id,
        email: data.user.email!,
        full_name: fullName || email.split('@')[0],
        is_admin: false, // Regular user by default
        is_active: true,
      }, {
        onConflict: 'id',
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      // Don't fail the signup if profile creation fails
      // The trigger should have created it
    }

    console.log('✅ User created successfully with auto-confirmed email');

    return NextResponse.json({
      success: true,
      message: 'Account created successfully. You can now sign in.',
      user: {
        id: data.user.id,
        email: data.user.email,
      },
      requiresVerification: false,
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

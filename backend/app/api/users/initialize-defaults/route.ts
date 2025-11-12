import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase';

// POST /api/users/initialize-defaults
// Initialize default categories and payment methods for a new user
export const POST = requireAuth(async (request, user) => {
  try {
    console.log('Initializing defaults for user:', user.id);

    // Get all categories
    const { data: categories, error: categoriesError } = await supabaseAdmin
      .from('categories')
      .select('id, name, is_default');

    if (categoriesError) {
      console.error('Error fetching categories:', categoriesError);
      return NextResponse.json(
        { error: 'Failed to fetch categories' },
        { status: 500 }
      );
    }

    // Get all payment methods
    const { data: paymentMethods, error: paymentMethodsError } = await supabaseAdmin
      .from('payment_methods')
      .select('id, name, is_default');

    if (paymentMethodsError) {
      console.error('Error fetching payment methods:', paymentMethodsError);
      return NextResponse.json(
        { error: 'Failed to fetch payment methods' },
        { status: 500 }
      );
    }

    // Process categories
    for (const category of categories || []) {
      const isDefault = category.is_default ?? true; // Default to true if not set

      // Check if user_category record exists
      const { data: existingCategory } = await supabaseAdmin
        .from('user_categories')
        .select('*')
        .eq('category_id', category.id)
        .single();

      if (existingCategory) {
        // Update existing record
        const optedInUsers = existingCategory.opted_in_users || [];
        const optedOutUsers = existingCategory.opted_out_users || [];

        if (isDefault) {
          // Add to opted_in_users if not already there
          if (!optedInUsers.includes(user.id)) {
            optedInUsers.push(user.id);
          }
          // Remove from opted_out_users if present
          const index = optedOutUsers.indexOf(user.id);
          if (index > -1) {
            optedOutUsers.splice(index, 1);
          }
        } else {
          // Add to opted_out_users if not already there
          if (!optedOutUsers.includes(user.id)) {
            optedOutUsers.push(user.id);
          }
          // Remove from opted_in_users if present
          const index = optedInUsers.indexOf(user.id);
          if (index > -1) {
            optedInUsers.splice(index, 1);
          }
        }

        await supabaseAdmin
          .from('user_categories')
          .update({
            opted_in_users: optedInUsers,
            opted_out_users: optedOutUsers,
          })
          .eq('category_id', category.id);
      } else {
        // Create new record
        await supabaseAdmin
          .from('user_categories')
          .insert({
            category_id: category.id,
            opted_in_users: isDefault ? [user.id] : [],
            opted_out_users: isDefault ? [] : [user.id],
          });
      }
    }

    // Process payment methods
    for (const paymentMethod of paymentMethods || []) {
      const isDefault = paymentMethod.is_default ?? true; // Default to true if not set

      // Check if user_payment_method record exists
      const { data: existingPaymentMethod } = await supabaseAdmin
        .from('user_payment_methods')
        .select('*')
        .eq('payment_method_id', paymentMethod.id)
        .single();

      if (existingPaymentMethod) {
        // Update existing record
        const optedInUsers = existingPaymentMethod.opted_in_users || [];
        const optedOutUsers = existingPaymentMethod.opted_out_users || [];

        if (isDefault) {
          // Add to opted_in_users if not already there
          if (!optedInUsers.includes(user.id)) {
            optedInUsers.push(user.id);
          }
          // Remove from opted_out_users if present
          const index = optedOutUsers.indexOf(user.id);
          if (index > -1) {
            optedOutUsers.splice(index, 1);
          }
        } else {
          // Add to opted_out_users if not already there
          if (!optedOutUsers.includes(user.id)) {
            optedOutUsers.push(user.id);
          }
          // Remove from opted_in_users if present
          const index = optedInUsers.indexOf(user.id);
          if (index > -1) {
            optedInUsers.splice(index, 1);
          }
        }

        await supabaseAdmin
          .from('user_payment_methods')
          .update({
            opted_in_users: optedInUsers,
            opted_out_users: optedOutUsers,
          })
          .eq('payment_method_id', paymentMethod.id);
      } else {
        // Create new record
        await supabaseAdmin
          .from('user_payment_methods')
          .insert({
            payment_method_id: paymentMethod.id,
            opted_in_users: isDefault ? [user.id] : [],
            opted_out_users: isDefault ? [] : [user.id],
          });
      }
    }

    console.log('✅ Defaults initialized successfully for user:', user.id);

    return NextResponse.json({
      success: true,
      message: 'Defaults initialized successfully',
      stats: {
        categories: categories?.length || 0,
        paymentMethods: paymentMethods?.length || 0,
      },
    });
  } catch (error) {
    console.error('Error initializing defaults:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
});

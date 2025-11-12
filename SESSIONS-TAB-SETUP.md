# Sessions Tab Setup Guide

## What Was Added

A new "Sessions" tab has been added to the admin panel, visible only to admin users. This tab allows admins to:

- View all active user sessions
- See session statistics (total sessions, active users, expiring sessions)
- Monitor session details (start time, last activity, expiration)
- Revoke all sessions for any user

## Files Created/Modified

### New Files
1. **`src/components/SessionManagement.tsx`** - Main sessions management component
2. **`src/components/ui/table.tsx`** - Table UI component
3. **`src/components/ui/alert-dialog.tsx`** - Alert dialog UI component

### Modified Files
1. **`src/pages/ExpensePage.tsx`** - Added Sessions tab next to Users tab

## Prerequisites

Before the Sessions tab will work, you need to run the SQL migration:

```bash
# In Supabase SQL Editor, run:
add-session-tracking.sql
```

This creates:
- `active_user_sessions` view
- `user_session_logs` table
- `get_session_stats()` function
- `admin_revoke_user_sessions()` function

## Features

### 1. Session Statistics Dashboard
Shows at a glance:
- **Active Sessions**: Total number of active sessions
- **Active Users**: Number of unique users with active sessions
- **Expiring Soon**: Sessions expiring within 1 hour
- **Avg Session Age**: Average age of active sessions

### 2. Active Sessions Table
Displays for each session:
- User name and email
- Session start time
- Last activity time
- Time until expiration
- Session status (Active/Expired)
- Revoke button

### 3. Session Revocation
Admins can:
- Click "Revoke" button next to any session
- Confirm the action in a dialog
- Immediately sign out the user from all devices
- See confirmation of how many sessions were revoked

## How to Access

1. **Log in as an admin user**
2. **Navigate to the Expense page**
3. **Click on the "Sessions" tab** (next to "Users" tab)
4. **View and manage sessions**

## Security

- Only admin users can see the Sessions tab
- Only admin users can revoke sessions
- All actions are logged in the `user_session_logs` table
- RLS policies ensure data security

## Usage Examples

### View All Active Sessions
Simply open the Sessions tab to see all active sessions.

### Revoke User Sessions
1. Find the user in the sessions list
2. Click the "Revoke" button
3. Confirm the action
4. User will be signed out immediately

### Refresh Session Data
Click the "Refresh" button in the top-right corner to reload session data.

## Troubleshooting

### "Failed to load sessions" Error
- Make sure you've run `add-session-tracking.sql` in Supabase
- Check that your user has admin privileges
- Verify RLS policies are set up correctly

### Sessions Tab Not Visible
- Ensure you're logged in as an admin user
- Check `user_profiles` table: `is_admin` should be `true`

### Can't Revoke Sessions
- Verify the `admin_revoke_user_sessions()` function exists
- Check browser console for errors
- Ensure you have admin privileges

## What Happens When Sessions Are Revoked

1. All sessions for the user are deleted from `auth.sessions`
2. All refresh tokens are deleted from `auth.refresh_tokens`
3. The action is logged in `user_session_logs`
4. User is immediately signed out on all devices
5. User must sign in again to access the application

## Integration with Deleted User Fix

This Sessions tab works together with the deleted user fix:

- When a user is deleted, sessions are automatically revoked (via trigger)
- Frontend validates user existence every 5 minutes
- Admins can manually revoke sessions if needed
- All session events are logged for auditing

## Next Steps

1. **Run the SQL migration**: `add-session-tracking.sql`
2. **Test as admin**: Log in and check the Sessions tab
3. **Try revoking a session**: Test with a non-admin user
4. **Monitor session logs**: Query `user_session_logs` for audit trail

## Additional Features (Optional)

You can extend the Sessions tab to:
- Filter sessions by user
- Sort by different columns
- Export session data
- View session history
- Set up alerts for suspicious activity
- Limit concurrent sessions per user

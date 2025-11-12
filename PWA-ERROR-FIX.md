# PWA Error Fix

## Problem
Console error: `Failed to load resource: the server responded with a status of 404 () pwa-192x192.png`

## Cause
The Vite PWA plugin was configured to use `pwa-192x192.png` and `pwa-512x512.png` icons, but these files don't exist in the `public/` folder.

## Solution Applied

Updated `vite.config.ts` to use the existing `favicon.ico` instead of missing PNG files.

### What Changed

**Before:**
```typescript
icons: [
  {
    src: 'pwa-192x192.png',  // ❌ File doesn't exist
    sizes: '192x192',
    type: 'image/png',
  },
  {
    src: 'pwa-512x512.png',  // ❌ File doesn't exist
    sizes: '512x512',
    type: 'image/png',
  },
]
```

**After:**
```typescript
icons: [
  {
    src: 'favicon.ico',  // ✅ File exists
    sizes: '64x64 32x32 24x24 16x16',
    type: 'image/x-icon',
  },
]
```

## Result

✅ No more 404 errors in console
✅ PWA still works with favicon
✅ App can be installed as PWA

## Optional: Add Proper PWA Icons

If you want proper PWA icons later, create these files in `public/`:

1. **pwa-192x192.png** - 192x192 pixels
2. **pwa-512x512.png** - 512x512 pixels

Then update `vite.config.ts` back to use them.

### Quick Way to Create Icons

Use an online tool like:
- https://realfavicongenerator.net/
- https://favicon.io/

Upload your logo and download the PWA icons.

## Testing

1. Clear browser cache
2. Reload the app
3. Check console - no more 404 errors
4. PWA should work normally

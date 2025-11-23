# PWA Deployment Guide

## Development Testing

### Start Web Development Server
```bash
npx expo start --web
```

This will start the development server on `http://localhost:8081` (or similar port).

## Production Build Options

### Option 1: Expo Go Web (Easiest)
1. Run `npx expo start --web`
2. Build will be served from Metro bundler
3. Deploy using a static hosting service

### Option 2: Static Export (Recommended for Production)
Since Expo SDK 54 has compatibility issues with @expo/webpack-config, we'll use an alternative approach:

1. **Use Expo's built-in static export:**
   ```bash
   npx expo export --platform web
   ```
   
2. **Serve the dist folder:**
   The output will be in `dist/` directory. Deploy this to:
   - **Vercel**: `vercel deploy`
   - **Netlify**: Drag & drop `dist` folder or use CLI
   - **Firebase Hosting**: `firebase deploy`
   - **GitHub Pages**: Push `dist` to gh-pages branch

### Option 3: Manual Webpack Setup (Advanced)
If needed, create custom webpack config compatible with SDK 54.

## Deployment Steps

### Vercel (Recommended)
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel`
3. Follow prompts
4. Your PWA will be live at `https://your-app.vercel.app`

### Netlify
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Run: `netlify deploy --prod`
3. Select `dist` as publish directory
4. Your PWA will be live

### Firebase Hosting
1. Install Firebase CLI: `npm i -g firebase-tools`
2. Run: `firebase init hosting`
3. Set public directory to `dist`
4. Run: `firebase deploy`

## Testing PWA Features

### On iOS Safari:
1. Open the deployed URL
2. Tap Share button
3. Tap "Add to Home Screen"
4. Open from home screen
5. Verify:
   - Runs in standalone mode (no browser UI)
   - Audio playback works
   - Offline caching works
   - Install prompt appears

### On Desktop:
1. Open in Chrome/Edge
2. Look for install icon in address bar
3. Click to install
4. Test offline mode (DevTools > Network > Offline)

## Current Status
- ✅ PWA manifest configured
- ✅ Service worker created
- ✅ iOS meta tags added
- ✅ Web compatibility wrappers created
- ✅ InstallPrompt component added
- ⏳ Ready for `expo start --web` testing
- ⏳ Ready for production deployment

## Next Steps
1. Test with `npx expo start --web`
2. Fix any runtime errors
3. Deploy to Vercel/Netlify
4. Test on iOS Safari
5. Share URL with iOS users

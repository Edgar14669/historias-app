import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.historiasbiblicas.v2',
  appName: 'Histórias Bíblicas',
  webDir: 'dist',
  // Development: Hot reload from Lovable preview
  // IMPORTANT: Remove this entire "server" block for production builds!
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#1a1a2e',
      androidSplashResourceName: 'splash',
      androidScaleType: 'CENTER_CROP',
      showSpinner: false,
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#1a1a2e',
    },
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: '#1a1a2e',
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#1a1a2e',
  },
};

export default config;

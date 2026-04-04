import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eventovms.app',
  appName: 'EventoVMS',
  webDir: 'out',
  server: {
    // For development: point to local Next.js dev server
    // Comment out for production builds
    // url: 'http://YOUR_LOCAL_IP:3000',
    // cleartext: true,
  },
  plugins: {
    // Camera permissions for QR scanner
    Camera: {
      permissionType: 'prompt',
    },
    // Push notifications (optional)
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    // Local notifications
    LocalNotifications: {
      smallIcon: 'ic_stat_icon_config_sample',
      iconColor: '#2B6E64',
    },
    // Splash screen
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2B6E64',
      showSpinner: false,
      androidSpinnerStyle: 'large',
      iosSpinnerStyle: 'small',
      spinnerColor: '#ffffff',
    },
    // Status bar
    StatusBar: {
      style: 'dark',
      backgroundColor: '#2B6E64',
    },
  },
  ios: {
    // Minimum iOS version
    minVersion: '14.0',
    // Required for camera access (QR scanner)
    allowsLinkPreview: false,
  },
  android: {
    // Minimum Android API level
    minSdkVersion: 22,
    targetSdkVersion: 33,
    // Allow HTTP for dev
    allowMixedContent: false,
    backgroundColor: '#ffffff',
  },
};

export default config;

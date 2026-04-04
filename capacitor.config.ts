import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.eventovms.app',
  appName: 'EventoVMS',
  webDir: 'out',
  server: {
    url: 'https://evento-git-main-sironline55s-projects.vercel.app',
    cleartext: false,
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#2B6E64',
      showSpinner: false,
    },
  },
};

export default config;

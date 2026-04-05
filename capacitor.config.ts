import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.eventovms.app',
  appName: 'EventVMS',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
}

export default config

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.ventus.pos',
  appName: 'Ventus POS',
  webDir: 'out',
  server: {
    androidScheme: 'https'
  }
};

export default config;

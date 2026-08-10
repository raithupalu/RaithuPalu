import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.raithupalu.app',
  appName: 'RaithuPalu',
  webDir: 'build',
  server: {
    url: 'https://raithu-palu.vercel.app', // 🌐 Forces the app to load your live working website!
    cleartext: true
  }
};

export default config;
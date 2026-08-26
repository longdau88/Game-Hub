import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.longdau88.gamehub',
  appName: 'Game Hub',
  webDir: 'out',
  server: {
    url: 'https://game-hub.best',
    cleartext: true
  }
};

export default config;

export interface CapacitorConfig {
  appId: string;
  appName: string;
  webDir: string;
  bundledWebRuntime?: boolean;
  server?: {
    androidScheme?: string;
    iosScheme?: string;
    hostname?: string;
    cleartext?: boolean;
  };
  android?: {
    buildOptions?: {
      keystorePath?: string;
      keystoreAlias?: string;
    };
  };
  plugins?: Record<string, any>;
}

const config: CapacitorConfig = {
  appId: 'com.sqlcode.app',
  appName: 'SQL CODE',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: false,
  },
};

export default config;

import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.kohki.m1106",
  appName: "基本情報ドリル",
  webDir: "dist",
  backgroundColor: "#101828",
  ios: {
    contentInset: "never",
    scheme: "FE Drill",
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 600,
      backgroundColor: "#101828",
      showSpinner: false,
    },
    LocalNotifications: {
      iconColor: "#F5D547",
    },
  },
};

export default config;

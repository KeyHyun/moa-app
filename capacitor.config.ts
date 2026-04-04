import { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.moa.family",
  appName: "모아",
  webDir: "out",
  server: {
    url: "https://moa-app.onrender.com",
    cleartext: false,
  },
  ios: {
    contentInset: "automatic",
    backgroundColor: "#ffffff",
  },
};

export default config;

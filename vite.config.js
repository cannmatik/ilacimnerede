// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@api": path.resolve(__dirname, "./src/api/index.js"),
      "@assets": path.resolve(__dirname, "./src/assets/index.js"),
      "@icons": path.resolve(__dirname, "./src/assets/icons/index.js"),
      "@components": path.resolve(__dirname, "./src/components/index.js"),
      "@routes": path.resolve(__dirname, "./src/routes"),
      "@enums": path.resolve(__dirname, "./src/enums/index.js"),
      "@hooks": path.resolve(__dirname, "./src/hooks/index.js"),
      "@services": path.resolve(__dirname, "./src/services"),
      "@store": path.resolve(__dirname, "./src/store"),
      "@utils": path.resolve(__dirname, "./src/utils/index.js"),
      "@validations": path.resolve(__dirname, "./src/validations"),
    },
  },
  css: {
    preprocessorOptions: {
      scss: {
        additionalData: `@import "./src/style/theme.scss"; @import "./src/style/mixins.scss";`,
      },
    },
  },
  envPrefix: "IlacimNerede_",
  server: {
    historyApiFallback: true,  // Bu satırı ekleyin
  },
});

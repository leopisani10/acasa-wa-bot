// vite.config.ts
import { defineConfig } from "file:///home/project/node_modules/vite/dist/node/index.js";
import react from "file:///home/project/node_modules/@vitejs/plugin-react/dist/index.js";
var vite_config_default = defineConfig({
  plugins: [react()],
  root: ".",
  base: "./",
  build: {
    outDir: "dist",
    assetsDir: "assets",
    rollupOptions: {
      input: {
        main: "./index.html",
        "public-register": "./public/public-register.html"
      },
      onwarn(warning, warn) {
        if (warning.code === "UNUSED_EXTERNAL_IMPORT") return;
        if (warning.code === "CIRCULAR_DEPENDENCY") return;
        warn(warning);
      }
    }
  },
  optimizeDeps: {
    exclude: ["lucide-react"]
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcudHMiXSwKICAic291cmNlc0NvbnRlbnQiOiBbImNvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9kaXJuYW1lID0gXCIvaG9tZS9wcm9qZWN0XCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ZpbGVuYW1lID0gXCIvaG9tZS9wcm9qZWN0L3ZpdGUuY29uZmlnLnRzXCI7Y29uc3QgX192aXRlX2luamVjdGVkX29yaWdpbmFsX2ltcG9ydF9tZXRhX3VybCA9IFwiZmlsZTovLy9ob21lL3Byb2plY3Qvdml0ZS5jb25maWcudHNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tICd2aXRlJztcbmltcG9ydCByZWFjdCBmcm9tICdAdml0ZWpzL3BsdWdpbi1yZWFjdCc7XG5cbi8vIGh0dHBzOi8vdml0ZWpzLmRldi9jb25maWcvXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xuICBwbHVnaW5zOiBbcmVhY3QoKV0sXG4gIHJvb3Q6ICcuJyxcbiAgYmFzZTogJy4vJyxcbiAgYnVpbGQ6IHtcbiAgICBvdXREaXI6ICdkaXN0JyxcbiAgICBhc3NldHNEaXI6ICdhc3NldHMnLFxuICAgIHJvbGx1cE9wdGlvbnM6IHtcbiAgICAgIGlucHV0OiB7XG4gICAgICAgIG1haW46ICcuL2luZGV4Lmh0bWwnLFxuICAgICAgICAncHVibGljLXJlZ2lzdGVyJzogJy4vcHVibGljL3B1YmxpYy1yZWdpc3Rlci5odG1sJ1xuICAgICAgfSxcbiAgICAgIG9ud2Fybih3YXJuaW5nLCB3YXJuKSB7XG4gICAgICAgIC8vIFN1cHByZXNzIGNlcnRhaW4gd2FybmluZ3MgdGhhdCBkb24ndCBhZmZlY3QgZnVuY3Rpb25hbGl0eVxuICAgICAgICBpZiAod2FybmluZy5jb2RlID09PSAnVU5VU0VEX0VYVEVSTkFMX0lNUE9SVCcpIHJldHVybjtcbiAgICAgICAgaWYgKHdhcm5pbmcuY29kZSA9PT0gJ0NJUkNVTEFSX0RFUEVOREVOQ1knKSByZXR1cm47XG4gICAgICAgIHdhcm4od2FybmluZyk7XG4gICAgICB9XG4gICAgfVxuICB9LFxuICBvcHRpbWl6ZURlcHM6IHtcbiAgICBleGNsdWRlOiBbJ2x1Y2lkZS1yZWFjdCddLFxuICB9LFxufSk7XG4iXSwKICAibWFwcGluZ3MiOiAiO0FBQXlOLFNBQVMsb0JBQW9CO0FBQ3RQLE9BQU8sV0FBVztBQUdsQixJQUFPLHNCQUFRLGFBQWE7QUFBQSxFQUMxQixTQUFTLENBQUMsTUFBTSxDQUFDO0FBQUEsRUFDakIsTUFBTTtBQUFBLEVBQ04sTUFBTTtBQUFBLEVBQ04sT0FBTztBQUFBLElBQ0wsUUFBUTtBQUFBLElBQ1IsV0FBVztBQUFBLElBQ1gsZUFBZTtBQUFBLE1BQ2IsT0FBTztBQUFBLFFBQ0wsTUFBTTtBQUFBLFFBQ04sbUJBQW1CO0FBQUEsTUFDckI7QUFBQSxNQUNBLE9BQU8sU0FBUyxNQUFNO0FBRXBCLFlBQUksUUFBUSxTQUFTLHlCQUEwQjtBQUMvQyxZQUFJLFFBQVEsU0FBUyxzQkFBdUI7QUFDNUMsYUFBSyxPQUFPO0FBQUEsTUFDZDtBQUFBLElBQ0Y7QUFBQSxFQUNGO0FBQUEsRUFDQSxjQUFjO0FBQUEsSUFDWixTQUFTLENBQUMsY0FBYztBQUFBLEVBQzFCO0FBQ0YsQ0FBQzsiLAogICJuYW1lcyI6IFtdCn0K

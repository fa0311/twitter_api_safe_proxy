import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const debugApiTarget = `http://127.0.0.1:3001`;
const debugUiPort = 3000;

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		host: "127.0.0.1",
		port: debugUiPort,
		strictPort: true,
		proxy: {
			"/api": {
				changeOrigin: true,
				target: debugApiTarget,
			},
			"/i/api/graphql": {
				changeOrigin: true,
				target: debugApiTarget,
			},
		},
	},
	build: {
		emptyOutDir: true,
		outDir: "dist/ui",
	},
});

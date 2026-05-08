import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
	plugins: [react(), tailwindcss()],
	server: {
		port: 3002,
		proxy: {
			"/debug": "http://localhost:3001",
		},
	},
	build: {
		emptyOutDir: true,
		outDir: "dist/ui",
	},
});

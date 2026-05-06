import { z } from "zod";

const ViewportSchema = z.strictObject({
	width: z.number().int().positive().default(1280),
	height: z.number().int().positive().default(720),
});

const ProxySchema = z.strictObject({
	server: z.string().min(1, "Proxy server is required"),
	bypass: z.string().optional(),
	username: z.string().optional(),
	password: z.string().optional(),
});

const HomeSchema = z.strictObject({
	url: z.url().default("https://x.com/home"),
});

const BrowserSchema = z.strictObject({
	headless: z.boolean().default(false),
	viewport: ViewportSchema.optional(),
	proxy: ProxySchema.optional(),
	args: z.array(z.string()).default([]),
	executablePath: z.string().optional(),
	env: z.record(z.string(), z.string()).optional(),
	userDataDir: z.string(),
});

const ProfileSchema = z.strictObject({
	name: z.string().min(1, "Profile name is required"),
	browserType: z.enum(["chromium", "firefox", "webkit"]).default("chromium"),
	home: HomeSchema.default(HomeSchema.parse({})),
	browser: BrowserSchema,
});

const SettingsSchema = z.strictObject({
	port: z.number().int().min(1).max(65535).default(3000),
	logLevel: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
	logPrettyPrint: z.boolean().default(true),
	profiles: z.array(ProfileSchema).min(1, "At least one profile is required"),
});

export const loadSettings = async (data: unknown) => {
	const settings = await SettingsSchema.safeParseAsync(data);
	if (settings.success) {
		return settings.data;
	}

	for (const issue of settings.error.issues) {
		const path = issue.path?.length ? issue.path.join(".") : "(root)";
		console.error(`[${issue.code}] path=${path} message=${issue.message}`);
	}
	throw new Error("Invalid settings");
};

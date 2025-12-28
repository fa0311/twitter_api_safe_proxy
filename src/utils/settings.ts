import { z } from "zod";

const ViewportSchema = z.object({
	width: z.number().int().positive().default(1280),
	height: z.number().int().positive().default(720),
});

const ProxySchema = z.object({
	server: z.string().min(1, "Proxy server is required"),
	bypass: z.string().optional(),
	username: z.string().optional(),
	password: z.string().optional(),
});

const GraphQLSchema = z.object({
	endpoint: z.url().default("https://x.com/i/api/graphql/"),
});

const HomeSchema = z.object({
	url: z.url().default("https://x.com/home"),
});

const BrowserSchema = z.object({
	headless: z.boolean().default(false),
	viewport: ViewportSchema.optional(),
	proxy: ProxySchema.optional(),
	args: z.array(z.string()).optional(),
	executablePath: z.string().optional(),
	env: z.record(z.string(), z.string()).optional(),
	userDataDir: z.string(),
});

const ProfileSchema = z.object({
	name: z.string().min(1, "Profile name is required"),
	browserType: z.enum(["chromium", "firefox", "webkit"]).default("chromium"),
	graphql: GraphQLSchema.default(GraphQLSchema.parse({})),
	home: HomeSchema.default(HomeSchema.parse({})),
	browser: BrowserSchema,
});

const FavoriteSchema = z.object({
	strategy: z.enum(["like", "retweet", "reply"]).default("like"),
	rateLimitPerHour: z.number().int().min(1).default(100),
});

const PoolSchema = z.object({
	name: z.string().min(1, "Pool name is required"),
	profiles: z.array(z.string()).min(1, "At least one profile is required"),
	strategy: z.enum(["round-robin", "random"]).default("round-robin"),
	failover: FavoriteSchema.optional(),
});

const SettingsSchema = z.object({
	port: z.number().int().min(1).max(65535).default(3000),
	logLevel: z.enum(["fatal", "error", "warn", "info", "debug", "trace"]).default("info"),
	logPrettyPrint: z.boolean().default(true),
	profiles: z.array(ProfileSchema).min(1, "At least one profile is required"),
	pools: z.array(PoolSchema).min(1, "At least one pool is required"),
	defaultPool: z.string().min(1).optional(),
});

export const loadSettings = async (data: unknown = undefined) => {
	const settings = await SettingsSchema.safeParseAsync(data);
	if (settings.success) {
		return settings.data;
	} else {
		for (const iss of settings.error.issues) {
			const path = iss.path?.length ? iss.path.join(".") : "(root)";
			console.error(`[${iss.code}] path=${path} message=${iss.message}`);
		}
		throw new Error("Invalid settings");
	}
};

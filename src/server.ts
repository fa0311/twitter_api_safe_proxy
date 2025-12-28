import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { logger } from "hono/logger";
import pino from "pino";
import { z } from "zod";

const pinoLogger = pino({
	level: process.env.LOG_LEVEL || "info",
	transport:
		process.env.NODE_ENV !== "production"
			? {
					target: "pino-pretty",
					options: {
						colorize: true,
						translateTime: "HH:MM:ss Z",
						ignore: "pid,hostname",
					},
				}
			: undefined,
});

type Variables = {
	logger: typeof pinoLogger;
};

const app = new Hono<{ Variables: Variables }>();

app.use("*", logger());

app.use("*", async (c, next) => {
	c.set("logger", pinoLogger);
	await next();
});

const UserSchema = z.object({
	name: z.string().min(1, "Name is required"),
	email: z.string().email("Invalid email format"),
	age: z.number().int().positive().optional(),
});

const PostSchema = z.object({
	title: z.string().min(1).max(100),
	content: z.string().min(1),
	tags: z.array(z.string()).optional(),
});

type User = z.infer<typeof UserSchema>;
type Post = z.infer<typeof PostSchema>;

app.get("/", (c) => {
	return c.json({
		message: "Welcome to Hono API with Zod validation!",
		endpoints: {
			GET: ["/health", "/users"],
			POST: ["/users", "/posts"],
		},
	});
});

app.get("/health", (c) => {
	return c.json({
		status: "ok",
		timestamp: new Date().toISOString(),
	});
});

app.get("/users", (c) => {
	const log = c.get("logger");
	log.info("Fetching users list");

	const users: User[] = [
		{ name: "Alice", email: "alice@example.com", age: 25 },
		{ name: "Bob", email: "bob@example.com", age: 30 },
	];
	return c.json({ users });
});

app.post("/users", zValidator("json", UserSchema), (c) => {
	const log = c.get("logger");
	const user = c.req.valid("json");

	log.info({ user }, "Creating new user");

	return c.json(
		{
			message: "User created successfully",
			user,
		},
		201,
	);
});

app.post("/posts", zValidator("json", PostSchema), (c) => {
	const post = c.req.valid("json");
	return c.json(
		{
			message: "Post created successfully",
			post: {
				...post,
				id: Math.random().toString(36).substring(7),
				createdAt: new Date().toISOString(),
			},
		},
		201,
	);
});

app.onError((err, c) => {
	const log = c.get("logger");
	log.error({ err, path: c.req.path }, "Request error occurred");

	return c.json(
		{
			error: err.message || "Internal Server Error",
		},
		500,
	);
});

app.notFound((c) => {
	const log = c.get("logger");
	log.warn({ path: c.req.path, method: c.req.method }, "Route not found");

	return c.json({ error: "Not Found" }, 404);
});

const port = 3000;
pinoLogger.info(`🚀 Server starting on http://localhost:${port}`);

export default {
	port,
	fetch: app.fetch,
};

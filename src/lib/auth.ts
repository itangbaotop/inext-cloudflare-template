import { Lucia } from "lucia";
import { DrizzleSQLiteAdapter } from "@lucia-auth/adapter-drizzle"; // 以 Drizzle 为例
import { getDb } from "@/lib/db";
import { sessionsTable, usersTable } from "@/db/schema";

const db  = await getDb();
const adapter = new DrizzleSQLiteAdapter(db, sessionsTable, usersTable);

export const lucia = new Lucia(adapter, {
	sessionCookie: {
		// 这个 cookie 我们不会直接用，因为我们将用 JWT cookie 替代
		attributes: {
			secure: process.env.NODE_ENV === "production"
		}
	},
    getUserAttributes: (attributes) => {
        return {
            username: attributes.username,
            // email: attributes.email
        };
    }
});

declare module "lucia" {
	interface Register {
		Lucia: typeof lucia;
        DatabaseUserAttributes: {
            username: string;
        };
	}
}
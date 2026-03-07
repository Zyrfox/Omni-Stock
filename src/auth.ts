import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    return null;
                }

                const email = credentials.email as string;
                const password = credentials.password as string;

                // Find user by email
                const [user] = await db
                    .select()
                    .from(users)
                    .where(eq(users.email, email))
                    .limit(1);

                if (!user) return null;

                // Compare password hash
                const isValidPassword = await bcrypt.compare(password, user.password);
                if (!isValidPassword) return null;

                return {
                    id: user.id,
                    email: user.email,
                    username: user.username,
                    role: user.role,
                };
            },
        }),
    ],

    callbacks: {
        // Inject custom fields into the JWT token
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id as string;
                token.username = (user as { username?: string }).username as string;
                token.role = (user as { role?: string }).role as string;
            }
            return token;
        },
        // Forward custom token fields into the session object
        async session({ session, token }) {
            if (token && session.user) {
                const sessionUser = session.user as { id?: string; username?: string; role?: string };
                sessionUser.id = token.id as string;
                sessionUser.username = token.username as string;
                sessionUser.role = token.role as string;
            }
            return session;
        },
    },

    pages: {
        signIn: "/login",  // Redirect unauthenticated users to /login
    },

    session: {
        strategy: "jwt",
    },
});

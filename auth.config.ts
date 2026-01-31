import NextAuth from "next-auth";
import type { Session } from "next-auth";

/**
 * 仅包含 session / callbacks / pages；providers 留空以满足 NextAuthConfig 类型。
 * 供 middleware 使用，避免 Edge 打包进 bcrypt / prisma。完整 providers 在 auth.ts。
 */
const authConfig = {
  providers: [] as const,
  session: { strategy: "jwt" as const, maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    jwt({ token, user }: { token: { id?: string; role?: string }; user?: { id?: string; role?: string } }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    session({ session, token }: { session: Session; token: { id?: string; role?: string } }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { role?: string }).role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};

export const auth = NextAuth(authConfig);
export { authConfig };

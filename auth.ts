import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

// bcrypt 与 prisma 仅在 authorize 内动态导入，避免被 Edge (middleware) 打包导致构建失败
export const { handlers, signIn, signOut, auth } = NextAuth({
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "邮箱", type: "email" },
        password: { label: "密码", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const { prisma } = await import("@/lib/prisma");
        const { default: bcrypt } = await import("bcryptjs");
        const user = await prisma.user.findUnique({
          where: { email: String(credentials.email) },
        });
        if (!user) return null;
        const ok = await bcrypt.compare(String(credentials.password), user.password);
        if (!ok) return null;
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt", maxAge: 30 * 24 * 60 * 60 },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as { role?: string }).role;
      }
      return token;
    },
    async session({ session, token }) {
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
});

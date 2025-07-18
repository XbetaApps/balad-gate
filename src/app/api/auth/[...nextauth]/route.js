import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from 'bcryptjs';
import prisma from '../../../../../prisma/client';

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
        }

        const user = await prisma.users.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
        
        if (!isPasswordValid) {
          throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role_id === 1 ? 'admin' : 'user'
        };
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user) {
        session.user.id = token.sub;
        session.user.role = token.role;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth',
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development'
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST, authOptions };

import { PrismaClient } from '@prisma/client';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
        token: { label: "Token", type: "text" } // إضافة دعم للتوكن
      },
      async authorize(credentials, req) {
        // إذا كان هناك توكن، قم بالتحقق منه
        if (credentials?.token) {
          try {
            const decoded = jwt.verify(credentials.token, process.env.NEXTAUTH_SECRET);
            return {
              id: decoded.id,
              email: decoded.email,
              name: decoded.name,
              role: decoded.role
            };
          } catch (error) {
            console.error('Token verification failed:', error);
            return null;
          }
        }

        // التحقق من بيانات الاعتماد التقليدية
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
  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
  callbacks: {
    async jwt({ token, user }) {
      // عند تسجيل الدخول، أضف بيانات المستخدم إلى الـ token
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      // إضافة بيانات المستخدم إلى كائن الجلسة
      if (token) {
        session.user = {
          ...session.user,
          id: token.id,
          name: token.name,
          email: token.email,
          role: token.role,
          image: null
        };
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth',
    error: '/auth',
  },
};

export default authOptions;

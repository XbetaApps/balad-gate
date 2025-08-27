import { PrismaClient } from '@prisma/client';
import CredentialsProvider from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Initialize Prisma client with proper error handling
let prisma;

try {
  prisma = new PrismaClient();
} catch (error) {
  console.error('Failed to initialize Prisma Client:', error);
  throw new Error('Failed to initialize database connection');
}

// JWT configuration
const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'your-secret-key';
const JWT_EXPIRES_IN = '30d';

const authOptions = {
  // Configure session
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
  
  // Configure JWT
  jwt: {
    secret: JWT_SECRET,
    encryption: true,
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  
  // Configure providers
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
        token: { label: "Token", type: "text" } // Token support for API authentication
      },
      async authorize(credentials, req) {
        try {
          // If token is provided, verify it
          if (credentials?.token) {
            try {
              const decoded = jwt.verify(credentials.token, JWT_SECRET);
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

          // Validate credentials
          if (!credentials?.email || !credentials?.password) {
            throw new Error('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
          }
          
          // Find user in database
          const user = await prisma.users.findUnique({
            where: { email: credentials.email }
          });

          if (!user) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          }

          // Verify password
          const isPasswordValid = await bcrypt.compare(credentials.password, user.password);
          
          if (!isPasswordValid) {
            throw new Error('البريد الإلكتروني أو كلمة المرور غير صحيحة');
          }

          // Return user data without sensitive information
          return {
            id: user.id.toString(),
            email: user.email,
            name: user.name,
            role: user.role_id === 1 ? 'admin' : 'user'
          };
          
        } catch (error) {
          console.error('Authentication error:', error);
          throw error;
        }
      }
    })
  ],
  
  // Secret for signing tokens
  secret: JWT_SECRET,
  
  // Enable debug in development
  debug: process.env.NODE_ENV === 'development',
  
  // Callbacks for customizing JWT and session
  callbacks: {
    async jwt({ token, user, account }) {
      // Initial sign in
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.email = user.email;
        token.name = user.name;
      }
      return token;
    },
    
    async session({ session, token }) {
      // Add user data to session
      if (token) {
        session.user = {
          id: token.id,
          name: token.name,
          email: token.email,
          role: token.role,
          image: null
        };
      }
      return session;
    },
    
    async redirect({ url, baseUrl }) {
      // Redirect to dashboard after login if no specific redirect URL is provided
      if (url.startsWith(baseUrl)) return url;
      if (url.startsWith('/')) return `${baseUrl}${url}`;
      return baseUrl;
    }
  },
  
  // Custom pages
  pages: {
    signIn: '/auth',
    signOut: '/auth',
    error: '/auth',
    verifyRequest: '/auth',
  },
  
  // Events
  events: {
    async signOut() {
      // Handle sign out events
      console.log('User signed out');
    },
    async error(error) {
      console.error('Authentication error:', error);
    }
  },
  
  // Enable debug logging in development
  logger: {
    error(code, metadata) {
      console.error(code, metadata);
    },
    warn(code) {
      console.warn(code);
    },
    debug(code, metadata) {
      console.debug(code, metadata);
    }
  }
};

export default authOptions;

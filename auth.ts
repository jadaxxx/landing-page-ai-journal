import { betterAuth } from "better-auth";
import { nextCookies } from "better-auth/next-js";
import Database from "better-sqlite3";
import { sendEmail } from "./email";

export const auth = betterAuth({
  database: new Database("./auth.db"), // swap for Prisma/Drizzle/Postgres in production
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 10,
    requireEmailVerification: true,
    sendResetPassword: async ({ user, url }) => {
      // don't await: keeps response time the same whether or not the account exists
      void sendEmail({
        to: user.email,
        subject: "Reset your JADEN password",
        text: `Reset your password: ${url}`,
      });
    },
  },
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    sendVerificationEmail: async ({ user, url }) => {
      void sendEmail({
        to: user.email,
        subject: "Confirm your email for JADEN",
        text: `Confirm your email: ${url}`,
      });
    },
  },
  plugins: [nextCookies()], // keep last
});

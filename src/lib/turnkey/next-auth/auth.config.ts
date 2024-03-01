import type { NextAuthConfig } from "next-auth"
import TurnkeyCredentialsProvider from "./turnkey-cred-provider"

export const authConfig = {
  pages: {
    signIn: "/auth",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    authorized({ request, auth }) {
      // Middleware logic goes here, can return true for pages that don't require auth
      return !!auth?.user
    },
    async jwt({ user, token }) {
      // Add the wallet to the token object to make it available in the session (see session callback below)
      if (user) {
        console.log("jwt", user)
        token.wallet = user.wallet
        token.username = user.username
      }
      return token
    },
    async session({ session, token, user }) {
      if (session.user && token.sub && token.wallet) {
        // Add the id returned from the CredentialsProvider.authorize callback to the user session object
        session.user.id = token.id
        // Add the wallet object to the user session object (obtained from the token as seen above)
        session.user.wallet = token.wallet

        session.user.username = token.username
        
        console.log("session", user, session)
      }

      return session
    },
  },
  providers: [TurnkeyCredentialsProvider],
} satisfies NextAuthConfig

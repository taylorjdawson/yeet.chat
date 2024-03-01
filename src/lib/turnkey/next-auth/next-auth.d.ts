import { JWT } from "@auth/core/jwt"
import { type DefaultSession, type User } from "next-auth"

import { TurnkeyTypes } from "../types"

type UserId = string

declare module "@auth/core/jwt" {
  /** Returned by the `jwt` callback and `auth`, when using JWT sessions */
  interface JWT extends TurnkeyTypes.User {}
}

declare module "next-auth" {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: TurnkeyTypes.User & DefaultSession["user"] // To keep the default types
  }

  interface User extends TurnkeyTypes.User {}
}

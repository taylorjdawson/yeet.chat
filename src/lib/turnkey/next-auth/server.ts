"use server"

import { AuthError } from "next-auth"
import { signIn } from "turnkey/next-auth"
import type { Email } from "@turnkey/types"

import type { TSignedRequest } from "@turnkey/http"
import { isRedirectError } from "next/dist/client/components/redirect"

export async function nextAuthSignIn(
  data: {
    email: Email
    challenge?: string
    attestation?: string
    signedRequest?: string
  },
  options?: {
    /** The URL to redirect to after signing in. By default, the user is redirected to the current page. */
    redirectTo?: string
  }
) {
  try {
    await signIn("credentials", {
      ...data,
      ...options,
    })
    return { status: "ok" }
  } catch (error) {
    if (error instanceof AuthError) {
      switch (error.type) {
        case "CredentialsSignin":
          return { status: "error", error: "Invalid credentials." }
        default:
          return { status: "error", error: "Something went wonky." }
      }
    } else if (isRedirectError(error)) {
      // Redirect error is thrown to signal to authjs (next-auth)
      // to redirect to the post-auth endpoint
      throw error
    } else {
      // Log unknown error to console or pass to your logger client
      console.log(error)
      return { status: "error", error: "Something went wonky." }
    }
  }
}

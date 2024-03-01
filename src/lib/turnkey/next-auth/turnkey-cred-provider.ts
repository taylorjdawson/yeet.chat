import { TSignedRequest } from "@turnkey/http"
import { Email } from "@turnkey/types"
import CredentialsProvider from "next-auth/providers/credentials"

import { createServerClient } from ".."
import { TurnkeyTypes } from "../types"

export default CredentialsProvider({
  name: "TurnkeyAuth",
  async authorize(_, req) {
    const {
      email,
      challenge,
      attestation: attestationString,
      signedRequest: signedRequestString,
    } = (await req.json()) as {
      email: Email
      challenge?: string
      attestation?: string
      signedRequest?: string
    }

    const tk = await createServerClient()

    let user: TurnkeyTypes.User | null = null

    if (challenge && attestationString) {
      const attestation: TurnkeyTypes.Attestation =
        JSON.parse(attestationString)
      user = await tk.signUp(email, { challenge, attestation })
    } else if (signedRequestString) {
      const signedRequest: TSignedRequest = JSON.parse(signedRequestString)
      user = await tk.signIn(email, signedRequest)
    }

    return user
  },
})

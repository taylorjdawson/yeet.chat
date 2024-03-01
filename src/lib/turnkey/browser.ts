import { Email, TurnkeyTypes } from "@turnkey/types"
import { TWebauthnStamperConfig } from "@turnkey/webauthn-stamper"

import { ALG_ES256, PUBKEY_CRED_TYPE } from "./constants"
import { signIn, signUp } from "./server"
import { base64UrlEncode, generateRandomBuffer } from "./utils"

export const registerPassKey = async (
  email: Email
): Promise<TurnkeyTypes.PassKeyRegistrationResult> => {
  if (!process.env.NEXT_PUBLIC_TURNKEY_RPID) {
    throw "Error must define NEXT_PUBLIC_TURNKEY_RPID in your .env file"
  }

  // @todo - Add error handling
  const { getWebAuthnAttestation } = await import("@turnkey/http")
  const challenge = generateRandomBuffer()
  const authenticatorUserId = generateRandomBuffer()

  // An example of possible options can be found here:
  // https://www.w3.org/TR/webauthn-2/#sctn-sample-registration
  const attestation = await getWebAuthnAttestation({
    publicKey: {
      rp: {
        id: process.env.NEXT_PUBLIC_TURNKEY_RPID,
        name: "Tunkey Demo Wallet",
      },
      challenge,
      pubKeyCredParams: [
        {
          type: PUBKEY_CRED_TYPE,
          alg: ALG_ES256,
        },
      ],
      user: {
        id: authenticatorUserId,
        name: email.split("@")[0],
        displayName: email.split("@")[0],
      },
      authenticatorSelection: {
        requireResidentKey: true,
        residentKey: "required",
        userVerification: "preferred",
      },
    },
  })

  return { challenge: base64UrlEncode(challenge), attestation }
}

export const createWebauthnStamper = async (
  options?: TWebauthnStamperConfig
) => {
  const { WebauthnStamper } = await import("@turnkey/webauthn-stamper")
  const rpId = options?.rpId || process.env.NEXT_PUBLIC_TURNKEY_RPID
  if (!rpId) {
    throw "Error must provide rpId or define TURNKEY_RPID in your .env file"
  }

  return new WebauthnStamper({
    ...options,
    rpId,
  })
}

// Note: Consider making this a singleton, to prevent multiple instances
export const createBrowserClient: TurnkeyTypes.CreateTurnkeyBrowserClient =
  async () => {
    const { TurnkeyClient } = await import("@turnkey/http")
    const tk = new TurnkeyClient(
      { baseUrl: "https://api.turnkey.com" },
      await createWebauthnStamper()
    )

    return {
      signUp: async (email: Email) => {
        const passKeyRegistrationResult = await registerPassKey(email)
        // todo check errors before proceeding
        return signUp(tk, email, passKeyRegistrationResult)
      },
      signIn: async (email: Email) => {
        const signedRequest = await tk.stampGetWhoami({
          organizationId: "aa522ced-be2a-46ac-83ca-f6256f0951fe",
        })
        return signIn(tk, email, signedRequest)
      },
      client: tk,
    }
  }

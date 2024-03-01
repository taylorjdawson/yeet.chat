"use server"

import type { UUID } from "node:crypto"
import {
  ApiKeyStamper,
  type TApiKeyStamperConfig,
} from "@turnkey/api-key-stamper"
import {
  createActivityPoller,
  TurnkeyClient,
  TurnkeyRequestError,
  type TSignedRequest,
} from "@turnkey/http"
import type {
  Attestation,
  Email,
  PassKeyRegistrationResult,
} from "@turnkey/types"
import type { Address } from "viem"

import { registerPassKey } from "."
import type { TurnkeyTypes } from "./types"

export const createAPIKeyStamper = (options?: TApiKeyStamperConfig) => {
  const apiPublicKey =
    options?.apiPublicKey || process.env.TURNKEY_API_PUBLIC_KEY
  const apiPrivateKey =
    options?.apiPrivateKey || process.env.TURNKEY_API_PRIVATE_KEY

  if (!(apiPublicKey && apiPrivateKey)) {
    throw "Error must provide public and private api key or define API_PUBLIC_KEY API_PRIVATE_KEY in your .env file"
  }

  return new ApiKeyStamper({
    apiPublicKey,
    apiPrivateKey,
  })
}

export const createUserSubOrg = async (
  turnkeyClient: TurnkeyClient,
  {
    email,
    // if challenge and attestation are provided we are creating a custodial wallet using the users provided authenticator
    challenge,
    attestation,
  }: {
    email: Email
    challenge: string
    attestation: Attestation
  }
) => {
  const ETHEREUM_WALLET_DEFAULT_PATH = "m/44'/60'/0'/0/0"
  const DEFAULT_WALLET_NAME = "Default Wallet"
  const DEFAULT_USER_NAME = "Satoshi"

  const activityPoller = createActivityPoller({
    client: turnkeyClient,
    requestFn: turnkeyClient.createSubOrganization,
  })

  const organizationId = process.env.NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID!
  const timestampMs = String(Date.now())

  const rootUsersOptions =
    challenge && attestation
      ? {
          authenticators: [
            {
              authenticatorName: "Passkey",
              challenge,
              attestation,
            },
          ],
          apiKeys: [],
        }
      : {
          authenticators: [],
          apiKeys: [
            {
              apiKeyName: "turnkey-demo",
              publicKey:
                "027f2b4b5465ee137da76e6f2ae4c5d3b400cb54e09ecfbf386b5178b24e923cfe",
            },
          ],
        }

  const completedActivity = await activityPoller({
    type: "ACTIVITY_TYPE_CREATE_SUB_ORGANIZATION_V4",
    timestampMs,
    organizationId,
    parameters: {
      subOrganizationName: `Sub Org - ${email}`,
      rootQuorumThreshold: 1,
      rootUsers: [
        {
          userName: email.split("@")[0],
          userEmail: email,
          ...rootUsersOptions,
        },
      ],
      wallet: {
        walletName: `User ${email.split("@")[0]} wallet`,
        accounts: [
          {
            curve: "CURVE_SECP256K1",
            pathFormat: "PATH_FORMAT_BIP32",
            path: ETHEREUM_WALLET_DEFAULT_PATH,
            addressFormat: "ADDRESS_FORMAT_ETHEREUM",
          },
        ],
      },
    },
  }).catch((error) => {
    console.log({ error, ...error })
  })

  return completedActivity?.result.createSubOrganizationResultV4
}

export const signIn = async (
  tk: TurnkeyClient,
  email: Email,
  signedRequest: TSignedRequest
) => {
  let user: TurnkeyTypes.User | null = null
  try {
    const { url, body, stamp } = signedRequest

    // Forward the signed request to the Turnkey API for validition
    const resp = await fetch(url, {
      method: "POST",
      body,
      headers: {
        [stamp.stampHeaderName]: stamp.stampHeaderValue,
      },
    })

    const signedResponse = (await resp.json()) as {
      code: number
      userId: UUID
      organizationId: UUID
      username: string
    }

    if (!(signedResponse?.code === 5) && signedResponse?.organizationId) {
      const { organizationId } = signedResponse

      const { wallets } = await tk.getWallets({
        organizationId,
      })

      const [account] = (
        await Promise.all(
          wallets.map(({ walletId }) =>
            tk.getWalletAccounts({ organizationId, walletId })
          )
        )
      )
        .flatMap((walletAccount) => walletAccount.accounts)
        .filter((account) => account.address)

      user = {
        id: signedResponse.userId as UUID,
        username: signedResponse?.username,
        email,
        wallet: (account?.address as Address) ?? "0x",
        orgId: organizationId,
        avatarUrl: "",
      }
    }
  } catch (error) {
    if (error instanceof TurnkeyRequestError) {
      console.log(error)
    } else {
      throw error
    }
  } finally {
    return user
  }
}

export const signUp = async (
  tk: TurnkeyClient,
  email: Email,
  passKeyRegistrationResult?: PassKeyRegistrationResult
) => {
  // Register passkey for user email if one is not provided
  const pkRegistrationResult =
    passKeyRegistrationResult ??
    (await registerPassKey(email).catch((error) => {
      // @todo handle case where user cancels operation or operation times out
      console.log(error)
      return null
    }))

  let user: TurnkeyTypes.User | null = null

  if (pkRegistrationResult) {
    // Create a new user sub org with email
    const { subOrganizationId, wallet } =
      (await createUserSubOrg(tk, { email, ...pkRegistrationResult })) ?? {}

    if (subOrganizationId) {
      const whoAmI = await tk
        .getWhoami({
          organizationId: subOrganizationId,
        })
        .catch((error) => {
          if (error instanceof TurnkeyRequestError) {
            console.log(error)
          }
          return null
        })

      if (whoAmI) {
        user = {
          id: whoAmI?.userId as UUID,
          username: email?.split("@")?.[0] ?? email ?? "",
          email,
          wallet: (wallet?.addresses?.[0] ?? "") as Address,
          orgId: whoAmI?.organizationId as UUID,
          avatarUrl: "",
        }
      }
    }
  }

  return user
}

export const createServerClient: TurnkeyTypes.CreateTurnkeyServerClient =
  async () => {
    const turnkeyClient = new TurnkeyClient(
      { baseUrl: "https://api.turnkey.com" },
      await createAPIKeyStamper()
    )
    return {
      signUp: (
        email: Email,
        passKeyRegistrationResult: PassKeyRegistrationResult
      ) => signUp(turnkeyClient, email, passKeyRegistrationResult),
      signIn: (email: Email, signedRequest: TSignedRequest) =>
        signIn(turnkeyClient, email, signedRequest),
      client: turnkeyClient,
    }
  }

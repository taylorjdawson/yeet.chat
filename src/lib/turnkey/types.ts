import type { UUID } from "crypto"
import type { TSignedRequest, TurnkeyClient } from "@turnkey/http"
import { Address } from "viem"

export type Email = `${string}@${string}.${string}`

export namespace TurnkeyTypes {
  export type Attestation = Parameters<
    TurnkeyClient["createSubOrganization"]
  >[0]["parameters"]["rootUsers"][0]["authenticators"][0]["attestation"]

  export interface PassKeyRegistrationResult {
    challenge: string
    attestation: Attestation
  }

  export type OrgId = UUID

  export interface User {
    id: UUID
    email: Email
    username: string
    wallet: Address
    orgId: OrgId
    avatarUrl: string
  }

  export interface CreateTurnkeyClient {
    (param?: {
      stamper?: TurnkeyClient["stamper"]
    }): Promise<AbstractTurnkeyClient>
  }

  export interface CreateTurnkeyServerClient {
    (param?: {
      stamper?: TurnkeyClient["stamper"]
    }): Promise<TurnkeyServerClient>
  }

  export interface CreateTurnkeyBrowserClient {
    (param?: {
      stamper?: TurnkeyClient["stamper"]
    }): Promise<TurnkeyBrowserClient>
  }

  export interface AbstractTurnkeyClient {
    client: TurnkeyClient
  }

  export interface TurnkeyBrowserClient extends AbstractTurnkeyClient {
    signUp: Browser.SignUp
    signIn: Browser.SignIn
  }

  export interface TurnkeyServerClient extends AbstractTurnkeyClient {
    signUp: Server.SignUp
    signIn: Server.SignIn
  }

  export namespace Browser {
    export type SignUp = (email: Email) => Promise<User | null>
    export type SignIn = (email: Email) => Promise<User | null>
  }

  export namespace Server {
    export type SignUp = (
      email: Email,
      passKeyRegistrationResult: PassKeyRegistrationResult
    ) => Promise<User | null>
    export type SignIn = (
      email: Email,
      signedRequest: TSignedRequest
    ) => Promise<User | null>
  }
}

export type Attestation = Parameters<
  TurnkeyClient["createSubOrganization"]
>[0]["parameters"]["rootUsers"][0]["authenticators"][0]["attestation"]

export interface User {
  id: UUID
  email: Email
  username: string
  defaultWallet: Address
  orgId: OrgId
  avatarUrl: string
}

export type OrgId = UUID

export interface PassKeyRegistrationResult {
  challenge: string
  attestation: Attestation
}

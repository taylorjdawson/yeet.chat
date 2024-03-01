namespace NodeJS {
  interface ProcessEnv {
    // Base host for Turnkey's public API
    TURNKEY_API_HOST: "api.turnkey.com" | string

    // Generate an API key with `turnkey gen --name $SOME_NAME`. Then look at the private key file.
    TURNKEY_API_PRIVATE_KEY: string
    TURNKEY_API_PUBLIC_KEY: string

    // Turnkey Organization ID. Create one by signing up at www.turnkey.com
    NEXT_PUBLIC_TURNKEY_ORGANIZATION_ID: string

    // The Relying Party Identifier used for webauthentication (passkeys)
    NEXT_PUBLIC_TURNKEY_RPID: string

    // INFURA API Key
    INFURA_API_KEY: string
  }
}

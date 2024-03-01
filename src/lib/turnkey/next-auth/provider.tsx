"use client"

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
  useRef,
} from "react"
import { TurnkeyTypes, Email } from "@turnkey/types"
import { createBrowserClient, registerPassKey } from "@turnkey/sdk"

import { nextAuthSignIn } from "turnkey/next-auth/server"
import { auth } from "turnkey/next-auth"
import { SessionProvider, useSession } from "next-auth/react"
import { organizationId } from "../env"

interface TurnkeyContextType {
  turnkeyClient: TurnkeyTypes.TurnkeyBrowserClient | null
  user: TurnkeyTypes.User | null
  signUp: (email: Email) => Promise<{ status: string; error?: string }>
  signIn: (email: Email) => Promise<{ status: string; error?: string }>
}

// Create the context with a default value
const TurnkeyContext = createContext<TurnkeyContextType | undefined>(undefined)

// TurnkeyProvider props type
interface TurnkeyProviderProps {
  children: ReactNode
  // TODO: This config should be encompas multiple options, not just for the next-auth signin method
  // This is the config that will enable users to override next-auth options so that they can integrate this into
  // an existing application that uses next-ath
  config?: {
    redirectTo?: string
  }
}

const Provider: React.FC<TurnkeyProviderProps> = ({ children, config }) => {
  const [user, setUser] = useState<TurnkeyTypes.User | null>(null)
  const [turnkeyClient, setTurnkeyClient] =
    useState<TurnkeyTypes.TurnkeyBrowserClient | null>(null)
  const initializedRef = useRef(false)

  const { data: session, status } = useSession()

  useEffect(() => {
    if (session) {
      // Assuming session.user has the User type or compatible structure
      setUser(session.user)
    } else {
      // Handle the case when there is no session (e.g., user logged out)
      setUser(null)
    }
  }, [session])

  useEffect(() => {
    const initializeClient = async () => {
      try {
        const client = await createBrowserClient()
        setTurnkeyClient(client)
      } catch (error) {
        console.error("Error initializing auth client:", error)
      }
    }
    if (!initializedRef.current) {
      initializedRef.current = true
      initializeClient()
    }
  })

  const signUp = async (email: Email) => {
    if (!turnkeyClient) throw new Error("Turnkey client is not initialized.")

    const passKeyRegistrationResult = await registerPassKey(email)

    // This function will be executed server side, therefore all client side ops (like signing with passkey)
    // must take place before calling this function when using next-auth in order to have the session mangaged

    return await nextAuthSignIn(
      {
        email,

        ...{
          ...passKeyRegistrationResult,
          // Since this is being passed to a server action this must be a string
          // server actions don't handle nested objects
          attestation: JSON.stringify(passKeyRegistrationResult.attestation),
        },
      },
      // TODO: This config should be encompas multiple options, not just for the next-auth signin method
      config
    )
  }

  const signIn = async (email: Email) => {
    if (!turnkeyClient) throw new Error("Turnkey client is not initialized.")

    const signedRequest = await turnkeyClient.client.stampGetWhoami({
      organizationId,
    })

    // This function will be executed server side, therefore all client side ops (like signing with passkey)
    // must take place before calling this function when using next-auth in order to have the session mangaged
    return await nextAuthSignIn({
      email,
      signedRequest: JSON.stringify(signedRequest),
    })
  }

  return (
    // use this pattern to embed context providers
    // https://stackoverflow.com/questions/51504506/too-many-react-context-providers
    <TurnkeyContext.Provider value={{ user, signUp, signIn, turnkeyClient }}>
      {children}
    </TurnkeyContext.Provider>
  )
}

export function TurnkeyNextAuthProvider({
  children,
  ...props
}: TurnkeyProviderProps) {
  // TODO make SessionProvider either a) passed into the TurnkeyProvider as a prop
  // at the very least only load it if the user is using next-auth
  return (
    <SessionProvider>
      <Provider {...props}>{children}</Provider>
    </SessionProvider>
  )
}

// Custom hook
export const useTurnkey = () => {
  const context = useContext(TurnkeyContext)
  if (context === undefined) {
    throw new Error("useTurnkey must be used within an TurnkeyProvider")
  }
  return context
}

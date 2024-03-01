"use client"

import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react"
import { Email } from "@turnkey/types"

import { createBrowserClient } from "."
import { TurnkeyTypes } from "./types"

interface TurnkeyContextType {
  user: TurnkeyTypes.User
  signUp: (email: Email) => Promise<TurnkeyTypes.User | null>
  signIn: (email: Email) => Promise<TurnkeyTypes.User | null>
}

const TurnkeyContext = createContext<TurnkeyContextType | undefined>(undefined)

interface TurnkeyProviderProps {
  children: ReactNode
  // rename maybe to nextAuthOptions?
  nextAuth?: {
    redirectTo?: string
  }
}

const TurnkeyProvider: React.FC<TurnkeyProviderProps> = ({ children }) => {
  const [user, setUser] = useState<any>(null)
  const [turnkeyClient, setTurnkeyClient] =
    useState<TurnkeyTypes.TurnkeyBrowserClient | null>(null)
  const initializedRef = useRef(false)

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
    const user = turnkeyClient.signUp(email)
    setUser(user)
    return user
  }

  const signIn = async (email: Email) => {
    if (!turnkeyClient) throw new Error("Turnkey client is not initialized.")
    const user = turnkeyClient.signIn(email)
    setUser(user)
    return user
  }

  return (
    // use this pattern to embed context providers
    // https://stackoverflow.com/questions/51504506/too-many-react-context-providers
    <TurnkeyContext.Provider value={{ user, signUp, signIn }}>
      {children}
    </TurnkeyContext.Provider>
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

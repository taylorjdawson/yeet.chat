import React from "react"
import Image from "next/image"

import { AuthForm } from "@/components/auth-form"

type AuthProps = {}

export default function Auth({}: AuthProps) {
  return (
    <main className="flex min-h-screen flex-col items-center p-12">
      <div className="mx-auto mt-24 flex w-full flex-col justify-center space-y-8 sm:w-[350px]">
        <Image
          className="mx-auto fill-white"
          src="/turnkey-logo.svg"
          width={200}
          height={200}
          alt="Turnkey Logo"
        />
        <div className="flex flex-col space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Connect to Turnkey
          </h1>
          <p className="text-sm text-muted-foreground">
            Enter your email below to sign in or create a new account
          </p>
        </div>
        <AuthForm />
      </div>
    </main>
  )
}

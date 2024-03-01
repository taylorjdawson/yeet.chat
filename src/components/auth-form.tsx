"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Email } from "@turnkey/types"
import { useForm } from "react-hook-form"
import { useTurnkey } from "turnkey/next-auth"
import * as z from "zod"

import { Button } from "./ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "./ui/form"
import { Input } from "./ui/input"

const formSchema = z.object({
  email: z.string().email({
    message: "Must be a valid email.",
  }),
})

export function AuthForm() {
  const { signIn, signUp } = useTurnkey()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  })

  const [action, setAction] = useState<"signIn" | "signUp">()

  async function onSubmit({ email }: z.infer<typeof formSchema>) {
    if (action) {
      try {
        const result = await { signIn, signUp }[action](email as Email)
        if (result.error) {
          form.setError("email", {
            type: "manual",
            message: result.error,
          })
        }
      } catch (error) {
        console.log("auth-form error", error)
      }
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-2">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input placeholder="satoshi@bitcoin.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="group relative flex tracking-tight">
          <Button
            variant="secondary"
            className="w-full rounded-r-none"
            type="submit"
            onClick={() => setAction("signUp")}
          >
            Sign Up
          </Button>
          <Button
            variant="secondary"
            className="w-full rounded-l-none"
            type="submit"
            onClick={() => setAction("signIn")}
          >
            Login
          </Button>
          <div className="absolute flex h-full w-full items-center justify-center rounded-md bg-secondary text-secondary-foreground transition-opacity duration-300 group-hover:pointer-events-none  group-hover:opacity-0">
            <div className="">Enter</div>
          </div>
        </div>
      </form>
    </Form>
  )
}

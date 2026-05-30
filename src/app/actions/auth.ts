"use server";

import { AuthError } from "next-auth";
import { signIn } from "../../../auth";
import { normalizeCallbackUrl } from "@/lib/auth-redirect";

export async function authenticate(_previousState: string | undefined, formData: FormData) {
  const email = formData.get("email");
  const password = formData.get("password");
  const redirectTo = normalizeCallbackUrl(formData.get("callbackUrl"));

  try {
    await signIn("credentials", {
      email,
      password,
      redirectTo,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      if (error.type === "CredentialsSignin") {
        return "Invalid email or password.";
      }

      return "Authentication failed. Please try again.";
    }

    throw error;
  }
}

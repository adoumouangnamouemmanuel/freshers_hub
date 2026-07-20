"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";

export async function loginAction(prevState: any, formData: FormData) {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email and password are required" };
  }

  try {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (!res.ok) {
      return { error: data.message || "Invalid credentials" };
    }

    // Set the cookie
    const cookieStore = await cookies();
    cookieStore.set({
      name: "accessToken",
      value: data.accessToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 15 * 60, // 15 minutes
      path: "/",
    });
    
    cookieStore.set({
      name: "refreshToken",
      value: data.refreshToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60, // 90 days
      path: "/",
    });

    // Store user metadata (non-httpOnly so client components could potentially read it, or server components can read it easily)
    cookieStore.set({
      name: "user",
      value: JSON.stringify(data.user),
      httpOnly: false,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 90 * 24 * 60 * 60, // 90 days
      path: "/",
    });

    // We can't redirect directly inside a try/catch if it catches it, but Next.js redirect throws an error that we must not catch
  } catch (error: any) {
    // Next.js redirect throws a specific error, we need to let it bubble up
    if (error.message === "NEXT_REDIRECT") {
      throw error;
    }
    return { error: "Failed to connect to the server" };
  }

  // Redirect on success
  redirect("/dashboard");
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete("accessToken");
  cookieStore.delete("refreshToken");
  cookieStore.delete("user");
  redirect("/login");
}

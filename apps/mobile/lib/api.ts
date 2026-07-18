export const API_URL =
  process.env.EXPO_PUBLIC_API_URL?.trim() || "http://localhost:4000";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init.headers || {}),
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) : {};

  if (!response.ok) {
    const errorMsg =
      typeof body.message === "string"
        ? body.message
        : typeof body.error === "string"
          ? body.error
          : "Request failed";
    const error = new Error(errorMsg);
    (error as Error & { status?: number; body?: unknown }).status =
      response.status;
    (error as Error & { status?: number; body?: unknown }).body = body;
    throw error;
  }

  return body as T;
}

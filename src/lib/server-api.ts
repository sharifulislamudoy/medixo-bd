import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const apiUrl = process.env.API_URL || "http://localhost:4000";

export async function getApi<T>(path: string): Promise<T> {
  const cookieHeader = (await cookies()).toString();
  const response = await fetch(`${apiUrl}${path}`, {
    headers: { Cookie: cookieHeader },
    cache: "no-store",
  });
  if (response.status === 401) redirect("/login?error=Session%20expired");
  if (response.status === 403) redirect("/auth-error");
  if (!response.ok) throw new Error(`API request failed (${response.status}): ${path}`);
  return response.json() as Promise<T>;
}

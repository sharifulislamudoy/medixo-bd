"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { motion } from "framer-motion";

type AppRole = "customer" | "delivery" | "admin";

const homeByRole: Record<AppRole, string> = {
  customer: "/",
  delivery: "/orders",
  admin: "/dashboard/admin",
};

export default function LoginForm({ role }: { role: AppRole }) {
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSessionModal, setShowSessionModal] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [clearingSessions, setClearingSessions] = useState(false);

  async function login() {
    const result = await signIn("credentials", {
      phone,
      password,
      redirect: false,
      callbackUrl: homeByRole[role],
    });

    if (result?.error === "SESSION_LIMIT_EXCEEDED") {
      setShowSessionModal(true);
    } else if (result?.error) {
      setError(result.error);
    } else if (result?.ok) {
      window.location.href = result.url || homeByRole[role];
    } else {
      setError("Login failed. Please try again.");
    }
  }

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login();
    } catch {
      setError("Could not connect to the server.");
    } finally {
      setIsLoading(false);
    }
  }

  async function clearSessionsAndLogin() {
    if (!confirmPassword) return;

    setClearingSessions(true);
    setError(null);

    try {
      const response = await fetch("/api/auth/clear-sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone,
          password: confirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || data.error || "Could not clear other sessions.",
        );
      }

      setShowSessionModal(false);
      setConfirmPassword("");
      await login();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Please try again.",
      );
    } finally {
      setClearingSessions(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative w-full max-w-md"
      >
        <div className="absolute inset-x-0 top-0 z-10 h-1 rounded-t-xl bg-gradient-to-r from-[#156A98] via-[#0F9D8F] to-[#156A98]" />

        <div className="rounded-xl bg-white p-8 pt-10 shadow-2xl">
          <div className="mb-8 text-center">
            <div className="inline-flex items-center gap-2">
              <img
                src="/Logo.png"
                alt="Medixo"
                className="h-11 w-11 object-contain"
              />
              <span className="bg-gradient-to-r from-[#156A98] to-[#0F9D8F] bg-clip-text text-2xl font-bold text-transparent">
                Medixo
              </span>
            </div>

            <h1 className="mt-4 text-2xl font-semibold text-gray-800">
              Welcome Back
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Sign in to your{" "}
              {role === "delivery"
                ? "delivery"
                : role === "admin"
                  ? "admin"
                  : "B2B"}{" "}
              account
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-4 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-5">
            <div className="space-y-2">
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-gray-700"
              >
                Phone Number
              </label>
              <input
                id="phone"
                type="tel"
                autoComplete="username"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="017xxxxxxxx"
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-black focus:border-[#0F9D8F] focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50"
                required
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Password
              </label>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-lg border border-gray-200 px-4 py-3 text-black focus:border-[#0F9D8F] focus:outline-none focus:ring-2 focus:ring-[#0F9D8F]/50"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                className="text-sm text-[#156A98]"
              >
                {showPassword ? "Hide" : "Show"} password
              </button>
            </div>

            <div className="text-right">
              <Link
                href="/forgot-password"
                className="text-sm text-[#0F9D8F] hover:text-[#156A98]"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full rounded-lg bg-gradient-to-r from-[#156A98] to-[#0F9D8F] py-3 font-medium text-white transition-opacity disabled:opacity-60"
            >
              {isLoading ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {role !== "admin" && (
            <p className="mt-6 text-center text-gray-600">
              Don&apos;t have an account?{" "}
              <Link
                href={
                  role === "delivery"
                    ? "/register/delivery-boy"
                    : "/register/customer"
                }
                className="font-medium text-[#0F9D8F] hover:text-[#156A98]"
              >
                Register here
              </Link>
            </p>
          )}
        </div>

        {showSessionModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
            <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl">
              <h2 className="text-lg font-bold text-gray-800">
                Device Limit Reached
              </h2>
              <p className="mt-2 text-sm text-gray-600">
                You are logged in on another device. Confirm your password to
                sign out there.
              </p>

              <label
                htmlFor="confirm-password"
                className="mt-4 block text-sm font-medium text-gray-700"
              >
                Confirm your password
              </label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-gray-200 px-3 py-2 text-black focus:ring-2 focus:ring-[#0F9D8F]"
              />

              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowSessionModal(false);
                    setConfirmPassword("");
                  }}
                  className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={clearSessionsAndLogin}
                  disabled={clearingSessions}
                  className="rounded-lg bg-gradient-to-r from-[#156A98] to-[#0F9D8F] px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
                >
                  {clearingSessions
                    ? "Processing..."
                    : "Log out others & Login"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
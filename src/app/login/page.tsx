import { Suspense } from "react";
import LoginErrorToast from "@/components/LoginErrorToast";
import LoginForm from "@/components/LoginForm";

export default function LoginPage() {
  return (
    <>
      <Suspense fallback={null}>
        <LoginErrorToast />
      </Suspense>
      <LoginForm role="customer" />
    </>
  );
}
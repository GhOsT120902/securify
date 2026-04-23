import { SignIn } from "@clerk/react";
import { Link } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center bg-background px-4 gap-4">
      <SignIn
        routing="path"
        path={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        fallbackRedirectUrl={`${basePath}/app`}
      />
      <p className="text-sm text-muted-foreground">
        Forgot your password?{" "}
        <Link href={`${basePath}/forgot-password`} className="text-primary hover:text-primary/80 font-medium transition-colors">
          Reset it here
        </Link>
      </p>
    </div>
  );
}

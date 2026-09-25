import Link from "next/link";
import LoginForm from "@/components/auth/LoginForm";

export const dynamic = "force-dynamic";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm">
        <div className="rounded-xl border border-surface/50 bg-surface p-8 shadow-sm">
          <div className="mb-6 text-center">
            <h1 className="text-xl font-bold text-primary">FIFA FRIENDS CUP</h1>
            <p className="mt-1 text-xs font-medium uppercase tracking-wider text-muted">
              Admin
            </p>
          </div>

          <LoginForm />
        </div>

        <p className="mt-6 text-center text-sm text-muted">
          <Link href="/" className="transition-colors hover:text-primary">
            Volver al inicio
          </Link>
        </p>
      </div>
    </div>
  );
}
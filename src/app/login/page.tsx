import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LoginForm } from "@/app/login/login-form";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = { title: "Masuk" };
export const dynamic = "force-dynamic";

export default async function LoginPage() {
  if (await getSession()) redirect("/admin");

  return (
    <main
      id="main-content"
      className="flex min-h-dvh items-center justify-center bg-ink px-4 py-10"
    >
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl sm:p-8">
        <div className="mb-6 flex items-center gap-3">
          <span
            aria-hidden="true"
            className="inline-flex size-11 items-center justify-center rounded-md bg-brand font-heading text-xl font-extrabold text-ink"
          >
            SB
          </span>
          <div>
            <h1 className="font-heading text-xl leading-tight font-extrabold uppercase">
              Sinar Berkah
            </h1>
            <p className="text-sm text-muted">Masuk ke panel admin</p>
          </div>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}

"use client";

import { useState, type FormEvent } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/feedback";
import { Field } from "@/components/ui/field";
import { inputStyles } from "@/components/ui/input-styles";
import { apiRequest } from "@/lib/client-api";
import { useApiForm } from "@/lib/use-api-form";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { saving, formError, firstError, submit } = useApiForm();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void submit(
      () =>
        apiRequest("/api/auth/login", {
          method: "POST",
          body: { email, password },
        }),
      "/admin",
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {formError && <Alert tone="error">{formError}</Alert>}

      <Field label="Email" required error={firstError("email")}>
        {(props) => (
          <input
            {...props}
            type="email"
            autoComplete="username"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className={inputStyles}
          />
        )}
      </Field>

      <Field label="Password" required error={firstError("password")}>
        {(props) => (
          <input
            {...props}
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className={inputStyles}
          />
        )}
      </Field>

      <Button type="submit" className="w-full" disabled={saving}>
        {saving ? "Memeriksa..." : "Masuk"}
      </Button>
    </form>
  );
}

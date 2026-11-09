import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircleIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import {
  TurnstileField,
  type TurnstileFieldHandle,
} from "@/components/turnstile-field";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { useLogin } from "@/features/auth/hooks";
import { type LoginInput, loginSchema } from "@/features/auth/schemas";

export function LoginForm() {
  const login = useLogin();
  const alertRef = useRef<HTMLDivElement>(null);
  const turnstileRef = useRef<TurnstileFieldHandle>(null);
  const [showPassword, setShowPassword] = useState(false);
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "", turnstileToken: "" },
  });

  // Focus server error message so screen readers announce it immediately.
  useEffect(() => {
    if (login.error) alertRef.current?.focus();
  }, [login.error]);

  const busy = login.isPending || login.isSuccess;
  const turnstileToken = form.watch("turnstileToken");
  const canSubmit = !busy && Boolean(turnstileToken);

  const handleSubmit = (values: LoginInput) => {
    login.mutate(values, {
      onSettled: () => {
        turnstileRef.current?.reset();
      },
    });
  };

  return (
    <form
      noValidate
      onSubmit={form.handleSubmit(handleSubmit)}
      className="space-y-5"
    >
      {login.error && (
        <Alert variant="destructive" ref={alertRef} tabIndex={-1}>
          <AlertCircleIcon aria-hidden="true" />
          <AlertDescription>{login.error.message}</AlertDescription>
        </Alert>
      )}

      <FieldGroup>
        <Controller
          name="email"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-email">Email</FieldLabel>
              <Input
                {...field}
                id="login-email"
                type="email"
                autoComplete="username"
                required
                aria-invalid={fieldState.invalid}
                aria-describedby={
                  fieldState.invalid ? "login-email-error" : undefined
                }
                className="h-11"
              />
              {fieldState.invalid && (
                <FieldError
                  id="login-email-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />

        <Controller
          name="password"
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="login-password">Password</FieldLabel>
              <div className="relative">
                <Input
                  {...field}
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  required
                  aria-invalid={fieldState.invalid}
                  aria-describedby={
                    fieldState.invalid ? "login-password-error" : undefined
                  }
                  className="h-11 pr-11"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={
                    showPassword
                      ? "Sembunyikan kata sandi"
                      : "Tampilkan kata sandi"
                  }
                  aria-pressed={showPassword}
                  className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
              {fieldState.invalid && (
                <FieldError
                  id="login-password-error"
                  errors={[fieldState.error]}
                />
              )}
            </Field>
          )}
        />
      </FieldGroup>

      <div className="flex flex-col items-center">
        <TurnstileField
          ref={turnstileRef}
          action="login"
          onToken={(token) =>
            form.setValue("turnstileToken", token, { shouldValidate: true })
          }
        />
        {form.formState.errors.turnstileToken && (
          <p className="text-xs text-destructive mt-1">
            {form.formState.errors.turnstileToken.message}
          </p>
        )}
      </div>

      <Button
        type="submit"
        size="lg"
        className="h-11 w-full"
        disabled={!canSubmit}
      >
        {busy ? "Memeriksa..." : "Masuk"}
      </Button>
    </form>
  );
}

<script lang="ts">
	import { CircleAlert, Eye, EyeOff } from '@lucide/svelte';
	import { tick } from 'svelte';

	import { apiRequest } from '#lib/api/client.js';
	import TurnstileField from '#lib/components/TurnstileField.svelte';
	import Button from '#lib/components/ui/Button.svelte';
	import { loginSchema, type LoginResult } from '#lib/features/auth/schemas.js';

	let email = $state('');
	let password = $state('');
	let turnstileToken = $state<string | null>(null);
	let showPassword = $state(false);
	let busy = $state(false);
	let resetSignal = $state(0);

	let serverError = $state<string | null>(null);
	let fieldErrors = $state<{
		email?: string;
		password?: string;
		turnstileToken?: string;
	}>({});

	let alertEl = $state<HTMLDivElement | null>(null);
	let canSubmit = $derived(!busy && Boolean(turnstileToken));

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (busy) return;

		fieldErrors = {};
		serverError = null;

		const parsed = loginSchema.safeParse({
			email,
			password,
			turnstileToken: turnstileToken ?? ''
		});

		if (!parsed.success) {
			const nextErrors: typeof fieldErrors = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0];
				if (field === 'email' && !nextErrors.email) nextErrors.email = issue.message;
				if (field === 'password' && !nextErrors.password) nextErrors.password = issue.message;
				if (field === 'turnstileToken' && !nextErrors.turnstileToken) {
					nextErrors.turnstileToken = issue.message;
				}
			}
			fieldErrors = nextErrors;
			return;
		}

		busy = true;
		try {
			await apiRequest<LoginResult>('/api/auth/login', {
				method: 'POST',
				json: parsed.data
			});
			window.location.assign('/admin');
		} catch (err) {
			serverError = err instanceof Error ? err.message : 'Gagal masuk ke panel admin.';
			busy = false;
			turnstileToken = null;
			resetSignal += 1;
			await tick();
			alertEl?.focus();
		}
	}
</script>

<form novalidate onsubmit={handleSubmit} class="space-y-5">
	{#if serverError}
		<div
			bind:this={alertEl}
			role="alert"
			tabindex="-1"
			class="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-3.5 py-2.5 text-sm text-destructive focus:outline-none"
		>
			<CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
			<p>{serverError}</p>
		</div>
	{/if}

	<div class="space-y-4">
		<div class="space-y-1.5">
			<label for="login-email" class="text-sm font-medium text-foreground">Email</label>
			<input
				id="login-email"
				type="email"
				bind:value={email}
				autocomplete="username"
				required
				aria-invalid={Boolean(fieldErrors.email)}
				aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
				class="flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive"
			/>
			{#if fieldErrors.email}
				<p id="login-email-error" class="text-xs font-medium text-destructive">
					{fieldErrors.email}
				</p>
			{/if}
		</div>

		<div class="space-y-1.5">
			<label for="login-password" class="text-sm font-medium text-foreground">Password</label>
			<div class="relative">
				<input
					id="login-password"
					type={showPassword ? 'text' : 'password'}
					bind:value={password}
					autocomplete="current-password"
					required
					aria-invalid={Boolean(fieldErrors.password)}
					aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
					class="flex h-11 w-full rounded-md border border-input bg-card py-2 pr-11 pl-3 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive"
				/>
				<button
					type="button"
					onclick={() => (showPassword = !showPassword)}
					aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
					aria-pressed={showPassword}
					class="absolute top-1/2 right-1.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
				>
					{#if showPassword}
						<EyeOff class="size-4" aria-hidden="true" />
					{:else}
						<Eye class="size-4" aria-hidden="true" />
					{/if}
				</button>
			</div>
			{#if fieldErrors.password}
				<p id="login-password-error" class="text-xs font-medium text-destructive">
					{fieldErrors.password}
				</p>
			{/if}
		</div>
	</div>

	<div class="flex flex-col items-center">
		<TurnstileField
			action="login"
			{resetSignal}
			onTokenChange={(token) => {
				turnstileToken = token;
				if (token && fieldErrors.turnstileToken) {
					fieldErrors = { ...fieldErrors, turnstileToken: undefined };
				}
			}}
		/>
		{#if fieldErrors.turnstileToken}
			<p class="mt-1 text-xs text-destructive">{fieldErrors.turnstileToken}</p>
		{/if}
	</div>

	<Button type="submit" size="lg" class="h-11 w-full" disabled={!canSubmit}>
		{busy ? 'Memeriksa...' : 'Masuk'}
	</Button>
</form>

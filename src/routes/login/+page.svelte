<script lang="ts">
	import ThemeToggle from '#lib/components/admin-kit/ThemeToggle.svelte';
	import LoginForm from '#lib/features/auth/components/LoginForm.svelte';
</script>

<svelte:head>
	<title>Masuk | Panel Admin Sinar Berkah</title>
</svelte:head>

<main
	id="main-content"
	tabindex="-1"
	class="relative flex min-h-dvh items-center justify-center bg-background px-4 py-10 transition-colors"
>
	<div class="absolute top-4 right-4 sm:top-6 sm:right-6">
		<ThemeToggle />
	</div>

	<section
		class="w-full max-w-md rounded-xl border border-border/80 bg-card p-6 text-card-foreground shadow-lg"
	>
		<header class="pb-6">
			<div class="flex items-center gap-3">
				<span
					aria-hidden="true"
					class="flex size-10 shrink-0 items-center justify-center rounded-lg bg-brand font-heading text-lg font-extrabold text-white shadow-xs"
				>
					SB
				</span>
				<div>
					<h1 class="font-heading text-xl font-extrabold tracking-wide text-foreground uppercase">
						Sinar Berkah
					</h1>
					<p class="text-sm text-muted-foreground">Masuk ke panel admin</p>
				</div>
			</div>
		</header>
		<LoginForm />
	</section>
</main>

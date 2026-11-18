<script lang="ts">
	import { PUBLIC_TURNSTILE_SITE_KEY } from '$app/env/public';
	import { onMount } from 'svelte';

	interface Props {
		action?: string;
		resetSignal?: number;
		onTokenChange: (token: string | null) => void;
		onLoadError?: () => void;
	}

	let { action = 'login', resetSignal = 0, onTokenChange, onLoadError }: Props = $props();

	let container = $state<HTMLDivElement | null>(null);
	let widgetId = $state<string | null>(null);
	let loadFailed = $state(false);
	let theme = $state<'light' | 'dark'>('light');

	const TURNSTILE_SCRIPT_SRC =
		'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

	function syncTheme(): void {
		theme = document.documentElement.classList.contains('dark') ? 'dark' : 'light';
	}

	function renderWidget(): void {
		if (!container || !window.turnstile || widgetId !== null) return;
		widgetId = window.turnstile.render(container, {
			sitekey: PUBLIC_TURNSTILE_SITE_KEY,
			action,
			theme,
			callback: (token: string) => {
				onTokenChange(token);
			},
			'expired-callback': () => {
				onTokenChange(null);
			},
			'error-callback': () => {
				onTokenChange(null);
			}
		});
	}

	onMount(() => {
		syncTheme();

		const observer = new MutationObserver(() => {
			syncTheme();
		});
		observer.observe(document.documentElement, {
			attributes: true,
			attributeFilter: ['class']
		});

		if (window.turnstile) {
			renderWidget();
		} else {
			let script = document.querySelector<HTMLScriptElement>(
				`script[src="${TURNSTILE_SCRIPT_SRC}"]`
			);
			const handleLoad = () => renderWidget();
			const handleError = () => {
				loadFailed = true;
				onLoadError?.();
			};

			if (!script) {
				script = document.createElement('script');
				script.src = TURNSTILE_SCRIPT_SRC;
				script.async = true;
				script.defer = true;
				document.head.appendChild(script);
			}
			script.addEventListener('load', handleLoad);
			script.addEventListener('error', handleError);

			return () => {
				observer.disconnect();
				script?.removeEventListener('load', handleLoad);
				script?.removeEventListener('error', handleError);
				if (widgetId !== null && window.turnstile) {
					window.turnstile.remove(widgetId);
					widgetId = null;
				}
			};
		}

		return () => {
			observer.disconnect();
			if (widgetId !== null && window.turnstile) {
				window.turnstile.remove(widgetId);
				widgetId = null;
			}
		};
	});

	$effect(() => {
		if (resetSignal > 0 && widgetId !== null && window.turnstile) {
			window.turnstile.reset(widgetId);
		}
	});
</script>

{#if loadFailed}
	<p
		class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive"
	>
		Widget keamanan gagal dimuat. Muat ulang halaman dan coba lagi.
	</p>
{:else}
	<div class="min-h-[65px]" bind:this={container}></div>
{/if}

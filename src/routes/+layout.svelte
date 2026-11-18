<script lang="ts">
	import type { Snippet } from 'svelte';

	import Toaster from '#lib/components/ui/Toaster.svelte';
	import '../styles/globals.css';

	let { children }: { children: Snippet } = $props();
</script>

<svelte:head>
	<title>Panel Admin | Sinar Berkah</title>
	<meta name="description" content="Kelola produk, portofolio, dan galeri pola Sinar Berkah." />
	<meta name="robots" content="noindex, nofollow" />
</svelte:head>

<a
	href="#main-content"
	class="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[60] focus:rounded-md focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
>
	Lewati ke konten utama
</a>

{@render children()}
<Toaster />

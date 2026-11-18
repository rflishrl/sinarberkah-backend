<script lang="ts">
	import { page } from '$app/state';

	import { buttonVariants } from '#lib/components/ui/button.js';
</script>

<svelte:head>
	<title>
		{page.status === 404
			? 'Halaman Tidak Ditemukan | Panel Admin Sinar Berkah'
			: 'Terjadi Kesalahan | Panel Admin Sinar Berkah'}
	</title>
</svelte:head>

<main
	id="main-content"
	tabindex="-1"
	class="flex min-h-dvh flex-col items-center justify-center bg-background px-4 py-16 text-center"
>
	<p class="font-heading text-6xl font-extrabold text-brand">{page.status}</p>
	<h1 class="mt-3 font-heading text-2xl font-extrabold text-foreground">
		{page.status === 404 ? 'Halaman tidak ditemukan' : 'Terjadi kesalahan'}
	</h1>
	<p class="mt-2 max-w-md text-sm text-muted-foreground">
		{page.status === 404
			? 'Halaman yang Anda cari tidak tersedia atau telah dipindahkan.'
			: page.error?.message || 'Silakan coba beberapa saat lagi.'}
	</p>
	<a href="/admin" class={buttonVariants({ size: 'lg', className: 'mt-6 h-11 px-5' })}>
		Kembali ke Dashboard
	</a>
</main>

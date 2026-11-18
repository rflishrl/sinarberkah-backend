<script lang="ts">
	import PageHeading from '#lib/components/admin-kit/PageHeading.svelte';
	import GalleryForm from '#lib/features/gallery/components/GalleryForm.svelte';
	import { GALLERY_CONFIG } from '#lib/features/gallery/config.js';

	const config = GALLERY_CONFIG.pattern;
</script>

<svelte:head>
	<title>Tambah {config.singular} | Panel Admin Sinar Berkah</title>
</svelte:head>

<div class="space-y-6">
	<PageHeading title={`Tambah ${config.singular}`} />
	<GalleryForm kind="pattern" />
</div>

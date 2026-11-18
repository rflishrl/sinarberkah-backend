<script lang="ts">
	import type { PageData } from './$types';

	import PageHeading from '#lib/components/admin-kit/PageHeading.svelte';
	import GalleryForm from '#lib/features/gallery/components/GalleryForm.svelte';
	import { GALLERY_CONFIG } from '#lib/features/gallery/config.js';

	let { data }: { data: PageData } = $props();
	const config = GALLERY_CONFIG.pattern;
</script>

<svelte:head>
	<title>Ubah {config.singular} | Panel Admin Sinar Berkah</title>
</svelte:head>

<div class="space-y-6">
	<PageHeading title={`Ubah ${config.singular}`} description={data.item.title} />
	{#key `${data.item._id}:${data.item.updatedAt}`}
		<GalleryForm kind="pattern" item={data.item} />
	{/key}
</div>

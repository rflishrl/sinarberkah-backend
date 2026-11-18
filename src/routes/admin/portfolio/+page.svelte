<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import type { PageData } from './$types';

	import PageHeading from '#lib/components/admin-kit/PageHeading.svelte';
	import SearchForm from '#lib/components/admin-kit/SearchForm.svelte';
	import { buttonVariants } from '#lib/components/ui/button.js';
	import GalleryListView from '#lib/features/gallery/components/GalleryListView.svelte';
	import { GALLERY_CONFIG } from '#lib/features/gallery/config.js';

	let { data }: { data: PageData } = $props();
	const config = GALLERY_CONFIG.portfolio;
</script>

<svelte:head>
	<title>{config.title} | Panel Admin Sinar Berkah</title>
</svelte:head>

<div>
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<PageHeading title={config.title} description={config.description} />
		<a href="/admin/portfolio/new" class={buttonVariants({ size: 'lg', className: 'h-11 px-4' })}>
			<Plus class="size-4" aria-hidden="true" />
			<span>Tambah {config.singular}</span>
		</a>
	</div>

	<SearchForm
		defaultValue={data.q}
		placeholder="Cari judul atau jenis..."
		clearHref={config.adminPath}
	/>

	<GalleryListView kind="portfolio" data={data.list} q={data.q} errorMessage={data.errorMessage} />
</div>

<script lang="ts">
	import { Plus } from '@lucide/svelte';
	import type { PageData } from './$types';

	import PageHeading from '#lib/components/admin-kit/PageHeading.svelte';
	import SearchForm from '#lib/components/admin-kit/SearchForm.svelte';
	import { buttonVariants } from '#lib/components/ui/button.js';
	import ProductListView from '#lib/features/products/components/ProductListView.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Produk | Panel Admin Sinar Berkah</title>
</svelte:head>

<div>
	<div class="mb-6 flex flex-wrap items-center justify-between gap-4">
		<PageHeading title="Produk" description="Produk yang ditandai Tampil akan muncul di website." />
		<a href="/admin/products/new" class={buttonVariants({ size: 'lg', className: 'h-11 px-4' })}>
			<Plus class="size-4" aria-hidden="true" />
			<span>Tambah produk</span>
		</a>
	</div>

	<SearchForm
		defaultValue={data.q}
		placeholder="Cari nama atau kategori produk..."
		clearHref="/admin/products"
	/>

	<ProductListView data={data.list} q={data.q} errorMessage={data.errorMessage} />
</div>

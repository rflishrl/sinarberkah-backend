<script lang="ts">
	import type { PageData } from './$types';

	import PageHeading from '#lib/components/admin-kit/PageHeading.svelte';
	import ProductForm from '#lib/features/products/components/ProductForm.svelte';

	let { data }: { data: PageData } = $props();
</script>

<svelte:head>
	<title>Ubah produk | Panel Admin Sinar Berkah</title>
</svelte:head>

<div class="space-y-6">
	<PageHeading title="Ubah produk" description={data.product.name} />
	{#key `${data.product._id}:${data.product.updatedAt}`}
		<ProductForm product={data.product} />
	{/key}
</div>

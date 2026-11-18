<script lang="ts">
	import PageHeading from '#lib/components/admin-kit/PageHeading.svelte';
	import ProductForm from '#lib/features/products/components/ProductForm.svelte';
</script>

<svelte:head>
	<title>Tambah produk | Panel Admin Sinar Berkah</title>
</svelte:head>

<div class="space-y-6">
	<PageHeading title="Tambah produk" />
	<ProductForm />
</div>

<script lang="ts">
	import { CircleAlert, Package, Pencil, Plus, Trash2 } from '@lucide/svelte';
	import { refreshAll } from '$app/navigation';

	import { apiRequest } from '#lib/api/client.js';
	import type { Paginated } from '#lib/api/types.js';
	import DeleteDialog from '#lib/components/admin-kit/DeleteDialog.svelte';
	import PaginationNav from '#lib/components/admin-kit/PaginationNav.svelte';
	import Thumb from '#lib/components/admin-kit/Thumb.svelte';
	import { buttonVariants } from '#lib/components/ui/button.js';
	import Button from '#lib/components/ui/Button.svelte';
	import type { ProductDto } from '#lib/features/products/schemas.js';
	import { toast } from '#lib/stores/toast.svelte.js';
	import { formatRupiah } from '#lib/utils.js';

	interface Props {
		data: Paginated<ProductDto> | null;
		q: string;
		errorMessage?: string | null;
	}

	let { data, q, errorMessage = null }: Props = $props();

	let deleteTarget = $state<ProductDto | null>(null);
	let isDeleting = $state(false);

	async function handleDeleteConfirm(): Promise<void> {
		if (!deleteTarget || isDeleting) return;
		isDeleting = true;
		try {
			await apiRequest(`/api/admin/products/${deleteTarget._id}`, { method: 'DELETE' });
			toast.success('Produk dihapus.');
			deleteTarget = null;
			await refreshAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : 'Gagal menghapus produk.');
		} finally {
			isDeleting = false;
		}
	}
</script>

{#if errorMessage || !data}
	<div
		role="alert"
		class="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
	>
		<CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
		<div class="space-y-2">
			<p class="font-semibold">Data gagal dimuat</p>
			<p>{errorMessage ?? 'Gagal memuat produk.'}</p>
			<Button variant="outline" class="mt-2 h-11" onclick={() => void refreshAll()}
				>Coba lagi</Button
			>
		</div>
	</div>
{:else if data.items.length === 0}
	<div
		class="flex flex-col items-center justify-center rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center"
	>
		<div
			class="mb-3 flex size-10 items-center justify-center rounded-lg bg-muted text-muted-foreground"
		>
			<Package class="size-5" aria-hidden="true" />
		</div>
		<h2 class="text-base font-semibold text-foreground">
			{q ? 'Tidak ada hasil' : 'Belum ada produk'}
		</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			{q ? 'Coba kata kunci lain.' : 'Tambahkan produk pertama agar tampil di website.'}
		</p>
		{#if !q}
			<a
				href="/admin/products/new"
				class={buttonVariants({ size: 'lg', className: 'mt-4 h-11 px-4' })}
			>
				<Plus class="size-4" aria-hidden="true" />
				<span>Tambah produk</span>
			</a>
		{/if}
	</div>
{:else}
	<div>
		<div class="hidden overflow-hidden rounded-lg bg-card shadow-card md:block">
			<table class="w-full caption-bottom text-sm">
				<caption class="sr-only">Daftar produk</caption>
				<thead class="border-b border-border bg-muted/60">
					<tr>
						<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">Produk</th
						>
						<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">Harga</th>
						<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">Status</th
						>
						<th scope="col" class="h-10 px-4 text-right font-medium text-muted-foreground">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.items as product (product._id)}
						<tr class="transition-colors hover:bg-muted/30">
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									<Thumb src={product.image.thumb_url ?? product.image.image_url} />
									<div class="min-w-0">
										<p class="truncate font-semibold">{product.name}</p>
										<p class="truncate text-muted-foreground">
											{product.category || 'Tanpa kategori'}
										</p>
									</div>
								</div>
							</td>
							<td class="px-4 py-3 whitespace-nowrap">{formatRupiah(product.price)}</td>
							<td class="px-4 py-3">
								{#if product.isActive}
									<span
										class="inline-flex items-center rounded-md bg-success-soft px-2 py-0.5 text-xs font-medium text-success"
									>
										Tampil
									</span>
								{:else}
									<span
										class="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
									>
										Disembunyikan
									</span>
								{/if}
							</td>
							<td class="px-4 py-3">
								<div class="flex justify-end gap-1">
									<a
										href="/admin/products/{product._id}/edit"
										aria-label={`Ubah ${product.name}`}
										class={buttonVariants({ variant: 'ghost', size: 'lg', className: 'h-11 px-3' })}
									>
										<Pencil class="size-4" aria-hidden="true" />
										<span class="hidden sm:inline">Ubah</span>
									</a>
									<button
										type="button"
										onclick={() => (deleteTarget = product)}
										aria-label={`Hapus ${product.name}`}
										class={buttonVariants({
											variant: 'ghost',
											size: 'lg',
											className:
												'h-11 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive'
										})}
									>
										<Trash2 class="size-4" aria-hidden="true" />
										<span class="hidden sm:inline">Hapus</span>
									</button>
								</div>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>

		<ul class="space-y-3 md:hidden">
			{#each data.items as product (product._id)}
				<li class="rounded-lg bg-card p-4 shadow-card">
					<div class="flex gap-3">
						<Thumb src={product.image.thumb_url ?? product.image.image_url} />
						<div class="min-w-0 flex-1">
							<p class="font-semibold">{product.name}</p>
							<p class="text-sm text-muted-foreground">
								{product.category || 'Tanpa kategori'}
							</p>
							<p class="mt-1 text-sm">{formatRupiah(product.price)}</p>
						</div>
						<div class="shrink-0">
							{#if product.isActive}
								<span
									class="inline-flex items-center rounded-md bg-success-soft px-2 py-0.5 text-xs font-medium text-success"
								>
									Tampil
								</span>
							{:else}
								<span
									class="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
								>
									Disembunyikan
								</span>
							{/if}
						</div>
					</div>
					<div class="mt-3 flex justify-end gap-1 border-t border-border pt-3">
						<a
							href="/admin/products/{product._id}/edit"
							aria-label={`Ubah ${product.name}`}
							class={buttonVariants({ variant: 'ghost', size: 'lg', className: 'h-11 px-3' })}
						>
							<Pencil class="size-4" aria-hidden="true" />
							<span>Ubah</span>
						</a>
						<button
							type="button"
							onclick={() => (deleteTarget = product)}
							aria-label={`Hapus ${product.name}`}
							class={buttonVariants({
								variant: 'ghost',
								size: 'lg',
								className:
									'h-11 px-3 text-destructive hover:bg-destructive/10 hover:text-destructive'
							})}
						>
							<Trash2 class="size-4" aria-hidden="true" />
							<span>Hapus</span>
						</button>
					</div>
				</li>
			{/each}
		</ul>

		<PaginationNav pagination={data.pagination} basePath="/admin/products" {q} />
	</div>

	<DeleteDialog
		open={deleteTarget !== null}
		title={`Hapus "${deleteTarget?.name ?? ''}"?`}
		description="Produk ini akan dihapus permanen beserta foto terkait jika tidak digunakan item lain."
		{isDeleting}
		onOpenChange={(open) => {
			if (!open) deleteTarget = null;
		}}
		onConfirm={handleDeleteConfirm}
	/>
{/if}

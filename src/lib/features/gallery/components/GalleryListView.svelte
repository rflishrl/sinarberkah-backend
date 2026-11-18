<script lang="ts">
	import { CircleAlert, Images, Pencil, Plus, Trash2 } from '@lucide/svelte';
	import { refreshAll } from '$app/navigation';

	import { apiRequest } from '#lib/api/client.js';
	import type { Paginated } from '#lib/api/types.js';
	import DeleteDialog from '#lib/components/admin-kit/DeleteDialog.svelte';
	import PaginationNav from '#lib/components/admin-kit/PaginationNav.svelte';
	import Thumb from '#lib/components/admin-kit/Thumb.svelte';
	import { buttonVariants } from '#lib/components/ui/button.js';
	import Button from '#lib/components/ui/Button.svelte';
	import { GALLERY_CONFIG, type GalleryKind } from '#lib/features/gallery/config.js';
	import type { GalleryItemDto } from '#lib/features/gallery/schemas.js';
	import { toast } from '#lib/stores/toast.svelte.js';
	import { formatDate } from '#lib/utils.js';

	interface Props {
		kind: GalleryKind;
		data: Paginated<GalleryItemDto> | null;
		q: string;
		errorMessage?: string | null;
	}

	let { kind, data, q, errorMessage = null }: Props = $props();

	let config = $derived(GALLERY_CONFIG[kind]);
	let deleteTarget = $state<GalleryItemDto | null>(null);
	let isDeleting = $state(false);

	function editHref(id: string): string {
		return kind === 'portfolio' ? `/admin/portfolio/${id}/edit` : `/admin/patterns/${id}/edit`;
	}

	function newHref(): string {
		return kind === 'portfolio' ? '/admin/portfolio/new' : '/admin/patterns/new';
	}

	async function handleDeleteConfirm(): Promise<void> {
		if (!deleteTarget || isDeleting) return;
		isDeleting = true;
		try {
			await apiRequest(`${config.adminApi}/${deleteTarget._id}`, { method: 'DELETE' });
			toast.success(`${config.singular} dihapus.`);
			deleteTarget = null;
			await refreshAll();
		} catch (err) {
			toast.error(err instanceof Error ? err.message : `Gagal menghapus ${config.singular}.`);
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
			<p>{errorMessage ?? 'Gagal memuat data.'}</p>
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
			<Images class="size-5" aria-hidden="true" />
		</div>
		<h2 class="text-base font-semibold text-foreground">
			{q ? 'Tidak ada hasil' : `Belum ada ${config.singular}`}
		</h2>
		<p class="mt-1 text-sm text-muted-foreground">
			{q ? 'Coba kata kunci lain.' : `Tambahkan ${config.singular} pertama agar tampil di website.`}
		</p>
		{#if !q}
			<a href={newHref()} class={buttonVariants({ size: 'lg', className: 'mt-4 h-11 px-4' })}>
				<Plus class="size-4" aria-hidden="true" />
				<span>Tambah {config.singular}</span>
			</a>
		{/if}
	</div>
{:else}
	<div>
		<div class="hidden overflow-hidden rounded-lg bg-card shadow-card md:block">
			<table class="w-full caption-bottom text-sm">
				<caption class="sr-only">Daftar {config.title.toLowerCase()}</caption>
				<thead class="border-b border-border bg-muted/60">
					<tr>
						<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">Judul</th>
						<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">Jenis</th>
						<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground"
							>Ditambahkan</th
						>
						<th scope="col" class="h-10 px-4 text-right font-medium text-muted-foreground">Aksi</th>
					</tr>
				</thead>
				<tbody class="divide-y divide-border">
					{#each data.items as item (item._id)}
						<tr class="transition-colors hover:bg-muted/30">
							<td class="px-4 py-3">
								<div class="flex items-center gap-3">
									<Thumb src={item.image.thumb_url ?? item.image.image_url} />
									<p class="min-w-0 truncate font-semibold">{item.title}</p>
								</div>
							</td>
							<td class="px-4 py-3">
								<span
									class="inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
								>
									{item.type}
								</span>
							</td>
							<td class="px-4 py-3 whitespace-nowrap text-muted-foreground">
								{formatDate(item.createdAt)}
							</td>
							<td class="px-4 py-3">
								<div class="flex justify-end gap-1">
									<a
										href={editHref(item._id)}
										aria-label={`Ubah ${item.title}`}
										class={buttonVariants({ variant: 'ghost', size: 'lg', className: 'h-11 px-3' })}
									>
										<Pencil class="size-4" aria-hidden="true" />
										<span class="hidden sm:inline">Ubah</span>
									</a>
									<button
										type="button"
										onclick={() => (deleteTarget = item)}
										aria-label={`Hapus ${item.title}`}
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
			{#each data.items as item (item._id)}
				<li class="rounded-lg bg-card p-4 shadow-card">
					<div class="flex gap-3">
						<Thumb src={item.image.thumb_url ?? item.image.image_url} />
						<div class="min-w-0 flex-1">
							<p class="font-semibold">{item.title}</p>
							<span
								class="mt-1 inline-flex items-center rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground"
							>
								{item.type}
							</span>
							<p class="mt-1 text-sm text-muted-foreground">{formatDate(item.createdAt)}</p>
						</div>
					</div>
					<div class="mt-3 flex justify-end gap-1 border-t border-border pt-3">
						<a
							href={editHref(item._id)}
							aria-label={`Ubah ${item.title}`}
							class={buttonVariants({ variant: 'ghost', size: 'lg', className: 'h-11 px-3' })}
						>
							<Pencil class="size-4" aria-hidden="true" />
							<span>Ubah</span>
						</a>
						<button
							type="button"
							onclick={() => (deleteTarget = item)}
							aria-label={`Hapus ${item.title}`}
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

		<PaginationNav pagination={data.pagination} basePath={config.adminPath} {q} />
	</div>

	<DeleteDialog
		open={deleteTarget !== null}
		title={`Hapus "${deleteTarget?.title ?? ''}"?`}
		description="Item ini akan dihapus permanen beserta foto terkait jika tidak digunakan item lain."
		{isDeleting}
		onOpenChange={(open) => {
			if (!open) deleteTarget = null;
		}}
		onConfirm={handleDeleteConfirm}
	/>
{/if}

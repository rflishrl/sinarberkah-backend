<script lang="ts">
	import { CircleAlert } from '@lucide/svelte';
	import { tick, untrack } from 'svelte';
	import { goto, refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';

	import { apiRequest } from '#lib/api/client.js';
	import ImageField from '#lib/components/admin-kit/ImageField.svelte';
	import { buttonVariants } from '#lib/components/ui/button.js';
	import Button from '#lib/components/ui/Button.svelte';
	import { GALLERY_CONFIG, type GalleryKind } from '#lib/features/gallery/config.js';
	import { galleryCreateSchema, type GalleryItemDto } from '#lib/features/gallery/schemas.js';
	import { toast } from '#lib/stores/toast.svelte.js';

	interface Props {
		kind: GalleryKind;
		item?: GalleryItemDto;
	}

	let { kind, item }: Props = $props();

	let config = $derived(GALLERY_CONFIG[kind]);

	const initial = untrack(() => item);
	let title = $state(initial?.title ?? '');
	let type = $state(initial?.type ?? '');
	let description = $state(initial?.description ?? '');
	let imageUrl = $state(initial?.image.image_url ?? '');

	let busy = $state(false);
	let serverError = $state<string | null>(null);
	let fieldErrors = $state<{
		title?: string;
		type?: string;
		description?: string;
		image_url?: string;
	}>({});
	let alertEl = $state<HTMLDivElement | null>(null);

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (busy) return;

		fieldErrors = {};
		serverError = null;

		const parsed = galleryCreateSchema.safeParse({
			title,
			type,
			description,
			image_url: imageUrl
		});

		if (!parsed.success) {
			const nextErrors: typeof fieldErrors = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0];
				if (field === 'title' && !nextErrors.title) nextErrors.title = issue.message;
				if (field === 'type' && !nextErrors.type) nextErrors.type = issue.message;
				if (field === 'description' && !nextErrors.description)
					nextErrors.description = issue.message;
				if (field === 'image_url' && !nextErrors.image_url) nextErrors.image_url = issue.message;
			}
			fieldErrors = nextErrors;
			return;
		}

		busy = true;
		try {
			if (item) {
				await apiRequest<GalleryItemDto>(`${config.adminApi}/${item._id}`, {
					method: 'PATCH',
					json: parsed.data
				});
				toast.success('Perubahan disimpan.');
			} else {
				await apiRequest<GalleryItemDto>(config.adminApi, {
					method: 'POST',
					json: parsed.data
				});
				toast.success(`${config.singular} ditambahkan.`);
			}
			await refreshAll();
			await goto(resolve(config.adminPath as '/admin/portfolio' | '/admin/patterns'));
		} catch (err) {
			serverError = err instanceof Error ? err.message : `Gagal menyimpan ${config.singular}.`;
			busy = false;
			await tick();
			alertEl?.focus();
		}
	}
</script>

<form novalidate onsubmit={handleSubmit} class="space-y-6">
	{#if serverError}
		<div
			bind:this={alertEl}
			role="alert"
			tabindex="-1"
			class="flex items-start gap-2.5 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive focus:outline-none"
		>
			<CircleAlert class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
			<p>{serverError}</p>
		</div>
	{/if}

	<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)]">
		<div class="space-y-5 rounded-lg bg-card p-5 shadow-card sm:p-6">
			<div class="space-y-1.5">
				<label for="gallery-title" class="text-sm font-medium text-foreground">
					Judul <span aria-hidden="true" class="text-destructive">*</span>
				</label>
				<input
					id="gallery-title"
					type="text"
					bind:value={title}
					maxlength={120}
					autocomplete="off"
					required
					aria-invalid={Boolean(fieldErrors.title)}
					aria-describedby={fieldErrors.title
						? 'gallery-title-hint gallery-title-error'
						: 'gallery-title-hint'}
					class="flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive"
				/>
				<p id="gallery-title-hint" class="text-xs text-muted-foreground">{config.titleHint}</p>
				{#if fieldErrors.title}
					<p id="gallery-title-error" class="text-xs font-medium text-destructive">
						{fieldErrors.title}
					</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="gallery-type" class="text-sm font-medium text-foreground">
					{config.typeLabel} <span aria-hidden="true" class="text-destructive">*</span>
				</label>
				<input
					id="gallery-type"
					type="text"
					bind:value={type}
					maxlength={60}
					autocomplete="off"
					required
					aria-invalid={Boolean(fieldErrors.type)}
					aria-describedby={fieldErrors.type
						? 'gallery-type-hint gallery-type-error'
						: 'gallery-type-hint'}
					class="flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive"
				/>
				<p id="gallery-type-hint" class="text-xs text-muted-foreground">{config.typeHint}</p>
				{#if fieldErrors.type}
					<p id="gallery-type-error" class="text-xs font-medium text-destructive">
						{fieldErrors.type}
					</p>
				{/if}
			</div>

			<div class="space-y-1.5">
				<label for="gallery-description" class="text-sm font-medium text-foreground">
					Deskripsi
				</label>
				<textarea
					id="gallery-description"
					bind:value={description}
					rows={5}
					maxlength={1000}
					aria-invalid={Boolean(fieldErrors.description)}
					aria-describedby={fieldErrors.description ? 'gallery-description-error' : undefined}
					class="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive"
				></textarea>
				{#if fieldErrors.description}
					<p id="gallery-description-error" class="text-xs font-medium text-destructive">
						{fieldErrors.description}
					</p>
				{/if}
			</div>
		</div>

		<div class="rounded-lg bg-card p-5 shadow-card sm:p-6">
			<ImageField
				value={imageUrl}
				onChange={(url) => {
					imageUrl = url;
					if (fieldErrors.image_url) fieldErrors = { ...fieldErrors, image_url: undefined };
				}}
				folder={config.uploadFolder}
				required
				error={fieldErrors.image_url}
			/>
		</div>
	</div>

	<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
		<a
			href={config.adminPath}
			class={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-11 px-4' })}
		>
			Batal
		</a>
		<Button type="submit" size="lg" class="h-11 px-4" disabled={busy}>
			{busy ? 'Menyimpan...' : item ? 'Simpan perubahan' : `Tambah ${config.singular}`}
		</Button>
	</div>
</form>

<script lang="ts">
	import { CircleAlert } from '@lucide/svelte';
	import { tick, untrack } from 'svelte';
	import { goto, refreshAll } from '$app/navigation';
	import { resolve } from '$app/paths';

	import { apiRequest } from '#lib/api/client.js';
	import ImageField from '#lib/components/admin-kit/ImageField.svelte';
	import { buttonVariants } from '#lib/components/ui/button.js';
	import Button from '#lib/components/ui/Button.svelte';
	import { PRODUCTS_ADMIN_PATH } from '#lib/features/products/config.js';
	import { productCreateSchema, type ProductDto } from '#lib/features/products/schemas.js';
	import { toast } from '#lib/stores/toast.svelte.js';
	import { formatRupiah } from '#lib/utils.js';

	interface Props {
		product?: ProductDto;
	}

	let { product }: Props = $props();

	const initial = untrack(() => product);
	let name = $state(initial?.name ?? '');
	let category = $state(initial?.category ?? '');
	let description = $state(initial?.description ?? '');
	let priceText = $state(initial ? String(initial.price) : '');
	let imageUrl = $state(initial?.image.image_url ?? '');
	let isActive = $state(initial?.isActive ?? true);

	let busy = $state(false);
	let serverError = $state<string | null>(null);
	let fieldErrors = $state<{
		name?: string;
		category?: string;
		description?: string;
		price?: string;
		image_url?: string;
	}>({});
	let alertEl = $state<HTMLDivElement | null>(null);

	let numericPreview = $derived(
		priceText.trim() !== '' && Number.isFinite(Number(priceText))
			? formatRupiah(Number(priceText))
			: null
	);

	async function handleSubmit(event: SubmitEvent): Promise<void> {
		event.preventDefault();
		if (busy) return;

		fieldErrors = {};
		serverError = null;

		const parsed = productCreateSchema.safeParse({
			name,
			category,
			description,
			price: priceText === '' ? undefined : Number(priceText),
			image_url: imageUrl,
			isActive
		});

		if (!parsed.success) {
			const nextErrors: typeof fieldErrors = {};
			for (const issue of parsed.error.issues) {
				const field = issue.path[0];
				if (field === 'name' && !nextErrors.name) nextErrors.name = issue.message;
				if (field === 'category' && !nextErrors.category) nextErrors.category = issue.message;
				if (field === 'description' && !nextErrors.description)
					nextErrors.description = issue.message;
				if (field === 'price' && !nextErrors.price) nextErrors.price = issue.message;
				if (field === 'image_url' && !nextErrors.image_url) nextErrors.image_url = issue.message;
			}
			fieldErrors = nextErrors;
			return;
		}

		busy = true;
		try {
			if (product) {
				await apiRequest<ProductDto>(`/api/admin/products/${product._id}`, {
					method: 'PATCH',
					json: parsed.data
				});
				toast.success('Perubahan disimpan.');
			} else {
				await apiRequest<ProductDto>('/api/admin/products', {
					method: 'POST',
					json: parsed.data
				});
				toast.success('Produk ditambahkan.');
			}
			await refreshAll();
			await goto(resolve(PRODUCTS_ADMIN_PATH));
		} catch (err) {
			serverError = err instanceof Error ? err.message : 'Gagal menyimpan produk.';
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
				<label for="product-name" class="text-sm font-medium text-foreground">
					Nama produk <span aria-hidden="true" class="text-destructive">*</span>
				</label>
				<input
					id="product-name"
					type="text"
					bind:value={name}
					maxlength={120}
					autocomplete="off"
					required
					aria-invalid={Boolean(fieldErrors.name)}
					aria-describedby={fieldErrors.name ? 'product-name-error' : undefined}
					class="flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive"
				/>
				{#if fieldErrors.name}
					<p id="product-name-error" class="text-xs font-medium text-destructive">
						{fieldErrors.name}
					</p>
				{/if}
			</div>

			<div class="grid gap-5 sm:grid-cols-2">
				<div class="space-y-1.5">
					<label for="product-price" class="text-sm font-medium text-foreground">
						Harga (Rp) <span aria-hidden="true" class="text-destructive">*</span>
					</label>
					<input
						id="product-price"
						type="text"
						inputmode="numeric"
						pattern="[0-9]*"
						value={priceText}
						oninput={(e) => {
							priceText = (e.currentTarget as HTMLInputElement).value.replace(/\D/g, '');
						}}
						required
						aria-invalid={Boolean(fieldErrors.price)}
						aria-describedby={fieldErrors.price
							? 'product-price-hint product-price-error'
							: 'product-price-hint'}
						placeholder="Contoh: 150000"
						class="flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive"
					/>
					<p id="product-price-hint" class="text-xs text-muted-foreground">
						{numericPreview
							? `Pratinjau: ${numericPreview}`
							: 'Masukkan angka tanpa tanda titik atau koma.'}
					</p>
					{#if fieldErrors.price}
						<p id="product-price-error" class="text-xs font-medium text-destructive">
							{fieldErrors.price}
						</p>
					{/if}
				</div>

				<div class="space-y-1.5">
					<label for="product-category" class="text-sm font-medium text-foreground">
						Kategori
					</label>
					<input
						id="product-category"
						type="text"
						bind:value={category}
						maxlength={60}
						aria-invalid={Boolean(fieldErrors.category)}
						aria-describedby={fieldErrors.category
							? 'product-category-hint product-category-error'
							: 'product-category-hint'}
						class="flex h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive"
					/>
					<p id="product-category-hint" class="text-xs text-muted-foreground">
						Contoh: Pagar, Sketsel.
					</p>
					{#if fieldErrors.category}
						<p id="product-category-error" class="text-xs font-medium text-destructive">
							{fieldErrors.category}
						</p>
					{/if}
				</div>
			</div>

			<div class="space-y-1.5">
				<label for="product-description" class="text-sm font-medium text-foreground">
					Deskripsi
				</label>
				<textarea
					id="product-description"
					bind:value={description}
					rows={5}
					maxlength={2000}
					aria-invalid={Boolean(fieldErrors.description)}
					aria-describedby={fieldErrors.description ? 'product-description-error' : undefined}
					class="flex w-full rounded-md border border-input bg-card px-3 py-2 text-sm shadow-xs transition-colors focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 focus-visible:outline-none aria-invalid:border-destructive"
				></textarea>
				{#if fieldErrors.description}
					<p id="product-description-error" class="text-xs font-medium text-destructive">
						{fieldErrors.description}
					</p>
				{/if}
			</div>

			<div class="flex min-h-11 items-start gap-3 pt-1">
				<input
					id="product-active"
					type="checkbox"
					bind:checked={isActive}
					aria-describedby="product-active-hint"
					class="mt-0.5 size-5 shrink-0 rounded border-input accent-primary focus-visible:ring-2 focus-visible:ring-ring"
				/>
				<div class="space-y-0.5">
					<label for="product-active" class="text-sm font-medium text-foreground">
						Tampilkan di website
					</label>
					<p id="product-active-hint" class="text-xs text-muted-foreground">
						Produk yang tidak ditampilkan tidak muncul di API publik.
					</p>
				</div>
			</div>
		</div>

		<div class="rounded-lg bg-card p-5 shadow-card sm:p-6">
			<ImageField
				value={imageUrl}
				onChange={(url) => {
					imageUrl = url;
					if (fieldErrors.image_url) fieldErrors = { ...fieldErrors, image_url: undefined };
				}}
				folder="products"
				error={fieldErrors.image_url}
			/>
		</div>
	</div>

	<div class="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
		<a
			href={PRODUCTS_ADMIN_PATH}
			class={buttonVariants({ variant: 'outline', size: 'lg', className: 'h-11 px-4' })}
		>
			Batal
		</a>
		<Button type="submit" size="lg" class="h-11 px-4" disabled={busy}>
			{busy ? 'Menyimpan...' : product ? 'Simpan perubahan' : 'Tambah produk'}
		</Button>
	</div>
</form>

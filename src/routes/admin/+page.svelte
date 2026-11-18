<script lang="ts">
	import { AlertTriangle, ArrowUpRight, Grid3x3, Images, Package, Plus } from '@lucide/svelte';
	import type { PageData } from './$types';

	import PageHeading from '#lib/components/admin-kit/PageHeading.svelte';
	import { buttonVariants } from '#lib/components/ui/button.js';
	import { cn } from '#lib/utils.js';

	let { data }: { data: PageData } = $props();

	const ENDPOINTS = [
		{ method: 'GET', path: '/api/products/v1', note: 'Daftar produk aktif', access: 'Publik' },
		{
			method: 'GET',
			path: '/api/gallery/v1/portfolio',
			note: 'Daftar portofolio',
			access: 'Publik'
		},
		{ method: 'GET', path: '/api/gallery/v1', note: 'Daftar galeri pola', access: 'Publik' },
		{
			method: 'GET / POST',
			path: '/api/admin/products',
			note: 'Daftar dan tambah produk',
			access: 'Admin'
		},
		{
			method: 'GET / POST',
			path: '/api/admin/portfolio',
			note: 'Daftar dan tambah portofolio',
			access: 'Admin'
		},
		{
			method: 'GET / POST',
			path: '/api/admin/patterns',
			note: 'Daftar dan tambah pola',
			access: 'Admin'
		},
		{
			method: 'PATCH / DELETE',
			path: '/api/admin/.../{id}',
			note: 'Ubah atau hapus data',
			access: 'Admin'
		},
		{ method: 'POST', path: '/api/upload', note: 'Unggah foto', access: 'Admin' }
	] as const;

	let statCards = $derived([
		{
			label: 'Katalog Produk',
			value: data.counts.products,
			href: '/admin/products',
			category: 'Katalog',
			icon: Package
		},
		{
			label: 'Proyek Portofolio',
			value: data.counts.portfolio,
			href: '/admin/portfolio',
			category: 'Galeri',
			icon: Images
		},
		{
			label: 'Galeri Pola Cetak',
			value: data.counts.patterns,
			href: '/admin/patterns',
			category: 'Motif & Desain',
			icon: Grid3x3
		}
	]);
</script>

<svelte:head>
	<title>Dashboard | Panel Admin Sinar Berkah</title>
</svelte:head>

<div class="space-y-8">
	<div class="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
		<PageHeading
			title="Dashboard"
			description="Ringkasan konten dan konfigurasi operasional website Sinar Berkah."
		/>
		<div class="flex items-center gap-2">
			<a
				href="/admin/products/new"
				class={buttonVariants({ variant: 'outline', size: 'sm', className: 'h-9 gap-1.5' })}
			>
				<Plus class="size-4" aria-hidden="true" />
				<span>Produk Baru</span>
			</a>
		</div>
	</div>

	{#if !data.storageReady}
		<div
			role="alert"
			class="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive"
		>
			<AlertTriangle class="mt-0.5 size-4 shrink-0" aria-hidden="true" />
			<div>
				<p class="font-semibold">Perhatian Penyimpanan Foto</p>
				<p class="mt-0.5">
					Penyimpanan media Cloudflare R2 belum dikonfigurasi lengkap. Lengkapi variabel
					<code>R2_*</code> di server agar unggah foto berfungsi.
				</p>
			</div>
		</div>
	{/if}

	<section aria-labelledby="stats-heading">
		<h2 id="stats-heading" class="sr-only">Jumlah Data Konten</h2>
		<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
			{#each statCards as card (card.href)}
				{@const Icon = card.icon}
				<a
					href={card.href}
					class="group block rounded-xl focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
				>
					<div
						class="h-full rounded-xl border border-border/80 bg-card/60 p-6 backdrop-blur-xs transition-all duration-200 hover:-translate-y-0.5 hover:border-brand/40 hover:shadow-md dark:bg-card/40"
					>
						<div class="flex flex-row items-center justify-between pb-2">
							<div
								class="flex size-9 items-center justify-center rounded-lg border border-border/60 bg-muted/50 text-muted-foreground group-hover:border-brand/40 group-hover:bg-brand/10 group-hover:text-brand-strong dark:group-hover:text-brand"
							>
								<Icon class="size-4.5" aria-hidden="true" />
							</div>
							<span
								class="inline-flex items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium text-muted-foreground"
							>
								{card.category}
							</span>
						</div>
						<div class="pt-3">
							<div class="flex items-baseline justify-between">
								<div>
									<div class="text-3xl font-extrabold tracking-tight text-foreground tabular-nums">
										{card.value}
									</div>
									<p
										class="mt-1 text-sm font-medium text-muted-foreground transition-colors group-hover:text-foreground"
									>
										{card.label}
									</p>
								</div>
								<ArrowUpRight
									class="size-4 text-muted-foreground/60 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-brand-strong dark:group-hover:text-brand"
									aria-hidden="true"
								/>
							</div>
						</div>
					</div>
				</a>
			{/each}
		</div>
	</section>

	<section aria-labelledby="quick-actions-heading">
		<div class="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
			<h2 id="quick-actions-heading" class="text-base font-semibold">Aksi Cepat</h2>
			<p class="mt-1 text-sm text-muted-foreground">
				Pintasan cepat untuk menambahkan item baru ke katalog dan galeri situs.
			</p>
			<div class="mt-5 grid gap-3 sm:grid-cols-3">
				<a
					href="/admin/products/new"
					class={buttonVariants({
						className: 'h-11 w-full justify-start gap-2.5 px-4 font-medium'
					})}
				>
					<Plus class="size-4" aria-hidden="true" />
					<span>Tambah Produk</span>
				</a>
				<a
					href="/admin/portfolio/new"
					class={buttonVariants({
						variant: 'outline',
						className: 'h-11 w-full justify-start gap-2.5 px-4 font-medium'
					})}
				>
					<Plus class="size-4" aria-hidden="true" />
					<span>Tambah Portofolio</span>
				</a>
				<a
					href="/admin/patterns/new"
					class={buttonVariants({
						variant: 'outline',
						className: 'h-11 w-full justify-start gap-2.5 px-4 font-medium'
					})}
				>
					<Plus class="size-4" aria-hidden="true" />
					<span>Tambah Galeri Pola</span>
				</a>
			</div>
		</div>
	</section>

	<section aria-labelledby="api-heading">
		<div class="rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xs">
			<div class="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h2 id="api-heading" class="text-base font-semibold text-foreground">
						Daftar Alamat API
					</h2>
					<p class="mt-1 text-sm text-muted-foreground">
						Daftar endpoint publik dan internal admin untuk integrasi data.
					</p>
				</div>
				<span
					class="inline-flex w-fit items-center rounded-md border border-border px-2 py-0.5 text-xs font-medium"
				>
					{ENDPOINTS.length} Endpoints
				</span>
			</div>
			<div class="mt-5 overflow-x-auto rounded-lg border border-border">
				<table class="w-full caption-bottom text-sm">
					<caption class="sr-only">Daftar rute API Sinar Berkah</caption>
					<thead class="border-b border-border bg-muted/40">
						<tr>
							<th scope="col" class="h-10 w-32 px-4 text-left font-medium text-muted-foreground">
								Metode
							</th>
							<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">
								Rute Alamat
							</th>
							<th scope="col" class="h-10 px-4 text-left font-medium text-muted-foreground">
								Keterangan
							</th>
							<th scope="col" class="h-10 w-24 px-4 text-right font-medium text-muted-foreground">
								Akses
							</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-border">
						{#each ENDPOINTS as endpoint (`${endpoint.method}-${endpoint.path}`)}
							<tr class="transition-colors hover:bg-muted/30">
								<td class="px-4 py-3">
									<span
										class={cn(
											'inline-flex items-center rounded-md px-2 py-0.5 font-mono text-xs font-medium',
											endpoint.method === 'GET'
												? 'border border-border text-foreground'
												: endpoint.method.includes('POST')
													? 'bg-brand/15 text-brand-strong dark:bg-brand/20 dark:text-brand'
													: 'bg-secondary text-secondary-foreground'
										)}
									>
										{endpoint.method}
									</span>
								</td>
								<td class="px-4 py-3 font-mono text-xs font-semibold text-foreground">
									{endpoint.path}
								</td>
								<td class="px-4 py-3 text-sm text-muted-foreground">{endpoint.note}</td>
								<td class="px-4 py-3 text-right">
									<span
										class={cn(
											'inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium',
											endpoint.access === 'Publik'
												? 'bg-secondary text-secondary-foreground'
												: 'border border-border text-foreground'
										)}
									>
										{endpoint.access}
									</span>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	</section>
</div>

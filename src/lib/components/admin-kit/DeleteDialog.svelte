<script lang="ts">
	import { LoaderCircle } from '@lucide/svelte';

	import Button from '#lib/components/ui/Button.svelte';

	interface Props {
		open: boolean;
		title: string;
		description: string;
		isDeleting: boolean;
		onOpenChange: (open: boolean) => void;
		onConfirm: () => void | Promise<void>;
	}

	let { open, title, description, isDeleting, onOpenChange, onConfirm }: Props = $props();

	let dialogEl = $state<HTMLDialogElement | null>(null);

	$effect(() => {
		if (!dialogEl) return;
		if (open && !dialogEl.open) {
			dialogEl.showModal();
		} else if (!open && dialogEl.open) {
			dialogEl.close();
		}
	});

	function handleCancel(event: Event): void {
		if (isDeleting) {
			event.preventDefault();
			return;
		}
		onOpenChange(false);
	}

	function handleBackdropClick(event: MouseEvent): void {
		if (event.target === dialogEl && !isDeleting) {
			onOpenChange(false);
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	oncancel={handleCancel}
	onclick={handleBackdropClick}
	class="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-border bg-card p-6 text-card-foreground shadow-xl backdrop:bg-black/55 backdrop:backdrop-blur-[1px]"
>
	<div class="space-y-2">
		<h2 class="font-heading text-lg font-bold text-foreground">{title}</h2>
		<p class="text-sm text-muted-foreground">{description}</p>
	</div>
	<div class="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
		<Button variant="outline" disabled={isDeleting} onclick={() => onOpenChange(false)}>
			Batal
		</Button>
		<Button variant="destructive" disabled={isDeleting} onclick={onConfirm}>
			{#if isDeleting}
				<LoaderCircle class="size-4 animate-spin" aria-hidden="true" />
				<span>Menghapus...</span>
			{:else}
				<span>Ya, hapus</span>
			{/if}
		</Button>
	</div>
</dialog>

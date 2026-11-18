<script lang="ts">
	interface Props {
		title: string;
		description?: string;
	}

	let { title, description }: Props = $props();
</script>

<div>
	<h1 class="font-heading text-2xl font-extrabold tracking-tight text-foreground">{title}</h1>
	{#if description}
		<p class="mt-1 text-sm text-muted-foreground">{description}</p>
	{/if}
</div>

<script lang="ts">
	import type { Snippet } from 'svelte';
	import type { LayoutData } from './$types';

	import AdminShell from '#lib/components/admin-kit/AdminShell.svelte';

	let { data, children }: { data: LayoutData; children: Snippet } = $props();
</script>

<AdminShell email={data.admin.email} frontendUrl={data.frontendUrl}>
	{@render children()}
</AdminShell>

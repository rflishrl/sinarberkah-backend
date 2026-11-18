<script lang="ts">
	import type { UploadFolder } from '#lib/features/uploads/schemas.js';
	import ImageUploader from '#lib/features/uploads/components/ImageUploader.svelte';

	interface Props {
		value: string;
		onChange: (url: string) => void;
		onBlur?: () => void;
		folder: UploadFolder;
		required?: boolean;
		error?: string;
	}

	let props: Props = $props();
</script>

<ImageUploader {...props} />

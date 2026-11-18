export type ToastVariant = 'default' | 'success' | 'error';

export interface ToastItem {
	id: string;
	message: string;
	variant: ToastVariant;
}

class ToastStore {
	items = $state<ToastItem[]>([]);

	push(message: string, variant: ToastVariant = 'default', durationMs = 4500): void {
		const id = crypto.randomUUID();
		this.items = [...this.items, { id, message, variant }];
		if (durationMs > 0) {
			setTimeout(() => this.dismiss(id), durationMs);
		}
	}

	success(message: string): void {
		this.push(message, 'success');
	}

	error(message: string): void {
		this.push(message, 'error', 6000);
	}

	info(message: string): void {
		this.push(message, 'default');
	}

	dismiss(id: string): void {
		this.items = this.items.filter((item) => item.id !== id);
	}
}

export const toast = new ToastStore();

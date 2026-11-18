export type GalleryKind = 'portfolio' | 'pattern';

export interface GalleryKindConfig {
	title: string;
	description: string;
	singular: string;
	label: string;
	publicApi: string;
	adminApi: string;
	adminPath: string;
	uploadFolder: 'portfolio' | 'patterns';
	revalidateTags: string[];
	typeLabel: string;
	typeHint: string;
	titleHint: string;
}

export const GALLERY_CONFIG: Record<GalleryKind, GalleryKindConfig> = {
	portfolio: {
		title: 'Portofolio',
		description: 'Proyek yang pernah dikerjakan Sinar Berkah.',
		singular: 'proyek',
		label: 'Portofolio',
		publicApi: '/api/gallery/v1/portfolio',
		adminApi: '/api/admin/portfolio',
		adminPath: '/admin/portfolio',
		uploadFolder: 'portfolio',
		revalidateTags: ['portfolio'],
		typeLabel: 'Jenis proyek',
		typeHint: 'Contoh: Pagar, Railing, Kanopi, Sketsel.',
		titleHint: 'Contoh: Pagar balkon motif daun.'
	},
	pattern: {
		title: 'Galeri Pola',
		description: 'Koleksi motif cutting yang tampil di website.',
		singular: 'pola',
		label: 'Pola',
		publicApi: '/api/gallery/v1',
		adminApi: '/api/admin/patterns',
		adminPath: '/admin/patterns',
		uploadFolder: 'patterns',
		revalidateTags: ['gallery'],
		typeLabel: 'Kode atau jenis pola',
		typeHint: 'Contoh: LC 071, Geometris, Floral.',
		titleHint: 'Contoh: Pola LC 071 - LC 075.'
	}
};

export const ADMIN_PAGE_SIZE = 10;
export const PUBLIC_PAGE_SIZE = 50;

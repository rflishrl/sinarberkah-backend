export interface ImageDto {
  image_url: string;
}

export interface ProductDto {
  _id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  image: ImageDto;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryItemDto {
  _id: string;
  kind: "portfolio" | "pattern";
  title: string;
  type: string;
  description: string;
  image: ImageDto;
  createdAt: string;
  updatedAt: string;
}

export interface ApiErrorBody {
  error: {
    message: string;
    details?: { formErrors?: string[]; fieldErrors?: Record<string, string[]> };
  };
}

export interface CategoryImage {
  id: string;
  url: string;
  publicId: string;
}

export interface CategoryResponseDto {
  id: string;
  name: string;
  displayOrder: number;
  parentId: string | null;
  image: CategoryImage | null;
  children?: CategoryResponseDto[];
  createdAt: string;
  updatedAt: string;
}

export interface TempUploadResponse {
  tempId: string;
  tempUrl: string;
  expiresIn: number;
}

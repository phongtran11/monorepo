/**
 * Domain result after sign request from Cloudinary
 */
export interface UploadSignature {
  cloudName: string;
  signature: string;
  timestamp: number;
  apiKey: string;
  folder: string;
}

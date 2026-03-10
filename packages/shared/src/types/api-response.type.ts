export interface ResponseDto<T> {
  success: boolean;
  data: T;
  message: string;
  error: string;
}

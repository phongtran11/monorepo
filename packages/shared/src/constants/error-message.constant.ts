import { ERROR_CODES, ErrorCode } from './error-code.constant';

export const ErrorMessage: Record<ErrorCode, string> = {
  // Common
  [ERROR_CODES.VALIDATION_ERROR]: 'Input validation failed',
  [ERROR_CODES.INTERNAL_SERVER_ERROR]: 'Lỗi hệ thống',
  [ERROR_CODES.UNAUTHORIZED]: 'Chưa xác thực',
  [ERROR_CODES.FORBIDDEN]: 'Bạn không có quyền thực hiện hành động này',
  [ERROR_CODES.NOT_FOUND]: 'Không tìm thấy dữ liệu',

  // Auth / User
  [ERROR_CODES.EMAIL_ALREADY_EXISTS]: 'Email đã tồn tại',
  [ERROR_CODES.ACCOUNT_NOT_FOUND]: 'Tài khoản không tồn tại',
  [ERROR_CODES.ACCOUNT_LOCKED]: 'Tài khoản của bạn đã bị khoá',
  [ERROR_CODES.INVALID_CREDENTIALS]: 'Email hoặc mật khẩu không chính xác',
  [ERROR_CODES.SESSION_REVOKED]: 'Phiên đăng nhập đã bị thu hồi',
  [ERROR_CODES.SESSION_EXPIRED]: 'Phiên đăng nhập đã hết hạn',
  [ERROR_CODES.INVALID_TOKEN]: 'Token không hợp lệ',
  [ERROR_CODES.ACCOUNT_NOT_FOUND_OR_LOCKED]:
    'Tài khoản không tồn tại hoặc bị khoá',
  [ERROR_CODES.INVALID_REFRESH_TOKEN_FORMAT]:
    'Token làm mới không đúng định dạng',

  // Category
  [ERROR_CODES.CATEGORY_NOT_FOUND]: 'Danh mục không tồn tại',
  [ERROR_CODES.CATEGORY_SLUG_EXISTS]: 'Slug danh mục đã tồn tại',
  [ERROR_CODES.PARENT_CATEGORY_NOT_FOUND]: 'Danh mục cha không tồn tại',
  [ERROR_CODES.CATEGORY_HAS_PRODUCTS]:
    'Không thể xóa danh mục đang có sản phẩm',
  [ERROR_CODES.CANNOT_MAKE_CATEGORY_ITS_OWN_PARENT]:
    'Một danh mục không thể làm cha của chính nó',
  [ERROR_CODES.CANNOT_SET_CHILD_AS_PARENT]:
    'Không thể đặt danh mục cha là một trong những danh mục con của nó',
  [ERROR_CODES.CATEGORY_HAS_CHILDREN]:
    'Không thể xóa danh mục đang có danh mục con',

  // Image / File
  [ERROR_CODES.IMAGE_NOT_FOUND]: 'Ảnh không tồn tại',
  [ERROR_CODES.UNAUTHORIZED_IMAGE_ACCESS]: 'Bạn không có quyền sử dụng ảnh này',
  [ERROR_CODES.INVALID_IMAGE_FILE]:
    'Tệp tải lên không hợp lệ hoặc không phải là hình ảnh',
  [ERROR_CODES.IMAGE_SIZE_EXCEEDS_LIMIT]:
    'Kích thước ảnh vượt quá giới hạn cho phép',

  // Product
  [ERROR_CODES.PRODUCT_NOT_FOUND]: 'Sản phẩm không tồn tại',
  [ERROR_CODES.PRODUCT_SLUG_EXISTS]: 'Slug sản phẩm đã tồn tại',
  [ERROR_CODES.PRODUCT_SKU_EXISTS]: 'SKU sản phẩm đã tồn tại',
};

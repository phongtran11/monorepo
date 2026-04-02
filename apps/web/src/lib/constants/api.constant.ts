/** Base URL for the backend API server. */
export const BASE_API_URL = process.env.BASE_API_URL || 'http://localhost:3000';

/** API v1 path suffix. */
export const SUFFIX_API_URL_V1 = process.env.SUFFIX_API_URL_V1 || '/api/v1';

/** Fully resolved API v1 URL (base + suffix). */
export const FULL_API_URL_V1 = `${BASE_API_URL}${SUFFIX_API_URL_V1}`;

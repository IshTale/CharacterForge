/** Stay under Vercel's 4.5 MB serverless request body limit (multipart overhead included). */
export const VERCEL_SAFE_MAX_BYTES = 4 * 1024 * 1024;

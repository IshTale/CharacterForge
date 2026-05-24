export function getBearerHeaders() {
  const key = process.env.PERFECTCORP_V2_API_KEY;
  if (!key) {
    throw new Error("Missing PERFECTCORP_V2_API_KEY.");
  }
  return {
    Authorization: `Bearer ${key}`,
    "Content-Type": "application/json"
  };
}

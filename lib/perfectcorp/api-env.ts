export const PERFECTCORP_V2_BASE = "https://yce-api-01.makeupar.com";
export const PERFECTCORP_V1_BASE = "https://yce-api-01.perfectcorp.com";

export function getV2ApiKey() {
  return process.env.PERFECTCORP_V2_API_KEY?.trim() || null;
}

export function v2AuthHeaders() {
  const apiKey = getV2ApiKey();
  if (!apiKey) {
    return null;
  }
  return {
    Authorization: `Bearer ${apiKey}`,
    "Content-Type": "application/json"
  };
}

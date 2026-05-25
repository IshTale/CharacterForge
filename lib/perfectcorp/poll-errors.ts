export function extractPollErrorMessage(
  taskPath: string,
  pollData: { data?: Record<string, unknown> }
) {
  const data = pollData.data;
  if (!data) {
    return `Task ${taskPath} returned error status.`;
  }
  const parts: string[] = [];
  if (typeof data.error === "string") {
    parts.push(data.error);
  }
  if (typeof data.error_code === "string") {
    parts.push(`(${data.error_code})`);
  }
  if (parts.length) {
    return `Task ${taskPath} failed: ${parts.join(" ")}`;
  }
  return `Task ${taskPath} returned error status: ${JSON.stringify(data)}`;
}

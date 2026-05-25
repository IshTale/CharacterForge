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
  if (typeof data.error_message === "string") {
    parts.push(data.error_message);
  }
  if (parts.length) {
    if (taskPath.includes("nail-vto") && data.error === "error_no_face") {
      return [
        `Task ${taskPath} failed: ${parts.join(" ")}`,
        "For Nail VTO this usually means the API could not detect a valid hand/nail pose. Use a back-of-hand photo with one hand, visible unoccluded nails, and the hand filling about half the image."
      ].join(" ");
    }
    return `Task ${taskPath} failed: ${parts.join(" ")}`;
  }
  return `Task ${taskPath} returned error status: ${JSON.stringify(data)}`;
}

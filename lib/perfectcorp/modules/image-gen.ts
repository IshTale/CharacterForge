export interface GenerateItemInput {
  prompt: string;
  style_group_id?: string;
  style_id?: string;
}

export async function generateItems(items: GenerateItemInput[]) {
  return items.map((item, index) => ({
    item_id: `generated-${index + 1}`,
    prompt: item.prompt,
    result_url: null as string | null
  }));
}

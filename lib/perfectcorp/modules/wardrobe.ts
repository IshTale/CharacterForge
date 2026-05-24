import { randomUUID } from "node:crypto";

export async function applyClothes() {
  return { dst_id: `dst_clothes_${randomUUID()}` };
}

export async function chainClothes() {
  return { dst_id: `dst_chain_${randomUUID()}` };
}

export async function applyHat() {
  return { dst_id: `dst_hat_${randomUUID()}` };
}

export async function applyBag() {
  return { dst_id: `dst_bag_${randomUUID()}` };
}

export async function applyShoes() {
  return { dst_id: `dst_shoes_${randomUUID()}` };
}

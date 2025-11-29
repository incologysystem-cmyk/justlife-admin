"use client";

import type { AddonPayload } from "../(provider)/addons/AddAddonModal";

export type AddonDto = {
  _id: string;
  title: string;
  description?: string;
  summary?: string;
  included: string[];
  excluded: string[];
  safetyNotice?: string;
  learnMore: string;
  imageUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function fetchAddons(onlyActive = false): Promise<AddonDto[]> {
  const query = onlyActive ? "?onlyActive=true" : "";

  const res = await fetch(`/api/provider/addons${query}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
    cache: "no-store",
  });

  const json = await res.json();

  if (!res.ok || !json.ok) {
    console.error("Failed to fetch addons:", json);
    throw new Error(json.error || "Failed to fetch addons");
  }

  return json.items as AddonDto[];
}

export async function createAddon(payload: AddonPayload): Promise<AddonDto> {
  const res = await fetch(`/api/provider/addons`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: payload.title,
      description: payload.description,
      summary: payload.summary,
      included: payload.included,
      excluded: payload.excluded,
      safetyNotice: payload.safetyNotice,
      learnMore: payload.learnMore,
      imageBase64: payload.imageBase64, // 👈 S3 ke liye
    }),
  });

  const json = await res.json();

  if (!res.ok || !json.ok) {
    console.error("Failed to create addon:", json);
    throw new Error(json.error || "Failed to create addon");
  }

  return json.addon as AddonDto;
}

export async function deleteAddon(id: string): Promise<void> {
  const res = await fetch(`/api/provider/addons/${id}`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
    },
  });

  const json = await res.json();

  if (!res.ok || !json.ok) {
    console.error("Failed to delete addon:", json);
    throw new Error(json.error || "Failed to delete addon");
  }
}

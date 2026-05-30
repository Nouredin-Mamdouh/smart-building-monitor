export function buildRoomSvgId(name: string, floor: number) {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);

  return `floor-${floor}-${slug || "room"}`;
}

export function withNumericSuffix(base: string, suffix: number) {
  return `${base}-${suffix}`;
}

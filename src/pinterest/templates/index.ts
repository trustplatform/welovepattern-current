export { TEMPLATE_A } from "./templateA";
export { TEMPLATE_B } from "./templateB";
export { TEMPLATE_C } from "./templateC";

export type PinterestTemplateId = "template-a" | "template-b" | "template-c";

export interface TemplateMetadata {
  id: PinterestTemplateId;
  name: string;
  tagline: string;
  description: string;
  aspectRatio: string;
  width: number;
  height: number;
  badge: string;
  features: string[];
  filename: string;
}

export const PINTEREST_TEMPLATES: Record<PinterestTemplateId, TemplateMetadata> = {
  "template-a": {
    id: "template-a",
    name: "Template A",
    tagline: "Classic Editorial",
    description: "Vertical right-side hero photo, custom craft badge, auto-wrapping headline, difficulty pill, and 3 gallery thumbnails.",
    aspectRatio: "2:3",
    width: 1000,
    height: 1500,
    badge: "Active Master",
    features: [
      "Hero right panel (484×742)",
      "3 Gallery showcase slots (267×224)",
      "High-contrast title & subtitle",
      "Dynamic craft badge (Crochet/Sewing/etc.)"
    ],
    filename: "template-a.png",
  },
  "template-b": {
    id: "template-b",
    name: "Template B",
    tagline: "Pastel Dream",
    description: "Soft pink watercolor wash, top-left yarn badge & feature pills, cozy craft scene illustration, center hero image, and 3 gallery cards with feature tags.",
    aspectRatio: "2:3",
    width: 1000,
    height: 1500,
    badge: "Master B",
    features: [
      "Central hero showcase (650×550)",
      "3 Gallery slots with feature pills",
      "4 Pre-configured benefit pills",
      "Official WeLovePattern CTA footer"
    ],
    filename: "template-b.png",
  },
  "template-c": {
    id: "template-c",
    name: "Template C",
    tagline: "Botanical Clean",
    description: "Warm off-white background with delicate eucalyptus borders, prominent panoramic hero photo, 4 circular feature icons, and 3 bottom gallery cards.",
    aspectRatio: "2:3",
    width: 1000,
    height: 1500,
    badge: "Master C",
    features: [
      "Extra wide hero photo (840×560)",
      "4 Circular feature icon highlights",
      "3 Gallery showcase slots (276×220)",
      "Clean botanical framing"
    ],
    filename: "template-c.png",
  },
};

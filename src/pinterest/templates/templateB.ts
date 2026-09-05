export const TEMPLATE_B = {
  id: "template-b",
  name: "Template B (Pastel Dream)",
  width: 1000,
  height: 1500,

  // Central Hero Image
  mainImage: {
    x: 175,
    y: 420,
    width: 650,
    height: 550,
    radius: 24,
  },

  // 3 Bottom Gallery Slots (Gallery Images 2, 3, 4)
  gallery: [
    {
      x: 48,
      y: 1018,
      width: 276,
      height: 212,
      radius: 20,
    },
    {
      x: 362,
      y: 1018,
      width: 276,
      height: 212,
      radius: 20,
    },
    {
      x: 676,
      y: 1018,
      width: 276,
      height: 212,
      radius: 20,
    },
  ],

  // Bottom Detail Feature Badges under Gallery items
  galleryBadges: [
    { text: "PRACTICAL DESIGN", x: 74, y: 1244, width: 224, height: 32 },
    { text: "SPACIOUS & FUNCTIONAL", x: 382, y: 1244, width: 236, height: 32 },
    { text: "BEAUTIFUL DETAILS", x: 704, y: 1244, width: 220, height: 32 },
  ],

  // Top Left Features Badges (Untouched / Part of master template)
  featurePills: [
    { text: "Detailed PDF Pattern", x: 50, y: 160 },
    { text: "Step-by-Step Photo Guide", x: 50, y: 215 },
    { text: "Beginner Friendly", x: 50, y: 270 },
    { text: "Great Gift Idea", x: 50, y: 325 },
  ],
} as const;

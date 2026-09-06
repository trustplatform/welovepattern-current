export const TEMPLATE_C = {
  id: "template-c",
  name: "Template C",
  width: 1024,
  height: 1536,

  // =========================================
  // DYNAMIC TITLE
  // Kept inside the top title frame
  // =========================================
  title: {
    x: 270,
    y: 43,
    width: 485,
    height: 112,
  },

  // =========================================
  // DYNAMIC SUBTITLE
  // Kept inside the subtitle frame
  // =========================================
  subtitle: {
    x: 285,
    y: 181,
    width: 454,
    height: 58,
  },

  // =========================================
  // DYNAMIC MAIN IMAGE
  // Safe area between side features
  // =========================================
  mainImage: {
    x: 269,
    y: 268,
    width: 489,
    height: 650,
    radius: 26,
  },

  // =========================================
  // DYNAMIC GALLERY
  // Must stay above the fixed gallery labels
  // =========================================
  gallery: [
  {
    x: 27,
    y: 934,
    width: 317,
    height: 215,
    radius: 20,
  },
  {
    x: 354,
    y: 934,
    width: 317,
    height: 215,
    radius: 20,
  },
  {
    x: 680,
    y: 934,
    width: 317,
    height: 215,
    radius: 20,
  },
],
} as const;
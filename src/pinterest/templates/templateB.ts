export const TEMPLATE_B = {
  id: "template-b",
  name: "Template B (Master B)",
  width: 1024,
  height: 1536,

  // =========================================
  // DYNAMIC TITLE
  // Empty area in the master template
  // =========================================
  title: {
    x: 198,
    y: 40,
    width: 628,
    height: 130,
  },

  // =========================================
  // DYNAMIC SUBTITLE
  // Empty area below the title
  // =========================================
  subtitle: {
    x: 270,
    y: 182,
    width: 484,
    height: 58,
  },

  // =========================================
  // DYNAMIC MAIN IMAGE
  // Main grey placeholder
  // =========================================
  mainImage: {
    x: 108,
    y: 300,
    width: 808,
    height: 495,
    radius: 24,
  },

  // =========================================
  // DYNAMIC GALLERY
  // Three grey placeholders
  // =========================================
  gallery: [
    {
      x: 48,
      y: 1018,
      width: 282,
      height: 216,
      radius: 20,
    },
    {
      x: 371,
      y: 1018,
      width: 282,
      height: 216,
      radius: 20,
    },
    {
      x: 694,
      y: 1018,
      width: 282,
      height: 216,
      radius: 20,
    },
  ],

  // =========================================
  // EVERYTHING BELOW IS FIXED IN MASTER
  // =========================================

  // Fixed feature row:
  // Detailed PDF Pattern
  // Step-by-Step Photo Guide
  // Beginner Friendly
  // Great Gift Idea

  // Fixed CTA:
  // Get the FREE Pattern
  // and crochet your own pencil case !

} as const;

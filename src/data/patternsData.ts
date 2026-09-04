import { Pattern } from '../types';

export const PATTERNS_DATA: Pattern[] = [
  {
    id: 'p1',
    slug: 'cozy-granny-square-blanket',
    title: 'Cozy Sunburst Granny Square Blanket',
    subtitle: 'Classic vintage heirloom throw blanket with a modern pastel twist',
    description: 'A gorgeous, warm, and comforting throw blanket constructed from 35 vibrant sunburst granny squares with an elegant ribbed border. Perfect for beginners and experienced crocheters alike!',
    difficulty: 'Easy',
    category: 'blankets',
    image: 'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584992236310-6edddc08acff?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1606760227091-3dd850d97f1d?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.9,
    reviewCount: 142,
    downloadsCount: 3820,
    hookSize: '5.0 mm (H-8)',
    yarnWeight: 'Medium / Worsted (#4)',
    yarnBrand: 'Soft Velvet Craft Acrylic',
    yarnMetersNeeded: 1250,
    finishedSize: '50 inches x 60 inches (127 cm x 152 cm)',
    estimatedTimeHours: 18,
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-01-15',
    pdfSize: '2.4 MB',
    pdfPages: 6,
    pdfUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
    tags: ['granny square', 'blanket', 'throw', 'sunburst', 'afghan', 'pastel'],
    gauge: '1 Granny Square = 7 inches x 7 inches (17.5 cm x 17.5 cm)',
    materials: [
      '600g Cream / Off-White Worsted Yarn (Base & Border)',
      '200g Soft Pink Worsted Yarn (Center Flowers)',
      '200g Lavender Worsted Yarn (Inner Petals)',
      '200g Sage Green Worsted Yarn (Outer Ring)',
      '5.0mm Crochet Hook (US H-8)',
      'Tapestry Needle & Scissors',
      'Stitch Markers'
    ],
    abbreviationsUsed: ['mr (magic ring)', 'ch (chain)', 'sl st (slip stitch)', 'sc (single crochet)', 'hdc (half double crochet)', 'dc (double crochet)', 'puff st (puff stitch)', 'popcorn st'],
    steps: [
      {
        rowNumber: 'Round 1',
        instruction: 'Make a magic ring. Ch 3 (counts as 1st dc), work 15 dc into the magic ring. Join with a sl st to top of ch-3. Cinch ring tight. (16 dc total)',
        stitchCount: '16 dc',
        tip: 'Keep your center magic ring tail long so you can weave it in securely later!'
      },
      {
        rowNumber: 'Round 2',
        instruction: 'Attach Pink yarn. Ch 1, work 1 puff stitch into every dc space (Yarn over, pull up loop 3 times, yo pull through all loops, ch 1 to lock). (16 puff stitches total)',
        stitchCount: '16 puff stitches',
        tip: 'Maintain light tension when pulling up puff stitch loops.'
      },
      {
        rowNumber: 'Round 3',
        instruction: 'Attach Lavender yarn in any ch-1 space. Ch 2, work a 4-dc popcorn stitch in each space between puff stitches. Ch 2 after each popcorn. Join to first popcorn.',
        stitchCount: '16 popcorn stitches',
        tip: 'Push popcorn bobbles outward with your thumb for maximum texture.'
      },
      {
        rowNumber: 'Round 4',
        instruction: 'Attach Cream yarn in any ch-2 space. Ch 3, (2 dc, ch 2, 3 dc) in same space for 1st corner. *Work 3 hdc in next space, 3 sc in next space, 3 hdc in next space, (3 dc, ch 2, 3 dc) in corner space.* Repeat from * to * 3 times. Join with sl st.',
        stitchCount: '4 corners formed',
        tip: 'Check that your square corners form true 90-degree right angles.'
      },
      {
        rowNumber: 'Assembly',
        instruction: 'Crochet 35 squares in total (5 rows of 7 squares). Join squares together using the mattress stitch or single crochet join-as-you-go method.',
        stitchCount: '35 squares joined'
      },
      {
        rowNumber: 'Border',
        instruction: 'Attach Cream yarn at any corner. Work 3 rounds of double crochet around the entire blanket edge, placing (2 dc, ch 2, 2 dc) in each of the 4 blanket corners.',
        stitchCount: 'Completed border'
      }
    ],
    faq: [
      {
        question: 'Can I substitute with Light DK weight yarn?',
        answer: 'Yes! Using DK weight yarn with a 4.0mm hook will result in a slightly smaller blanket (approx 42" x 50"), ideal for a baby or lapghan throw.'
      },
      {
        question: 'Is this pattern suitable for absolute beginners?',
        answer: 'Yes! It features clear row-by-row steps and uses basic crochet stitches with common specialty texture stitches like puff and popcorn.'
      }
    ]
  },
  {
    id: 'p2',
    slug: 'cute-amigurumi-bear-plushie',
    title: 'Adorable Honey Bear Amigurumi',
    subtitle: 'Soft plush teddy bear with removable crochet sweater',
    description: 'An irresistibly cute crocheted teddy bear plushie that stands 8 inches tall. Comes with step-by-step assembly instructions, embroidered eyes, and a mini turtleneck sweater pattern!',
    difficulty: 'Intermediate',
    category: 'amigurumi',
    image: 'https://images.unsplash.com/photo-1566454825481-4e28f37f2d63?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1566454825481-4e28f37f2d63?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.95,
    reviewCount: 210,
    downloadsCount: 5410,
    hookSize: '3.5 mm (E-4)',
    yarnWeight: 'Light / DK (#3) or Chenille Plush',
    yarnBrand: 'Honey Plush Cotton Yarn',
    yarnMetersNeeded: 350,
    finishedSize: '8.5 inches tall sitting (21 cm)',
    estimatedTimeHours: 6,
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-02-01',
    pdfSize: '1.8 MB',
    pdfPages: 5,
    tags: ['amigurumi', 'bear', 'plushie', 'toy', 'stuffed animal', 'cute'],
    gauge: '20 sc and 22 rows = 4 inches (10 cm)',
    materials: [
      '100g Honey Brown Plush Yarn',
      '30g Cream Yarn (Snout & Ears)',
      '30g Mustard Yellow Yarn (Sweater)',
      '3.5mm Hook',
      '10mm Safety Eyes or Embroidery Floss',
      'Polyester Fiberfill Stuffing',
      'Stitch Marker'
    ],
    abbreviationsUsed: ['mr (magic ring)', 'sc (single crochet)', 'inc (increase)', 'dec (invisible decrease)', 'sl st'],
    steps: [
      {
        rowNumber: 'Head R1-R6',
        instruction: 'R1: 6 sc in MR (6). R2: inc in each st around (12). R3: [sc, inc] x 6 (18). R4: [2 sc, inc] x 6 (24). R5: [3 sc, inc] x 6 (30). R6: [4 sc, inc] x 6 (36).',
        stitchCount: '36 sts',
        tip: 'Use continuous spiral rounds without joining sl st.'
      },
      {
        rowNumber: 'Head R7-R14',
        instruction: 'Sc in each st around for 8 rounds (36). Insert 10mm safety eyes between R10 and R11, spaced 7 stitches apart.',
        stitchCount: '36 sts'
      },
      {
        rowNumber: 'Head R15-R19',
        instruction: 'R15: [4 sc, dec] x 6 (30). R16: [3 sc, dec] x 6 (24). Stuff head firmly. R17: [2 sc, dec] x 6 (18). R18: [sc, dec] x 6 (12). R19: dec x 6 (6). Fasten off & weave tail.',
        stitchCount: '6 sts',
        tip: 'Stuff firmly around cheek areas to give the bear a round cute face.'
      },
      {
        rowNumber: 'Body & Arms',
        instruction: 'Crochet body starting from MR (6) up to (30 sts), work 6 even rounds, then decrease down to (12 sts) for neck join. Work arms and legs separately in spiral rounds.',
        stitchCount: 'Body parts complete'
      }
    ],
    faq: [
      {
        question: 'What stuffing works best for amigurumi?',
        answer: 'High-loft 100% polyester fiberfill provides the best softness and retains shape after washing.'
      }
    ]
  },
  {
    id: 'p3',
    slug: 'boho-flower-bucket-hat',
    title: 'Boho Sunburst Floral Bucket Hat',
    subtitle: 'Trendy summer sun hat assembled with granny square flower motifs',
    description: 'Stay stylish and shaded with this gorgeous hand-crocheted bucket hat! Features 5 floral granny square panels attached to a sturdy structured brim and crown top.',
    difficulty: 'Easy',
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.88,
    reviewCount: 94,
    downloadsCount: 2940,
    hookSize: '4.5 mm (G-7)',
    yarnWeight: 'Medium / Worsted Cotton (#4)',
    yarnBrand: 'Natural Soft Cotton Blend',
    yarnMetersNeeded: 280,
    finishedSize: 'Fits head circumference 21 - 23 inches (53-58 cm)',
    estimatedTimeHours: 4,
    isFeatured: false,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-03-10',
    pdfSize: '1.6 MB',
    pdfPages: 4,
    tags: ['bucket hat', 'boho', 'summer', 'flowers', 'accessories', 'cotton'],
    gauge: '16 sc and 18 rows = 4 inches (10 cm)',
    materials: [
      '100g Natural Cream Cotton Yarn',
      '50g Terracotta / Rust Cotton Yarn',
      '50g Golden Yellow Cotton Yarn',
      '4.5mm Crochet Hook',
      'Tapestry Needle'
    ],
    abbreviationsUsed: ['ch', 'sc', 'hdc', 'dc', 'sl st', 'magic ring'],
    steps: [
      {
        rowNumber: 'Top Crown',
        instruction: 'Start with Magic Ring in Cream. R1: 8 hdc in MR (8). R2: 2 hdc in each st (16). R3: [1 hdc, inc] x 8 (24). R4: [2 hdc, inc] x 8 (32). Continue expanding until crown diameter equals 6.5 inches.',
        stitchCount: 'Crown top complete'
      },
      {
        rowNumber: 'Flower Side Squares',
        instruction: 'Make 5 floral granny squares using Terracotta and Golden Yellow yarn for centers. Join the 5 squares into a continuous circle band.',
        stitchCount: '5 squares ring'
      },
      {
        rowNumber: 'Brim',
        instruction: 'Attach Cream yarn to bottom of side band. Work sc in rounds, increasing every 5th st on Round 1 of brim for flare. Work 6 rounds total for stiff sun brim.',
        stitchCount: 'Brim finished'
      }
    ],
    faq: [
      {
        question: 'Is cotton yarn recommended for bucket hats?',
        answer: 'Yes! Cotton yarn holds structure, stays breathable in summer heat, and does not stretch out of shape.'
      }
    ]
  },
  {
    id: 'p4',
    slug: 'pastel-baby-cardigan-set',
    title: 'Pastel Feather & Fan Baby Cardigan',
    subtitle: 'Ultra-soft heirloom baby sweater with matching bonnet',
    description: 'A delicate and cozy baby cardigan sweater featuring soft rippled shell textures, raglan seamless sleeves, and cute wooden button closures. Sized for 0-6 months and 6-12 months.',
    difficulty: 'Intermediate',
    category: 'baby',
    image: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.92,
    reviewCount: 88,
    downloadsCount: 3120,
    hookSize: '4.0 mm (G-6)',
    yarnWeight: 'Fine / Sport (#2) or Baby DK',
    yarnBrand: 'Soft Gentle Baby Acrylic',
    yarnMetersNeeded: 450,
    finishedSize: 'Chest 18-20 inches (0-6M / 6-12M)',
    estimatedTimeHours: 7,
    isFeatured: true,
    isTrending: false,
    isPopular: true,
    createdAt: '2026-02-14',
    pdfSize: '2.1 MB',
    pdfPages: 6,
    tags: ['baby sweater', 'cardigan', 'infant', 'pastels', 'bonnet', 'baby clothing'],
    gauge: '18 hdc and 14 rows = 4 inches (10 cm)',
    materials: [
      '200g Baby Mint or Baby Pink Sport Yarn',
      '4.0mm Crochet Hook',
      '4 Small Wooden Buttons (12mm)',
      '4 Stitch Markers'
    ],
    abbreviationsUsed: ['ch', 'sc', 'hdc', 'dc', 'shell st', 'inc', 'raglan corner'],
    steps: [
      {
        rowNumber: 'Yoke R1-R10',
        instruction: 'Ch 53. Row 1: Hdc across placing (2 hdc, ch 2, 2 hdc) at 4 raglan marker points to separate back, sleeves, and front panels.',
        stitchCount: 'Raglan yoke'
      },
      {
        rowNumber: 'Separate Sleeves',
        instruction: 'Row 11: Work across front, skip sleeve stitches, ch 3 underarm, work across back, skip 2nd sleeve, work across opposite front.',
        stitchCount: 'Body connected'
      },
      {
        rowNumber: 'Skirt Shell Pattern',
        instruction: 'Work Shell pattern (5 dc in 1 st, skip 2, sc in next) down body length for 12 rows.',
        stitchCount: 'Cardigan skirt'
      }
    ],
    faq: [
      {
        question: 'Are buttons safe for newborn baby cardigans?',
        answer: 'Ensure buttons are sewn extra tightly with strong nylon thread, or substitute with soft crochet button ties.'
      }
    ]
  },
  {
    id: 'p5',
    slug: 'boho-macrame-style-plant-hanger',
    title: 'Boho Plant Hanger & Pot Holder',
    subtitle: 'Modern textured home decor crochet hanging basket',
    description: 'Add greenery to your home with this sturdy crocheted plant hanger! Fits pots from 4 to 8 inches in diameter.',
    difficulty: 'Beginner',
    category: 'home-decor',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.82,
    reviewCount: 64,
    downloadsCount: 1890,
    hookSize: '5.5 mm (I-9)',
    yarnWeight: 'Bulky / Cord (#5) or 3mm Cotton Cord',
    yarnBrand: 'Craft Macrame Cotton Cord',
    yarnMetersNeeded: 180,
    finishedSize: '32 inches total hanging length (81 cm)',
    estimatedTimeHours: 2,
    isFeatured: false,
    isTrending: false,
    isPopular: false,
    createdAt: '2026-03-01',
    pdfSize: '1.2 MB',
    pdfPages: 3,
    tags: ['plant hanger', 'home decor', 'macrame', 'cotton cord', 'boho', 'beginner'],
    gauge: '12 sc = 4 inches (10 cm)',
    materials: [
      '150g 3mm Macrame Cotton Cord',
      '5.5mm Hook',
      '1 Wooden Ring (2-inch diameter)'
    ],
    abbreviationsUsed: ['mr', 'sc', 'ch', 'sl st'],
    steps: [
      {
        rowNumber: 'Base Ring',
        instruction: 'Work 16 sc around the wooden ring. Join with sl st.',
        stitchCount: '16 sc'
      },
      {
        rowNumber: 'Basket Net',
        instruction: 'Work mesh rounds: *Ch 5, skip 2 sts, sc in next st*. Repeat around to create diamond net holder.',
        stitchCount: 'Net basket complete'
      }
    ],
    faq: [
      {
        question: 'Can this hold heavy ceramic pots?',
        answer: 'Yes! Using sturdy 3mm cotton cord with a 5.5mm hook creates high strength support for pots up to 6 lbs.'
      }
    ]
  },
  {
    id: 'p6',
    slug: 'sunflower-coaster-set',
    title: 'Bright Sunshine Flower Coasters (Set of 4)',
    subtitle: 'Quick 30-minute crochet stash buster project for kitchen & dining',
    description: 'Brighten your coffee table with these cheery sunflower coasters! Uses simple double crochet clusters and picot petal edges. Makes a wonderful handmade housewarming gift!',
    difficulty: 'Beginner',
    category: 'flowers',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.96,
    reviewCount: 175,
    downloadsCount: 4620,
    hookSize: '4.0 mm (G-6)',
    yarnWeight: 'Medium Cotton (#4)',
    yarnBrand: 'Kitchen Cotton Yarn',
    yarnMetersNeeded: 120,
    finishedSize: '5.5 inches diameter (14 cm)',
    estimatedTimeHours: 1,
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-02-20',
    pdfSize: '1.1 MB',
    pdfPages: 3,
    tags: ['sunflower', 'coasters', 'flowers', 'quick project', 'kitchen', 'gifts'],
    gauge: '1 circle = 5.5 inches across',
    materials: [
      '50g Dark Brown Cotton Yarn (Center Seed)',
      '50g Bright Yellow Cotton Yarn (Petals)',
      '4.0mm Crochet Hook',
      'Yarn Needle'
    ],
    abbreviationsUsed: ['mr', 'dc', 'picot', 'sl st'],
    steps: [
      {
        rowNumber: 'Round 1 (Brown)',
        instruction: 'Magic Ring, Ch 3, 11 dc into ring. Join (12 dc).',
        stitchCount: '12 dc'
      },
      {
        rowNumber: 'Round 2 (Brown)',
        instruction: 'Ch 3, 2 dc in each st around. Join (24 dc). Fasten off brown.',
        stitchCount: '24 dc'
      },
      {
        rowNumber: 'Round 3 (Yellow Petals)',
        instruction: 'Attach yellow. *Ch 3, dc in same st, ch 2 picot, dc in next st, ch 3, sl st in next st*. Repeat around for 12 petals.',
        stitchCount: '12 petals'
      }
    ],
    faq: [
      {
        question: 'Are cotton coasters absorbent for cold drinks?',
        answer: '100% cotton is naturally absorbent and heat-resistant for hot mugs and cold icy glasses.'
      }
    ]
  },
  {
    id: 'p7',
    slug: 'boho-fringe-cushion-cover',
    title: 'Boho Fringe Textured Pillow Cover',
    subtitle: 'Modern textured throw pillow with tassel details for cozy living spaces',
    description: 'Elevate your living room decor with this stunning boho pillow cover featuring alpine stitches, bobbles, and dramatic corner tassels.',
    difficulty: 'Intermediate',
    category: 'home-decor',
    image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?auto=format&fit=crop&w=1000&q=80',
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.88,
    reviewCount: 94,
    downloadsCount: 3150,
    hookSize: '5.5 mm (I-9)',
    yarnWeight: 'Bulky Chunky (#5)',
    yarnBrand: 'Cozy Living Bulky Yarn',
    yarnMetersNeeded: 450,
    finishedSize: '18 inches x 18 inches (45 cm x 45 cm)',
    estimatedTimeHours: 7,
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-02-12',
    pdfSize: '1.8 MB',
    pdfPages: 4,
    tags: ['pillow', 'boho', 'home decor', 'cushion', 'tassels', 'texture'],
    gauge: '12 sts and 10 rows = 4 inches (10 cm)',
    materials: ['400g Cream Chunky Cotton Yarn', '5.5mm Crochet Hook', '18x18 Insert Pillow', 'Yarn Needle'],
    abbreviationsUsed: ['ch', 'sc', 'dc', 'fpdc', 'bpdc', 'sl st'],
    steps: [
      { rowNumber: 'Row 1', instruction: 'Ch 55. Sc in 2nd ch from hook and each ch across. Turn. (54 sc)' },
      { rowNumber: 'Row 2', instruction: 'Ch 2, dc in each st across. Turn.' },
      { rowNumber: 'Row 3', instruction: 'Ch 1, *dc in next st, fpdc around st 2 rows below*. Repeat across. Turn.' }
    ]
  },
  {
    id: 'p8',
    slug: 'cozy-ribbed-slouchy-beanie',
    title: 'Cozy Ribbed Slouchy Beanie Hat',
    subtitle: 'Classic gender-neutral winter beanie with a fold-over brim',
    description: 'An essential winter accessory with super stretchy ribbed texture that fits adults and teens comfortably. Fast 2-hour project!',
    difficulty: 'Beginner',
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.95,
    reviewCount: 210,
    downloadsCount: 6890,
    hookSize: '5.0 mm (H-8)',
    yarnWeight: 'Medium / Worsted (#4)',
    yarnBrand: 'Soft Velvet Acrylic',
    yarnMetersNeeded: 220,
    finishedSize: 'Adult Universal (Head Circ. 20-23 in)',
    estimatedTimeHours: 3,
    isFeatured: false,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-01-20',
    pdfSize: '1.2 MB',
    pdfPages: 3,
    tags: ['beanie', 'hat', 'ribbed', 'slouchy', 'winter', 'unisex'],
    gauge: '16 hdc blo = 4 inches (10 cm)',
    materials: ['150g Worsted Yarn', '5.0mm Crochet Hook', 'Faux Fur Pom Pom (Optional)'],
    abbreviationsUsed: ['ch', 'hdc', 'blo (back loop only)', 'sl st'],
    steps: [
      { rowNumber: 'Row 1', instruction: 'Ch 40. Hdc in 2nd ch from hook and each ch across. Turn.' },
      { rowNumber: 'Row 2-55', instruction: 'Ch 1, hdc blo in each st across. Turn until piece measures 18 inches un-stretched.' }
    ]
  },
  {
    id: 'p9',
    slug: 'spooky-pumpkin-jack-o-lantern',
    title: 'Rustic Autumn Pumpkin & Jack-o-Lantern',
    subtitle: 'Cute harvest table decor and festive Halloween accent',
    description: 'Create a cozy set of small, medium, and large ribbed pumpkins topped with real cinnamon stick stems and twine leaves.',
    difficulty: 'Easy',
    category: 'halloween',
    image: 'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1508746829417-e6f548d8d6ed?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.92,
    reviewCount: 160,
    downloadsCount: 4210,
    hookSize: '4.5 mm (7)',
    yarnWeight: 'Worsted (#4)',
    yarnBrand: 'Autumn Harvest Wool Mix',
    yarnMetersNeeded: 180,
    finishedSize: 'Set of 3 (4 in, 6 in, 8 in width)',
    estimatedTimeHours: 2,
    isFeatured: false,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-02-01',
    pdfSize: '1.5 MB',
    pdfPages: 4,
    tags: ['pumpkin', 'halloween', 'autumn', 'harvest', 'rustic', 'decor'],
    gauge: '15 hdc blo = 4 inches',
    materials: ['Burnt Orange Yarn', 'Polyfill Fiberfill', 'Cinnamon Sticks for Stems', 'Jute Twine'],
    abbreviationsUsed: ['ch', 'hdc blo', 'sl st'],
    steps: [
      { rowNumber: 'Rectangle', instruction: 'Work 30 rows of hdc blo to form a stretchy ribbing rectangle.' },
      { rowNumber: 'Assembly', instruction: 'Seam side edges together, cinch bottom, stuff firmly, cinch top around cinnamon stick.' }
    ]
  },
  {
    id: 'p10',
    slug: 'classic-granny-square-cardigan',
    title: 'Vintage Daisy Granny Square Cardigan',
    subtitle: 'Statement patchwork jacket made with colorful flower squares',
    description: 'Turn individual daisy granny squares into a head-turning retro cardigan with balloon sleeves and cozy wide cuffs.',
    difficulty: 'Intermediate',
    category: 'granny-squares',
    image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.97,
    reviewCount: 280,
    downloadsCount: 8430,
    hookSize: '5.0 mm (H-8)',
    yarnWeight: 'DK / Light Worsted (#3)',
    yarnBrand: 'Pastel Dream Wool',
    yarnMetersNeeded: 1600,
    finishedSize: 'S/M, L/XL, 2XL/3XL available',
    estimatedTimeHours: 22,
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-01-05',
    pdfSize: '3.1 MB',
    pdfPages: 8,
    tags: ['granny square', 'cardigan', 'sweater', 'daisy', 'patchwork', 'vintage'],
    gauge: '1 Square = 5 in x 5 in',
    materials: ['600g Cream Base', '200g Yellow', '200g White', '400g Mixed Accent Colors', '5.0mm Hook'],
    abbreviationsUsed: ['mr', 'ch', 'dc', 'tr', 'sl st'],
    steps: [
      { rowNumber: 'Squares', instruction: 'Crochet 54 daisy granny squares using 3-color rounds.' },
      { rowNumber: 'Seaming', instruction: 'Use flat slip stitch join to assemble back panel, front panels, and sleeves.' }
    ]
  },
  {
    id: 'p11',
    slug: 'mini-amigurumi-cat-keychain',
    title: 'Pocket Kitty Cat Amigurumi Plushie',
    subtitle: 'Ultra-cute pocket kitten keychain project for beginner crafters',
    description: 'A quick 1-hour amigurumi cat pattern that requires minimal sewing and turns out irresistibly squishy!',
    difficulty: 'Beginner',
    category: 'animals',
    image: 'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1543852786-1cf6624b9987?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.91,
    reviewCount: 185,
    downloadsCount: 5120,
    hookSize: '3.0 mm (C-2)',
    yarnWeight: 'Sport / Fine (#2)',
    yarnBrand: 'Cotton Comfort Soft',
    yarnMetersNeeded: 80,
    finishedSize: '3.5 inches tall (9 cm)',
    estimatedTimeHours: 2,
    isFeatured: false,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-02-18',
    pdfSize: '1.4 MB',
    pdfPages: 3,
    tags: ['cat', 'kitten', 'amigurumi', 'keychain', 'animal', 'quick'],
    gauge: '22 sc x 22 rows = 4 inches',
    materials: ['50g Peach / Grey Yarn', 'Safety Eyes 6mm', 'Polyfill', 'Keychain Ring'],
    abbreviationsUsed: ['mr', 'sc', 'inc', 'dec', 'sl st'],
    steps: [
      { rowNumber: 'Rnd 1-12', instruction: 'Work seamless continuous rounds from head to body with decreases.' },
      { rowNumber: 'Ears', instruction: 'Ch 4, sc, hdc, dc to create triangular ears on top of head.' }
    ]
  },
  {
    id: 'p12',
    slug: 'festive-holly-christmas-stocking',
    title: 'Traditional Heirloom Christmas Stocking',
    subtitle: 'Vintage-inspired holiday mantel stocking with cable cuff and holly leaves',
    description: 'Create a cherished family holiday heirloom with textured bobble rows, plush ribbed turn-over cuff, and cute holly berry appliques.',
    difficulty: 'Intermediate',
    category: 'christmas',
    image: 'https://images.unsplash.com/photo-1543589077-47d5199647ce?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1543589077-47d5199647ce?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.96,
    reviewCount: 130,
    downloadsCount: 3940,
    hookSize: '5.0 mm (H-8)',
    yarnWeight: 'Worsted (#4)',
    yarnBrand: 'Holiday Classic Wool',
    yarnMetersNeeded: 380,
    finishedSize: '18 inches long (45 cm)',
    estimatedTimeHours: 8,
    isFeatured: true,
    isTrending: false,
    isPopular: true,
    createdAt: '2025-11-20',
    pdfSize: '2.0 MB',
    pdfPages: 5,
    tags: ['christmas', 'stocking', 'holiday', 'holly', 'mantel', 'heirloom'],
    gauge: '14 dc = 4 inches',
    materials: ['200g Crimson Red', '100g Off-White', '50g Forest Green', '5.0mm Hook'],
    abbreviationsUsed: ['ch', 'sc', 'dc', 'bobble', 'sl st'],
    steps: [
      { rowNumber: 'Leg', instruction: 'Work in joined rounds with alternating plain and bobble rows.' },
      { rowNumber: 'Heel Flap', instruction: 'Short rows for reinforced traditional heel shape.' }
    ]
  },
  {
    id: 'p13',
    slug: 'summer-boho-crop-top',
    title: 'Summer Solstice Lace Bralette Crop Top',
    subtitle: 'Breathable festival tie-back top with scallop lace edge',
    description: 'Perfect for sunny festival days, beach getaways, and summer layering. Features customizable bust cups and criss-cross back straps.',
    difficulty: 'Intermediate',
    category: 'tops',
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.87,
    reviewCount: 112,
    downloadsCount: 2980,
    hookSize: '3.75 mm (F-5)',
    yarnWeight: 'Fine / Sport Cotton (#2)',
    yarnBrand: 'Summer Breeze Cotton',
    yarnMetersNeeded: 280,
    finishedSize: 'Cups A-DD cup instructions included',
    estimatedTimeHours: 6,
    isFeatured: false,
    isTrending: true,
    isPopular: false,
    createdAt: '2026-02-10',
    pdfSize: '1.9 MB',
    pdfPages: 5,
    tags: ['top', 'crop top', 'summer', 'boho', 'bralette', 'festival'],
    gauge: '18 dc = 4 inches',
    materials: ['150g 100% Cotton Sport Yarn', '3.75mm Hook', 'Tapestry Needle'],
    abbreviationsUsed: ['ch', 'sc', 'dc', 'shell st', 'sl st'],
    steps: [
      { rowNumber: 'Cups', instruction: 'Make 2 triangular bust cups starting from center chain.' },
      { rowNumber: 'Band & Straps', instruction: 'Attach cups together with shell lace underbust band and long cord straps.' }
    ]
  },
  {
    id: 'p14',
    slug: 'blossom-coaster-set',
    title: 'Blooming Flower Coaster 4-Piece Set',
    subtitle: 'Charming floral coaster set to brighten your coffee table',
    description: 'Quick & satisfying stash-buster project! Four colorful double-layered flower coasters with leafy border edges.',
    difficulty: 'Easy',
    category: 'home-decor',
    image: 'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1513519245088-0e12902e5a38?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.93,
    reviewCount: 88,
    downloadsCount: 2740,
    hookSize: '4.0 mm (G-6)',
    yarnWeight: 'Medium Cotton (#4)',
    yarnBrand: 'Eco Cotton Prints',
    yarnMetersNeeded: 140,
    finishedSize: '5 inches diameter',
    estimatedTimeHours: 2,
    isFeatured: false,
    isTrending: false,
    isPopular: true,
    createdAt: '2026-01-28',
    pdfSize: '1.2 MB',
    pdfPages: 3,
    tags: ['coaster', 'flower', 'home decor', 'floral', 'tableware', 'quick'],
    gauge: '1 coaster = 5 in diameter',
    materials: ['100g Mixed Cotton Scrap Yarn', '4.0mm Hook'],
    abbreviationsUsed: ['mr', 'sc', 'hdc', 'dc', 'tr', 'sl st'],
    steps: [
      { rowNumber: 'Center', instruction: 'Magic Ring, 12 dc in yellow.' },
      { rowNumber: 'Petals', instruction: 'Work 12 double treble cluster petals around center.' }
    ]
  },
  {
    id: 'p15',
    slug: 'marshmallow-bear-plushie',
    title: 'Marshmallow Teddy Bear Velvet Plushie',
    subtitle: 'Extra soft chenille plushie toy ideal for baby shower gifts',
    description: 'Super plush cuddly teddy bear made with chenille velvet yarn. Features embroidered nose and weighted belly.',
    difficulty: 'Easy',
    category: 'amigurumi',
    image: 'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1559454403-b8fb88521f11?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.98,
    reviewCount: 310,
    downloadsCount: 9280,
    hookSize: '6.0 mm (J-10)',
    yarnWeight: 'Super Bulky Velvet (#6)',
    yarnBrand: 'Velvet Soft Plush',
    yarnMetersNeeded: 180,
    finishedSize: '10 inches sitting (25 cm)',
    estimatedTimeHours: 4,
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-02-05',
    pdfSize: '2.2 MB',
    pdfPages: 5,
    tags: ['bear', 'teddy bear', 'velvet', 'plushie', 'amigurumi', 'chenille'],
    gauge: '10 sc x 10 rows = 4 inches',
    materials: ['200g Velvet Chunky Yarn', '6.0mm Hook', 'Safety Eyes 12mm', 'Fiberfill'],
    abbreviationsUsed: ['mr', 'sc', 'inc', 'dec', 'sl st'],
    steps: [
      { rowNumber: 'Head & Body', instruction: 'Seamless bottom-up construction in chenille yarn.' },
      { rowNumber: 'Limbs', instruction: 'Attach arms and legs with invisible surface joins.' }
    ]
  },
  {
    id: 'p16',
    slug: 'cloud-soft-baby-blanket',
    title: 'Cloud-Soft Ripple Wave Baby Blanket',
    subtitle: 'Gentle pastel chevron baby blanket with scalloped edges',
    description: 'A serene and lightweight baby throw featuring a delicate ripple stitch pattern in soothing nursery pastels.',
    difficulty: 'Easy',
    category: 'baby',
    image: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.94,
    reviewCount: 145,
    downloadsCount: 4890,
    hookSize: '4.5 mm (7)',
    yarnWeight: 'DK Baby Soft (#3)',
    yarnBrand: 'Nursery Velvet Touch',
    yarnMetersNeeded: 850,
    finishedSize: '36 in x 42 in (91 cm x 106 cm)',
    estimatedTimeHours: 12,
    isFeatured: false,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-01-18',
    pdfSize: '1.7 MB',
    pdfPages: 4,
    tags: ['baby', 'blanket', 'ripple', 'chevron', 'nursery', 'gift'],
    gauge: '16 dc ripple = 4 inches',
    materials: ['400g DK Baby Acrylic Yarn', '4.5mm Hook', 'Yarn Needle'],
    abbreviationsUsed: ['ch', 'dc', 'dc2tog', 'sl st'],
    steps: [
      { rowNumber: 'Foundation', instruction: 'Ch 145. Dc in 4th ch from hook, work ripple repeat (*dc5, dc3tog, dc5, 3dc in next*).' },
      { rowNumber: 'Color Repeats', instruction: 'Change color every 4 rows for clean pastel stripes.' }
    ]
  },
  {
    id: 'p17',
    slug: 'chunky-cable-knit-scarf',
    title: 'Chunky Faux-Cable Braided Scarf',
    subtitle: 'Warm winter scarf featuring rich braided texture without cabling needles',
    description: 'Look like a master knitter with this easy crochet cable scarf that uses front-post double crochets to create luscious braid cables.',
    difficulty: 'Intermediate',
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.89,
    reviewCount: 98,
    downloadsCount: 3410,
    hookSize: '6.5 mm (K-10.5)',
    yarnWeight: 'Bulky (#5)',
    yarnBrand: 'Winter Warmth Bulky',
    yarnMetersNeeded: 420,
    finishedSize: '8 in x 72 in (20 cm x 182 cm)',
    estimatedTimeHours: 6,
    isFeatured: false,
    isTrending: false,
    isPopular: true,
    createdAt: '2026-02-08',
    pdfSize: '1.6 MB',
    pdfPages: 4,
    tags: ['scarf', 'cable', 'chunky', 'winter', 'braided', 'warm'],
    gauge: '11 sts x 8 rows = 4 inches',
    materials: ['350g Bulky Wool Yarn', '6.5mm Hook'],
    abbreviationsUsed: ['ch', 'hdc', 'fptr (front post treble)', 'sl st'],
    steps: [
      { rowNumber: 'Row 1', instruction: 'Ch 28. Hdc in 2nd ch from hook and each st across.' },
      { rowNumber: 'Cable Pattern', instruction: 'Cross fptr stitches over 3-stitch columns to form 6-strand braid.' }
    ]
  },
  {
    id: 'p18',
    slug: 'daisy-chain-market-bag',
    title: 'Daisy Chain Mesh Produce & Market Bag',
    subtitle: 'Eco-friendly stretchy grocery tote with reinforced handles',
    description: 'Ditch single-use plastic bags! This durable mesh tote expands to carry farmers market produce, beach towels, or yarn skeins.',
    difficulty: 'Easy',
    category: 'bags',
    image: 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.90,
    reviewCount: 124,
    downloadsCount: 4100,
    hookSize: '4.5 mm (7)',
    yarnWeight: 'Worsted Cotton (#4)',
    yarnBrand: 'Eco Farmer Cotton',
    yarnMetersNeeded: 240,
    finishedSize: '15 in x 16 in (unstretched)',
    estimatedTimeHours: 4,
    isFeatured: false,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-01-30',
    pdfSize: '1.3 MB',
    pdfPages: 3,
    tags: ['bag', 'market bag', 'tote', 'mesh', 'eco-friendly', 'cotton'],
    gauge: '4 mesh arches = 3 inches',
    materials: ['200g 100% Cotton Yarn', '4.5mm Hook'],
    abbreviationsUsed: ['mr', 'ch', 'sc', 'dc', 'sl st'],
    steps: [
      { rowNumber: 'Base', instruction: 'Start from circular solid base in sc for 8 rounds.' },
      { rowNumber: 'Mesh Body', instruction: 'Work chain-5 arches in spiral rounds until desired depth.' }
    ]
  },
  {
    id: 'p19',
    slug: 'sweet-strawberry-keychain',
    title: 'Sweet Strawberry Amigurumi Charm',
    subtitle: 'Juicy 30-minute berry keychain charm with tiny flower topper',
    description: 'Adorable quick gift item! A plump strawberry with embroidered seeds, green calyx top, and hanging loop.',
    difficulty: 'Beginner',
    category: 'amigurumi',
    image: 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.96,
    reviewCount: 220,
    downloadsCount: 7150,
    hookSize: '3.0 mm (C-2)',
    yarnWeight: 'Cotton Sport (#2)',
    yarnBrand: 'Bright Cotton Minis',
    yarnMetersNeeded: 45,
    finishedSize: '2.5 inches (6 cm)',
    estimatedTimeHours: 1,
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-02-22',
    pdfSize: '1.0 MB',
    pdfPages: 2,
    tags: ['strawberry', 'fruit', 'amigurumi', 'keychain', 'charm', 'quick'],
    gauge: '24 sc = 4 inches',
    materials: ['25g Red Cotton', '10g Green Cotton', 'White Thread for Seeds', 'Polyfill'],
    abbreviationsUsed: ['mr', 'sc', 'inc', 'dec', 'sl st'],
    steps: [
      { rowNumber: 'Berry', instruction: 'MR 6 sc. Inc to 18 sc. Decrease to tip.' },
      { rowNumber: 'Leaves', instruction: '5-leaf star cap in green cotton.' }
    ]
  },
  {
    id: 'p20',
    slug: 'cutest-octopus-sensory-toy',
    title: 'Preemie Octopus Sensory Plushie',
    subtitle: 'Safe curly-tentacle octopus companion for infants & preemies',
    description: 'The spiral tentacles resemble umbilical cords and comfort little ones. Made with 100% hypoallergenic cotton.',
    difficulty: 'Easy',
    category: 'baby',
    image: 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.99,
    reviewCount: 190,
    downloadsCount: 6320,
    hookSize: '3.5 mm (E-4)',
    yarnWeight: 'DK Organic Cotton (#3)',
    yarnBrand: 'Organic Infant Cotton',
    yarnMetersNeeded: 110,
    finishedSize: '7 inches total length',
    estimatedTimeHours: 3,
    isFeatured: false,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-01-12',
    pdfSize: '1.5 MB',
    pdfPages: 3,
    tags: ['octopus', 'baby', 'sensory', 'preemie', 'toy', 'tentacles'],
    gauge: '20 sc = 4 inches',
    materials: ['75g Organic Cotton Yarn', 'Embroidered Eyes (No Plastic)', 'Polyfill'],
    abbreviationsUsed: ['mr', 'sc', 'inc', 'dec', 'ch'],
    steps: [
      { rowNumber: 'Head', instruction: 'Work smooth round head up to 36 sc, work 10 rounds straight.' },
      { rowNumber: 'Tentacles', instruction: 'Ch 45, 3 sc in each ch to curl tightly into 8 bouncy spirals.' }
    ]
  },
  {
    id: 'p21',
    slug: 'rainbow-granny-stripe-throw',
    title: 'Vibrant Rainbow Granny Stripe Blanket',
    subtitle: 'Relaxing row-by-row color therapy throw blanket',
    description: 'An addictive and therapeutic project! Uses standard 3-dc cluster granny stitches in continuous straight stripes.',
    difficulty: 'Beginner',
    category: 'blankets',
    image: 'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.92,
    reviewCount: 165,
    downloadsCount: 5410,
    hookSize: '5.5 mm (I-9)',
    yarnWeight: 'Worsted (#4)',
    yarnBrand: 'Rainbow Spectrum Acrylic',
    yarnMetersNeeded: 1400,
    finishedSize: '52 in x 64 in (132 cm x 162 cm)',
    estimatedTimeHours: 20,
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-01-08',
    pdfSize: '2.5 MB',
    pdfPages: 5,
    tags: ['rainbow', 'granny stripe', 'blanket', 'throw', 'colorful', 'relaxing'],
    gauge: '5 granny clusters = 4 inches',
    materials: ['1200g Worsted Yarn in 7 Spectrum Colors', '5.5mm Hook'],
    abbreviationsUsed: ['ch', 'dc', 'sl st'],
    steps: [
      { rowNumber: 'Row 1', instruction: 'Ch 175. 3 dc in 5th ch from hook, *skip 2 ch, 3 dc in next*. Repeat across.' },
      { rowNumber: 'Stripes', instruction: 'Switch colors every 2 rows.' }
    ]
  },
  {
    id: 'p22',
    slug: 'harvest-acorn-table-runner',
    title: 'Harvest Acorn & Oak Leaf Table Runner',
    subtitle: 'Elegant dining table runner for Thanksgiving & Autumn gatherings',
    description: 'Frame your autumn dinner table with a linen-look textured center panel bordered by leafy oak appliques and acorns.',
    difficulty: 'Intermediate',
    category: 'home-decor',
    image: 'https://images.unsplash.com/photo-1510074377623-8cf13fb86c08?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1510074377623-8cf13fb86c08?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.89,
    reviewCount: 76,
    downloadsCount: 2390,
    hookSize: '4.0 mm (G-6)',
    yarnWeight: 'DK Linen/Cotton (#3)',
    yarnBrand: 'Natural Linen Craft',
    yarnMetersNeeded: 620,
    finishedSize: '14 in x 60 in (35 cm x 152 cm)',
    estimatedTimeHours: 10,
    isFeatured: false,
    isTrending: false,
    isPopular: false,
    createdAt: '2025-10-15',
    pdfSize: '1.8 MB',
    pdfPages: 4,
    tags: ['table runner', 'harvest', 'autumn', 'thanksgiving', 'acorn', 'decor'],
    gauge: '16 moss st = 4 inches',
    materials: ['350g Oatmeal Linen Yarn', '100g Forest Green & Terracotta Yarn', '4.0mm Hook'],
    abbreviationsUsed: ['ch', 'sc', 'hdc', 'dc', 'sl st'],
    steps: [
      { rowNumber: 'Center Body', instruction: 'Moss stitch rectangle (sc, ch 1) for 200 rows.' },
      { rowNumber: 'Appliques', instruction: 'Stitch oak leaves and 3D acorns onto both pointed ends.' }
    ]
  },
  {
    id: 'p23',
    slug: 'cozy-cabin-slipper-socks',
    title: 'Cozy Cabin Non-Slip Slipper Socks',
    subtitle: 'Thick chunky house slippers with soft ribbed ankle cuffs',
    description: 'Keep your toes cozy all winter long! Includes instructions for applying silicone non-slip puff dots on soles.',
    difficulty: 'Easy',
    category: 'accessories',
    image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.93,
    reviewCount: 140,
    downloadsCount: 4680,
    hookSize: '5.5 mm (I-9)',
    yarnWeight: 'Chunky Bulky (#5)',
    yarnBrand: 'Cozy Cabin Chunky',
    yarnMetersNeeded: 220,
    finishedSize: 'US Women 5-11 / US Men 7-12',
    estimatedTimeHours: 3,
    isFeatured: false,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-01-25',
    pdfSize: '1.4 MB',
    pdfPages: 4,
    tags: ['slippers', 'socks', 'chunky', 'cozy', 'footwear', 'winter'],
    gauge: '12 hdc = 4 inches',
    materials: ['200g Chunky Wool Blend', '5.5mm Hook', 'Sock Stop Non-Slip Gel'],
    abbreviationsUsed: ['mr', 'hdc', 'hdc2tog', 'sl st'],
    steps: [
      { rowNumber: 'Toe', instruction: 'Start from toe in magic ring, increase to 24 hdc.' },
      { rowNumber: 'Foot & Heel', instruction: 'Work in rounds for foot, then back and forth short rows for heel cup.' }
    ]
  },
  {
    id: 'p24',
    slug: 'pastel-granny-square-tote',
    title: 'Pastel Daisy Granny Square Shoulder Bag',
    subtitle: 'Chic boho shoulder tote with lined interior and sturdy straps',
    description: 'A trendy everyday shoulder bag made from 13 connected daisy granny squares with fabric inner lining instructions.',
    difficulty: 'Intermediate',
    category: 'bags',
    image: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80',
    gallery: [
      'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=1000&q=80'
    ],
    rating: 4.95,
    reviewCount: 180,
    downloadsCount: 5840,
    hookSize: '4.5 mm (7)',
    yarnWeight: 'Worsted Cotton (#4)',
    yarnBrand: 'Pastel Cotton Blend',
    yarnMetersNeeded: 410,
    finishedSize: '14 in x 14 in (excluding 22 in straps)',
    estimatedTimeHours: 8,
    isFeatured: true,
    isTrending: true,
    isPopular: true,
    createdAt: '2026-02-15',
    pdfSize: '2.1 MB',
    pdfPages: 5,
    tags: ['bag', 'granny square', 'tote', 'daisy', 'shoulder bag', 'boho'],
    gauge: '1 square = 4.5 inches',
    materials: ['300g Cotton Yarn in 4 colors', '4.5mm Hook', 'Cotton Lining Fabric (Optional)'],
    abbreviationsUsed: ['mr', 'ch', 'dc', 'tr', 'sl st'],
    steps: [
      { rowNumber: 'Squares', instruction: 'Crochet 13 daisy granny squares.' },
      { rowNumber: 'Assembly', instruction: 'Join 13 squares into tulip-bag 3D shape and attach long crocheted handles.' }
    ]
  }
];


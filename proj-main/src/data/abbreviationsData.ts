import { Abbreviation } from '../types';

export const ABBREVIATIONS_DATA: Abbreviation[] = [
  {
    usTerm: 'sc',
    ukTerm: 'dc',
    name: 'Single Crochet (US) / Double Crochet (UK)',
    description: 'Insert hook into stitch, yarn over, pull up loop (2 loops on hook), yarn over, pull through both loops.',
    symbol: 'X or +',
    difficulty: 'Basic'
  },
  {
    usTerm: 'hdc',
    ukTerm: 'htr',
    name: 'Half Double Crochet (US) / Half Treble (UK)',
    description: 'Yarn over, insert hook, yarn over, pull up loop (3 loops on hook), yarn over, pull through all 3 loops.',
    symbol: 'T',
    difficulty: 'Basic'
  },
  {
    usTerm: 'dc',
    ukTerm: 'tr',
    name: 'Double Crochet (US) / Treble Crochet (UK)',
    description: 'Yarn over, insert hook, yarn over, pull up loop (3 loops), yarn over, pull through first 2 loops, yarn over, pull through last 2 loops.',
    symbol: 'T with 1 crossbar',
    difficulty: 'Basic'
  },
  {
    usTerm: 'tr (or tc)',
    ukTerm: 'dtr',
    name: 'Treble Crochet (US) / Double Treble (UK)',
    description: 'Yarn over twice, insert hook, yarn over, pull up loop (4 loops), yarn over and pull through 2 loops three times.',
    symbol: 'T with 2 crossbars',
    difficulty: 'Intermediate'
  },
  {
    usTerm: 'sl st',
    ukTerm: 'ss (or sl st)',
    name: 'Slip Stitch',
    description: 'Insert hook into stitch, yarn over and pull through stitch and loop on hook in one motion. Used for joining rounds.',
    symbol: 'Filled Dot (•)',
    difficulty: 'Basic'
  },
  {
    usTerm: 'ch',
    ukTerm: 'ch',
    name: 'Chain',
    description: 'Yarn over and pull loop through current loop on hook to form foundation chain or spaces.',
    symbol: 'Open Oval (o)',
    difficulty: 'Basic'
  },
  {
    usTerm: 'mr (or mc)',
    ukTerm: 'magic ring',
    name: 'Magic Ring / Magic Circle',
    description: 'An adjustable loop used to start circular projects without a hole in the center (ideal for amigurumi and granny squares).',
    symbol: 'Spiral / Circle',
    difficulty: 'Basic'
  },
  {
    usTerm: 'inc',
    ukTerm: 'inc',
    name: 'Increase',
    description: 'Work 2 stitches into the exact same base stitch to widen the piece.',
    symbol: 'V shape',
    difficulty: 'Basic'
  },
  {
    usTerm: 'dec (or sc2tog)',
    ukTerm: 'dec (or dc2tog)',
    name: 'Decrease (2 Stitches Together)',
    description: 'Combine two adjacent stitches into one to narrow the piece.',
    symbol: 'Inverted V shape',
    difficulty: 'Basic'
  },
  {
    usTerm: 'blo',
    ukTerm: 'blo',
    name: 'Back Loop Only',
    description: 'Work the stitch inserting hook only under the back strand of the V at the top of the stitch.',
    symbol: 'Arc below stitch',
    difficulty: 'Basic'
  },
  {
    usTerm: 'flo',
    ukTerm: 'flo',
    name: 'Front Loop Only',
    description: 'Work the stitch inserting hook only under the front strand of the V closest to you.',
    symbol: 'Arc above stitch',
    difficulty: 'Basic'
  },
  {
    usTerm: 'fpdc',
    ukTerm: 'fptr',
    name: 'Front Post Double Crochet (US) / Front Post Treble (UK)',
    description: 'Work double crochet around the post of the stitch from the front, creating a raised ribbed texture.',
    symbol: 'DC with hook curve at bottom left',
    difficulty: 'Intermediate'
  },
  {
    usTerm: 'bpdc',
    ukTerm: 'bptr',
    name: 'Back Post Double Crochet (US) / Back Post Treble (UK)',
    description: 'Work double crochet around the post of the stitch inserting hook from the back.',
    symbol: 'DC with hook curve at bottom right',
    difficulty: 'Intermediate'
  },
  {
    usTerm: 'yo',
    ukTerm: 'yfwd / yoh',
    name: 'Yarn Over',
    description: 'Wrap the working yarn over the crochet hook from back to front.',
    symbol: 'Standard Loop',
    difficulty: 'Basic'
  },
  {
    usTerm: 'popcorn',
    ukTerm: 'popcorn',
    name: 'Popcorn Stitch',
    description: 'Work 5 dc into same stitch, drop loop, reinsert hook in 1st dc, grab dropped loop, pull through to cinch tight.',
    symbol: '5 DCs bound together',
    difficulty: 'Intermediate'
  },
  {
    usTerm: 'bobble',
    ukTerm: 'bobble',
    name: 'Bobble Stitch',
    description: 'Work 3 to 5 partial double crochets into same stitch, then yarn over and pull through all loops on hook.',
    symbol: '3-5 incomplete DCs joined at top',
    difficulty: 'Intermediate'
  },
  {
    usTerm: 'puff',
    ukTerm: 'puff',
    name: 'Puff Stitch',
    description: 'Yarn over, pull up loop 3 to 5 times into same stitch, yarn over and pull through all loops, chain 1 to lock.',
    symbol: 'Oval with loops',
    difficulty: 'Intermediate'
  }
];

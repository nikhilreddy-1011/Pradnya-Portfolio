/**
 * CV-derived content — the factual source of truth (Pradnya Salunkhe, CV, 2026).
 *
 * Used twice:
 *  1. `npm run seed` writes it into the CMS as the starting content.
 *  2. If no database is configured, the public site renders from it directly
 *     ("CV content" preview mode), so the design can be reviewed with zero setup.
 *
 * RULE: nothing here may go beyond what the CV states. No invented clients, years,
 * dimensions, awards or experience. Optional fields are simply left out.
 */
import type { Profile, Project, SiteSettings } from './types'

export const cvProfile: Profile = {
  name: 'Pradnya Salunkhe',
  role: 'Interior Designer',
  statusLine: 'Interior Design certification in progress',
  availability: 'Open to internship opportunities in interior design',
  photo: {
    url: '/profile/pradnya-salunkhe.jpg',
    alt: 'Portrait of Pradnya Salunkhe',
    width: 1107,
    height: 1421,
    focalX: 50,
    focalY: 38,
  },
  location: 'Pune, Maharashtra',
  email: 'pradnyasalunkhe1212@gmail.com',
  phone: '+91 9130015391',
  socialLinks: [], // Only real profiles, when supplied.
  aboutHeadline: 'A different perspective on space.',
  aboutIntro:
    'Pradnya Salunkhe is moving into interior design after more than eight years in banking and credit management.',
  aboutBody: [
    'She is currently pursuing a certified Interior Design course, working in AutoCAD, SketchUp and V-Ray through portfolio projects — including a French-inspired café — and learning on residential sites how design is actually carried out.',
    'Her credit roles meant sitting across the table from clients, visiting homes and businesses in person, checking every document, and delivering within strict turnaround times. Those habits — client interaction, attention to detail, budget discipline and end-to-end execution — now shape how she approaches a space.',
  ].join('\n\n'),
  transferable: [
    { title: 'Client interaction', text: 'Years of client engagement and client servicing in every interaction.' },
    { title: 'Attention to detail', text: 'Documentation, verification and audit work where small errors matter.' },
    { title: 'Budget discipline', text: 'Financial analysis and credit assessment — reading what a plan can deliver within its means.' },
    { title: 'Project execution', text: 'Managing a complete life-cycle end to end, from application to disbursement.' },
    { title: 'Working within strict timelines', text: 'Delivering within defined turnaround times.' },
    { title: 'Organisation', text: 'Structured, organised working — and training teams on policy.' },
  ],
  strengths: ['Adaptable', 'Hard-working', 'Performs well under challenging situations', 'Organised'],
  achievements: ['Best Performance of the Year, 2018–19'],
  languages: ['Marathi', 'Hindi', 'English'],
  skillGroups: [
    { title: 'Design', items: ['Space planning', 'Floor layouts', 'Residential interiors', 'Commercial interiors'] },
    { title: 'Software', items: ['AutoCAD', 'SketchUp', 'V-Ray (rendering)'] },
    { title: 'Currently learning', items: ['Advanced SketchUp'] },
    {
      title: 'Professional',
      items: ['Client interaction', 'Attention to detail', 'Organisation', 'Budget discipline', 'Timeline management'],
    },
  ],
  education: [
    {
      title: 'Interior Design Course',
      institution: 'Certified course',
      year: '2026',
      status: 'Pursuing — completion certificate awaited',
      isDesign: true,
    },
    { title: 'M.Com', institution: 'Pune University', year: '2013' },
    { title: 'B.Com', institution: 'Kolhapur University', year: '2011' },
  ],
  experience: [
    {
      role: 'Manager',
      organisation: 'HDFC Bank',
      start: 'Oct 2022',
      summary:
        'Comprehensive credit assessment and client engagement within defined turnaround times; managing the complete loan life-cycle from application to disbursement, including documentation and portfolio quality.',
    },
    {
      role: 'Credit Manager',
      organisation: 'ICICI Bank Ltd.',
      start: 'May 2022',
      end: 'Oct 2022',
      summary: 'Financial analysis, credit underwriting and sanctioning across Personal Loan, Home Loan and Credit Card products.',
    },
    {
      role: 'Branch Credit Manager',
      organisation: 'IDFC FIRST Bank Ltd.',
      start: 'Aug 2021',
      end: 'May 2022',
      summary: 'Business loan underwriting, client site visits and cross-functional coordination; policy training for teams.',
    },
    {
      role: 'Credit Officer',
      organisation: 'Ujjivan Small Finance Bank',
      start: 'Feb 2017',
      end: 'Aug 2021',
      summary: 'Credit underwriting and client discussions, including in-person house and business visits; trained branch teams on policy.',
    },
    {
      role: 'Credit Executive',
      organisation: 'Shriram City Union Finance Ltd.',
      start: 'Jul 2014',
      end: 'Feb 2015',
      summary: 'Processed personal and business loans with documentation and verification checks.',
    },
    {
      role: 'Audit Assistant',
      organisation: 'M/S V. L. Sawant & Co.',
      start: 'Jan 2013',
      end: 'May 2014',
      summary: 'Assisted with co-operative bank audits, voucher checking and stock / gold audits.',
    },
  ],
  siteVisits: {
    count: 2,
    title: 'Residential site visits',
    text: 'Two residential site visits to see how design decisions are carried out on the ground — as practical learning alongside the course.',
    points: ['On-ground execution', 'Material application', 'Construction sequencing'],
    images: [],
  },
}

export const cvSettings: SiteSettings = {
  heroEyebrow: 'Interior Design',
  heroHeadline: 'Spaces shaped around the way we live.',
  // Homepage hero: Pradnya's kitchen render (same file as the Kitchen project cover).
  heroImage: {
    url: '/projects/kitchen/cover.jpg',
    alt: 'L-shaped kitchen in matte sage cabinetry with a blue-teal tiled backsplash, warm under-cabinet lighting, glass-fronted wall cabinets, a tall pantry unit and marble-look flooring',
    width: 1779,
    height: 884,
    focalX: 55, // hood, cooktop and the glass-fronted corner — kept in view on narrow (phone) crops
    focalY: 50,
  },
  heroImageMobile: null,
  introText:
    'Residential and commercial interior concepts — planned in AutoCAD, modelled in SketchUp, rendered in V-Ray. Shaped by eight years of client-facing work in banking, where detail, budgets and timelines are never optional.',
  processIntro:
    'A working framework used across these portfolio projects — from the first reading of a brief to the final presentation.',
  processSteps: [
    { title: 'Understand', caption: 'Brief / requirements', text: 'Read the brief closely: who uses the space, what it must hold, what it must feel like.' },
    { title: 'Plan', caption: 'Space planning / zoning', text: 'Zoning, circulation and furniture layout worked out in AutoCAD before anything is modelled.' },
    { title: 'Design', caption: 'Furniture / materials / colours', text: 'A material and colour palette chosen to carry the concept through every room.' },
    { title: 'Model', caption: 'SketchUp / 3D', text: 'The plan becomes volume — walls, openings, joinery and furniture in SketchUp.' },
    { title: 'Visualise', caption: 'V-Ray', text: 'Light and material studied through V-Ray renders.' },
    { title: 'Refine', caption: 'Details / functionality', text: 'Details and day-to-day function checked and adjusted.' },
    { title: 'Present', caption: 'Render / walkthrough / final concept', text: 'Plans, renders and walkthroughs assembled into the final concept.' },
  ],
  contactHeadline: 'Have a space in mind?',
  contactText:
    'For internship opportunities, studio collaborations, or a conversation about a residential or commercial space — write, call, or use the form.',
  projectTypes: ['Residential interior', 'Commercial interior', 'Internship / studio opportunity', 'Other'],
  seoTitle: 'Pradnya Salunkhe — Interior Design Portfolio',
  seoDescription:
    'Interior design portfolio of Pradnya Salunkhe, Pune — residential and commercial interior concepts planned in AutoCAD, modelled in SketchUp and rendered in V-Ray.',
  ogImage: null,
}

export const cvCategories = [
  { title: 'Residential', slug: 'residential', order: 1 },
  { title: 'Commercial', slug: 'commercial', order: 2 },
]

/** Indicative tones only — labelled as such on the site until real material photos are uploaded. */
export const cvMaterials = [
  { name: 'Light oak wood', tone: '#C9A57B' },
  { name: 'Terracotta', tone: '#B5654A' },
  { name: 'Subway tile', tone: '#EDEAE3' },
  { name: 'Brass', tone: '#B08D57', description: 'Used as accents.' },
]

const empty = (): Pick<
  Project,
  | 'cover' | 'coverMobile' | 'process' | 'palette' | 'gallery' | 'beforeAfter' | 'floorPlans'
  | 'panoramas' | 'models' | 'videos' | 'hasPlan' | 'hasModel' | 'hasVideo' | 'seo'
> => ({
  cover: null,
  coverMobile: null,
  process: [],
  palette: [],
  gallery: [],
  beforeAfter: [],
  floorPlans: [],
  panoramas: [],
  models: [],
  videos: [],
  hasPlan: false,
  hasModel: false,
  hasVideo: false,
  seo: { image: null, noindex: false },
})

/** Web variants of the supplied renders live in public/projects/<project>/<image>.jpg (originals are kept untouched in assets/originals/portfolio-incoming/). */
const render = (project: string, file: string, width: number, height: number, alt: string, focalX = 50, focalY = 50) => ({
  url: `/projects/${project}/${file}.jpg`,
  alt,
  width,
  height,
  focalX,
  focalY,
})
const gal = (project: string, file: string, width: number, height: number, room: string, caption: string, alt: string, focalX = 50, focalY = 50, slug?: string) => ({
  image: render(project, file, width, height, alt, focalX, focalY),
  room,
  caption,
  slug,
  layout: 'full' as const,
})

export const cvProjects: Project[] = [
  {
    ...empty(),
    slug: 'cafe-lumiere',
    number: '01',
    title: 'Café Lumière',
    typology: 'French-inspired commercial café',
    category: { title: 'Commercial', slug: 'commercial' },
    credibility: 'portfolio-coursework',
    area: '1,350 sq.ft.',
    summary: 'A French-inspired café concept of 1,350 sq.ft., designed from brief to floor plan in AutoCAD as part of Interior Design coursework.',
    tools: ['AutoCAD'],
    featured: true,
    conceptStatement: 'Cozy, minimal-French.',
    concept:
      'A café built around a cozy, minimal-French character: light oak wood, terracotta and subway tile, finished with brass accents.',
    brief:
      'Designed from a defined design brief as part of Interior Design coursework, taking the café from brief to a complete floor plan.',
    programme: ['Window seating', 'Sofa corners', 'Billing counter', 'Kitchen', 'Washroom', 'Circulation'],
    spacePlanning:
      'The complete layout was planned in AutoCAD from the brief — window seating, sofa corners, billing counter, kitchen, washroom and circulation — with the furniture layout developed alongside the material and colour palette.',
    designDetails: [],
    materials: [
      { name: 'Light oak wood', texture: null, tone: '#C9A57B' },
      { name: 'Terracotta', texture: null, tone: '#B5654A' },
      { name: 'Subway tile', texture: null, tone: '#EDEAE3' },
      { name: 'Brass', texture: null, tone: '#B08D57', application: 'Accents' },
    ],
  },
  {
    // Everything below comes from Pradnya's own description of this kitchen.
    // Category (Residential) is inferred from the render; area, year and location are unknown and left out.
    ...empty(),
    slug: 'kitchen',
    number: '02',
    title: 'Kitchen',
    typology: 'L-shaped kitchen',
    category: { title: 'Residential', slug: 'residential' },
    credibility: 'portfolio',
    summary:
      'An L-shaped kitchen in matte sage cabinetry with a light countertop, a blue-teal decorative backsplash and warm under-cabinet lighting — modelled in SketchUp and presented as an interactive 360° view.',
    tools: ['SketchUp'],
    featured: false,
    // Cover: an ordinary single-view render (supplied by Pradnya) — never the 360° panorama.
    cover: {
      url: '/projects/kitchen/cover.jpg',
      alt: 'L-shaped kitchen in matte sage cabinetry with a blue-teal tiled backsplash, warm under-cabinet lighting, glass-fronted wall cabinets, a tall pantry unit and marble-look flooring',
      width: 1779,
      height: 884,
      focalX: 55, // hood, cooktop and the glass-fronted corner — kept in view on narrow (phone) crops
      focalY: 50,
    },
    // The 360° view. Only this 1774 × 887 image exists today. When the real 4K / 8K render arrives,
    // replace the files and list them here (or upload them in the CMS) — no viewer code changes.
    panoramas: [
      {
        id: 'kitchen-360',
        label: 'Kitchen',
        image: {
          url: '/panoramas/kitchen-360.jpg',
          alt: 'L-shaped kitchen with matte sage cabinetry, light countertop, blue-teal backsplash, warm under-cabinet lighting, marble-look flooring and a false ceiling with indirect lighting',
          width: 1774,
          height: 887,
        },
        sources: [{ kind: 'equirect', url: '/panoramas/kitchen-360.jpg', width: 1774, height: 887 }],
        initialYaw: 185,
        initialPitch: -6,
      },
    ],
    programme: [],
    designDetails: [
      { title: 'L-shaped layout', text: 'Sink, gas cooktop and a tall matching pantry / refrigerator unit arranged along an L.', image: null },
      { title: 'Matte sage cabinetry', text: 'Matte sage-green cabinets with a light countertop and a blue-teal decorative backsplash.', image: null },
      { title: 'Layered warm light', text: 'Warm under-cabinet lighting, and a false ceiling with warm indirect lighting.', image: null },
      { title: 'Finishes', text: 'Marble-look flooring, warm cream / beige walls and a dark kitchen hood.', image: null },
    ],
    materials: [],
  },

  /* ── Interior concept renders ───────────────────────────────────────────────────────────────
   * Ten ordinary single-view renders supplied by Pradnya, organised into eight projects.
   * They are editorial groupings of concept work — NOT claims of built or commissioned projects —
   * so no client, area, year, location, budget or software is stated: only what is visible in the renders.
   * None of these is a 360° panorama; `panoramas` stays empty so no 360° section is rendered for them.
   * Display names, categories and descriptions are Pradnya's own wording (see docs/CONTENT-GUIDE.md).
   */
  {
    ...empty(),
    slug: 'warm-contemporary-master-bedroom',
    number: '03',
    title: 'The Warm Contemporary Master Bedroom',
    typology: 'Bedroom Design',
    category: { title: 'Residential', slug: 'residential' },
    credibility: 'concept-render',
    summary:
      'A contemporary bedroom concept combining warm neutral finishes, natural wood tones, soft textiles, decorative wall detailing and layered ambient lighting.',
    tools: [],
    featured: false,
    cover: render('warm-contemporary-master-bedroom', 'warm-contemporary-master-bedroom', 1886, 834,
      'Contemporary bedroom with a bed against an arched, floral-patterned feature wall, a vertical wood-slatted panel beside it, a wood-framed dressing mirror, warm wooden flooring and a layered ceiling with concealed warm lighting', 46, 55),
    coverMobile: null,
    gallery: [
      gal('warm-contemporary-master-bedroom', 'warm-contemporary-master-bedroom', 1886, 834, 'The Warm Contemporary Master Bedroom',
        'A contemporary bedroom concept combining warm neutral finishes, natural wood tones, soft textiles, decorative wall detailing and layered ambient lighting.',
        'Wide view of a contemporary bedroom: an upholstered bed centred on an arched floral feature wall, a dark vertical wood panel and pendant light to the right, a dressing table and arched mirror to the left, a rug over wooden flooring and a stepped ceiling with warm cove lighting', 46, 55),
    ],
    programme: [],
    designDetails: [
      { title: 'Warm neutral finishes', text: 'A warm, neutral palette of cream walls and natural wood tones.', image: null },
      { title: 'Decorative wall detailing', text: 'An arched, floral-patterned feature wall behind the bed, with vertical wood slats alongside.', image: null },
      { title: 'Layered ambient lighting', text: 'Concealed warm lighting in the ceiling and along the floor edge.', image: null },
    ],
    materials: [],
  },
  {
    ...empty(),
    slug: 'ceiling-lighting-concepts',
    number: '04',
    title: 'Ceiling & Lighting Concepts',
    typology: 'Ceiling Design · Lighting',
    category: { title: 'Residential', slug: 'residential' },
    credibility: 'design-study',
    summary:
      'Two separate ceiling-design studies — a circular cove ceiling with a central chandelier, and a layered rectangular false ceiling with concealed warm lighting. Each is its own concept, shown here together.',
    tools: [],
    featured: false,
    cover: render('ceiling-lighting-concepts', 'circular-cove-ceiling-chandelier', 1387, 1134,
      'Ceiling with concentric circular cove rings lit by concealed warm light and a brass-toned chandelier at the centre', 50, 50),
    coverMobile: null,
    gallery: [
      gal('ceiling-lighting-concepts', 'circular-cove-ceiling-chandelier', 1387, 1134, 'Circular Cove Ceiling & Statement Chandelier',
        'A ceiling-design study featuring concentric circular forms, concealed warm lighting and a central statement chandelier.',
        'Looking up at a ceiling of concentric circular cove rings glowing with concealed warm light, with a spherical multi-bulb chandelier at the centre and recessed downlights along the edge', 50, 50, 'circular-cove-ceiling-chandelier'),
      gal('ceiling-lighting-concepts', 'layered-geometric-ceiling-cove-lighting', 1443, 1090, 'Layered Geometric Ceiling with Cove Lighting',
        'A geometric false-ceiling concept using layered rectangular forms, recessed detailing and concealed warm indirect lighting.',
        'Looking along a room to a ceiling of nested rectangular layers outlined in warm cove light, narrowing toward a lit central recess, with downlights set into the outer layer', 50, 50, 'layered-geometric-ceiling-cove-lighting'),
    ],
    programme: [],
    designDetails: [
      { title: 'Concentric circular forms', text: 'Stepped circular coves around a central chandelier.', image: null },
      { title: 'Layered rectangular forms', text: 'Nested rectangular layers with recessed detailing.', image: null },
      { title: 'Concealed warm lighting', text: 'Both studies use concealed, warm indirect light to define the ceiling edges.', image: null },
    ],
    materials: [],
  },
  {
    ...empty(),
    slug: 'playful-pink-oak-kids-bedroom',
    number: '05',
    title: 'A Playful Pink & Oak Kids’ Bedroom',
    typology: 'Kids’ Bedroom',
    category: { title: 'Residential', slug: 'residential' },
    credibility: 'concept-render',
    summary:
      'A playful bedroom concept combining soft pink cabinetry, comfortable seating, warm wood finishes, decorative lighting and an integrated staircase.',
    tools: [],
    featured: false,
    cover: render('playful-pink-oak-kids-bedroom', 'playful-pink-oak-kids-bedroom', 1357, 1159,
      'Kids’ bedroom with soft pink cabinetry, an arched cushioned bed nook with circular cut-outs, a built-in corner seat, a wooden staircase and a round rug on warm wood flooring', 45, 55),
    coverMobile: null,
    gallery: [
      gal('playful-pink-oak-kids-bedroom', 'playful-pink-oak-kids-bedroom', 1357, 1159, 'A Playful Pink & Oak Kids’ Bedroom',
        'A playful bedroom concept combining soft pink cabinetry, comfortable seating, warm wood finishes, decorative lighting and an integrated staircase.',
        'Pink and cream kids’ bedroom: an arched bed nook with a pink cushioned bed and drawers, circular cut-outs and lit circles above, a built-in corner banquette, a wooden staircase beside a window and a sculptural ceiling light', 45, 55),
    ],
    programme: [],
    designDetails: [
      { title: 'Soft pink cabinetry', text: 'Rounded pink joinery forms the bed nook, drawers and seating.', image: null },
      { title: 'Integrated staircase', text: 'A wooden staircase is built into the composition beside the bed nook.', image: null },
      { title: 'Warm wood and decorative lighting', text: 'Wood flooring and treads balance the pink, with circular lights and a sculptural ceiling fixture.', image: null },
    ],
    materials: [],
  },
  {
    // A SEPARATE project from the sage "Kitchen" (04). It has no panorama and is not linked to that 360° view.
    ...empty(),
    slug: 'contemporary-teal-kitchen',
    number: '06',
    title: 'Contemporary Teal Kitchen with Marble Finishes',
    typology: 'Kitchen Design',
    category: { title: 'Residential', slug: 'residential' },
    credibility: 'concept-render',
    summary:
      'A contemporary kitchen concept featuring deep teal cabinetry, a marble-look backsplash, warm illuminated shelving and integrated kitchen storage.',
    tools: [],
    featured: false,
    cover: render('contemporary-teal-kitchen', 'contemporary-teal-kitchen-marble-finishes', 1291, 1041,
      'L-shaped kitchen in deep teal cabinetry with a marble-look backsplash, black countertop, open shelves lit with warm light, a tall unit with an illuminated arched niche and marble-look flooring', 55, 50),
    coverMobile: null,
    gallery: [
      gal('contemporary-teal-kitchen', 'contemporary-teal-kitchen-marble-finishes', 1291, 1041, 'Contemporary Teal Kitchen with Marble Finishes',
        'A contemporary kitchen concept featuring deep teal cabinetry, a marble-look backsplash, warm illuminated shelving and integrated kitchen storage.',
        'Corner view of a deep teal kitchen: tall teal storage units, a lit arched display niche, floating shelves with warm lighting over a marble-look backsplash, a gas hob and sink on a dark countertop, and marble-look flooring', 55, 50),
    ],
    programme: [],
    designDetails: [
      { title: 'Deep teal cabinetry', text: 'Flat-fronted teal cabinets with integrated tall storage.', image: null },
      { title: 'Marble-look backsplash', text: 'A veined, marble-look backsplash runs behind the shelves and worktop.', image: null },
      { title: 'Warm illuminated shelving', text: 'Open shelves and an arched niche are lit with warm light.', image: null },
    ],
    materials: [],
  },
  {
    ...empty(),
    slug: 'living-room-decorative-swing-feature-wall',
    number: '07',
    title: 'Living Room with Decorative Swing & Floral Feature Wall',
    typology: 'Living Room Design',
    category: { title: 'Residential', slug: 'residential' },
    credibility: 'concept-render',
    summary:
      'A living-area concept featuring decorative floral wall treatment, warm wood detailing, integrated illuminated niches and a statement swing-style seating arrangement.',
    tools: [],
    featured: false,
    cover: render('living-room-decorative-swing', 'living-room-decorative-swing-feature-wall', 1388, 1133,
      'Living area with a hanging swing seat on the left, a floral-patterned feature wall with carved wood panels and illuminated niches, a white oval console, a patterned ceiling panel and marble-look flooring', 50, 50),
    coverMobile: null,
    gallery: [
      gal('living-room-decorative-swing', 'living-room-decorative-swing-feature-wall', 1388, 1133, 'Living Room with Decorative Swing & Floral Feature Wall',
        'A living-area concept featuring decorative floral wall treatment, warm wood detailing, integrated illuminated niches and a statement swing-style seating arrangement.',
        'Living area seen from the entrance: a rope-hung swing seat with cushions beside a window, a floral feature wall with a carved arched wood panel and lit niches, an oval white console with drawers, a wooden cot-style unit on the right and a coffered ceiling with a pendant light', 50, 50),
    ],
    programme: [],
    designDetails: [
      { title: 'Decorative floral wall', text: 'A floral-patterned wall treatment forms the backdrop of the room.', image: null },
      { title: 'Illuminated niches', text: 'Arched niches and carved wood panels are lit with warm light.', image: null },
      { title: 'Statement swing seating', text: 'A hanging, swing-style seat is the focal piece of the seating arrangement.', image: null },
    ],
    materials: [],
  },
  {
    ...empty(),
    slug: 'contemporary-wardrobe-open-display-shelving',
    number: '08',
    title: 'Contemporary Wardrobe with Open Display Shelving',
    typology: 'Storage Design · Wardrobes',
    category: { title: 'Residential', slug: 'residential' },
    credibility: 'design-study',
    summary:
      'A minimalist storage concept combining clean-lined wardrobe doors, natural wood framing and illuminated open display shelving.',
    tools: [],
    featured: false,
    cover: render('contemporary-wardrobe-open-shelving', 'contemporary-wardrobe-open-display-shelving', 1316, 1195,
      'Contemporary wardrobe with two cream doors and long black bar handles, framed in natural wood beside a column of open wood shelves lit with warm light', 50, 45),
    coverMobile: null,
    gallery: [
      gal('contemporary-wardrobe-open-shelving', 'contemporary-wardrobe-open-display-shelving', 1316, 1195, 'Contemporary Wardrobe with Open Display Shelving',
        'A minimalist storage concept combining clean-lined wardrobe doors, natural wood framing and illuminated open display shelving.',
        'Front view of a full-height wardrobe: two large cream doors with black vertical bar handles, a natural wood frame, and a column of open wooden shelves with warm concealed lighting, standing on marble-look flooring', 50, 50),
    ],
    programme: [],
    designDetails: [
      { title: 'Clean-lined doors', text: 'Two flat cream doors with black bar handles keep the front minimal.', image: null },
      { title: 'Natural wood framing', text: 'A wood frame and shelf column add warmth to the cream surfaces.', image: null },
      { title: 'Illuminated open shelving', text: 'Open shelves with concealed warm light provide a display area.', image: null },
    ],
    materials: [],
  },
  {
    ...empty(),
    slug: 'refined-study-nook-illuminated-shelving',
    number: '09',
    title: 'A Refined Study Nook with Illuminated Shelving',
    typology: 'Study & Workspace Design',
    category: { title: 'Residential', slug: 'residential' },
    credibility: 'portfolio-concept',
    summary:
      'A compact study-space concept integrating a built-in desk, coordinated storage, display shelving and warm concealed lighting.',
    tools: [],
    featured: false,
    cover: render('refined-study-nook', 'refined-study-nook-illuminated-shelving', 1297, 1213,
      'Compact study nook between muted green walls with a built-in white desk, a blush-pink tall cabinet, open wood shelving, wall shelves with warm lighting and a grey upholstered chair', 50, 50),
    coverMobile: null,
    gallery: [
      gal('refined-study-nook', 'refined-study-nook-illuminated-shelving', 1297, 1213, 'A Refined Study Nook with Illuminated Shelving',
        'A compact study-space concept integrating a built-in desk, coordinated storage, display shelving and warm concealed lighting.',
        'Study nook seen straight on: a floating white desk with a grey chair, a tall blush-pink cabinet and open wooden shelf unit on the left, lit floating shelves above the desk with small plants and books, muted green side walls and marble-look flooring', 50, 50),
    ],
    programme: [],
    designDetails: [
      { title: 'Built-in desk', text: 'A wall-mounted desk is integrated with the surrounding storage.', image: null },
      { title: 'Coordinated storage', text: 'A tall blush-pink cabinet and open wooden shelves sit beside the desk.', image: null },
      { title: 'Warm concealed lighting', text: 'Floating display shelves are lit with warm concealed light.', image: null },
    ],
    materials: [],
  },
  {
    ...empty(),
    slug: 'tv-units-media-walls',
    number: '10',
    title: 'TV Units & Media Walls',
    typology: 'Living Room · Media Wall Design',
    category: { title: 'Residential', slug: 'residential' },
    credibility: 'design-study',
    summary:
      'Two separate media-wall concepts — one with vertical wood slats and a floating console, one with a central decorative panel, warm wood storage and illuminated niches. Each is its own concept, shown here together.',
    tools: [],
    featured: false,
    cover: render('tv-units-media-walls', 'slatted-wood-tv-wall-floating-console', 1299, 1211,
      'Media wall with vertical wood slats, lit display shelves, a wall-mounted television and a white floating console, under a layered wood and cove-lit ceiling', 50, 55),
    coverMobile: null,
    gallery: [
      gal('tv-units-media-walls', 'slatted-wood-tv-wall-floating-console', 1299, 1211, 'Slatted-Wood TV Wall with Floating Console',
        'A media-wall concept combining vertical wood slats, integrated display shelves, a wall-mounted television and a clean-lined console.',
        'Straight-on view of a media wall: vertical wood slats with lit display shelves to the left, a wall-mounted television on a white panel, a floating white console with a deer figurine and books, beneath an angular wood ceiling feature with warm cove light', 50, 55, 'slatted-wood-tv-wall-floating-console'),
      gal('tv-units-media-walls', 'marble-feature-tv-wall-warm-wood-storage', 1690, 931, 'Marble Feature TV Wall with Warm-Wood Storage',
        'A contemporary media-wall concept featuring a central decorative feature panel, warm wood storage, illuminated display niches and integrated television placement.',
        'Long view down a room to a media wall with an arched decorative panel and dark slatted section, warm wood storage with lit niches, an integrated television, and an ornate layered ceiling with cove lighting and a ceiling fan', 50, 50, 'marble-feature-tv-wall-warm-wood-storage'),
    ],
    // The 360° view: a genuine 2:1 equirectangular panorama of the same living space (the file as supplied is
    // 2576 × 1288 — NOT 4K/8K). The cover stays the ordinary slatted-wood render; the panorama is only ever
    // used in the 360° section. Replace the file (or attach a true 4096/8192 px master in the CMS) — no code changes.
    panoramas: [
      {
        id: 'tv-wall-living-space',
        label: 'Living space',
        description: 'Explore the TV wall, illuminated shelving, console and the surrounding interior.',
        image: {
          url: '/panoramas/tv-units-media-walls-panorama.jpg',
          alt: 'Warm contemporary living room: a wall-mounted television beside vertical wood slats with lit shelves and a floating console, a round brass mirror above a wall-hung console, framed landscape art, cream sofas, a layered ceiling with warm cove lighting and glossy marble-look flooring',
          width: 2576,
          height: 1288,
        },
        sources: [{ kind: 'equirect', url: '/panoramas/tv-units-media-walls-panorama.jpg', width: 2576, height: 1288 }],
        initialYaw: 181,
        initialPitch: -9,
      },
    ],
    programme: [],
    designDetails: [
      { title: 'Vertical wood slats', text: 'One concept uses vertical wood slats with integrated display shelves.', image: null },
      { title: 'Central decorative panel', text: 'The other centres on an arched decorative feature panel with warm wood storage.', image: null },
      { title: 'Illuminated display niches', text: 'Both walls integrate lit shelves or niches around the television.', image: null },
    ],
    materials: [],
  },
]

'use client';

export type CartoonSpriteKind = 'cat' | 'rose' | 'chocolate' | 'magnet' | 'obstacle' | 'monster' | 'runner' | 'fierceMonster' | 'exploder' | 'boss' | 'projectile' | 'blueKey' | 'coin' | 'heart' | 'doubleScore' | 'shadowHunter' | 'shadowRunner' | 'shadowBrute' | 'shadowBoss' | 'crystalHunter' | 'crystalRunner' | 'crystalBrute' | 'crystalBoss' | 'emberHunter' | 'emberRunner' | 'emberBrute' | 'emberBoss';



function themedCreatureSvg(primary: string, secondary: string, accent: string, form: 'hunter' | 'runner' | 'brute' | 'boss', biome: 'shadow' | 'crystal' | 'ember'): string {
  const body = form === 'runner'
    ? `<path d="M27 42 Q13 34 7 19 Q25 18 38 34 L62 33 Q77 17 94 20 Q86 39 72 46 L66 71 L51 84 L35 70Z" fill="url(#hide)" stroke="#0B1220" stroke-width="4"/><path d="M32 51 L13 69 L35 65 M67 51 L88 69 L65 64" fill="none" stroke="${accent}" stroke-width="8" stroke-linecap="round"/><path d="M36 70 L28 91 L44 89 L50 74 L57 90 L73 93 L64 69" fill="${secondary}" stroke="#0B1220" stroke-width="4" stroke-linejoin="round"/>`
    : form === 'brute'
      ? `<path d="M24 38 L12 23 L35 29 L43 18 L57 18 L66 29 L88 22 L76 43 L81 71 L67 87 L33 87 L19 70Z" fill="url(#hide)" stroke="#0B1220" stroke-width="5" stroke-linejoin="round"/><path d="M24 48 L9 62 L18 78 L34 66 M76 48 L91 62 L82 78 L66 66" fill="${secondary}" stroke="#0B1220" stroke-width="4"/><path d="M30 80 L24 96 L43 91 L50 78 L58 91 L78 96 L70 79" fill="${secondary}" stroke="#0B1220" stroke-width="3"/>`
      : form === 'boss'
        ? `<path d="M18 44 L5 12 L32 26 L42 5 L53 25 L77 5 L72 31 L95 22 L82 52 L77 80 L61 94 L39 94 L22 80Z" fill="url(#hide)" stroke="#0B1220" stroke-width="5" stroke-linejoin="round"/><path d="M19 57 L4 76 L24 84 M81 57 L96 76 L76 84" fill="none" stroke="${accent}" stroke-width="9" stroke-linecap="round"/><path d="M37 74 L50 66 L63 74 L58 88 L42 88Z" fill="${accent}" stroke="#0B1220" stroke-width="3"/>`
        : `<path d="M31 43 L17 19 L40 29 L50 9 L60 29 L83 18 L69 44 L73 75 L50 91 L27 75Z" fill="url(#hide)" stroke="#0B1220" stroke-width="4" stroke-linejoin="round"/><path d="M29 53 L12 64 L21 76 L38 67 M71 53 L88 64 L79 76 L62 67" fill="${secondary}" stroke="#0B1220" stroke-width="3"/>`;
  const biomeOrnament = biome === 'shadow'
    ? `<path d="M23 43 Q2 28 13 10 Q17 32 35 31 M77 43 Q98 28 87 10 Q83 32 65 31" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round" opacity=".9"/><circle cx="18" cy="25" r="3" fill="${accent}"/><circle cx="82" cy="25" r="3" fill="${accent}"/>`
    : biome === 'crystal'
      ? `<path d="M24 48 L11 26 L26 32 L31 12 L45 31 L50 8 L58 31 L75 13 L73 35 L90 27 L77 53" fill="${accent}" stroke="${secondary}" stroke-width="3" stroke-linejoin="round" opacity=".92"/><path d="M19 68 L8 78 L22 82 M81 68 L92 78 L78 82" fill="none" stroke="${primary}" stroke-width="5" stroke-linecap="round"/>`
      : `<path d="M20 49 Q4 35 17 13 Q20 29 34 31 Q27 14 43 4 Q43 26 52 30 Q54 13 73 7 Q68 27 82 31 Q98 43 79 53" fill="${accent}" stroke="${secondary}" stroke-width="3" stroke-linejoin="round" opacity=".9"/><path d="M18 69 L7 83 L27 78 M82 69 L93 83 L73 78" fill="none" stroke="${accent}" stroke-width="5" stroke-linecap="round"/>`;
  const eyes = form === 'boss'
    ? `<ellipse cx="37" cy="48" rx="6" ry="8" fill="${accent}"/><ellipse cx="63" cy="48" rx="6" ry="8" fill="${accent}"/><circle cx="50" cy="59" r="4" fill="#FFF7D6"/>`
    : `<path d="M32 47 L45 50 M68 47 L55 50" stroke="#07111F" stroke-width="5" stroke-linecap="round"/><ellipse cx="40" cy="54" rx="5" ry="6" fill="${accent}"/><ellipse cx="60" cy="54" rx="5" ry="6" fill="${accent}"/><circle cx="41" cy="53" r="2" fill="#07111F"/><circle cx="59" cy="53" r="2" fill="#07111F"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><linearGradient id="hide" x1="0" y1="0" x2="1" y2="1"><stop stop-color="${primary}"/><stop offset=".55" stop-color="${secondary}"/><stop offset="1" stop-color="#111827"/></linearGradient><radialGradient id="aura"><stop stop-color="${accent}" stop-opacity=".65"/><stop offset="1" stop-color="${accent}" stop-opacity="0"/></radialGradient></defs><circle cx="50" cy="53" r="46" fill="url(#aura)"/>${biomeOrnament}<ellipse cx="50" cy="94" rx="29" ry="4" fill="#020617" opacity=".32"/>${body}<path d="M34 37 Q32 16 50 13 Q68 16 66 37 L62 57 Q50 65 38 57Z" fill="url(#hide)" stroke="#0B1220" stroke-width="4"/>${eyes}<path d="M43 68 Q50 73 57 68" fill="none" stroke="#F8FAFC" stroke-width="2.5" stroke-linecap="round"/><path d="M50 75 L44 84 L56 84Z" fill="${accent}" stroke="#0B1220" stroke-width="2"/></svg>`;
}

const CARTOON_SVGS: Record<CartoonSpriteKind, string> = {
  cat: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="catGlow" cx="50%" cy="45%" r="50%">
        <stop offset="0%" stop-color="#FFFBEB"/>
        <stop offset="100%" stop-color="#FDE68A"/>
      </radialGradient>
    </defs>
    <!-- Cute Ears -->
    <path d="M22 44 L16 14 L42 28 Z" fill="#FED7AA" stroke="#9A3412" stroke-width="3" stroke-linejoin="round"/>
    <path d="M78 44 L84 14 L58 28 Z" fill="#FED7AA" stroke="#9A3412" stroke-width="3" stroke-linejoin="round"/>
    <path d="M24 38 L21 20 L37 30 Z" fill="#FDA4AF"/>
    <path d="M76 38 L79 20 L63 30 Z" fill="#FDA4AF"/>
    <!-- Chubby Face -->
    <ellipse cx="50" cy="54" rx="34" ry="30" fill="#FFEDD5" stroke="#9A3412" stroke-width="3"/>
    <!-- Forehead Stripes -->
    <path d="M44 26 L46 34 M50 24 L50 35 M56 26 L54 34" stroke="#EA580C" stroke-width="3" stroke-linecap="round"/>
    <!-- Big Twinkling Eyes -->
    <circle cx="36" cy="52" r="5.5" fill="#1E293B"/>
    <circle cx="64" cy="52" r="5.5" fill="#1E293B"/>
    <circle cx="34.5" cy="50" r="2" fill="#FFFFFF"/>
    <circle cx="62.5" cy="50" r="2" fill="#FFFFFF"/>
    <!-- Rosy Cheeks -->
    <ellipse cx="27" cy="60" rx="5.5" ry="3.5" fill="#FDA4AF" opacity="0.85"/>
    <ellipse cx="73" cy="60" rx="5.5" ry="3.5" fill="#FDA4AF" opacity="0.85"/>
    <!-- Cute Nose & Smile -->
    <polygon points="47,57 53,57 50,61" fill="#FB7185"/>
    <path d="M42 63 Q46 68 50 63 Q54 68 58 63" fill="none" stroke="#9A3412" stroke-width="2.6" stroke-linecap="round"/>
    <!-- Whiskers -->
    <path d="M13 54 L26 56 M12 61 L26 60 M87 54 L74 56 M88 61 L74 60" stroke="#9A3412" stroke-width="2.2" stroke-linecap="round"/>
    <!-- Red Collar & Golden Bell -->
    <path d="M28 79 Q50 87 72 79" fill="none" stroke="#E11D48" stroke-width="6" stroke-linecap="round"/>
    <circle cx="50" cy="85" r="6" fill="#FBBF24" stroke="#B45309" stroke-width="2"/>
  </svg>`,

  rose: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <!-- Stem & Leaves -->
    <path d="M50 56 Q48 76 50 93" fill="none" stroke="#15803D" stroke-width="5.5" stroke-linecap="round"/>
    <path d="M49 74 Q30 62 24 72 Q35 83 49 77 Z" fill="#22C55E" stroke="#14532D" stroke-width="2.5"/>
    <path d="M50 68 Q70 56 76 66 Q65 78 50 71 Z" fill="#16A34A" stroke="#14532D" stroke-width="2.5"/>
    <!-- Outer Rose Petals -->
    <circle cx="36" cy="38" r="17" fill="#E11D48" stroke="#881337" stroke-width="2.5"/>
    <circle cx="64" cy="38" r="17" fill="#E11D48" stroke="#881337" stroke-width="2.5"/>
    <circle cx="50" cy="46" r="19" fill="#BE123C" stroke="#881337" stroke-width="2.5"/>
    <!-- Inner Swirling Rose Petals -->
    <path d="M32 34 Q50 10 68 34 Q68 54 50 56 Q32 54 32 34 Z" fill="#F43F5E" stroke="#881337" stroke-width="2.5"/>
    <path d="M40 34 Q50 22 60 34 Q58 46 50 46 Q42 46 40 34 Z" fill="#FB7185" stroke="#9F1239" stroke-width="2"/>
    <path d="M45 33 Q50 28 55 33 Q52 39 47 36" fill="none" stroke="#FFE4E6" stroke-width="2.5" stroke-linecap="round"/>
  </svg>`,

  chocolate: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <g transform="rotate(-10 50 50)">
      <!-- Main Chocolate Bar -->
      <rect x="24" y="14" width="52" height="72" rx="8" fill="#5C2D16" stroke="#3B1A0B" stroke-width="3"/>
      <!-- Raised Cocoa Pips -->
      <rect x="30" y="20" width="17" height="14" rx="3" fill="#78350F" stroke="#451A03" stroke-width="1.8"/>
      <rect x="53" y="20" width="17" height="14" rx="3" fill="#78350F" stroke="#451A03" stroke-width="1.8"/>
      <rect x="30" y="38" width="17" height="14" rx="3" fill="#78350F" stroke="#451A03" stroke-width="1.8"/>
      <rect x="53" y="38" width="17" height="14" rx="3" fill="#78350F" stroke="#451A03" stroke-width="1.8"/>
      <!-- Gloss Highlights -->
      <path d="M33 23 L41 23 M56 23 L64 23" stroke="#D97706" stroke-width="2" stroke-linecap="round" opacity="0.65"/>
      <!-- Gold Foil Trim -->
      <path d="M22 54 L36 49 L50 55 L64 49 L78 54 L78 65 L22 65 Z" fill="#FBBF24" stroke="#B45309" stroke-width="2"/>
      <!-- Crimson Wrapper -->
      <rect x="22" y="59" width="56" height="29" rx="6" fill="#E11D48" stroke="#881337" stroke-width="2.8"/>
      <!-- Cute Heart Emblem on Wrapper -->
      <path d="M50 79 C43 73 42 66 50 70 C58 66 57 73 50 79 Z" fill="#FFE4E6"/>
    </g>
  </svg>`,

  doubleScore: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <radialGradient id="scoreCore" cx="35%" cy="25%" r="80%"><stop stop-color="#FFF7C2"/><stop offset=".45" stop-color="#FBBF24"/><stop offset="1" stop-color="#B45309"/></radialGradient>
      <linearGradient id="scoreEdge" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FEF3C7"/><stop offset="1" stop-color="#D97706"/></linearGradient>
    </defs>
    <path d="M50 4 62 15 78 12 83 28 96 39 88 54 92 70 75 78 67 94 50 88 33 94 25 78 8 70 12 54 4 39 17 28 22 12 38 15Z" fill="#FDE68A" opacity=".42"/>
    <circle cx="50" cy="50" r="34" fill="url(#scoreCore)" stroke="#92400E" stroke-width="5"/>
    <circle cx="50" cy="50" r="27" fill="none" stroke="url(#scoreEdge)" stroke-width="3"/>
    <path d="M34 35 Q50 23 66 35" fill="none" stroke="#FFF7D6" stroke-width="4" stroke-linecap="round" opacity=".9"/>
    <text x="50" y="61" text-anchor="middle" font-family="Arial,sans-serif" font-size="26" font-weight="900" fill="#78350F" stroke="#FFFBEB" stroke-width="1.2" paint-order="stroke">2×</text>
    <path d="M14 11 18 20 27 24 18 28 14 37 10 28 1 24 10 20Z M84 65 87 72 94 75 87 78 84 85 81 78 74 75 81 72Z" fill="#fff"/>
  </svg>`,

  obstacle: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <!-- Grumpy Dark Storm Cloud -->
    <path d="M24 60 C13 60 10 44 22 39 C23 24 41 18 52 27 C61 17 81 24 80 40 C90 44 88 60 76 60 Z"
      fill="#475569" stroke="#1E293B" stroke-width="3.2" stroke-linejoin="round"/>
    <!-- Highlight Puff -->
    <path d="M28 34 Q36 25 48 28" fill="none" stroke="#94A3B8" stroke-width="3" stroke-linecap="round"/>
    <!-- Grumpy Eyes & Eyebrows -->
    <path d="M33 41 L43 45 M67 41 L57 45" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/>
    <circle cx="38" cy="48" r="3" fill="#F8FAFC"/>
    <circle cx="62" cy="48" r="3" fill="#F8FAFC"/>
    <!-- Glowing Golden Lightning Bolt -->
    <polygon points="53,54 39,74 50,74 44,93 66,69 54,69" fill="#FACC15" stroke="#B45309" stroke-width="2.5" stroke-linejoin="round"/>
  </svg>`,

  monster: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="archerHide" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#99F6E4"/><stop offset=".58" stop-color="#0F766E"/><stop offset="1" stop-color="#042F2E"/></linearGradient><linearGradient id="archerArmor" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#A7F3D0"/><stop offset="1" stop-color="#115E59"/></linearGradient></defs>
  <ellipse cx="50" cy="94" rx="28" ry="4" fill="#020617" opacity=".28"/>
  <!-- legs and boots -->
  <path d="M39 65 L34 84 L29 91 L43 92 L49 72 M59 65 L65 83 L72 90 L58 93 L52 72" fill="#0F766E" stroke="#042F2E" stroke-width="4" stroke-linejoin="round"/>
  <path d="M28 88 L44 88 L46 95 L25 95 Z M58 88 L75 88 L78 95 L57 95 Z" fill="#334155" stroke="#0F172A" stroke-width="2.5"/>
  <!-- arms -->
  <path d="M34 43 Q22 49 18 63 L25 68 L42 55 M66 43 Q78 47 79 60 L72 66 L61 54" fill="none" stroke="#0F766E" stroke-width="10" stroke-linecap="round"/>
  <path d="M18 62 L13 69 M79 59 L84 66" stroke="#99F6E4" stroke-width="6" stroke-linecap="round"/>
  <!-- tunic and chest armor -->
  <path d="M35 40 Q50 34 65 40 L70 68 Q50 77 30 68 Z" fill="url(#archerArmor)" stroke="#042F2E" stroke-width="4"/>
  <path d="M39 45 L61 45 L58 64 L42 64 Z" fill="#134E4A" stroke="#5EEAD4" stroke-width="2.5"/>
  <path d="M50 45 L50 66 M38 54 L62 54" stroke="#FDE68A" stroke-width="2.5"/>
  <!-- pointed ears and head -->
  <path d="M34 22 L20 9 L25 34 Z M66 22 L80 9 L75 34 Z" fill="#7DD3FC" stroke="#075985" stroke-width="3"/>
  <path d="M31 22 Q32 8 50 8 Q68 8 69 24 L65 42 Q50 52 35 42 Z" fill="url(#archerHide)" stroke="#042F2E" stroke-width="4"/>
  <path d="M35 25 L45 28 M65 25 L55 28" stroke="#042F2E" stroke-width="4" stroke-linecap="round"/>
  <path d="M37 30 Q43 24 47 32 L44 37 L37 35 Z M63 30 Q57 24 53 32 L56 37 L63 35 Z" fill="#FDE047" stroke="#713F12" stroke-width="1.8"/>
  <circle cx="42" cy="32" r="2" fill="#0F172A"/><circle cx="58" cy="32" r="2" fill="#0F172A"/>
  <path d="M43 42 Q50 47 57 41" stroke="#042F2E" stroke-width="3" fill="none" stroke-linecap="round"/>
  <path d="M46 42 L49 47 L52 42" fill="#F8FAFC"/>
  <!-- visible wooden bow -->
  <path d="M79 30 Q96 48 80 72" fill="none" stroke="#92400E" stroke-width="5" stroke-linecap="round"/>
  <path d="M79 30 L80 72" stroke="#FDE68A" stroke-width="1.5"/>
  <path d="M77 50 L91 43 L87 50 L91 57 Z" fill="#CBD5E1" stroke="#475569" stroke-width="1.8"/>
</svg>` ,

  runner: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="runnerBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FDE68A"/><stop offset=".48" stop-color="#EA580C"/><stop offset="1" stop-color="#7C2D12"/></linearGradient></defs>
  <ellipse cx="49" cy="94" rx="30" ry="4" fill="#020617" opacity=".3"/>
  <!-- long sprinting legs -->
  <path d="M39 64 Q31 75 18 79 L9 91 L23 94 L34 84 L51 74 M60 63 Q69 75 76 78 L92 75 L96 84 L76 91 L58 78" fill="#9A3412" stroke="#431407" stroke-width="4" stroke-linejoin="round"/>
  <path d="M9 88 L25 88 L24 96 L5 96 Z M82 88 L97 81 L100 89 L86 97 Z" fill="#1E293B" stroke="#0F172A" stroke-width="2"/>
  <!-- arms raised for running -->
  <path d="M35 43 Q20 43 14 28 L7 23 M64 42 Q78 38 83 24 L94 20" fill="none" stroke="#EA580C" stroke-width="10" stroke-linecap="round"/>
  <circle cx="7" cy="22" r="6" fill="#FDE68A" stroke="#7C2D12" stroke-width="2.5"/><circle cx="94" cy="19" r="6" fill="#FDE68A" stroke="#7C2D12" stroke-width="2.5"/>
  <!-- body -->
  <path d="M35 39 Q49 33 65 39 L68 68 Q50 77 31 67 Z" fill="url(#runnerBody)" stroke="#431407" stroke-width="4"/>
  <path d="M40 45 L60 45 L57 64 L43 64 Z" fill="#7C2D12" opacity=".55"/>
  <path d="M40 50 L60 58 M59 49 L41 60" stroke="#FDE68A" stroke-width="2.5"/>
  <!-- head with swept-back horns -->
  <path d="M36 20 L16 8 L26 31 M64 20 L84 8 L74 31" fill="#F97316" stroke="#7C2D12" stroke-width="4" stroke-linejoin="round"/>
  <path d="M33 19 Q50 5 67 20 L65 41 Q50 53 35 41 Z" fill="#FDBA74" stroke="#7C2D12" stroke-width="4"/>
  <path d="M35 27 L46 31 M65 27 L54 31" stroke="#431407" stroke-width="4" stroke-linecap="round"/>
  <path d="M37 31 Q44 26 48 35 L43 39 L37 36 Z M63 31 Q56 26 52 35 L57 39 L63 36 Z" fill="#FEF08A" stroke="#9A3412" stroke-width="2"/>
  <circle cx="43" cy="34" r="2.5" fill="#111827"/><circle cx="57" cy="34" r="2.5" fill="#111827"/>
  <path d="M42 44 Q50 50 58 43 L55 50 L50 47 L46 51 Z" fill="#7F1D1D" stroke="#431407" stroke-width="2"/>
  <path d="M43 44 L46 49 L49 44 M53 44 L56 49 L59 44" stroke="#FFF7ED" stroke-width="2.5"/>
</svg>` ,

  fierceMonster: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="fierceBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FDA4AF"/><stop offset=".45" stop-color="#BE123C"/><stop offset="1" stop-color="#3F0714"/></linearGradient><linearGradient id="fierceMetal" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#64748B"/><stop offset="1" stop-color="#0F172A"/></linearGradient></defs>
  <ellipse cx="50" cy="95" rx="34" ry="4" fill="#020617" opacity=".42"/>
  <!-- heavy armored legs -->
  <path d="M37 64 L31 83 L25 91 L46 92 L50 73 M62 64 L68 83 L76 91 L55 93 L51 73" fill="#7F1D1D" stroke="#450A0A" stroke-width="5" stroke-linejoin="round"/>
  <path d="M23 86 L45 86 L48 96 L20 96 Z M55 86 L78 86 L82 96 L53 96 Z" fill="url(#fierceMetal)" stroke="#020617" stroke-width="3"/>
  <!-- jagged arms and claws -->
  <path d="M34 42 L19 53 L10 70 L20 76 L37 62 M66 42 L81 53 L90 70 L80 76 L63 62" fill="none" stroke="#BE123C" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M13 70 L5 80 L18 78 L23 88 L28 75 M87 70 L95 80 L82 78 L77 88 L72 75" fill="#FCA5A5" stroke="#450A0A" stroke-width="2.5"/>
  <!-- plated chest -->
  <path d="M32 38 L50 31 L68 38 L72 68 Q50 80 28 68 Z" fill="url(#fierceBody)" stroke="#450A0A" stroke-width="5"/>
  <path d="M35 44 L50 39 L65 44 L62 65 L50 71 L38 65 Z" fill="url(#fierceMetal)" stroke="#FCA5A5" stroke-width="2.5"/>
  <path d="M50 42 L50 68 M38 52 L62 52" stroke="#FDE68A" stroke-width="3"/>
  <!-- spikes and head -->
  <path d="M32 22 L14 5 L22 31 L7 34 L31 42 M68 22 L86 5 L78 31 L93 34 L69 42 M45 17 L50 2 L55 17" fill="#7F1D1D" stroke="#FCA5A5" stroke-width="3" stroke-linejoin="round"/>
  <path d="M31 20 Q50 7 69 20 L65 42 Q50 54 35 42 Z" fill="#881337" stroke="#450A0A" stroke-width="4"/>
  <path d="M34 26 L47 32 M66 26 L53 32" stroke="#29040C" stroke-width="5" stroke-linecap="round"/>
  <path d="M35 31 L47 30 L44 39 L34 36 Z M65 31 L53 30 L56 39 L66 36 Z" fill="#FDE047" stroke="#EA580C" stroke-width="2"/>
  <circle cx="41" cy="34" r="2.5" fill="#450A0A"/><circle cx="59" cy="34" r="2.5" fill="#450A0A"/>
  <path d="M38 43 Q50 54 62 43 L57 53 L50 49 L43 53 Z" fill="#1F0710" stroke="#FCA5A5" stroke-width="2"/>
  <path d="M42 44 L46 50 L49 45 L53 50 L58 44" fill="#FFF7ED" stroke="#7F1D1D" stroke-width="1.5"/>
</svg>` ,

  exploder: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="exploderCloak" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#C4B5FD"/><stop offset=".48" stop-color="#6D28D9"/><stop offset="1" stop-color="#1E1B4B"/></linearGradient><radialGradient id="exploderCore"><stop stop-color="#FDE68A"/><stop offset=".6" stop-color="#F97316"/><stop offset="1" stop-color="#B91C1C"/></radialGradient></defs>
  <ellipse cx="50" cy="95" rx="31" ry="4" fill="#020617" opacity=".36"/>
  <!-- feet under robe -->
  <path d="M37 76 L31 89 L24 94 L45 95 L51 81 M62 76 L69 89 L77 94 L56 95 L50 81" fill="#312E81" stroke="#111827" stroke-width="4" stroke-linejoin="round"/>
  <!-- arms and burning fists -->
  <path d="M35 42 Q20 46 17 63 L25 69 L42 57 M65 42 Q81 45 84 62 L76 69 L59 56" fill="none" stroke="#6D28D9" stroke-width="11" stroke-linecap="round"/>
  <path d="M13 56 Q5 49 12 40 Q13 51 21 48 Q28 55 20 65 Q15 68 10 63 Z M87 55 Q95 47 88 39 Q87 51 79 48 Q72 56 80 65 Q85 68 90 62 Z" fill="#FB923C" stroke="#9A3412" stroke-width="2.5"/>
  <!-- cloak body -->
  <path d="M34 37 Q50 32 66 37 L76 78 Q50 89 24 78 Z" fill="url(#exploderCloak)" stroke="#1E1B4B" stroke-width="4"/>
  <path d="M37 49 L63 49 L69 76 L31 76 Z" fill="#312E81" stroke="#A78BFA" stroke-width="2.5"/>
  <!-- glowing explosive chest crystal -->
  <path d="M50 48 L66 62 L50 78 L34 62 Z" fill="url(#exploderCore)" stroke="#FDE68A" stroke-width="3"/>
  <path d="M50 52 L50 72 M39 62 L61 62" stroke="#FFF7ED" stroke-width="2.5" stroke-linecap="round"/>
  <!-- hood and sharp face -->
  <path d="M27 29 Q29 5 50 7 Q72 5 73 29 L68 49 Q50 58 32 49 Z" fill="#4C1D95" stroke="#1E1B4B" stroke-width="4"/>
  <path d="M35 29 L46 33 M65 29 L54 33" stroke="#1E1B4B" stroke-width="4" stroke-linecap="round"/>
  <path d="M36 33 Q44 25 48 36 L43 42 L36 39 Z M64 33 Q56 25 52 36 L57 42 L64 39 Z" fill="#FDE047" stroke="#EA580C" stroke-width="1.8"/>
  <circle cx="42" cy="35" r="2.5" fill="#111827"/><circle cx="58" cy="35" r="2.5" fill="#111827"/>
  <path d="M43 47 L50 53 L57 47" fill="none" stroke="#FCA5A5" stroke-width="3" stroke-linecap="round"/>
  <!-- sparks -->
  <path d="M18 17 L21 25 L29 28 L21 31 L18 39 L15 31 L7 28 L15 25 Z M82 12 L85 19 L92 22 L85 25 L82 32 L79 25 L72 22 L79 19 Z" fill="#FDE68A" stroke="#F97316" stroke-width="1.8"/>
</svg>`,

  boss: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
  <defs><linearGradient id="bossBodyFull" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#FCA5A5"/><stop offset=".42" stop-color="#9F1239"/><stop offset="1" stop-color="#1E1038"/></linearGradient><linearGradient id="bossArmorFull" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#FDE68A"/><stop offset=".5" stop-color="#B45309"/><stop offset="1" stop-color="#451A03"/></linearGradient></defs>
  <ellipse cx="50" cy="96" rx="37" ry="4" fill="#020617" opacity=".48"/>
  <!-- massive legs -->
  <path d="M34 67 L28 84 L22 93 L47 94 L50 74 M65 67 L72 84 L80 93 L54 94 L50 74" fill="#450A0A" stroke="#1F0710" stroke-width="5"/>
  <path d="M20 87 L46 87 L49 97 L17 97 Z M54 87 L81 87 L85 97 L52 97 Z" fill="url(#bossArmorFull)" stroke="#451A03" stroke-width="3"/>
  <!-- heavy arms -->
  <path d="M32 39 L17 51 L10 70 L22 77 L39 59 M68 39 L83 51 L90 70 L78 77 L61 59" fill="none" stroke="#9F1239" stroke-width="15" stroke-linecap="round"/>
  <path d="M11 68 L5 79 L19 76 L25 86 L29 72 M89 68 L95 79 L81 76 L75 86 L71 72" fill="#FCA5A5" stroke="#450A0A" stroke-width="2.5"/>
  <!-- regal armor -->
  <path d="M29 37 Q50 27 71 37 L79 72 Q50 86 21 72 Z" fill="url(#bossBodyFull)" stroke="#2E1065" stroke-width="5"/>
  <path d="M34 43 L50 35 L66 43 L69 68 L50 77 L31 68 Z" fill="url(#bossArmorFull)" stroke="#451A03" stroke-width="3"/>
  <path d="M50 41 L50 73 M35 54 L65 54" stroke="#FFF7ED" stroke-width="3"/>
  <path d="M42 60 L50 49 L58 60 L50 68 Z" fill="#7C3AED" stroke="#FDE68A" stroke-width="2"/>
  <!-- horned crowned head -->
  <path d="M30 23 Q9 16 10 2 Q30 5 41 21 M70 23 Q91 16 90 2 Q70 5 59 21" fill="#7F1D1D" stroke="#FCA5A5" stroke-width="4" stroke-linejoin="round"/>
  <path d="M29 20 L35 5 L44 17 L50 1 L57 17 L66 5 L71 20 L67 42 Q50 55 33 42 Z" fill="#881337" stroke="#450A0A" stroke-width="4"/>
  <path d="M33 29 L47 34 M67 29 L53 34" stroke="#29040C" stroke-width="5" stroke-linecap="round"/>
  <path d="M34 33 L47 32 L44 41 L34 38 Z M66 33 L53 32 L56 41 L66 38 Z" fill="#FDE047" stroke="#F97316" stroke-width="2"/>
  <circle cx="41" cy="35" r="3" fill="#450A0A"/><circle cx="59" cy="35" r="3" fill="#450A0A"/>
  <path d="M37 44 Q50 56 63 44 L59 54 L50 50 L41 54 Z" fill="#1F0710" stroke="#FCA5A5" stroke-width="2.5"/>
  <path d="M42 45 L46 52 L50 46 L54 52 L58 45" fill="#FFF7ED" stroke="#7F1D1D" stroke-width="1.5"/>
  <path d="M50 0 L54 10 L65 12 L54 15 L50 25 L46 15 L35 12 L46 10 Z" fill="#FDE68A" stroke="#92400E" stroke-width="2"/>
</svg>` ,

  projectile: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><linearGradient id="arrowSteel" x1="0" y1="0" x2="1" y2="0"><stop stop-color="#E0F2FE"/><stop offset=".5" stop-color="#64748B"/><stop offset="1" stop-color="#F8FAFC"/></linearGradient></defs>
    <path d="M50 9 L50 84" stroke="#312E81" stroke-width="11" stroke-linecap="round"/>
    <path d="M50 9 L50 84" stroke="url(#arrowSteel)" stroke-width="6" stroke-linecap="round"/>
    <path d="M50 98 L25 62 L45 69 L50 53 L55 69 L75 62 Z" fill="#F97316" stroke="#7C2D12" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 17 L25 3 L31 29 Z M50 17 L75 3 L69 29 Z" fill="#8B5CF6" stroke="#312E81" stroke-width="3" stroke-linejoin="round"/>
    <path d="M50 15 L50 76" stroke="#FFFFFF" stroke-width="1.8" opacity=".8"/>
  </svg>`,

  magnet: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <!-- Electric Aura Ring -->
    <circle cx="50" cy="50" r="43" fill="rgba(56, 189, 248, 0.16)" stroke="#38BDF8" stroke-width="2.5" stroke-dasharray="6 5"/>
    <!-- Horseshoe U-Magnet -->
    <path d="M30 34 L30 56 A20 20 0 0 0 70 56 L70 34" fill="none" stroke="#E11D48" stroke-width="16" stroke-linecap="butt"/>
    <path d="M30 34 L30 56 A20 20 0 0 0 70 56 L70 34" fill="none" stroke="#881337" stroke-width="16" opacity="0.22"/>
    <!-- Metallic Silver Pole Tips -->
    <rect x="21" y="22" width="18" height="14" rx="3" fill="#E2E8F0" stroke="#475569" stroke-width="2.5"/>
    <rect x="61" y="22" width="18" height="14" rx="3" fill="#E2E8F0" stroke="#475569" stroke-width="2.5"/>
    <!-- Sparkles between poles -->
    <polygon points="50,15 53,23 61,26 53,29 50,37 47,29 39,26 47,23" fill="#FDE047" stroke="#D97706" stroke-width="1.5"/>
  </svg>`,
  coin: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="coinGold"><stop stop-color="#fff7ad"/><stop offset=".62" stop-color="#facc15"/><stop offset="1" stop-color="#b45309"/></radialGradient></defs><circle cx="50" cy="50" r="39" fill="url(#coinGold)" stroke="#92400e" stroke-width="6"/><circle cx="50" cy="50" r="29" fill="none" stroke="#fef3c7" stroke-width="3"/><path d="M59 28 Q40 20 34 37 Q29 49 51 51 Q72 55 64 72 Q57 86 37 73 M50 20 V80" fill="none" stroke="#92400e" stroke-width="6" stroke-linecap="round"/></svg>`,
  heart: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><radialGradient id="reviveHeart" cx="35%" cy="25%" r="75%"><stop stop-color="#fff1f5"/><stop offset=".34" stop-color="#fb7185"/><stop offset=".72" stop-color="#e11d48"/><stop offset="1" stop-color="#9f1239"/></radialGradient><filter id="heartGlow"><feGaussianBlur stdDeviation="3" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter></defs>
    <path d="M50 87 C39 76 11 56 11 34 C11 13 37 7 50 27 C63 7 89 13 89 34 C89 56 61 76 50 87Z" fill="url(#reviveHeart)" stroke="#fff1f2" stroke-width="4" filter="url(#heartGlow)"/>
    <path d="M25 34 C27 22 39 20 45 30" fill="none" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>
    <path d="M50 42 L43 54 H51 L47 68 L61 50 H53 L58 42Z" fill="#fff7ed" stroke="#ffe4e6" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M17 13 L20 21 L28 24 L20 27 L17 35 L14 27 L6 24 L14 21Z" fill="#fef08a"/><circle cx="82" cy="14" r="3.5" fill="#fff"/><circle cx="91" cy="52" r="2.5" fill="#fef08a"/>
  </svg>`,
  blueKey: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs>
      <linearGradient id="keyMetal" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#eff6ff"/><stop offset=".34" stop-color="#7dd3fc"/><stop offset=".7" stop-color="#2563eb"/><stop offset="1" stop-color="#172554"/></linearGradient>
      <linearGradient id="keyStem" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dbeafe"/><stop offset=".48" stop-color="#60a5fa"/><stop offset="1" stop-color="#1e40af"/></linearGradient>
      <radialGradient id="keyCenter"><stop stop-color="#0f172a"/><stop offset=".72" stop-color="#1e3a8a"/><stop offset="1" stop-color="#38bdf8"/></radialGradient>
    </defs>
    <circle cx="38" cy="36" r="32" fill="#38bdf8" opacity=".15"/>
    <circle cx="38" cy="36" r="25" fill="url(#keyMetal)" stroke="#dbeafe" stroke-width="3.5"/>
    <circle cx="38" cy="36" r="16" fill="url(#keyCenter)" stroke="#1d4ed8" stroke-width="3"/>
    <circle cx="38" cy="36" r="8" fill="#07152d" stroke="#bae6fd" stroke-width="2.5"/>
    <path d="M56 53 L86 82 Q90 86 85 91 L78 97 L69 88 L62 95 L53 86 L60 78 L50 68 Z" fill="url(#keyStem)" stroke="#1e3a8a" stroke-width="3.5" stroke-linejoin="round"/>
    <path d="M63 61 L78 76 M61 80 L69 88 M70 70 L77 77" stroke="#eff6ff" stroke-width="2.5" stroke-linecap="round" opacity=".85"/>
    <path d="M20 8 L24 19 L35 23 L24 27 L20 38 L16 27 L5 23 L16 19 Z" fill="#fff" stroke="#bae6fd" stroke-width="1.5"/>
    <circle cx="76" cy="22" r="3" fill="#fef3c7"/><circle cx="87" cy="37" r="2" fill="#fff"/>
  </svg>`,
  shadowHunter: themedCreatureSvg('#C4B5FD', '#4C1D95', '#F5D0FE', 'hunter', 'shadow'),
  shadowRunner: themedCreatureSvg('#A78BFA', '#312E81', '#E9D5FF', 'runner', 'shadow'),
  shadowBrute: themedCreatureSvg('#8B5CF6', '#2E1065', '#F0ABFC', 'brute', 'shadow'),
  shadowBoss: themedCreatureSvg('#DDD6FE', '#4C1D95', '#FDE68A', 'boss', 'shadow'),
  crystalHunter: themedCreatureSvg('#A5F3FC', '#0E7490', '#D9F99D', 'hunter', 'crystal'),
  crystalRunner: themedCreatureSvg('#67E8F9', '#155E75', '#F0FDFA', 'runner', 'crystal'),
  crystalBrute: themedCreatureSvg('#34D399', '#065F46', '#A7F3D0', 'brute', 'crystal'),
  crystalBoss: themedCreatureSvg('#CFFAFE', '#0E7490', '#FDE68A', 'boss', 'crystal'),
  emberHunter: themedCreatureSvg('#FDA4AF', '#9F1239', '#FDE68A', 'hunter', 'ember'),
  emberRunner: themedCreatureSvg('#FB923C', '#7C2D12', '#FDE68A', 'runner', 'ember'),
  emberBrute: themedCreatureSvg('#F87171', '#7F1D1D', '#FDBA74', 'brute', 'ember'),
  emberBoss: themedCreatureSvg('#FECDD3', '#881337', '#FDE68A', 'boss', 'ember'),

};

export function getCartoonSvgDataUri(kind: CartoonSpriteKind): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(CARTOON_SVGS[kind])}`;
}

export type CartoonSpriteMap = Partial<Record<CartoonSpriteKind, HTMLImageElement>>;

export function loadCartoonSvgSprites(onReady: (sprites: CartoonSpriteMap) => void): () => void {
  let active = true;
  const loaded: CartoonSpriteMap = {};

  (Object.keys(CARTOON_SVGS) as CartoonSpriteKind[]).forEach((kind) => {
    const img = new Image();
    img.onload = () => {
      if (!active) return;
      loaded[kind] = img;
      onReady({ ...loaded });
    };
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(CARTOON_SVGS[kind])}`;
  });

  return () => {
    active = false;
  };
}

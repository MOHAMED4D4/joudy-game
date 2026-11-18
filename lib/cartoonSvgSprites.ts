'use client';

export type CartoonSpriteKind = 'cat' | 'rose' | 'chocolate' | 'magnet' | 'obstacle' | 'blueKey' | 'coin';

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
  blueKey: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <defs><radialGradient id="keyGlow"><stop stop-color="#dbeafe"/><stop offset="1" stop-color="#3b82f6"/></radialGradient></defs>
    <circle cx="39" cy="35" r="25" fill="url(#keyGlow)" stroke="#1d4ed8" stroke-width="8"/>
    <circle cx="39" cy="35" r="9" fill="#172554" stroke="#bfdbfe" stroke-width="3"/>
    <path d="M55 51 L82 78 L72 88 L64 80 L56 88 L46 78 L55 69 L47 61 Z" fill="#60a5fa" stroke="#1d4ed8" stroke-width="5" stroke-linejoin="round"/>
    <path d="M19 10 L22 20 L32 23 L22 26 L19 36 L16 26 L6 23 L16 20 Z" fill="#fff"/>
  </svg>`,

};

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

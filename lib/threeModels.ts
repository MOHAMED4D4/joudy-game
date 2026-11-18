'use client';

import * as THREE from 'three';
import {
  createDynamicJoudyFaceTexture,
  createMarbledHijabTexture,
  type DynamicJoudyFace,
} from './threeUtils';

export interface Joudy3DChibiBundle {
  group: THREE.Group;
  face: DynamicJoudyFace;
  dispose: () => void;
}

/**
 * Procedural Articulated 3D Chibi Avatar of Joudy matching her real photo:
 * - Dynamic expressive anime face (blinking, happy heart/star eyes, hurt dizzy)
 * - Sage-grey-green luminous eyes & rosy blush
 * - Chestnut-auburn curly side hair tendrils
 * - Sage-green & cream marbled hijab headscarf with flowing tail
 * - Articulated hip-pivoted legs & shoulder-pivoted arms for real running cycle
 * - Exact boot soles grounded at local y = 0
 */
export function createJoudy3DChibi(maxAnisotropy = 4): Joudy3DChibiBundle {
  const root = new THREE.Group();

  const face = createDynamicJoudyFaceTexture(maxAnisotropy);
  const hijabTex = createMarbledHijabTexture(maxAnisotropy);

  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xfce1d2,
    roughness: 0.62,
    metalness: 0.02,
  });
  const faceMat = new THREE.MeshStandardMaterial({
    map: face.texture,
    roughness: 0.54,
    metalness: 0.02,
  });
  const hijabMat = new THREE.MeshStandardMaterial({
    map: hijabTex,
    roughness: 0.78,
    metalness: 0.04,
  });
  const hairMat = new THREE.MeshStandardMaterial({
    color: 0x6f3224, // Warm chestnut-auburn matching her photo
    roughness: 0.55,
    metalness: 0.08,
  });
  const dressSageMat = new THREE.MeshStandardMaterial({
    color: 0x9dbfa7,
    roughness: 0.68,
    metalness: 0.05,
  });
  const bootMat = new THREE.MeshStandardMaterial({
    color: 0xbe123c,
    roughness: 0.45,
    metalness: 0.1,
  });
  const creamMat = new THREE.MeshStandardMaterial({
    color: 0xfff8ef,
    roughness: 0.72,
    metalness: 0.04,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.22,
    metalness: 0.88,
  });
  const roseMat = new THREE.MeshStandardMaterial({
    color: 0xf43f5e,
    roughness: 0.45,
    metalness: 0.06,
  });

  // 1. Articulated Legs & Boots (Hip pivot at y = 0.34, Boot sole bottom at exact y = 0.0)
  const legGeo = new THREE.CapsuleGeometry(0.085, 0.14, 6, 12);
  const soleGeo = new THREE.CylinderGeometry(0.105, 0.115, 0.055, 14);

  const buildLeg = (x: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(x, 0.34, 0);

    const legMesh = new THREE.Mesh(legGeo, creamMat);
    legMesh.position.y = -0.15;
    legMesh.castShadow = true;

    const bootMesh = new THREE.Mesh(soleGeo, bootMat);
    bootMesh.position.set(0, -0.3125, 0.025);
    bootMesh.castShadow = true;

    legPivot.add(legMesh, bootMesh);
    return legPivot;
  };

  const leftLeg = buildLeg(-0.155);
  const rightLeg = buildLeg(0.155);
  root.add(leftLeg, rightLeg);

  // Upper Body Assembly (allows natural running forward lean & breathing)
  const bodyGroup = new THREE.Group();
  bodyGroup.position.set(0, 0.32, 0);
  root.add(bodyGroup);

  // 2. Flared Magical Dress Skirt (LatheGeometry)
  const skirtPoints = [
    new THREE.Vector2(0.01, 0.0),
    new THREE.Vector2(0.46, 0.02),
    new THREE.Vector2(0.42, 0.18),
    new THREE.Vector2(0.28, 0.42),
    new THREE.Vector2(0.22, 0.52),
  ];
  const skirtGeo = new THREE.LatheGeometry(skirtPoints, 24);
  const skirtMesh = new THREE.Mesh(skirtGeo, dressSageMat);
  skirtMesh.position.y = 0.0;
  skirtMesh.castShadow = true;
  bodyGroup.add(skirtMesh);

  // Cream underskirt trim + golden belt
  const trimRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.44, 0.035, 10, 28),
    creamMat,
  );
  trimRing.rotation.x = Math.PI / 2;
  trimRing.position.y = 0.04;
  bodyGroup.add(trimRing);

  const beltMesh = new THREE.Mesh(
    new THREE.CylinderGeometry(0.23, 0.24, 0.07, 20),
    goldMat,
  );
  beltMesh.position.y = 0.46;
  bodyGroup.add(beltMesh);

  // 3. Bodice + Rose Brooch
  const bodice = new THREE.Mesh(
    new THREE.CylinderGeometry(0.2, 0.23, 0.34, 20),
    creamMat,
  );
  bodice.position.y = 0.64;
  bodice.castShadow = true;
  bodyGroup.add(bodice);

  const brooch = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 12), roseMat);
  brooch.position.set(0.12, 0.7, 0.2);
  bodyGroup.add(brooch);

  // 4. Shoulder-Pivoted Arms + Golden Star Wand
  const armGeo = new THREE.CapsuleGeometry(0.072, 0.24, 6, 12);
  const handGeo = new THREE.SphereGeometry(0.072, 10, 10);

  const leftArm = new THREE.Group();
  leftArm.position.set(-0.27, 0.75, 0);
  const leftArmMesh = new THREE.Mesh(armGeo, dressSageMat);
  leftArmMesh.position.set(-0.04, -0.14, 0);
  leftArmMesh.rotation.z = 0.28;
  leftArmMesh.castShadow = true;
  const leftHand = new THREE.Mesh(handGeo, skinMat);
  leftHand.position.set(-0.1, -0.28, 0.03);
  leftArm.add(leftArmMesh, leftHand);
  bodyGroup.add(leftArm);

  const rightArm = new THREE.Group();
  rightArm.position.set(0.27, 0.75, 0);
  const rightArmMesh = new THREE.Mesh(armGeo, dressSageMat);
  rightArmMesh.position.set(0.04, -0.14, 0);
  rightArmMesh.rotation.z = -0.32;
  rightArmMesh.castShadow = true;
  const rightHand = new THREE.Mesh(handGeo, skinMat);
  rightHand.position.set(0.1, -0.28, 0.05);

  const wandStick = new THREE.Mesh(
    new THREE.CylinderGeometry(0.02, 0.024, 0.56, 10),
    goldMat,
  );
  wandStick.position.set(0.18, -0.1, 0.2);
  wandStick.rotation.x = 0.7;
  wandStick.rotation.z = -0.35;

  const wandStarMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.7,
    roughness: 0.18,
    metalness: 0.85,
  });
  const wandStar = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), wandStarMat);
  wandStar.position.set(0.26, 0.09, 0.36);
  rightArm.add(rightArmMesh, rightHand, wandStick, wandStar);
  bodyGroup.add(rightArm);

  // 5. Chibi Head + Sculpted Hijab + Chestnut Curly Tendrils + Dizzy Stars
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.18, 0);

  const headSphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.42, 28, 28),
    faceMat,
  );
  headSphere.rotation.y = -Math.PI / 2;
  headSphere.castShadow = true;
  headGroup.add(headSphere);

  // Sage-green & cream marbled Hijab Hood wrapping cleanly around head
  const hijabHood = new THREE.Mesh(
    new THREE.SphereGeometry(0.455, 28, 28, -Math.PI * 0.78, Math.PI * 1.56, 0, Math.PI * 0.82),
    hijabMat,
  );
  hijabHood.rotation.y = Math.PI * 0.5;
  hijabHood.position.set(0, 0.02, -0.045);
  hijabHood.castShadow = true;
  headGroup.add(hijabHood);

  // Hijab Neck Wrap Collar
  const neckScarf = new THREE.Mesh(
    new THREE.TorusGeometry(0.26, 0.095, 12, 24),
    hijabMat,
  );
  neckScarf.rotation.x = Math.PI / 2;
  neckScarf.position.set(0, -0.35, 0);
  headGroup.add(neckScarf);

  // Flowing Scarf Tail behind her
  const scarfTailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.05, -0.34, -0.22),
    new THREE.Vector3(0.22, -0.52, -0.44),
    new THREE.Vector3(0.36, -0.68, -0.58),
  ]);
  const scarfTail = new THREE.Mesh(
    new THREE.TubeGeometry(scarfTailCurve, 12, 0.085, 8, false),
    hijabMat,
  );
  scarfTail.scale.set(1.2, 0.5, 1);
  headGroup.add(scarfTail);

  // Chestnut-Auburn Curly Side Tendrils framing face
  const makeTendril = (side: -1 | 1) => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(side * 0.24, 0.25, 0.28),
      new THREE.Vector3(side * 0.34, 0.04, 0.32),
      new THREE.Vector3(side * 0.3, -0.18, 0.34),
      new THREE.Vector3(side * 0.35, -0.34, 0.27),
    ]);
    return new THREE.Mesh(new THREE.TubeGeometry(curve, 14, 0.042, 8, false), hairMat);
  };
  const leftTendril = makeTendril(-1);
  const rightTendril = makeTendril(1);
  headGroup.add(leftTendril, rightTendril);

  // Tiny center hair parting wisps peeking at top of forehead
  const topHair = new THREE.Mesh(
    new THREE.SphereGeometry(0.4, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.38),
    hairMat,
  );
  topHair.position.set(0, 0.06, 0.04);
  headGroup.add(topHair);

  // Dizzy Stars Orbiting above head when hurt
  const dizzyGroup = new THREE.Group();
  dizzyGroup.position.set(0, 0.58, 0);
  dizzyGroup.visible = false;
  const dizzyStarGeo = new THREE.OctahedronGeometry(0.07, 0);
  const dizzyStarMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xf59e0b,
    emissiveIntensity: 0.9,
  });
  for (let i = 0; i < 3; i++) {
    const angle = (Math.PI * 2 * i) / 3;
    const s = new THREE.Mesh(dizzyStarGeo, dizzyStarMat);
    s.position.set(Math.cos(angle) * 0.32, 0, Math.sin(angle) * 0.32);
    dizzyGroup.add(s);
  }
  headGroup.add(dizzyGroup);

  bodyGroup.add(headGroup);

  // 6. Magnetic Power-up Halo Ring around waist (visible when Magic Magnet is active)
  const magnetAuraMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.95,
    roughness: 0.15,
    metalness: 0.7,
    transparent: true,
    opacity: 0.85,
  });
  const magnetAura = new THREE.Mesh(
    new THREE.TorusGeometry(0.82, 0.035, 10, 40),
    magnetAuraMat,
  );
  magnetAura.rotation.x = Math.PI / 2;
  magnetAura.position.y = 0.65;
  magnetAura.visible = false;
  root.add(magnetAura);

  root.userData = {
    bodyGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    scarfTail,
    wandStar,
    dizzyGroup,
    magnetAura,
  };

  const dispose = () => {
    face.dispose();
    hijabTex.dispose();
    root.traverse((obj) => {
      if (obj instanceof THREE.Mesh) {
        obj.geometry.dispose();
        if (Array.isArray(obj.material)) {
          obj.material.forEach((m) => m.dispose());
        } else {
          obj.material.dispose();
        }
      }
    });
  };

  return { group: root, face, dispose };
}

/**
 * 3D Layered Anime Character Standee using Joudy's transparent anime illustration
 * paired with a glowing 3D magical base ring and orbiting 3D golden stars.
 */
export function createJoudyAnime3DStandee(
  animeImageSrc: string,
  maxAnisotropy = 4,
): { group: THREE.Group; disposeTexture: () => void } {
  const root = new THREE.Group();

  // 1. Glowing Magical Ring Base at feet (y = 0.04)
  const baseRingMat = new THREE.MeshStandardMaterial({
    color: 0xa7f3d0,
    emissive: 0x34d399,
    emissiveIntensity: 0.65,
    roughness: 0.25,
    metalness: 0.5,
  });
  const baseRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.68, 0.045, 12, 36),
    baseRingMat,
  );
  baseRing.rotation.x = Math.PI / 2;
  baseRing.position.y = 0.05;
  root.add(baseRing);

  // 2. Orbiting 3D Golden Stars & Rose Heart Gem around Joudy
  const orbitGroup = new THREE.Group();
  orbitGroup.position.y = 1.05;
  const starMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xfbbf24,
    emissiveIntensity: 0.75,
    roughness: 0.2,
    metalness: 0.85,
  });
  const star1 = new THREE.Mesh(new THREE.OctahedronGeometry(0.11, 0), starMat);
  star1.position.set(0.88, 0.22, 0.18);
  const star2 = new THREE.Mesh(new THREE.OctahedronGeometry(0.085, 0), starMat);
  star2.position.set(-0.85, -0.15, -0.15);

  const roseGem = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.095, 0),
    new THREE.MeshStandardMaterial({
      color: 0xf43f5e,
      emissive: 0xe11d48,
      emissiveIntensity: 0.6,
      roughness: 0.22,
      metalness: 0.55,
    }),
  );
  roseGem.position.set(0, 0.65, -0.55);
  orbitGroup.add(star1, star2, roseGem);
  root.add(orbitGroup);

  // 3. Sculpted Character Plane displaying her transparent Anime Chibi artwork
  const spriteGeo = new THREE.PlaneGeometry(1.95, 1.95);
  const spriteMat = new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    alphaTest: 0.12,
    side: THREE.DoubleSide,
  });
  const spriteMesh = new THREE.Mesh(spriteGeo, spriteMat);
  spriteMesh.position.y = 1.02;
  spriteMesh.castShadow = false;
  root.add(spriteMesh);

  let dynamicTexture: THREE.Texture | null = null;
  let disposed = false;

  // Load & strip outer white background on offscreen canvas for crisp cutout
  import('./spriteUtils')
    .then(({ loadTransparentSprite }) => loadTransparentSprite(animeImageSrc))
    .then(({ image }) => {
      if (disposed) return;
      const tex = new THREE.Texture(image);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.anisotropy = maxAnisotropy;
      tex.needsUpdate = true;
      dynamicTexture = tex;
      spriteMat.map = tex;
      spriteMat.needsUpdate = true;
    })
    .catch(() => {
      // Fallback: load directly without flood-fill if needed
      if (disposed) return;
      const loader = new THREE.TextureLoader();
      loader.load(animeImageSrc, (tex) => {
        if (disposed) {
          tex.dispose();
          return;
        }
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = maxAnisotropy;
        dynamicTexture = tex;
        spriteMat.map = tex;
        spriteMat.needsUpdate = true;
      });
    });

  // 4. Magnetic Power-up Halo Ring (visible when Magic Magnet is active)
  const magnetAuraMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.95,
    roughness: 0.15,
    metalness: 0.7,
    transparent: true,
    opacity: 0.85,
  });
  const magnetAura = new THREE.Mesh(
    new THREE.TorusGeometry(1.02, 0.036, 10, 40),
    magnetAuraMat,
  );
  magnetAura.rotation.x = Math.PI / 2;
  magnetAura.position.y = 0.85;
  magnetAura.visible = false;
  root.add(magnetAura);

  root.userData = {
    orbitGroup,
    baseRing,
    spriteMesh,
    magnetAura,
  };

  const disposeTexture = () => {
    disposed = true;
    if (dynamicTexture) {
      dynamicTexture.dispose();
      dynamicTexture = null;
    }
    spriteGeo.dispose();
    spriteMat.dispose();
    baseRing.geometry.dispose();
    baseRingMat.dispose();
    star1.geometry.dispose();
    star2.geometry.dispose();
    starMat.dispose();
    roseGem.geometry.dispose();
    (roseGem.material as THREE.Material).dispose();
    magnetAura.geometry.dispose();
    magnetAuraMat.dispose();
  };

  return { group: root, disposeTexture };
}

/**
 * 3D Cute Cat Collectible (+20 pts) — 8 distinct parts
 */
export function createCat3D(): THREE.Group {
  const cat = new THREE.Group();
  const furMat = new THREE.MeshStandardMaterial({
    color: 0xffedd5,
    roughness: 0.65,
    metalness: 0.05,
  });
  const earPinkMat = new THREE.MeshStandardMaterial({
    color: 0xfda4af,
    roughness: 0.55,
    metalness: 0.04,
  });
  const eyeMat = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.15,
    metalness: 0.2,
  });
  const bellMat = new THREE.MeshStandardMaterial({
    color: 0xfbbf24,
    roughness: 0.2,
    metalness: 0.9,
  });

  // Body + Head
  const body = new THREE.Mesh(new THREE.SphereGeometry(0.28, 18, 18), furMat);
  body.scale.set(1, 0.9, 1.15);
  body.position.y = 0.25;
  body.castShadow = true;

  const head = new THREE.Mesh(new THREE.SphereGeometry(0.27, 20, 20), furMat);
  head.position.set(0, 0.56, 0.08);
  head.castShadow = true;

  // Pointed Cat Ears
  const earGeo = new THREE.ConeGeometry(0.095, 0.2, 4);
  const leftEar = new THREE.Mesh(earGeo, furMat);
  leftEar.position.set(-0.16, 0.8, 0.08);
  leftEar.rotation.set(0.15, 0.4, 0.3);

  const rightEar = new THREE.Mesh(earGeo, furMat);
  rightEar.position.set(0.16, 0.8, 0.08);
  rightEar.rotation.set(0.15, -0.4, -0.3);

  // Eyes + Nose
  const leftEye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), eyeMat);
  leftEye.position.set(-0.095, 0.59, 0.32);
  const rightEye = new THREE.Mesh(new THREE.SphereGeometry(0.036, 10, 10), eyeMat);
  rightEye.position.set(0.095, 0.59, 0.32);

  const nose = new THREE.Mesh(new THREE.SphereGeometry(0.028, 10, 10), earPinkMat);
  nose.position.set(0, 0.52, 0.34);

  // Collar & Golden Bell
  const collar = new THREE.Mesh(
    new THREE.TorusGeometry(0.17, 0.028, 8, 20),
    new THREE.MeshStandardMaterial({ color: 0xf43f5e, roughness: 0.5 }),
  );
  collar.rotation.x = Math.PI / 2;
  collar.position.set(0, 0.4, 0.05);

  const bell = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 10), bellMat);
  bell.position.set(0, 0.36, 0.22);

  // Curved Tail
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0.22, -0.26),
    new THREE.Vector3(0.1, 0.4, -0.38),
    new THREE.Vector3(0.02, 0.58, -0.3),
  ]);
  const tail = new THREE.Mesh(new THREE.TubeGeometry(tailCurve, 10, 0.04, 8, false), furMat);

  cat.add(body, head, leftEar, rightEar, leftEye, rightEye, nose, collar, bell, tail);
  return cat;
}

/**
 * 3D Red Rose Collectible (+15 pts) — 7 distinct parts
 */
export function createRose3D(): THREE.Group {
  const rose = new THREE.Group();

  const petalMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    roughness: 0.52,
    metalness: 0.06,
    emissive: 0x4c0519,
    emissiveIntensity: 0.18,
  });
  const innerPetalMat = new THREE.MeshStandardMaterial({
    color: 0xfb7185,
    roughness: 0.42,
    metalness: 0.08,
  });
  const stemMat = new THREE.MeshStandardMaterial({
    color: 0x15803d,
    roughness: 0.72,
    metalness: 0.05,
  });

  const stem = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.04, 0.52, 10), stemMat);
  stem.position.y = 0.26;
  rose.add(stem);

  const leafGeo = new THREE.SphereGeometry(0.12, 10, 8);
  const leaf1 = new THREE.Mesh(leafGeo, stemMat);
  leaf1.scale.set(1.4, 0.25, 0.65);
  leaf1.position.set(0.14, 0.25, 0);
  leaf1.rotation.z = 0.45;
  const leaf2 = new THREE.Mesh(leafGeo, stemMat);
  leaf2.scale.set(1.4, 0.25, 0.65);
  leaf2.position.set(-0.14, 0.18, 0);
  leaf2.rotation.z = -0.45;
  rose.add(leaf1, leaf2);

  // Layered Swirling Rose Blossom
  const bud = new THREE.Mesh(new THREE.SphereGeometry(0.15, 14, 14), innerPetalMat);
  bud.position.y = 0.58;
  rose.add(bud);

  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI * 2 * i) / 6;
    const petal = new THREE.Mesh(
      new THREE.SphereGeometry(0.15, 12, 10, 0, Math.PI),
      petalMat,
    );
    petal.scale.set(1.05, 1.25, 0.45);
    petal.position.set(Math.cos(angle) * 0.13, 0.57, Math.sin(angle) * 0.13);
    petal.rotation.y = -angle + Math.PI / 2;
    petal.rotation.x = 0.28;
    petal.castShadow = true;
    rose.add(petal);
  }

  return rose;
}

/**
 * 3D Glossy Chocolate Bar Collectible (+10 pts) — Beveled Extrude + Gold Foil Wrapper
 */
export function createChocolate3D(): THREE.Group {
  const choco = new THREE.Group();

  const cocoaMat = new THREE.MeshStandardMaterial({
    color: 0x5c2d16,
    roughness: 0.24,
    metalness: 0.12,
  });
  const foilMat = new THREE.MeshStandardMaterial({
    color: 0xf59e0b,
    roughness: 0.2,
    metalness: 0.9,
  });
  const wrapperMat = new THREE.MeshStandardMaterial({
    color: 0xbe123c,
    roughness: 0.55,
    metalness: 0.15,
  });

  // Base Bar
  const baseBar = new THREE.Mesh(new THREE.BoxGeometry(0.54, 0.68, 0.14), cocoaMat);
  baseBar.position.y = 0.42;
  baseBar.castShadow = true;
  choco.add(baseBar);

  // 4 Raised Chocolate Pips
  const pipGeo = new THREE.BoxGeometry(0.2, 0.17, 0.06);
  const offsets = [
    [-0.12, 0.62],
    [0.12, 0.62],
    [-0.12, 0.41],
    [0.12, 0.41],
  ];
  offsets.forEach(([ox, oy]) => {
    const pip = new THREE.Mesh(pipGeo, cocoaMat);
    pip.position.set(ox, oy, 0.08);
    choco.add(pip);
  });

  // Metallic Gold Foil Sleeve & Crimson Paper Band
  const foil = new THREE.Mesh(new THREE.BoxGeometry(0.57, 0.34, 0.17), foilMat);
  foil.position.y = 0.24;
  const band = new THREE.Mesh(new THREE.BoxGeometry(0.59, 0.24, 0.19), wrapperMat);
  band.position.y = 0.19;
  choco.add(foil, band);

  return choco;
}

/**
 * 3D Storm Cloud & Lightning Obstacle (-15 pts)
 */
export function createStormCloud3D(): THREE.Group {
  const group = new THREE.Group();
  const cloudMat = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.85,
    metalness: 0.08,
  });
  const boltMat = new THREE.MeshStandardMaterial({
    color: 0xfacc15,
    emissive: 0xeab308,
    emissiveIntensity: 0.85,
    roughness: 0.25,
    metalness: 0.4,
  });

  const puffs = [
    { x: 0, y: 0.52, z: 0, r: 0.24 },
    { x: -0.22, y: 0.44, z: 0.02, r: 0.19 },
    { x: 0.22, y: 0.44, z: -0.02, r: 0.19 },
    { x: 0.08, y: 0.48, z: 0.14, r: 0.16 },
  ];
  puffs.forEach((p) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(p.r, 14, 14), cloudMat);
    m.position.set(p.x, p.y, p.z);
    m.castShadow = true;
    group.add(m);
  });

  // Glowing Lightning Bolt Shape
  const boltShape = new THREE.Shape();
  boltShape.moveTo(0.03, 0.24);
  boltShape.lineTo(-0.11, 0.04);
  boltShape.lineTo(-0.01, 0.04);
  boltShape.lineTo(-0.09, -0.18);
  boltShape.lineTo(0.11, 0.06);
  boltShape.lineTo(0.01, 0.06);
  boltShape.closePath();

  const boltGeo = new THREE.ExtrudeGeometry(boltShape, {
    depth: 0.06,
    bevelEnabled: true,
    bevelSize: 0.012,
    bevelThickness: 0.012,
    bevelSegments: 2,
  });
  boltGeo.center();
  const bolt = new THREE.Mesh(boltGeo, boltMat);
  bolt.position.set(0, 0.18, 0.06);
  group.add(bolt);

  return group;
}

/**
 * Fluffy Pastel 3D Cloud for Sky Scenery
 */
export function createFluffyCloud3D(tintHex = 0xffffff): THREE.Group {
  const cloud = new THREE.Group();
  const mat = new THREE.MeshStandardMaterial({
    color: tintHex,
    roughness: 0.9,
    metalness: 0.0,
    transparent: true,
    opacity: 0.92,
  });
  const spheres = [
    { x: 0, y: 0.2, z: 0, r: 0.72 },
    { x: -0.68, y: 0, z: 0.08, r: 0.52 },
    { x: 0.7, y: 0.04, z: -0.05, r: 0.56 },
    { x: 0.28, y: 0.35, z: 0.12, r: 0.48 },
    { x: -0.32, y: 0.26, z: -0.1, r: 0.44 },
  ];
  spheres.forEach((s) => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(s.r, 14, 14), mat);
    m.position.set(s.x, s.y, s.z);
    cloud.add(m);
  });
  return cloud;
}

/**
 * 3D Magic Horseshoe Magnet Power-Up (attracts all good collectibles to Joudy)
 */
export function createMagnet3D(): THREE.Group {
  const magnet = new THREE.Group();

  const bodyMat = new THREE.MeshStandardMaterial({
    color: 0xe11d48,
    emissive: 0x881337,
    emissiveIntensity: 0.25,
    roughness: 0.28,
    metalness: 0.45,
  });
  const tipMat = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.16,
    metalness: 0.92,
  });
  const auraMat = new THREE.MeshStandardMaterial({
    color: 0x38bdf8,
    emissive: 0x06b6d4,
    emissiveIntensity: 0.9,
    roughness: 0.2,
    metalness: 0.6,
  });
  const sparkMat = new THREE.MeshStandardMaterial({
    color: 0xfde047,
    emissive: 0xfacc15,
    emissiveIntensity: 0.85,
    roughness: 0.2,
  });

  // Curved U-shaped Horseshoe Tube
  const uCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 0.56, 0),
    new THREE.Vector3(-0.22, 0.26, 0),
    new THREE.Vector3(0, 0.1, 0),
    new THREE.Vector3(0.22, 0.26, 0),
    new THREE.Vector3(0.22, 0.56, 0),
  ]);
  const horseshoe = new THREE.Mesh(
    new THREE.TubeGeometry(uCurve, 22, 0.088, 12, false),
    bodyMat,
  );
  horseshoe.castShadow = true;
  magnet.add(horseshoe);

  // Brushed Silver Magnetic Pole Tips
  const tipGeo = new THREE.CylinderGeometry(0.095, 0.095, 0.15, 14);
  const leftTip = new THREE.Mesh(tipGeo, tipMat);
  leftTip.position.set(-0.22, 0.63, 0);
  const rightTip = new THREE.Mesh(tipGeo, tipMat);
  rightTip.position.set(0.22, 0.63, 0);
  magnet.add(leftTip, rightTip);

  // Glowing Cyan Magnetic Energy Halo
  const halo = new THREE.Mesh(new THREE.TorusGeometry(0.46, 0.025, 10, 32), auraMat);
  halo.position.set(0, 0.42, 0);
  halo.rotation.x = 0.45;
  magnet.add(halo);

  // Mini Golden Sparkle Crystal between the poles
  const spark = new THREE.Mesh(new THREE.OctahedronGeometry(0.08, 0), sparkMat);
  spark.position.set(0, 0.66, 0);
  magnet.add(spark);

  return magnet;
}

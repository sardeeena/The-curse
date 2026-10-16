import * as THREE from 'three';
import { CollisionSystem } from '../player/CollisionSystem';
import { ProceduralTextures } from '../textures/ProceduralTextures';

export interface Brazier {
  group: THREE.Group;
  light: THREE.PointLight;
  baseIntensity: number;
}

export class RoomBuilder {
  private scene: THREE.Scene;
  private collisionSystem: CollisionSystem;
  public braziers: Brazier[] = [];
  public animatedItems: { update: (dt: number, time: number) => void }[] = [];

  constructor(scene: THREE.Scene, collisionSystem: CollisionSystem) {
    this.scene = scene;
    this.collisionSystem = collisionSystem;
  }

  public createFloor(
    x: number,
    z: number,
    width: number,
    length: number,
    customTexture?: THREE.CanvasTexture
  ): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(width, length);
    geo.rotateX(-Math.PI / 2);

    const tex = (customTexture || ProceduralTextures.getFloorTexture()).clone();
    tex.repeat.set(width / 4, length / 4);
    tex.needsUpdate = true;

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.88,
      metalness: 0.08,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, 0, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  public createCeiling(
    x: number,
    z: number,
    width: number,
    length: number,
    height: number = 4.5,
    customTexture?: THREE.CanvasTexture
  ): THREE.Mesh {
    const geo = new THREE.PlaneGeometry(width, length);
    geo.rotateX(Math.PI / 2);

    const tex = (customTexture || ProceduralTextures.getCeilingTexture()).clone();
    tex.repeat.set(width / 3, length / 3);
    tex.needsUpdate = true;

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: 0.95,
      metalness: 0.05,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, height, z);
    mesh.receiveShadow = true;
    this.scene.add(mesh);
    return mesh;
  }

  public createWall(
    x: number,
    y: number,
    z: number,
    width: number,
    height: number,
    depth: number = 0.6,
    textureType: 'standard' | 'burial' | 'archive' | 'vault' | 'sanctuary' = 'standard'
  ): THREE.Mesh {
    const geo = new THREE.BoxGeometry(width, height, depth);

    let baseTex: THREE.CanvasTexture;
    switch (textureType) {
      case 'burial':
        baseTex = ProceduralTextures.getBurialWallTexture();
        break;
      case 'archive':
        baseTex = ProceduralTextures.getArchiveWallTexture();
        break;
      case 'vault':
        baseTex = ProceduralTextures.getVaultWallTexture();
        break;
      case 'sanctuary':
        baseTex = ProceduralTextures.getSanctuaryWallTexture();
        break;
      default:
        baseTex = ProceduralTextures.getWallTexture();
        break;
    }

    const tex = baseTex.clone();
    tex.repeat.set(Math.max(1, width / 3), Math.max(1, height / 3));
    tex.needsUpdate = true;

    const mat = new THREE.MeshStandardMaterial({
      map: tex,
      roughness: textureType === 'burial' ? 0.75 : 0.92,
      metalness: textureType === 'burial' ? 0.2 : 0.05,
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(x, y + height / 2, z);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    this.scene.add(mesh);

    // Register collision box
    const halfW = width / 2;
    const halfD = depth / 2;
    this.collisionSystem.addBox(
      new THREE.Vector3(x - halfW, y, z - halfD),
      new THREE.Vector3(x + halfW, y + height, z + halfD)
    );

    return mesh;
  }

  /**
   * Composite 5-part authentic Egyptian Lotus Pillar
   */
  public createLotusColumn(x: number, z: number, height: number = 4.5, isBurial: boolean = false): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneTex = isBurial ? ProceduralTextures.getBurialWallTexture() : ProceduralTextures.getWallTexture();
    const stoneMat = new THREE.MeshStandardMaterial({
      map: stoneTex,
      roughness: isBurial ? 0.72 : 0.88,
      metalness: isBurial ? 0.25 : 0.08,
    });

    const friezeMat = new THREE.MeshStandardMaterial({
      map: isBurial ? ProceduralTextures.getGoldReliefTexture() : ProceduralTextures.getHieroglyphFriezeTexture(),
      roughness: 0.6,
      metalness: isBurial ? 0.8 : 0.15,
    });

    // 1. Plinth base (square)
    const baseGeo = new THREE.BoxGeometry(1.4, 0.4, 1.4);
    const base = new THREE.Mesh(baseGeo, stoneMat);
    base.position.y = 0.2;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 2. Lower ring
    const ringGeo = new THREE.CylinderGeometry(0.6, 0.68, 0.25, 16);
    const ring = new THREE.Mesh(ringGeo, friezeMat);
    ring.position.y = 0.45;
    group.add(ring);

    // 3. Fluted central column shaft
    const shaftH = height - 1.4;
    const shaftGeo = new THREE.CylinderGeometry(0.48, 0.54, shaftH, 18);
    const shaft = new THREE.Mesh(shaftGeo, stoneMat);
    shaft.position.y = 0.45 + shaftH / 2;
    shaft.castShadow = true;
    shaft.receiveShadow = true;
    group.add(shaft);

    // 4. Carved Lotus Capital (flared inverted bell)
    const capitalGeo = new THREE.CylinderGeometry(0.85, 0.48, 0.65, 18);
    const capital = new THREE.Mesh(capitalGeo, friezeMat);
    capital.position.y = 0.45 + shaftH + 0.325;
    capital.castShadow = true;
    group.add(capital);

    // 5. Square abacus block supporting the ceiling
    const abacusGeo = new THREE.BoxGeometry(1.2, 0.3, 1.2);
    const abacus = new THREE.Mesh(abacusGeo, stoneMat);
    abacus.position.y = height - 0.15;
    abacus.castShadow = true;
    group.add(abacus);

    this.scene.add(group);

    // Add cylinder collision (radius 0.65)
    this.collisionSystem.addCylinder(x, z, 0.65, 0, height);

    return group;
  }

  /**
   * Stepped sacrificial / offering pedestal
   */
  public createPedestal(x: number, z: number, height: number = 1.1): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWallTexture(),
      roughness: 0.85,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.3,
      metalness: 0.85,
    });

    // Step 1
    const s1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.3, 1.8), stoneMat);
    s1.position.y = 0.15;
    s1.castShadow = true;
    s1.receiveShadow = true;
    group.add(s1);

    // Step 2
    const s2 = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.3, 1.4), stoneMat);
    s2.position.y = 0.45;
    s2.castShadow = true;
    s2.receiveShadow = true;
    group.add(s2);

    // Top plinth
    const s3 = new THREE.Mesh(new THREE.BoxGeometry(1.0, height - 0.6, 1.0), stoneMat);
    s3.position.y = 0.6 + (height - 0.6) / 2;
    s3.castShadow = true;
    group.add(s3);

    // Golden inlay top slab
    const goldCap = new THREE.Mesh(new THREE.BoxGeometry(1.05, 0.08, 1.05), goldMat);
    goldCap.position.y = height;
    goldCap.castShadow = true;
    group.add(goldCap);

    this.scene.add(group);
    this.collisionSystem.addBox(
      new THREE.Vector3(x - 0.9, 0, z - 0.9),
      new THREE.Vector3(x + 0.9, height + 0.1, z + 0.9)
    );

    return group;
  }

  /**
   * Composite Royal Egyptian Sarcophagus on a stepped daïs
   */
  public createSarcophagus(x: number, z: number, rotY: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    const darkGranite = new THREE.MeshStandardMaterial({
      color: 0x1f1813,
      roughness: 0.55,
      metalness: 0.3,
    });

    const royalGold = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.28,
      metalness: 0.9,
    });

    // Stepped daïs base under the sarcophagus
    const daisMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getBurialWallTexture(),
      roughness: 0.7,
      metalness: 0.2,
    });
    const dais1 = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.2, 3.8), daisMat);
    dais1.position.y = 0.1;
    dais1.castShadow = true;
    dais1.receiveShadow = true;
    group.add(dais1);

    const dais2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.2, 3.4), daisMat);
    dais2.position.y = 0.3;
    dais2.castShadow = true;
    dais2.receiveShadow = true;
    group.add(dais2);

    // 1. Granite base coffin
    const baseGeo = new THREE.BoxGeometry(1.2, 0.8, 2.6);
    const base = new THREE.Mesh(baseGeo, darkGranite);
    base.position.y = 0.8;
    base.castShadow = true;
    base.receiveShadow = true;
    group.add(base);

    // 2. Sculpted mummy lid
    const lidGeo = new THREE.BoxGeometry(1.15, 0.4, 2.5);
    const lid = new THREE.Mesh(lidGeo, royalGold);
    lid.position.y = 1.35;
    lid.castShadow = true;
    group.add(lid);

    // 3. Pharaonic Death Mask headpiece
    const headGeo = new THREE.SphereGeometry(0.38, 16, 16);
    headGeo.scale(1.1, 0.9, 1.3);
    const head = new THREE.Mesh(headGeo, royalGold);
    head.position.set(0, 1.55, -0.75);
    head.castShadow = true;
    group.add(head);

    // 4. Nemes headdress side flaps
    const flapGeo = new THREE.BoxGeometry(0.9, 0.25, 0.5);
    const flaps = new THREE.Mesh(flapGeo, royalGold);
    flaps.position.set(0, 1.45, -0.7);
    group.add(flaps);

    // 5. Ceremonial beard / beard plinth
    const beardGeo = new THREE.CylinderGeometry(0.04, 0.08, 0.35, 8);
    beardGeo.rotateX(Math.PI / 4);
    const beard = new THREE.Mesh(beardGeo, royalGold);
    beard.position.set(0, 1.35, -0.45);
    group.add(beard);

    // 6. Crossed Crook and Flail symbols
    const staffMat = new THREE.MeshStandardMaterial({ color: 0x1a4682, metalness: 0.8, roughness: 0.3 });
    const crook = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), staffMat);
    crook.rotation.z = 0.6;
    crook.position.set(0, 1.56, -0.1);
    group.add(crook);

    const flail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8), staffMat);
    flail.rotation.z = -0.6;
    flail.position.set(0, 1.56, -0.1);
    group.add(flail);

    // Broken seal pieces on the coffin rim (environmental storytelling)
    const sealGeo = new THREE.BoxGeometry(0.12, 0.05, 0.08);
    const sealMat = new THREE.MeshStandardMaterial({ color: 0x8a2414, roughness: 0.7 });
    for (let i = 0; i < 3; i++) {
      const sealFragment = new THREE.Mesh(sealGeo, sealMat);
      sealFragment.position.set(0.55, 1.22, -0.5 + i * 0.4);
      sealFragment.rotation.y = (Math.random() - 0.5) * 0.5;
      group.add(sealFragment);
    }

    this.scene.add(group);

    // Sarcophagus collision box
    const halfW = 1.0;
    const halfL = 1.8;
    this.collisionSystem.addBox(
      new THREE.Vector3(x - halfW, 0, z - halfL),
      new THREE.Vector3(x + halfW, 1.8, z + halfL)
    );

    return group;
  }

  /**
   * Bronze Tripod Brazier with flickering fire and organic warmth
   */
  public createBrazier(x: number, z: number, intensityScale: number = 1.0): Brazier {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const bronzeMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getBronzeTexture(),
      roughness: 0.5,
      metalness: 0.8,
    });

    // Bowl
    const bowlGeo = new THREE.CylinderGeometry(0.5, 0.25, 0.35, 12, 1, false);
    const bowl = new THREE.Mesh(bowlGeo, bronzeMat);
    bowl.position.y = 1.0;
    bowl.castShadow = true;
    group.add(bowl);

    // Tripod legs (3 legs)
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3;
      const legGeo = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8);
      const leg = new THREE.Mesh(legGeo, bronzeMat);
      leg.position.set(Math.cos(angle) * 0.35, 0.5, Math.sin(angle) * 0.35);
      leg.rotation.z = (Math.cos(angle) * Math.PI) / 14;
      leg.rotation.x = (-Math.sin(angle) * Math.PI) / 14;
      leg.castShadow = true;
      group.add(leg);
    }

    // Glowing coals/fire mesh inside bowl
    const coalGeo = new THREE.SphereGeometry(0.35, 8, 8);
    coalGeo.scale(1, 0.4, 1);
    const coalMat = new THREE.MeshBasicMaterial({
      color: 0xff6600,
    });
    const coalMesh = new THREE.Mesh(coalGeo, coalMat);
    coalMesh.position.y = 1.12;
    group.add(coalMesh);

    // Flickering torch/fire PointLight with warm decay
    const fireLight = new THREE.PointLight(0xff7a24, 1.8 * intensityScale, 13, 1.8);
    fireLight.position.set(0, 1.4, 0);
    fireLight.castShadow = true;
    fireLight.shadow.bias = -0.002;
    group.add(fireLight);

    this.scene.add(group);

    const brazierItem: Brazier = {
      group,
      light: fireLight,
      baseIntensity: 1.8 * intensityScale,
    };
    this.braziers.push(brazierItem);

    // Add obstacle collision
    this.collisionSystem.addCylinder(x, z, 0.45, 0, 1.5);

    return brazierItem;
  }

  /**
   * The Holy "Eye of Horus" golden artifact with celestial particle aura
   */
  public createArtifactEyeOfHorus(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const goldMat = new THREE.MeshPhysicalMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      color: 0xffd700,
      metalness: 0.95,
      roughness: 0.15,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    });

    const lapisMat = new THREE.MeshStandardMaterial({
      color: 0x133e7c,
      metalness: 0.6,
      roughness: 0.25,
    });

    // Eye outline - curved torus segment or ring
    const eyeOutline = new THREE.Mesh(new THREE.TorusGeometry(0.26, 0.038, 12, 32), goldMat);
    group.add(eyeOutline);

    // Pupil
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 16), lapisMat);
    pupil.scale.z = 0.4;
    group.add(pupil);

    // Eyebrow bar
    const browGeo = new THREE.BoxGeometry(0.55, 0.045, 0.06);
    const brow = new THREE.Mesh(browGeo, goldMat);
    brow.position.set(0, 0.27, 0);
    group.add(brow);

    // Falcon cheek spiral teardrop marking
    const teardrop = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.012, 0.22, 8), goldMat);
    teardrop.position.set(0.09, -0.24, 0);
    teardrop.rotation.z = -0.3;
    group.add(teardrop);

    const spiral = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.028, 8, 16), goldMat);
    spiral.position.set(-0.13, -0.24, 0);
    group.add(spiral);

    // Sacred halo aura ring
    const haloRing = new THREE.Mesh(
      new THREE.RingGeometry(0.38, 0.42, 32),
      new THREE.MeshBasicMaterial({
        color: 0xffdf77,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.6,
      })
    );
    group.add(haloRing);

    // Mystical golden glow PointLight
    const glowLight = new THREE.PointLight(0xffcc44, 2.2, 6, 2.0);
    group.add(glowLight);

    this.scene.add(group);

    // Animate rotation & hovering
    const startY = y;
    this.animatedItems.push({
      update: (_dt, time) => {
        group.rotation.y = time * 1.2;
        group.position.y = startY + Math.sin(time * 2.5) * 0.08;
        haloRing.rotation.z = time * 0.8;
      },
    });

    return group;
  }

  /**
   * Flashlight Battery Cell Pickup
   */
  public createBatteryPickup(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xd4af37,
      metalness: 0.85,
      roughness: 0.3,
    });
    const blueMat = new THREE.MeshStandardMaterial({
      color: 0x1f5fa0,
      metalness: 0.5,
      roughness: 0.4,
    });
    const glowMat = new THREE.MeshBasicMaterial({ color: 0x00ff88 });

    // Battery cell cylinder
    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.32, 16), blueMat);
    group.add(cyl);

    // Brass terminals
    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.06, 12), brassMat);
    topCap.position.y = 0.18;
    group.add(topCap);

    const bottomCap = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.04, 16), brassMat);
    bottomCap.position.y = -0.17;
    group.add(bottomCap);

    // Tiny green indicator light
    const led = new THREE.Mesh(new THREE.SphereGeometry(0.025, 8, 8), glowMat);
    led.position.set(0, 0, 0.12);
    group.add(led);

    const light = new THREE.PointLight(0x00ff88, 0.6, 2.5, 2);
    group.add(light);

    this.scene.add(group);

    const startY = y;
    this.animatedItems.push({
      update: (_dt, time) => {
        group.rotation.y = time * 1.5;
        group.position.y = startY + Math.sin(time * 3 + 1) * 0.05;
      },
    });

    return group;
  }

  /**
   * Ancient Stone Tablet with Hieroglyphs and directional illumination sconce
   */
  public createInscriptionTablet(x: number, y: number, z: number, rotY: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    // Stone stele backing with arched Egyptian top
    const stoneMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getArchiveWallTexture(),
      roughness: 0.9,
    });
    const stele = new THREE.Mesh(new THREE.BoxGeometry(1.3, 1.7, 0.18), stoneMat);
    stele.castShadow = true;
    group.add(stele);

    // Inscribed front slab
    const tabletMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getTabletTexture(),
      roughness: 0.75,
    });
    const tabletFace = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.5), tabletMat);
    tabletFace.position.set(0, 0, 0.1);
    group.add(tabletFace);

    // Warm atmospheric reading sconce focused on the clue
    const sconceLight = new THREE.PointLight(0xffbe66, 1.4, 5, 2.0);
    sconceLight.position.set(0, 0.7, 0.5);
    group.add(sconceLight);

    this.scene.add(group);

    // Add collision box
    this.collisionSystem.addBox(
      new THREE.Vector3(x - 0.7, y - 0.8, z - 0.3),
      new THREE.Vector3(x + 0.7, y + 0.8, z + 0.3)
    );

    return group;
  }

  /**
   * Ankh Pedestal Mechanism for the sealed gate
   */
  public createGateMechanismPedestal(x: number, y: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWallTexture(),
      roughness: 0.85,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.3,
      metalness: 0.85,
    });

    // Pedestal stand
    const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 1.1, 12), stoneMat);
    pillar.position.y = 0.55;
    pillar.castShadow = true;
    group.add(pillar);

    // Socket receptacle
    const socket = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.35, 0.2, 12), goldMat);
    socket.position.y = 1.15;
    group.add(socket);

    // Falcon Eye socket indentation
    const indent = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.18, 0.05, 12),
      new THREE.MeshBasicMaterial({ color: 0x111111 })
    );
    indent.position.y = 1.24;
    group.add(indent);

    // Glowing rune outline inside socket
    const runeMesh = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 0.14, 16),
      new THREE.MeshBasicMaterial({ color: 0xffaa00, side: THREE.DoubleSide })
    );
    runeMesh.rotation.x = Math.PI / 2;
    runeMesh.position.y = 1.25;
    group.add(runeMesh);

    this.scene.add(group);
    this.collisionSystem.addCylinder(x, z, 0.45, y, y + 1.3);

    return group;
  }

  // =========================================================================
  // STAGE 3: IMMERSIVE ENVIRONMENTAL STORYTELLING PROPS & ARCHITECTURE
  // =========================================================================

  /**
   * Scattered rubble and fallen stone blocks for entrance corridor
   */
  public createStoneDebris(x: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWallTexture(),
      roughness: 0.95,
      metalness: 0.05,
    });

    // Main cracked ashlar block
    const b1 = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.28, 0.6), stoneMat);
    b1.position.set(0, 0.14, 0);
    b1.rotation.y = 0.4;
    b1.castShadow = true;
    b1.receiveShadow = true;
    group.add(b1);

    // Smaller fallen fragments
    const b2 = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.25), stoneMat);
    b2.position.set(0.3, 0.09, -0.2);
    b2.rotation.set(0.1, 0.8, -0.2);
    b2.castShadow = true;
    group.add(b2);

    const b3 = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.12, 0.35), stoneMat);
    b3.position.set(-0.25, 0.06, 0.2);
    b3.rotation.set(-0.15, 0.3, 0.1);
    b3.castShadow = true;
    group.add(b3);

    this.scene.add(group);
    return group;
  }

  /**
   * Carved wall relief cartouche slab for corridor and antechamber walls
   */
  public createReliefPanel(x: number, y: number, z: number, rotY: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    const stoneMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWallTexture(),
      roughness: 0.88,
    });
    const goldRelief = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.4,
      metalness: 0.8,
    });

    // Panel slab
    const slab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 2.2, 0.08), stoneMat);
    slab.castShadow = true;
    group.add(slab);

    // Inset golden cartouche
    const cartouche = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.9, 16), goldRelief);
    cartouche.scale.set(0.7, 1.0, 0.15);
    cartouche.position.set(0, 0, 0.05);
    group.add(cartouche);

    this.scene.add(group);
    return group;
  }

  /**
   * Sculpted Anubis Jackal Guardian Statue on Plinth
   */
  public createAnubisStatue(x: number, z: number, rotY: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    const basaltMat = new THREE.MeshStandardMaterial({
      color: 0x141210,
      roughness: 0.4,
      metalness: 0.3,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.3,
      metalness: 0.85,
    });

    // 1. Stepped Plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.0, 0.8, 1.4), basaltMat);
    plinth.position.y = 0.4;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);

    // Gold collar band around plinth
    const plinthCollar = new THREE.Mesh(new THREE.BoxGeometry(1.04, 0.1, 1.44), goldMat);
    plinthCollar.position.y = 0.75;
    group.add(plinthCollar);

    // 2. Seated Jackal Body (slender Egyptian silhouette)
    const bodyGeo = new THREE.CylinderGeometry(0.24, 0.32, 0.9, 10);
    bodyGeo.scale(0.8, 1.0, 1.3);
    const body = new THREE.Mesh(bodyGeo, basaltMat);
    body.position.set(0, 1.25, 0.1);
    body.castShadow = true;
    group.add(body);

    // 3. Proud Chest & Forelegs
    const legs = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.7, 0.25), basaltMat);
    legs.position.set(0, 1.15, -0.4);
    group.add(legs);

    // 4. Jackal Head with Long Snout
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.3, 0.35), basaltMat);
    head.position.set(0, 1.85, -0.15);
    group.add(head);

    const snout = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.12, 0.35), basaltMat);
    snout.position.set(0, 1.8, -0.45);
    group.add(snout);

    // 5. Tall Alert Ears
    for (const side of [-1, 1]) {
      const ear = new THREE.Mesh(new THREE.ConeGeometry(0.08, 0.45, 4), basaltMat);
      ear.position.set(side * 0.14, 2.15, -0.12);
      ear.rotation.z = side * -0.15;
      group.add(ear);
    }

    // 6. Gilded Usekh Collar on Anubis
    const collar = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 12), goldMat);
    collar.position.set(0, 1.65, -0.15);
    group.add(collar);

    this.scene.add(group);

    // Collision box
    this.collisionSystem.addBox(
      new THREE.Vector3(x - 0.6, 0, z - 0.8),
      new THREE.Vector3(x + 0.6, 2.2, z + 0.8)
    );

    return group;
  }

  /**
   * Directional Doorway Architrave with carved Egyptian guidance lintel
   */
  public createArchitrave(
    x: number,
    y: number,
    z: number,
    type: 'ARCHIVE' | 'VAULT' | 'SANCTUM',
    width: number = 3.2
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWallTexture(),
      roughness: 0.85,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.35,
      metalness: 0.8,
    });

    // Heavy horizontal cornice lintel
    const lintel = new THREE.Mesh(new THREE.BoxGeometry(width, 0.5, 0.7), stoneMat);
    lintel.castShadow = true;
    group.add(lintel);

    // Overhanging Egyptian Cavetto cornice crown
    const cornice = new THREE.Mesh(new THREE.BoxGeometry(width + 0.3, 0.25, 0.85), stoneMat);
    cornice.position.y = 0.35;
    group.add(cornice);

    // Carved emblem on lintel face
    if (type === 'SANCTUM') {
      // Monumental Winged Solar Disc of Horus Behudeti
      const sunDisc = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 16), goldMat);
      sunDisc.scale.z = 0.3;
      sunDisc.position.set(0, 0, 0.38);
      group.add(sunDisc);

      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.16, 0.05), goldMat);
        wing.position.set(side * 0.65, 0, 0.38);
        group.add(wing);
      }
    } else if (type === 'ARCHIVE') {
      // Papyrus Scroll and Feather symbol badge
      const badge = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.3, 0.05), goldMat);
      badge.position.set(0, 0, 0.38);
      group.add(badge);
    } else if (type === 'VAULT') {
      // Sacred Offering Chalice badge
      const badge = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.1, 0.3, 10), goldMat);
      badge.position.set(0, 0, 0.38);
      group.add(badge);
    }

    this.scene.add(group);
    return group;
  }

  /**
   * Papyrus Scroll Shelf for Scribe's Archive
   */
  public createScrollShelf(x: number, y: number, z: number, rotY: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);
    group.rotation.y = rotY;

    const woodMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWoodTexture(),
      roughness: 0.9,
      metalness: 0.1,
    });

    const papyrusMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getPapyrusTexture(),
      roughness: 0.85,
    });

    // Upright frame posts
    for (const sx of [-0.85, 0.85]) {
      const post = new THREE.Mesh(new THREE.BoxGeometry(0.1, 2.2, 0.5), woodMat);
      post.position.set(sx, 1.1, 0);
      post.castShadow = true;
      group.add(post);
    }

    // 3 Horizontal wooden shelves
    for (let i = 0; i < 3; i++) {
      const shelfY = 0.4 + i * 0.75;
      const shelf = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.08, 0.48), woodMat);
      shelf.position.set(0, shelfY, 0);
      shelf.castShadow = true;
      shelf.receiveShadow = true;
      group.add(shelf);

      // Stack of rolled papyrus scrolls on this shelf
      const scrollCount = 4 + (i % 2) * 2;
      for (let s = 0; s < scrollCount; s++) {
        const scrollGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.38, 10);
        scrollGeo.rotateX(Math.PI / 2);
        const scroll = new THREE.Mesh(scrollGeo, papyrusMat);
        scroll.position.set(-0.6 + s * 0.22, shelfY + 0.08, (Math.random() - 0.5) * 0.06);
        scroll.rotation.y = (Math.random() - 0.5) * 0.2;
        group.add(scroll);
      }
    }

    this.scene.add(group);

    // Collision box
    this.collisionSystem.addBox(
      new THREE.Vector3(x - 1.0, y, z - 0.3),
      new THREE.Vector3(x + 1.0, y + 2.3, z + 0.3)
    );

    return group;
  }

  /**
   * Scribe's Low Writing Desk with reed pens, inkwell, and open manuscript
   */
  public createScribeDesk(x: number, z: number, rotY: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    const woodMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWoodTexture(),
      roughness: 0.88,
    });

    const papyrusMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getPapyrusTexture(),
      roughness: 0.8,
    });

    // Desk table top
    const tableTop = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.1, 0.8), woodMat);
    tableTop.position.y = 0.65;
    tableTop.castShadow = true;
    tableTop.receiveShadow = true;
    group.add(tableTop);

    // 4 Wooden legs
    for (const sx of [-0.6, 0.6]) {
      for (const sz of [-0.3, 0.3]) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.65, 0.08), woodMat);
        leg.position.set(sx, 0.325, sz);
        leg.castShadow = true;
        group.add(leg);
      }
    }

    // Open papyrus manuscript spread across table
    const unrolledScroll = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.4), papyrusMat);
    unrolledScroll.rotation.x = -Math.PI / 2;
    unrolledScroll.position.set(-0.15, 0.71, 0);
    group.add(unrolledScroll);

    // Stone inkwell palette (red and black ink wells)
    const inkwell = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.05, 0.12),
      new THREE.MeshStandardMaterial({ color: 0x221a14, roughness: 0.5 })
    );
    inkwell.position.set(0.4, 0.72, 0.1);
    group.add(inkwell);

    this.scene.add(group);

    // Collision box
    this.collisionSystem.addBox(
      new THREE.Vector3(x - 0.8, 0, z - 0.5),
      new THREE.Vector3(x + 0.8, 0.9, z + 0.5)
    );

    return group;
  }

  /**
   * Scattered scrolls and parchment fragments on floor
   */
  public createScatteredScrolls(x: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const papyrusMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getPapyrusTexture(),
      roughness: 0.9,
    });

    for (let i = 0; i < 3; i++) {
      const scroll = new THREE.Mesh(
        new THREE.CylinderGeometry(0.04, 0.04, 0.35, 8),
        papyrusMat
      );
      scroll.position.set((i - 1) * 0.25, 0.04, (Math.random() - 0.5) * 0.15);
      scroll.rotation.z = Math.PI / 2;
      scroll.rotation.y = (i * Math.PI) / 3;
      group.add(scroll);
    }

    this.scene.add(group);
    return group;
  }

  /**
   * Authentic Egyptian Canopic Jar for the Offering Vault
   */
  public createCanopicJar(
    x: number,
    y: number,
    z: number,
    type: 'jackal' | 'falcon' | 'baboon' | 'human' = 'human'
  ): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, y, z);

    const alabasterMat = new THREE.MeshStandardMaterial({
      color: 0xe8dcbe,
      roughness: 0.45,
      metalness: 0.1,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.3,
      metalness: 0.85,
    });

    // Jar body (flared alabaster vase)
    const bodyGeo = new THREE.CylinderGeometry(0.18, 0.12, 0.45, 12);
    const body = new THREE.Mesh(bodyGeo, alabasterMat);
    body.position.y = 0.225;
    body.castShadow = true;
    group.add(body);

    // Gilded hieroglyphic band around belly
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.185, 0.185, 0.08, 12), goldMat);
    band.position.y = 0.26;
    group.add(band);

    // Jar stopper lid (shaped according to the 4 Sons of Horus)
    let lidGeo: THREE.BufferGeometry;
    if (type === 'jackal') {
      lidGeo = new THREE.ConeGeometry(0.14, 0.28, 4); // pointed jackal snout
    } else if (type === 'falcon') {
      lidGeo = new THREE.ConeGeometry(0.15, 0.24, 6); // curved beak
    } else {
      lidGeo = new THREE.SphereGeometry(0.14, 10, 10); // rounded pharaoh head
    }

    const lid = new THREE.Mesh(lidGeo, alabasterMat);
    lid.position.y = 0.52;
    lid.castShadow = true;
    group.add(lid);

    this.scene.add(group);
    return group;
  }

  /**
   * Classical Egyptian Amphora / Storage Urn with loop handles
   */
  public createAmphora(x: number, z: number, scale: number = 1.0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.scale.set(scale, scale, scale);

    const clayMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getPotteryTexture(),
      roughness: 0.8,
      metalness: 0.05,
    });

    // Stand base
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.22, 0.15, 12), clayMat);
    base.position.y = 0.075;
    group.add(base);

    // Bulbous belly
    const belly = new THREE.Mesh(new THREE.SphereGeometry(0.32, 12, 12), clayMat);
    belly.position.y = 0.45;
    belly.scale.set(1.0, 1.3, 1.0);
    belly.castShadow = true;
    group.add(belly);

    // Narrow neck
    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.2, 0.35, 12), clayMat);
    neck.position.y = 0.85;
    group.add(neck);

    // Flared lip rim
    const rim = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.035, 8, 16), clayMat);
    rim.position.y = 1.02;
    rim.rotation.x = Math.PI / 2;
    group.add(rim);

    // Twin loop handles
    for (const side of [-1, 1]) {
      const handle = new THREE.Mesh(new THREE.TorusGeometry(0.14, 0.03, 6, 12), clayMat);
      handle.position.set(side * 0.28, 0.72, 0);
      handle.rotation.y = Math.PI / 2;
      group.add(handle);
    }

    this.scene.add(group);

    this.collisionSystem.addCylinder(x, z, 0.35 * scale, 0, 1.1 * scale);
    return group;
  }

  /**
   * Broken shattered terracotta urn with pottery shards on floor
   */
  public createBrokenPottery(x: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const clayMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getPotteryTexture(),
      roughness: 0.85,
    });

    // Fractured base half
    const halfBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.25, 0.18, 0.3, 8, 1, false, 0, Math.PI * 1.2),
      clayMat
    );
    halfBase.position.y = 0.15;
    halfBase.rotation.z = 0.4;
    group.add(halfBase);

    // Scattered shards
    for (let i = 0; i < 5; i++) {
      const shard = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.03, 0.16), clayMat);
      shard.position.set((Math.random() - 0.5) * 0.6, 0.02, (Math.random() - 0.5) * 0.6);
      shard.rotation.set((Math.random() - 0.5) * 0.5, Math.random() * Math.PI, (Math.random() - 0.5) * 0.5);
      group.add(shard);
    }

    this.scene.add(group);
    return group;
  }

  /**
   * Gilded Ceremonial Offering Chest with hieroglyphic inlays
   */
  public createOfferingChest(x: number, z: number, rotY: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    const goldMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.35,
      metalness: 0.85,
    });

    const woodMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getWoodTexture(),
      roughness: 0.85,
    });

    // Chest box body
    const chestBox = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.65, 0.8), woodMat);
    chestBox.position.y = 0.4;
    chestBox.castShadow = true;
    chestBox.receiveShadow = true;
    group.add(chestBox);

    // Gilded corner brackets and lid
    const lid = new THREE.Mesh(new THREE.BoxGeometry(1.26, 0.18, 0.86), goldMat);
    lid.position.y = 0.8;
    lid.castShadow = true;
    group.add(lid);

    this.scene.add(group);

    this.collisionSystem.addBox(
      new THREE.Vector3(x - 0.7, 0, z - 0.5),
      new THREE.Vector3(x + 0.7, 0.95, z + 0.5)
    );

    return group;
  }

  /**
   * Stone Offering Table with ceremonial bowls and chalices
   */
  public createOfferingTable(x: number, z: number): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    const stoneMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getVaultWallTexture(),
      roughness: 0.85,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.3,
      metalness: 0.85,
    });

    // Central pillar pedestal
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.4, 0.75, 12), stoneMat);
    pedestal.position.y = 0.375;
    pedestal.castShadow = true;
    group.add(pedestal);

    // Table top slab
    const topSlab = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 0.1, 16), stoneMat);
    topSlab.position.y = 0.8;
    topSlab.castShadow = true;
    group.add(topSlab);

    // Ceremonial golden chalice and libation bowl
    const chalice = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.06, 0.22, 10), goldMat);
    chalice.position.set(0.2, 0.95, -0.1);
    group.add(chalice);

    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.08, 0.1, 12), goldMat);
    bowl.position.set(-0.25, 0.9, 0.15);
    group.add(bowl);

    this.scene.add(group);

    this.collisionSystem.addCylinder(x, z, 0.95, 0, 1.1);
    return group;
  }

  /**
   * Colossal Funerary Sentinel Statue for the Grand Burial Chamber
   */
  public createFunerarySentinel(x: number, z: number, rotY: number = 0): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);
    group.rotation.y = rotY;

    const darkBasalt = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getBurialWallTexture(),
      roughness: 0.6,
      metalness: 0.3,
    });

    const goldMat = new THREE.MeshStandardMaterial({
      map: ProceduralTextures.getGoldReliefTexture(),
      roughness: 0.3,
      metalness: 0.9,
    });

    // 1. Tall Ashlar Throne Plinth
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(1.4, 1.2, 1.6), darkBasalt);
    plinth.position.y = 0.6;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    group.add(plinth);

    // 2. Colossal Seated Pharaoh Torso
    const torso = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.6, 0.8), darkBasalt);
    torso.position.set(0, 2.0, 0.2);
    torso.castShadow = true;
    group.add(torso);

    // 3. Pharaonic Head with Nemes Headdress
    const head = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.7, 0.6), darkBasalt);
    head.position.set(0, 3.1, 0.15);
    group.add(head);

    // Gilded Nemes crown headdress
    const nemes = new THREE.Mesh(new THREE.ConeGeometry(0.7, 0.8, 4), goldMat);
    nemes.position.set(0, 3.65, 0.15);
    nemes.rotation.y = Math.PI / 4;
    group.add(nemes);

    // Ceremonial pharaonic beard
    const beard = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, 0.55, 8), goldMat);
    beard.position.set(0, 2.65, 0.45);
    group.add(beard);

    // Ceremonial staff held upright
    const staff = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.8, 8), goldMat);
    staff.position.set(0.6, 1.9, 0.65);
    group.add(staff);

    this.scene.add(group);

    // Collision box
    this.collisionSystem.addBox(
      new THREE.Vector3(x - 0.85, 0, z - 0.95),
      new THREE.Vector3(x + 0.85, 4.0, z + 0.95)
    );

    return group;
  }

  /**
   * Celestial Light Shaft breaking through the cracked sanctuary ceiling
   */
  public createLightShaft(x: number, z: number, height: number = 4.5): THREE.Group {
    const group = new THREE.Group();
    group.position.set(x, 0, z);

    // Volumetric cone of pale golden / lunar light
    const beamGeo = new THREE.ConeGeometry(2.4, height, 18, 1, true);
    beamGeo.translate(0, height / 2, 0);

    const beamMat = new THREE.MeshBasicMaterial({
      color: 0xfffae0,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    const beam = new THREE.Mesh(beamGeo, beamMat);
    group.add(beam);

    // Downward Directional / SpotLight illuminating the escape area
    const downLight = new THREE.SpotLight(0xfffae0, 2.8, 14, Math.PI / 4, 0.4, 1.2);
    downLight.position.set(0, height, 0);
    const target = new THREE.Object3D();
    target.position.set(0, 0, 0);
    group.add(target);
    downLight.target = target;
    group.add(downLight);

    // Radiant pool on the ground
    const pool = new THREE.Mesh(
      new THREE.CircleGeometry(1.6, 24),
      new THREE.MeshBasicMaterial({
        color: 0xfff6cf,
        transparent: true,
        opacity: 0.25,
        blending: THREE.AdditiveBlending,
      })
    );
    pool.rotation.x = -Math.PI / 2;
    pool.position.y = 0.02;
    group.add(pool);

    this.scene.add(group);

    // Subtle breathing pulse on the light beam
    this.animatedItems.push({
      update: (_dt, time) => {
        beamMat.opacity = 0.11 + Math.sin(time * 1.5) * 0.03;
      },
    });

    return group;
  }

  public update(dt: number, time: number) {
    // Flickering braziers with organic double-sine wave
    for (const b of this.braziers) {
      const flicker =
        Math.sin(time * 11 + b.group.position.x * 2) * 0.14 +
        Math.sin(time * 19 + b.group.position.z * 3) * 0.09;
      b.light.intensity = Math.max(0.6, b.baseIntensity + flicker);
    }

    // Floating animated pickups, amulets, and volumetric light shafts
    for (const item of this.animatedItems) {
      item.update(dt, time);
    }
  }
}

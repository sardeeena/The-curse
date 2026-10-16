import * as THREE from 'three';
import { CollisionSystem } from '../player/CollisionSystem';
import { InteractionSystem } from './InteractionSystem';
import { soundManager } from '../audio/SoundEffects';
import { ProceduralTextures } from '../textures/ProceduralTextures';

export interface GlyphOption {
  id: string;
  name: string;
  symbol: string;
  description: string;
}

export const GLYPH_OPTIONS: GlyphOption[] = [
  { id: 'scarab', name: 'Scarab of Rebirth', symbol: '𓆣', description: 'Symbol of the rising sun and transformation' },
  { id: 'ankh', name: 'Ankh of Life', symbol: '☥', description: 'The sacred key of breath and eternity' },
  { id: 'eye', name: 'Eye of Horus', symbol: '𓂀', description: 'The Wadjet seal of divine protection' },
  { id: 'feather', name: 'Feather of Ma\'at', symbol: '𓆄', description: 'The feather of truth and cosmic order' },
];

export interface GlyphPillar {
  index: number;
  position: THREE.Vector3;
  group: THREE.Group;
  rotor: THREE.Mesh;
  symbolCanvas: HTMLCanvasElement;
  symbolTexture: THREE.CanvasTexture;
  selectedGlyphIndex: number;
}

export class GlyphPuzzleSystem {
  public pillars: GlyphPillar[] = [];
  public isSolved: boolean = false;
  public targetSolution: number[] = [0, 1, 2]; // Scarab (0), Ankh (1), Eye (2)
  private onSolvedCallback: () => void;

  constructor(
    scene: THREE.Scene,
    collisionSystem: CollisionSystem,
    interactionSystem: InteractionSystem,
    onSolved: () => void
  ) {
    this.onSolvedCallback = onSolved;
    this.buildPillars(scene, collisionSystem, interactionSystem);
  }

  private buildPillars(
    scene: THREE.Scene,
    collisionSystem: CollisionSystem,
    interactionSystem: InteractionSystem
  ) {
    // 3 Mechanism Pillars placed in the Antechamber along the north wall
    const positions = [
      new THREE.Vector3(-3.0, 0, -4.2),
      new THREE.Vector3(0, 0, -4.2),
      new THREE.Vector3(3.0, 0, -4.2),
    ];

    const initialGlyphs = [3, 2, 1]; // Initially incorrect arrangement

    positions.forEach((pos, idx) => {
      const group = new THREE.Group();
      group.position.copy(pos);

      // Stone Base Plinth
      const baseGeo = new THREE.CylinderGeometry(0.5, 0.6, 0.4, 12);
      const stoneMat = new THREE.MeshStandardMaterial({
        map: ProceduralTextures.getWallTexture(),
        roughness: 0.88,
      });
      const base = new THREE.Mesh(baseGeo, stoneMat);
      base.position.y = 0.2;
      base.castShadow = true;
      group.add(base);

      // Rotating Cylinder Drum with symbol face
      const drumGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.8, 16);
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;

      const drumMat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.6,
        metalness: 0.2,
      });

      const rotor = new THREE.Mesh(drumGeo, drumMat);
      rotor.position.y = 0.8;
      rotor.castShadow = true;
      group.add(rotor);

      // Golden Cap
      const capGeo = new THREE.ConeGeometry(0.44, 0.35, 12);
      const goldMat = new THREE.MeshStandardMaterial({
        map: ProceduralTextures.getGoldReliefTexture(),
        roughness: 0.3,
        metalness: 0.85,
      });
      const cap = new THREE.Mesh(capGeo, goldMat);
      cap.position.y = 1.35;
      group.add(cap);

      scene.add(group);

      // Collision cylinder
      collisionSystem.addCylinder(pos.x, pos.z, 0.55, 0, 1.6);

      const pillarData: GlyphPillar = {
        index: idx,
        position: pos,
        group,
        rotor,
        symbolCanvas: canvas,
        symbolTexture: texture,
        selectedGlyphIndex: initialGlyphs[idx],
      };

      this.pillars.push(pillarData);
      this.updatePillarTexture(pillarData);

      // Register interaction
      const romanNumber = ['I', 'II', 'III'][idx];
      interactionSystem.register({
        id: `glyph_pillar_${idx}`,
        name: `Guardian Pillar ${romanNumber}`,
        promptText: `Rotate Pillar ${romanNumber} (Currently: ${GLYPH_OPTIONS[pillarData.selectedGlyphIndex].name})`,
        position: new THREE.Vector3(pos.x, 1.0, pos.z),
        interactionDistance: 2.6,
        active: true,
        onInteract: () => {
          this.cyclePillar(pillarData, interactionSystem);
        },
      });
    });
  }

  private updatePillarTexture(pillar: GlyphPillar) {
    const ctx = pillar.symbolCanvas.getContext('2d')!;
    ctx.fillStyle = '#221a12';
    ctx.fillRect(0, 0, 256, 256);

    // Stone border ring
    ctx.strokeStyle = '#c9961f';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, 232, 232);

    const glyph = GLYPH_OPTIONS[pillar.selectedGlyphIndex];

    // Pillar number
    ctx.fillStyle = '#8c6b3e';
    ctx.font = 'bold 20px serif';
    ctx.textAlign = 'center';
    ctx.fillText(`PILLAR ${['I', 'II', 'III'][pillar.index]}`, 128, 48);

    // Glowing ancient glyph
    ctx.fillStyle = '#facc15';
    ctx.shadowColor = '#eab308';
    ctx.shadowBlur = 14;
    ctx.font = 'bold 84px serif';
    ctx.fillText(glyph.symbol, 128, 150);
    ctx.shadowBlur = 0;

    // Glyph Name
    ctx.fillStyle = '#d4af37';
    ctx.font = '16px serif';
    ctx.fillText(glyph.name, 128, 215);

    pillar.symbolTexture.needsUpdate = true;
  }

  public cyclePillar(pillar: GlyphPillar, interactionSystem: InteractionSystem) {
    if (this.isSolved) return;

    pillar.selectedGlyphIndex = (pillar.selectedGlyphIndex + 1) % GLYPH_OPTIONS.length;
    this.updatePillarTexture(pillar);
    soundManager.playPuzzleClick();

    // Subtle spin animation
    pillar.rotor.rotation.y += Math.PI / 2;

    const romanNumber = ['I', 'II', 'III'][pillar.index];
    const currentGlyph = GLYPH_OPTIONS[pillar.selectedGlyphIndex];

    // Update prompt
    const target = interactionSystem.currentTarget;
    if (target && target.id === `glyph_pillar_${pillar.index}`) {
      target.promptText = `Rotate Pillar ${romanNumber} (Currently: ${currentGlyph.name})`;
    }

    this.checkSolution();
  }

  public checkSolution(): boolean {
    if (this.isSolved) return true;

    const matches = this.pillars.every(
      (p, i) => p.selectedGlyphIndex === this.targetSolution[i]
    );

    if (matches) {
      this.isSolved = true;
      soundManager.playPuzzleSuccess();
      soundManager.playStoneGrind();

      // Turn all dials to golden aura
      this.pillars.forEach((p) => {
        const ctx = p.symbolCanvas.getContext('2d')!;
        ctx.strokeStyle = '#22c55e';
        ctx.strokeRect(12, 12, 232, 232);
        p.symbolTexture.needsUpdate = true;
      });

      this.onSolvedCallback();
      return true;
    }

    return false;
  }

  public reset() {
    this.isSolved = false;
    const initialGlyphs = [3, 2, 1];
    this.pillars.forEach((p, idx) => {
      p.selectedGlyphIndex = initialGlyphs[idx];
      this.updatePillarTexture(p);
      p.rotor.rotation.y = 0;
    });
  }
}

import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { CollisionSystem } from '../player/CollisionSystem';
import { RoomBuilder } from '../world/RoomBuilder';
import { Door } from '../world/Door';
import { InteractionSystem } from '../systems/InteractionSystem';
import { GlyphPuzzleSystem } from '../systems/GlyphPuzzleSystem';
import { Guardian } from '../enemy/Guardian';
import { HealthSystem } from '../systems/HealthSystem';
import { soundManager } from '../audio/SoundEffects';
import { ProceduralTextures } from '../textures/ProceduralTextures';

export interface TombSceneEvents {
  onArtifactCollected: () => void;
  onBatteryCollected: (amount: number) => void;
  onTabletInspected: (text: string) => void;
  onSarcophagusInspected: () => void;
  onGateUnlocked: () => void;
  onExitReached: () => void;
  onPuzzleSolved: () => void;
  onGuardianAwakened: () => void;
}

export class TombScene {
  public scene: THREE.Scene;
  public collisionSystem: CollisionSystem;
  public roomBuilder: RoomBuilder;
  public exitDoor: Door;
  public guardian: Guardian;
  public puzzle: GlyphPuzzleSystem;
  public healthSystem: HealthSystem;

  public hasArtifact: boolean = false;
  public gateUnlocked: boolean = false;
  public puzzleSolved: boolean = false;
  public checkpointReached: boolean = false;
  public victoryTriggered: boolean = false;

  private artifactMesh: THREE.Group | null = null;
  private batteryMesh: THREE.Group | null = null;
  private dustParticles: THREE.Points | null = null;
  private events: TombSceneEvents;
  private interactionSystemRef: InteractionSystem | null = null;

  constructor(
    renderer: THREE.WebGLRenderer,
    healthSystem: HealthSystem,
    events: TombSceneEvents
  ) {
    this.events = events;
    this.healthSystem = healthSystem;
    this.scene = new THREE.Scene();

    // Dense atmospheric subterranean tomb fog matching dark stone
    this.scene.fog = new THREE.FogExp2(0x0a0806, 0.048);

    // Procedural Studio Environment Reflection
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    this.scene.environment = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    pmremGenerator.dispose();

    // Subdued subterranean ambient lighting (cool ceiling fill vs warm floor bounce)
    const hemiLight = new THREE.HemisphereLight(0x1a2638, 0x181008, 0.32);
    this.scene.add(hemiLight);

    // Initialize collision and world builder
    this.collisionSystem = new CollisionSystem();
    this.roomBuilder = new RoomBuilder(this.scene, this.collisionSystem);

    // Build the tomb layout with Stage 3 environmental storytelling
    this.buildTomb();

    // Create the exit door at the north end of the Burial Chamber
    this.exitDoor = new Door(
      'exit_door',
      new THREE.Vector3(0, 0, -23.5),
      2.6,
      3.8,
      0.6,
      this.collisionSystem
    );
    this.scene.add(this.exitDoor.group);

    // Create floating atmospheric dust motes
    this.createDustParticles();

    // Initialize the supernatural guardian entity in the burial chamber
    this.guardian = new Guardian(
      new THREE.Vector3(0, 0, -14),
      this.collisionSystem,
      this.healthSystem
    );
    this.scene.add(this.guardian.group);

    // Initialize the 3-pillar glyph puzzle
    this.puzzle = new GlyphPuzzleSystem(
      this.scene,
      this.collisionSystem,
      () => {
        this.puzzleSolved = true;
        this.checkpointReached = true;
        this.events.onPuzzleSolved();

        // Awaken the guardian from the burial chamber
        setTimeout(() => {
          this.guardian.awaken(12);
          this.events.onGuardianAwakened();
        }, 800);
      }
    );
  }

  private buildTomb() {
    const rb = this.roomBuilder;
    const wallH = 4.4;

    // ==========================================
    // 1. ENTRANCE CORRIDOR (Z: 9 to 21, X: -2 to 2)
    // ==========================================
    rb.createFloor(0, 15, 4.4, 13);
    rb.createCeiling(0, 15, 4.4, 13, wallH);

    // South wall (sealed cave-in behind player)
    rb.createWall(0, 0, 21.2, 4.4, wallH, 0.6, 'standard');

    // East and West corridor walls
    rb.createWall(-2.2, 0, 15, 0.6, wallH, 12, 'standard');
    rb.createWall(2.2, 0, 15, 0.6, wallH, 12, 'standard');

    // Corridor brazier
    rb.createBrazier(1.4, 13, 0.9);

    // Environmental storytelling: Fallen stone rubble and cracked blocks along corridor
    rb.createStoneDebris(-1.3, 19.5);
    rb.createStoneDebris(1.2, 17.5);
    rb.createStoneDebris(-1.4, 14.5);

    // Carved wall relief cartouches along corridor
    rb.createReliefPanel(-2.15, 1.8, 16.5, Math.PI / 2);
    rb.createReliefPanel(2.15, 1.8, 13.5, -Math.PI / 2);

    // ==========================================
    // 2. CENTRAL ANTECHAMBER (Z: -5 to 9, X: -6 to 6)
    // ==========================================
    rb.createFloor(0, 2, 13, 14.5);
    rb.createCeiling(0, 2, 13, 14.5, wallH);

    // Entrance corner walls
    rb.createWall(-4.1, 0, 9, 3.8, wallH, 0.6, 'standard');
    rb.createWall(4.1, 0, 9, 3.8, wallH, 0.6, 'standard');

    // Lotus columns in antechamber
    rb.createLotusColumn(-3.2, 2.5, wallH);
    rb.createLotusColumn(3.2, 2.5, wallH);

    // Antechamber braziers
    rb.createBrazier(-4.8, 6.5, 1.1);
    rb.createBrazier(4.8, 6.5, 1.1);

    // Anubis Jackal Guardian Statues flanking the corridor entrance to the antechamber
    rb.createAnubisStatue(-2.8, 8.2, 0);
    rb.createAnubisStatue(2.8, 8.2, 0);

    // Architectural Doorway Architraves with clear navigational guidance
    // West doorway (leads to Scribe's Archive)
    rb.createArchitrave(-6.0, wallH - 0.4, 2.0, 'ARCHIVE', 2.8);
    // East doorway (leads to Offering Vault)
    rb.createArchitrave(6.0, wallH - 0.4, 2.0, 'VAULT', 2.8);
    // North doorway (monumental pylon leading to Grand Burial Chamber)
    rb.createArchitrave(0, wallH - 0.4, -5.0, 'SANCTUM', 4.4);

    // ==========================================
    // 3. WEST WING: SCRIBE'S ARCHIVE (X: -14 to -6, Z: -2 to 6)
    // ==========================================
    rb.createFloor(-10, 2, 8.5, 8.5);
    rb.createCeiling(-10, 2, 8.5, 8.5, wallH);

    // West wing walls using aged limestone texture
    rb.createWall(-6, 0, 5.2, 0.6, wallH, 2.4, 'archive');
    rb.createWall(-6, 0, -1.2, 0.6, wallH, 2.4, 'archive');
    rb.createWall(-14, 0, 2, 0.6, wallH, 8.5, 'archive');
    rb.createWall(-10, 0, 6.2, 8.5, wallH, 0.6, 'archive');
    rb.createWall(-10, 0, -2.2, 8.5, wallH, 0.6, 'archive');

    // Ancient Inscription tablet on west wall with dedicated reading illumination
    rb.createInscriptionTablet(-13.4, 1.8, 2, Math.PI / 2);
    rb.createBrazier(-12.8, 4.8, 0.9);

    // Archive Environmental Storytelling: Shelves with rolled papyrus scrolls
    rb.createScrollShelf(-10.5, 0, 5.6, 0);
    rb.createScrollShelf(-10.5, 0, -1.6, Math.PI);

    // Scholar's low writing desk with open manuscript and reed pens
    rb.createScribeDesk(-8.8, 3.8, Math.PI / 6);

    // Scattered scrolls and fragments on the floor
    rb.createScatteredScrolls(-11.5, 2.8);
    rb.createScatteredScrolls(-8.5, 0.5);

    // ==========================================
    // 4. EAST WING: OFFERING VAULT (X: 6 to 14, Z: -2 to 6)
    // ==========================================
    rb.createFloor(10, 2, 8.5, 8.5);
    rb.createCeiling(10, 2, 8.5, 8.5, wallH);

    // East wing walls using ceremonial ochre sandstone with soot traces
    rb.createWall(6, 0, 5.2, 0.6, wallH, 2.4, 'vault');
    rb.createWall(6, 0, -1.2, 0.6, wallH, 2.4, 'vault');
    rb.createWall(14, 0, 2, 0.6, wallH, 8.5, 'vault');
    rb.createWall(10, 0, 6.2, 8.5, wallH, 0.6, 'vault');
    rb.createWall(10, 0, -2.2, 8.5, wallH, 0.6, 'vault');

    // Offering pedestal in east wing with spare flashlight battery
    rb.createPedestal(10.5, 2, 0.9);
    this.batteryMesh = rb.createBatteryPickup(10.5, 1.15, 2);
    rb.createBrazier(12.8, 4.8, 0.9);

    // Vault Environmental Storytelling:
    // 1. Gilded Offering Chest along the south wall
    rb.createOfferingChest(10.5, -1.5, 0);

    // 2. Stone Offering Table with ceremonial bowls along the north wall
    rb.createOfferingTable(8.5, 4.2);

    // 3. 4 Canopic Jars (Sons of Horus) placed on a stone step
    rb.createCanopicJar(12.2, 0, 3.2, 'jackal');
    rb.createCanopicJar(12.2, 0, 3.8, 'falcon');
    rb.createCanopicJar(12.2, 0, 4.4, 'human');
    rb.createCanopicJar(12.2, 0, 5.0, 'baboon');

    // 4. Ceremonial Storage Amphorae
    rb.createAmphora(13.0, 0.5, 1.1);
    rb.createAmphora(13.2, -1.0, 0.9);

    // 5. Shattered terracotta urn with broken pottery shards
    rb.createBrokenPottery(8.2, 0.8);

    // ==========================================
    // 5. GRAND BURIAL CHAMBER (Z: -5 to -24, X: -8 to 8)
    // ==========================================
    rb.createFloor(0, -14.5, 17, 19.5);
    rb.createCeiling(0, -14.5, 17, 19.5, wallH, ProceduralTextures.getCeilingTexture());

    // Transition portal walls between Antechamber and Burial Chamber
    rb.createWall(-5.2, 0, -5, 4.6, wallH, 0.6, 'burial');
    rb.createWall(5.2, 0, -5, 4.6, wallH, 0.6, 'burial');

    // East & West walls of Burial Chamber using royal dark basalt/granite
    rb.createWall(-8.2, 0, -14.5, 0.6, wallH, 19, 'burial');
    rb.createWall(8.2, 0, -14.5, 0.6, wallH, 19, 'burial');

    // North wall of Burial Chamber
    rb.createWall(-4.8, 0, -23.5, 6.8, wallH, 0.6, 'burial');
    rb.createWall(4.8, 0, -23.5, 6.8, wallH, 0.6, 'burial');

    // 4 Grand Lotus Columns framing the royal sanctum with gilded burial bands
    rb.createLotusColumn(-4.5, -10, wallH, true);
    rb.createLotusColumn(4.5, -10, wallH, true);
    rb.createLotusColumn(-4.5, -18, wallH, true);
    rb.createLotusColumn(4.5, -18, wallH, true);

    // 4 Corner Braziers in Burial Chamber
    rb.createBrazier(-6.8, -8, 1.2);
    rb.createBrazier(6.8, -8, 1.2);
    rb.createBrazier(-6.8, -21, 1.2);
    rb.createBrazier(6.8, -21, 1.2);

    // Colossal Funerary Sentinels flanking the royal sarcophagus
    rb.createFunerarySentinel(-5.8, -13.5, Math.PI / 2);
    rb.createFunerarySentinel(5.8, -13.5, -Math.PI / 2);

    // Centerpiece: Royal Egyptian Sarcophagus on raised daïs
    rb.createSarcophagus(0, -13.5, 0);

    // Centerpiece: Artifact Pedestal behind Sarcophagus
    rb.createPedestal(0, -18, 1.1);

    // The First Artifact: Eye of Horus Golden Amulet with celestial particle aura
    this.artifactMesh = rb.createArtifactEyeOfHorus(0, 1.5, -18);

    // Gate mechanism pedestal next to exit door
    rb.createGateMechanismPedestal(2.2, 0, -22);

    // ==========================================
    // 6. SANCTUARY ESCAPE CHAMBER (Beyond Exit Gate)
    // ==========================================
    rb.createFloor(0, -28, 5.5, 8.5);
    rb.createCeiling(0, -28, 5.5, 8.5, wallH);
    rb.createWall(-2.7, 0, -28, 0.6, wallH, 8.5, 'sanctuary');
    rb.createWall(2.7, 0, -28, 0.6, wallH, 8.5, 'sanctuary');
    rb.createWall(0, 0, -32.2, 5.5, wallH, 0.6, 'sanctuary');

    // Volumetric celestial light shaft breaking through cracked ceiling fissure
    rb.createLightShaft(0, -28.5, wallH);

    // Monumental architrave crowning the exit door
    rb.createArchitrave(0, wallH - 0.4, -23.5, 'SANCTUM', 3.8);
  }

  private createDustParticles() {
    const particleCount = 600;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount * 3; i += 3) {
      positions[i] = (Math.random() - 0.5) * 26;
      positions[i + 1] = Math.random() * 4.4;
      positions[i + 2] = (Math.random() - 0.5) * 46;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const material = new THREE.PointsMaterial({
      color: 0xdfbc7a,
      size: 0.055,
      transparent: true,
      opacity: 0.38,
      blending: THREE.AdditiveBlending,
    });

    this.dustParticles = new THREE.Points(geometry, material);
    this.scene.add(this.dustParticles);
  }

  public setupInteractions(interactionSystem: InteractionSystem) {
    this.interactionSystemRef = interactionSystem;

    // 1. Artifact: Eye of Horus
    interactionSystem.register({
      id: 'artifact_eye_of_horus',
      name: 'Eye of Horus Golden Amulet',
      promptText: 'Take the Eye of Horus Amulet',
      position: new THREE.Vector3(0, 1.3, -18),
      interactionDistance: 2.8,
      active: !this.hasArtifact,
      onInteract: () => {
        if (this.hasArtifact) return;
        this.hasArtifact = true;
        soundManager.playPickup();

        if (this.artifactMesh) {
          this.artifactMesh.visible = false;
        }

        interactionSystem.unregister('artifact_eye_of_horus');
        this.events.onArtifactCollected();

        // Enrage guardian if not already chasing
        if (this.guardian.getState() === 'DORMANT') {
          this.guardian.awaken(16);
        }
      },
    });

    // 2. Battery Pickup
    interactionSystem.register({
      id: 'battery_cell',
      name: 'Flashlight Battery',
      promptText: 'Pick up Flashlight Battery (+45%)',
      position: new THREE.Vector3(10.5, 1.1, 2),
      interactionDistance: 2.5,
      active: true,
      onInteract: () => {
        if (this.batteryMesh) {
          this.batteryMesh.visible = false;
        }
        interactionSystem.unregister('battery_cell');
        this.events.onBatteryCollected(45);
      },
    });

    // 3. Ancient Inscription Tablet in Scribe's Archive
    interactionSystem.register({
      id: 'tablet_inscription',
      name: 'Ancient Inscription',
      promptText: 'Decipher Sacred Inscription',
      position: new THREE.Vector3(-12.8, 1.6, 2),
      interactionDistance: 2.6,
      active: true,
      onInteract: () => {
        this.events.onTabletInspected(
          '“He who disturbs the divine sovereign must know the Sacred Order of the Triad:\n\n' +
          '𓆣 I. First: The Scarab rises from the sand (Rebirth).\n' +
          '☥ II. Second: The Ankh grants the breath of life.\n' +
          '𓂀 III. Third: The Eye watches over the sacred tomb.\n\n' +
          'Align the Three Pillars in the Antechamber to unseal the Sacred Relic.”'
        );
      },
    });

    // 4. Royal Sarcophagus
    interactionSystem.register({
      id: 'royal_sarcophagus',
      name: 'Royal Sarcophagus',
      promptText: 'Examine Royal Sarcophagus',
      position: new THREE.Vector3(0, 1.1, -13.5),
      interactionDistance: 2.8,
      active: true,
      onInteract: () => {
        this.events.onSarcophagusInspected();
      },
    });

    // 5. Exit Gate Mechanism
    interactionSystem.register({
      id: 'gate_mechanism',
      name: 'Gate Mechanism',
      promptText: 'Inspect Ancient Stone Lock',
      position: new THREE.Vector3(2.2, 1.2, -22),
      interactionDistance: 2.8,
      active: true,
      onInteract: () => {
        if (this.gateUnlocked) return;

        if (this.hasArtifact) {
          this.gateUnlocked = true;
          this.exitDoor.open();
          this.events.onGateUnlocked();
          interactionSystem.unregister('gate_mechanism');
        } else {
          this.events.onTabletInspected(
            'The massive stone lock socket is shaped like a falcon\'s eye. The Eye of Horus amulet is required to unseal the gate.'
          );
        }
      },
    });

    // 6. Register 3-Pillar Glyph Mechanism Puzzle interactions
    this.puzzle.setupInteractions(interactionSystem);
  }

  public reset(useCheckpoint: boolean = false) {
    this.hasArtifact = false;
    this.gateUnlocked = false;
    this.victoryTriggered = false;

    // Reset exit door cleanly
    this.exitDoor.reset();

    // Reset guardian
    this.guardian.reset(new THREE.Vector3(0, 0, -14));

    // Restore mesh visibility
    if (this.artifactMesh) {
      this.artifactMesh.visible = true;
    }
    if (this.batteryMesh) {
      this.batteryMesh.visible = true;
    }

    if (!useCheckpoint) {
      this.puzzleSolved = false;
      this.checkpointReached = false;
      this.puzzle.reset();
    } else {
      // At checkpoint, keep puzzle solved and awaken guardian
      this.puzzleSolved = true;
      this.checkpointReached = true;
      this.puzzle.setSolvedState();
      this.guardian.awaken(12);
    }

    // Refresh interactions without recreating 3D objects
    if (this.interactionSystemRef) {
      this.interactionSystemRef.clear();
      this.setupInteractions(this.interactionSystemRef);
    }
  }

  public update(
    dt: number,
    time: number,
    playerPos: THREE.Vector3,
    isSprinting: boolean,
    isMoving: boolean,
    flashlightOn: boolean
  ) {
    this.roomBuilder.update(dt, time);
    this.exitDoor.update(dt);

    // Update supernatural guardian AI
    this.guardian.update(dt, playerPos, isSprinting, isMoving, flashlightOn);

    // Update dust particles with subtle swirling
    if (this.dustParticles) {
      const positions = this.dustParticles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i] += Math.sin(time + positions[i + 1]) * dt * 0.04;
        positions[i + 1] -= dt * 0.07;
        if (positions[i + 1] < 0) positions[i + 1] = 4.4;
      }
      this.dustParticles.geometry.attributes.position.needsUpdate = true;
    }

    // Check if player passed through the opened exit gate into outer sanctuary
    if (this.gateUnlocked && playerPos.z < -25.5 && !this.victoryTriggered) {
      this.victoryTriggered = true;
      this.events.onExitReached();
    }
  }

  public dispose() {
    this.exitDoor.dispose();
    this.guardian.dispose();
    this.puzzle.dispose();
    if (this.dustParticles) {
      this.dustParticles.geometry.dispose();
      (this.dustParticles.material as THREE.Material).dispose();
    }
  }
}

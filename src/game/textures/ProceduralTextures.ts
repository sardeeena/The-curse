import * as THREE from 'three';

export class ProceduralTextures {
  private static wallTexture: THREE.CanvasTexture | null = null;
  private static burialWallTexture: THREE.CanvasTexture | null = null;
  private static archiveWallTexture: THREE.CanvasTexture | null = null;
  private static vaultWallTexture: THREE.CanvasTexture | null = null;
  private static sanctuaryWallTexture: THREE.CanvasTexture | null = null;
  private static floorTexture: THREE.CanvasTexture | null = null;
  private static ceilingTexture: THREE.CanvasTexture | null = null;
  private static goldReliefTexture: THREE.CanvasTexture | null = null;
  private static hieroglyphFriezeTexture: THREE.CanvasTexture | null = null;
  private static tabletTexture: THREE.CanvasTexture | null = null;
  private static woodTexture: THREE.CanvasTexture | null = null;
  private static papyrusTexture: THREE.CanvasTexture | null = null;
  private static potteryTexture: THREE.CanvasTexture | null = null;
  private static bronzeTexture: THREE.CanvasTexture | null = null;
  private static linenTexture: THREE.CanvasTexture | null = null;

  private static createSafeCanvas(width: number, height: number): HTMLCanvasElement {
    if (typeof document !== 'undefined') {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      return canvas;
    }
    const mockCtx = {
      fillStyle: '',
      strokeStyle: '',
      lineWidth: 1,
      font: '',
      textAlign: '',
      textBaseline: '',
      fillRect: () => {},
      strokeRect: () => {},
      beginPath: () => {},
      moveTo: () => {},
      lineTo: () => {},
      stroke: () => {},
      fill: () => {},
      fillText: () => {},
      createLinearGradient: () => ({ addColorStop: () => {} }),
    };
    return {
      width,
      height,
      getContext: () => mockCtx,
    } as unknown as HTMLCanvasElement;
  }

  /**
   * Weathered warm ochre sandstone for Entrance Corridor and Antechamber
   */
  public static getWallTexture(): THREE.CanvasTexture {
    if (this.wallTexture) return this.wallTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Base sandstone warm ochre
    ctx.fillStyle = '#b8925c';
    ctx.fillRect(0, 0, 512, 512);

    // Weathered speckles and stone grit
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const shade = Math.random() * 50 - 25;
      ctx.fillStyle = `rgba(${170 + shade}, ${135 + shade}, ${90 + shade}, 0.25)`;
      ctx.fillRect(x, y, 2 + Math.random() * 3, 2 + Math.random() * 3);
    }

    // Brick mortar lines
    ctx.strokeStyle = '#5c4524';
    ctx.lineWidth = 4;
    const rows = 8;
    const rowH = 512 / rows;

    for (let r = 0; r <= rows; r++) {
      const y = r * rowH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      if (r < rows) {
        const offset = (r % 2) * (512 / 6);
        for (let c = 0; c < 5; c++) {
          const x = (offset + c * (512 / 3)) % 512;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowH);
          ctx.stroke();
        }
      }
    }

    // Subtle engraved hieroglyphs on several blocks
    ctx.fillStyle = '#6d4f29';
    ctx.font = '22px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    const glyphs = ['𓀀', '𓁐', '𓃭', '𓆓', '𓇋', '𓊪', '𓋹', '𓍯', '𓎛', '𓏏', '𓐍', '☥', '𓅓', '𓂋'];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < 3; c++) {
        if (Math.random() > 0.4) {
          const x = 50 + c * 160 + (r % 2) * 40;
          const y = (r + 0.5) * rowH;
          const glyph = glyphs[Math.floor(Math.random() * glyphs.length)];
          ctx.fillText(glyph, x, y);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.wallTexture = tex;
    return tex;
  }

  /**
   * Dark ceremonial royal basalt / obsidian granite for the Grand Burial Chamber
   */
  public static getBurialWallTexture(): THREE.CanvasTexture {
    if (this.burialWallTexture) return this.burialWallTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Deep subterranean basalt / black granite
    ctx.fillStyle = '#1c1714';
    ctx.fillRect(0, 0, 512, 512);

    // Fine mineral flecks
    for (let i = 0; i < 12000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const g = Math.random() * 30;
      ctx.fillStyle = `rgba(${50 + g}, ${42 + g}, ${35 + g}, 0.3)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Monumental ashlar block seams
    ctx.strokeStyle = '#0e0b09';
    ctx.lineWidth = 5;
    const rows = 6;
    const rowH = 512 / rows;

    for (let r = 0; r <= rows; r++) {
      const y = r * rowH;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();

      if (r < rows) {
        const offset = (r % 2) * 128;
        for (let c = 0; c < 4; c++) {
          const x = (offset + c * 256) % 512;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(x, y + rowH);
          ctx.stroke();
        }
      }
    }

    // Faint golden cartouche carvings and underworld incantations
    ctx.fillStyle = 'rgba(212, 175, 55, 0.45)';
    ctx.font = '24px serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const sacredGlyphs = ['𓋹', '𓍹𓇋𓏠𓈖𓊵𓏏𓊪𓍺', '𓂀', '𓊃', '𓆣', '𓎛', '𓃭', '𓅃'];
    for (let r = 0; r < rows; r++) {
      const x = 120 + ((r * 180) % 280);
      const y = (r + 0.5) * rowH;
      ctx.fillText(sacredGlyphs[r % sacredGlyphs.length], x, y);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.burialWallTexture = tex;
    return tex;
  }

  /**
   * Aged scholar's limestone wall texture with dust staining for Scribe's Archive
   */
  public static getArchiveWallTexture(): THREE.CanvasTexture {
    if (this.archiveWallTexture) return this.archiveWallTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Pale weathered dusty limestone
    ctx.fillStyle = '#a69075';
    ctx.fillRect(0, 0, 512, 512);

    // Weathered papyrus ink stains & humidity blooms
    for (let i = 0; i < 9000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const v = Math.random() * 40 - 20;
      ctx.fillStyle = `rgba(${145 + v}, ${125 + v}, ${100 + v}, 0.25)`;
      ctx.fillRect(x, y, 3, 3);
    }

    // Mortar lines for archive niches
    ctx.strokeStyle = '#4e3f2e';
    ctx.lineWidth = 3;
    const rows = 10;
    const rowH = 512 / rows;

    for (let r = 0; r <= rows; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * rowH);
      ctx.lineTo(512, r * rowH);
      ctx.stroke();
    }

    // Inscribed scribe tally marks and cataloging symbols
    ctx.fillStyle = '#3e2e1c';
    ctx.font = '18px serif';
    for (let r = 0; r < rows; r++) {
      if (r % 2 === 0) {
        ctx.fillText('𓏞 𓏛 𓏵 𓏶', 60 + (r * 35) % 300, (r + 0.6) * rowH);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.archiveWallTexture = tex;
    return tex;
  }

  /**
   * Ritual ochre sandstone with painted ceremonial frieze traces for Offering Vault
   */
  public static getVaultWallTexture(): THREE.CanvasTexture {
    if (this.vaultWallTexture) return this.vaultWallTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#af8551';
    ctx.fillRect(0, 0, 512, 512);

    // Soot stains from millennia of incense burners
    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 150; // top soot
      ctx.fillStyle = `rgba(40, 30, 20, ${0.1 + Math.random() * 0.2})`;
      ctx.fillRect(x, y, 4, 4);
    }

    // Painted terracotta red and Nile blue ceremonial border
    ctx.fillStyle = '#872718';
    ctx.fillRect(0, 380, 512, 24);
    ctx.fillStyle = '#1c3d69';
    ctx.fillRect(0, 404, 512, 14);

    // Stone joints
    ctx.strokeStyle = '#51391e';
    ctx.lineWidth = 4;
    for (let y = 0; y <= 512; y += 73) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.vaultWallTexture = tex;
    return tex;
  }

  /**
   * Sun-bleached pale stone for the Outer Sanctuary escape chamber
   */
  public static getSanctuaryWallTexture(): THREE.CanvasTexture {
    if (this.sanctuaryWallTexture) return this.sanctuaryWallTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Bleached travertine limestone
    ctx.fillStyle = '#c5b59a';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 6000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      ctx.fillStyle = 'rgba(230, 220, 200, 0.3)';
      ctx.fillRect(x, y, 3, 3);
    }

    // Winged solar disc carvings
    ctx.fillStyle = '#9b8264';
    ctx.font = '26px serif';
    ctx.textAlign = 'center';
    ctx.fillText('𓐍 𓇳 𓐍', 256, 120);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.sanctuaryWallTexture = tex;
    return tex;
  }

  public static getFloorTexture(): THREE.CanvasTexture {
    if (this.floorTexture) return this.floorTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Ancient aged stone slab floor
    ctx.fillStyle = '#7a6449';
    ctx.fillRect(0, 0, 512, 512);

    // Weathering noise
    for (let i = 0; i < 18000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const val = Math.random() * 40 - 20;
      ctx.fillStyle = `rgba(${110 + val}, ${90 + val}, ${65 + val}, 0.3)`;
      ctx.fillRect(x, y, 3, 3);
    }

    // Large square flagstones
    ctx.strokeStyle = '#3a2d1f';
    ctx.lineWidth = 6;
    const gridSize = 4;
    const step = 512 / gridSize;

    for (let i = 0; i <= gridSize; i++) {
      ctx.beginPath();
      ctx.moveTo(0, i * step);
      ctx.lineTo(512, i * step);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i * step, 0);
      ctx.lineTo(i * step, 512);
      ctx.stroke();
    }

    // Cracks
    ctx.strokeStyle = '#291e13';
    ctx.lineWidth = 1.5;
    for (let i = 0; i < 8; i++) {
      let cx = Math.random() * 512;
      let cy = Math.random() * 512;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      for (let s = 0; s < 5; s++) {
        cx += (Math.random() - 0.5) * 40;
        cy += (Math.random() - 0.5) * 40;
        ctx.lineTo(cx, cy);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.floorTexture = tex;
    return tex;
  }

  public static getCeilingTexture(): THREE.CanvasTexture {
    if (this.ceilingTexture) return this.ceilingTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Dark subterranean soot-stained ceiling with Egyptian astronomical ceiling motif
    ctx.fillStyle = '#181410';
    ctx.fillRect(0, 0, 512, 512);

    for (let i = 0; i < 8000; i++) {
      const x = Math.random() * 512;
      const y = Math.random() * 512;
      const dark = Math.random() * 30;
      ctx.fillStyle = `rgba(${30 - dark}, ${25 - dark}, ${20 - dark}, 0.35)`;
      ctx.fillRect(x, y, 4, 4);
    }

    // Ancient faded golden stars (Nut's celestial vault)
    ctx.fillStyle = 'rgba(212, 175, 55, 0.4)';
    ctx.font = '14px serif';
    for (let i = 0; i < 60; i++) {
      const sx = Math.random() * 512;
      const sy = Math.random() * 512;
      ctx.fillText('𓇯', sx, sy);
    }

    // Heavy crossbeam shadows
    ctx.strokeStyle = '#0e0b08';
    ctx.lineWidth = 12;
    for (let y = 0; y <= 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.ceilingTexture = tex;
    return tex;
  }

  public static getGoldReliefTexture(): THREE.CanvasTexture {
    if (this.goldReliefTexture) return this.goldReliefTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Rich Egyptian gold leaf
    const grad = ctx.createLinearGradient(0, 0, 512, 512);
    grad.addColorStop(0, '#e5b839');
    grad.addColorStop(0.5, '#ffd966');
    grad.addColorStop(1, '#c9961f');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 512, 512);

    // Lapis lazuli & turquoise inlay geometric patterns
    ctx.fillStyle = '#1c3f70'; // lapis
    for (let x = 0; x < 512; x += 64) {
      ctx.fillRect(x + 16, 0, 32, 512);
    }

    ctx.fillStyle = '#239389'; // turquoise
    for (let y = 0; y < 512; y += 64) {
      ctx.fillRect(0, y + 16, 512, 16);
    }

    // Gold specular flecks
    ctx.fillStyle = '#fff4b8';
    for (let i = 0; i < 500; i++) {
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.goldReliefTexture = tex;
    return tex;
  }

  public static getHieroglyphFriezeTexture(): THREE.CanvasTexture {
    if (this.hieroglyphFriezeTexture) return this.hieroglyphFriezeTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    // Painted lotus frieze border
    ctx.fillStyle = '#c8a065';
    ctx.fillRect(0, 0, 512, 128);

    // Decorative zigzag & lotus pattern
    ctx.fillStyle = '#8f2619'; // Egyptian red
    ctx.beginPath();
    for (let x = 0; x < 512; x += 32) {
      ctx.lineTo(x + 16, 24);
      ctx.lineTo(x + 32, 0);
    }
    ctx.lineTo(512, 0);
    ctx.lineTo(0, 0);
    ctx.fill();

    // Blue band
    ctx.fillStyle = '#1d4378';
    ctx.fillRect(0, 100, 512, 28);

    // Center sacred symbols
    ctx.fillStyle = '#2d1f0f';
    ctx.font = '28px serif';
    ctx.textAlign = 'center';
    const symbols = ['☥', '𓋹', '𓍯', '𓊪', '𓃭', '𓆓', '𓅓', '𓇋'];
    for (let i = 0; i < symbols.length; i++) {
      ctx.fillText(symbols[i], 32 + i * 64, 68);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.hieroglyphFriezeTexture = tex;
    return tex;
  }

  public static getTabletTexture(): THREE.CanvasTexture {
    if (this.tabletTexture) return this.tabletTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;

    // Aged carved limestone tablet
    ctx.fillStyle = '#d9c298';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#5a3d1b';
    ctx.lineWidth = 12;
    ctx.strokeRect(16, 16, 480, 480);

    // Engraved header
    ctx.fillStyle = '#3a250e';
    ctx.font = 'bold 22px serif';
    ctx.textAlign = 'center';
    ctx.fillText('𓋹 INSCRIPTION OF PHARAOH 𓋹', 256, 60);

    ctx.font = '16px serif';
    ctx.textAlign = 'left';
    const lines = [
      '“He who disturbs the divine sovereign',
      'must know the Sacred Order of the Triad:',
      '',
      '𓆣 I. First: The Scarab rises from the sand.',
      '☥ II. Second: The Ankh grants breath to kings.',
      '𓂀 III. Third: The Eye watches over the dead.',
      '',
      'Align the Three Pillars in the Antechamber',
      'to unlock the Golden Eye of Horus.”'
    ];

    lines.forEach((line, idx) => {
      ctx.fillText(line, 45, 115 + idx * 36);
    });

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    this.tabletTexture = tex;
    return tex;
  }

  /**
   * Ancient desiccated acacia/cedar wood texture for shelving, chests & tables
   */
  public static getWoodTexture(): THREE.CanvasTexture {
    if (this.woodTexture) return this.woodTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dark dry ancient wood base
    ctx.fillStyle = '#4a3319';
    ctx.fillRect(0, 0, 256, 256);

    // Wood grain lines
    ctx.strokeStyle = '#2b1c0b';
    ctx.lineWidth = 2;
    for (let y = 0; y < 256; y += 6) {
      ctx.beginPath();
      ctx.moveTo(0, y + (Math.random() - 0.5) * 3);
      for (let x = 0; x <= 256; x += 32) {
        ctx.lineTo(x, y + Math.sin(x * 0.05) * 4);
      }
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.woodTexture = tex;
    return tex;
  }

  /**
   * Fibrous papyrus parchment texture for rolled scrolls & manuscripts
   */
  public static getPapyrusTexture(): THREE.CanvasTexture {
    if (this.papyrusTexture) return this.papyrusTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Dried Nile reed parchment
    ctx.fillStyle = '#dfcca2';
    ctx.fillRect(0, 0, 256, 256);

    // Crossed reed fibers
    ctx.strokeStyle = 'rgba(180, 150, 110, 0.4)';
    ctx.lineWidth = 1;
    for (let i = 0; i < 256; i += 4) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }

    // Faint cursive hieratic black ink writing
    ctx.fillStyle = 'rgba(30, 20, 10, 0.7)';
    for (let y = 20; y < 240; y += 22) {
      for (let x = 15; x < 230; x += 18) {
        if (Math.random() > 0.3) {
          ctx.fillRect(x, y, 8 + Math.random() * 6, 2);
        }
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.papyrusTexture = tex;
    return tex;
  }

  /**
   * Terracotta earthenware clay texture for canopic jars, urns, and broken pottery
   */
  public static getPotteryTexture(): THREE.CanvasTexture {
    if (this.potteryTexture) return this.potteryTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Warm terracotta red-orange clay
    ctx.fillStyle = '#9e4e2a';
    ctx.fillRect(0, 0, 256, 256);

    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = `rgba(${120 + Math.random() * 40}, ${50 + Math.random() * 25}, 20, 0.25)`;
      ctx.fillRect(x, y, 2, 2);
    }

    // Painted geometric bands
    ctx.fillStyle = '#22150d';
    ctx.fillRect(0, 60, 256, 12);
    ctx.fillRect(0, 180, 256, 12);

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.potteryTexture = tex;
    return tex;
  }

  /**
   * Weathered bronze with verdigris patina for ceremonial tripods and lamp stands
   */
  public static getBronzeTexture(): THREE.CanvasTexture {
    if (this.bronzeTexture) return this.bronzeTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    // Tarnished bronze base
    ctx.fillStyle = '#563e26';
    ctx.fillRect(0, 0, 256, 256);

    // Greenish verdigris oxidation spots
    for (let i = 0; i < 2500; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      ctx.fillStyle = `rgba(45, 110, 85, ${0.15 + Math.random() * 0.3})`;
      ctx.fillRect(x, y, 3, 3);
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.bronzeTexture = tex;
    return tex;
  }

  /**
   * Aged woven linen bandage cloth
   */
  public static getLinenTexture(): THREE.CanvasTexture {
    if (this.linenTexture) return this.linenTexture;

    const canvas = this.createSafeCanvas(512, 512);
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#94836f';
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#5f5040';
    ctx.lineWidth = 1;
    for (let i = 0; i < 256; i += 3) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(256, i);
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, 256);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.colorSpace = THREE.SRGBColorSpace;
    this.linenTexture = tex;
    return tex;
  }
}

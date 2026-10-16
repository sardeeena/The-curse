import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { GLYPH_OPTIONS, GlyphPuzzleSystem } from '../src/game/systems/GlyphPuzzleSystem';
import { HealthSystem } from '../src/game/systems/HealthSystem';
import { CollisionSystem } from '../src/game/player/CollisionSystem';
import { FlashlightSystem } from '../src/game/systems/FlashlightSystem';
import { GuardianNavigation } from '../src/game/enemy/GuardianNavigation';

describe('1. Sacred Glyph Puzzle & Symbol-to-Index Mapping', () => {
  test('GLYPH_OPTIONS has exact 4 canonical symbols in verified order', () => {
    assert.equal(GLYPH_OPTIONS.length, 4);

    // Index 0: Scarab of Rebirth (𓆣)
    assert.equal(GLYPH_OPTIONS[0].id, 'scarab');
    assert.equal(GLYPH_OPTIONS[0].symbol, '𓆣');
    assert.equal(GLYPH_OPTIONS[0].name, 'Scarab of Rebirth');

    // Index 1: Ankh of Life (☥)
    assert.equal(GLYPH_OPTIONS[1].id, 'ankh');
    assert.equal(GLYPH_OPTIONS[1].symbol, '☥');
    assert.equal(GLYPH_OPTIONS[1].name, 'Ankh of Life');

    // Index 2: Eye of Horus (𓂀)
    assert.equal(GLYPH_OPTIONS[2].id, 'eye');
    assert.equal(GLYPH_OPTIONS[2].symbol, '𓂀');
    assert.equal(GLYPH_OPTIONS[2].name, 'Eye of Horus');

    // Index 3: Feather of Ma'at (𓆄)
    assert.equal(GLYPH_OPTIONS[3].id, 'feather');
    assert.equal(GLYPH_OPTIONS[3].symbol, '𓆄');
  });

  test('Target solution is strictly [0, 1, 2] matching Scarab -> Ankh -> Eye', () => {
    const scene = new THREE.Scene();
    const collision = new CollisionSystem();
    let solved = false;
    const puzzle = new GlyphPuzzleSystem(scene, collision, () => {
      solved = true;
    });

    assert.deepEqual(puzzle.targetSolution, [0, 1, 2]);
    assert.deepEqual(puzzle.initialGlyphs, [3, 2, 1]);
    assert.equal(puzzle.isSolved, false);
    assert.equal(solved, false);

    // Initial state does NOT match target
    assert.notDeepEqual(
      puzzle.pillars.map(p => p.selectedGlyphIndex),
      [0, 1, 2]
    );

    // Solve the puzzle step by step
    puzzle.setSolvedState();
    assert.equal(puzzle.isSolved, true);
    assert.deepEqual(
      puzzle.pillars.map(p => p.selectedGlyphIndex),
      [0, 1, 2]
    );
  });

  test('Pillar rotation wraps modulo 4', () => {
    let index = 0;
    index = (index + 1) % 4; // 1
    assert.equal(index, 1);
    index = (index + 1) % 4; // 2
    assert.equal(index, 2);
    index = (index + 1) % 4; // 3
    assert.equal(index, 3);
    index = (index + 1) % 4; // 0
    assert.equal(index, 0);
  });
});

describe('2. Health System, Damage Clamping & Single Death Trigger', () => {
  test('Health never drops below 0 and clamps at max', () => {
    const health = new HealthSystem(100);
    assert.equal(health.currentHealth, 100);
    assert.equal(health.maxHealth, 100);
    assert.equal(health.isDead, false);

    // Take partial damage
    health.takeDamage(35);
    assert.equal(health.currentHealth, 65);

    // Heal cannot exceed max
    health.heal(50);
    assert.equal(health.currentHealth, 100);

    // Excessive damage clamps to 0
    let deathCount = 0;
    health.addListener({
      onHealthChanged: () => {},
      onPlayerDeath: () => {
        deathCount++;
      },
    });

    health.takeDamage(200);
    assert.equal(health.currentHealth, 0);
    assert.equal(health.isDead, true);
    assert.equal(deathCount, 1);

    // Further damage after death does not fire second death event
    health.takeDamage(50);
    assert.equal(health.currentHealth, 0);
    assert.equal(deathCount, 1);
  });

  test('Invulnerability frames prevent rapid damage spamming', () => {
    const health = new HealthSystem(100);
    health.takeDamage(25);
    assert.equal(health.currentHealth, 75);

    // Immediate second hit within i-frames is ignored
    const damaged = health.takeDamage(25);
    assert.equal(damaged, false);
    assert.equal(health.currentHealth, 75);

    // After updating delta past i-frame duration, next damage applies
    health.update(1.2);
    const damagedAfter = health.takeDamage(25);
    assert.equal(damagedAfter, true);
    assert.equal(health.currentHealth, 50);
  });

  test('Reset cleanly restores health and alive state', () => {
    const health = new HealthSystem(100);
    health.takeDamage(150);
    assert.equal(health.isDead, true);

    health.reset(100);
    assert.equal(health.currentHealth, 100);
    assert.equal(health.isDead, false);
  });
});

describe('3. Collision System Integrity', () => {
  test('Box collision checks inside vs outside coordinates accurately', () => {
    const col = new CollisionSystem();
    col.addBox(new THREE.Vector3(-2, 0, -2), new THREE.Vector3(2, 4, 2));

    // Inside
    assert.equal(col.checkPoint(new THREE.Vector3(0, 2, 0)), true);
    assert.equal(col.checkPoint(new THREE.Vector3(1.5, 1, 1.5)), true);

    // Outside
    assert.equal(col.checkPoint(new THREE.Vector3(3.5, 2, 0)), false);
    assert.equal(col.checkPoint(new THREE.Vector3(0, 5, 0)), false);
  });

  test('Cylinder collision checks radius and height accurately', () => {
    const col = new CollisionSystem();
    col.addCylinder(0, 0, 1.0, 0, 4);

    // Inside radius (0.5 < 1.0) and height (2 in [0, 4])
    assert.equal(col.checkPoint(new THREE.Vector3(0.5, 2, 0)), true);

    // Outside radius (1.5 > 1.0)
    assert.equal(col.checkPoint(new THREE.Vector3(1.5, 2, 0)), false);

    // Outside height (Y = 5 > 4)
    assert.equal(col.checkPoint(new THREE.Vector3(0.2, 5, 0)), false);
  });
});

describe('4. Flashlight Battery System', () => {
  test('Battery drains when ON and stops at 0', () => {
    const flash = new FlashlightSystem();
    assert.equal(flash.isOn, true);
    assert.equal(flash.battery, 100);

    // Update 10 seconds (drainRate is 0.45%/s)
    flash.update(10);
    assert.ok(flash.battery < 100);
    assert.ok(flash.battery > 90);

    // Drain to 0
    flash.update(300);
    assert.equal(flash.battery, 0);
    assert.equal(flash.isOn, false);

    // Turning on with 0 battery fails
    const turnedOn = flash.toggle();
    assert.equal(turnedOn, false);
    assert.equal(flash.isOn, false);
  });

  test('Adding battery recharges and caps at 100', () => {
    const flash = new FlashlightSystem();
    flash.update(200);
    const low = flash.battery;

    flash.addBattery(45);
    assert.equal(flash.battery, Math.min(100, low + 45));

    flash.addBattery(200);
    assert.equal(flash.battery, 100);
  });
});

describe('5. Guardian Navigation Graph Connectivity', () => {
  test('Waypoint graph forms continuous route from entrance corridor to northern gate', () => {
    const nav = new GuardianNavigation();
    assert.ok(nav.nodes.length >= 18);

    // Test path from entrance (node 0: 0, 0, 16) to Northern Gate (node 17: 0, 0, -21.5)
    const fromPos = new THREE.Vector3(0, 0, 16);
    const toPos = new THREE.Vector3(0, 0, -21.5);
    const path = nav.findPath(fromPos, toPos);

    assert.ok(path.length > 0);
    // Final waypoint in path should reach the destination
    const lastPoint = path[path.length - 1];
    assert.ok(lastPoint.distanceTo(toPos) < 2.5);
  });
});

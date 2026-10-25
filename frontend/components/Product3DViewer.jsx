'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RotateCw, Box, Eye, Sparkles, ExternalLink, ShieldCheck, ZoomIn } from 'lucide-react';

/**
 * Interactive 3D Product Showcase Canvas
 * Built with Three.js for high-performance WebGL rendering.
 * Supports mouse drag 360° rotation, wheel zooming, procedural streetwear models
 * (Chunky Sneakers, Tactical G-Shock Watch, Y2K Wrap Shield Shades),
 * dynamic lighting, wireframe mode, and neon colorway switching.
 */
export default function Product3DViewer({ initialProduct, onCopLook }) {
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const cameraRef = useRef(null);
  const modelGroupRef = useRef(null);
  const materialsRef = useRef([]);

  // Viewer State
  const [activeModelType, setActiveModelType] = useState(initialProduct?.model_type || 'sneaker');
  const [autoRotate, setAutoRotate] = useState(true);
  const [isWireframe, setIsWireframe] = useState(false);
  const [selectedColor, setSelectedColor] = useState('#4D0E13'); // Velvet Burgundy default
  const [isDragging, setIsDragging] = useState(false);

  // Active showcase item details
  const showcaseItems = {
    sneaker: {
      name: "Nike Air Max Plus Drift 'Acid Neon'",
      brand: "Nike",
      price: "₹14,999",
      dropTag: "HIGH VOLTAGE DROP",
      link: "https://nike.com/affiliate/air-max-plus-drift?ref=streetdrip",
      category: "Shoes"
    },
    watch: {
      name: "Casio G-Shock GA-2100 'CasiOak' Stealth",
      brand: "Casio",
      price: "₹7,995",
      dropTag: "CYBER TECH WEAR",
      link: "https://gshock.com/affiliate/ga2100-stealth?ref=streetdrip",
      category: "Watches"
    },
    glasses: {
      name: "CyberShield Y2K Matrix Wrap Sunglasses",
      brand: "Zara",
      price: "₹2,490",
      dropTag: "LIMITED FEST DROP",
      link: "https://zara.com/affiliate/cybershield-shades?ref=streetdrip",
      category: "Glasses"
    }
  };

  const currentItem = showcaseItems[activeModelType] || showcaseItems.sneaker;

  // Colorways for real-time 3D material customization (Pinterest Nomiki Luxury Palette)
  const colorways = [
    { name: 'Velvet Burgundy', hex: '#4D0E13' },
    { name: 'Atelier Creme', hex: '#EEE4DA' },
    { name: 'Desert Sand', hex: '#D8C4AC' },
    { name: 'Dusty Rose', hex: '#C8A49F' },
    { name: 'Rich Wine', hex: '#6B141C' },
    { name: 'Obsidian Noir', hex: '#140204' },
    { name: 'Warm Cashmere', hex: '#DEC3BF' },
  ];

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene Setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    scene.fog = new THREE.FogExp2(0x050505, 0.04);

    // 2. Camera Setup
    const width = container.clientWidth;
    const height = container.clientHeight;
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.2, 3.8);
    cameraRef.current = camera;

    // 3. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    container.appendChild(renderer.domElement);

    // 4. Lighting Rig (Cyberpunk Brutalist Studio Setup)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);

    const mainKeyLight = new THREE.DirectionalLight(0xffffff, 2.0);
    mainKeyLight.position.set(4, 5, 4);
    mainKeyLight.castShadow = true;
    mainKeyLight.shadow.mapSize.width = 1024;
    mainKeyLight.shadow.mapSize.height = 1024;
    scene.add(mainKeyLight);

    const neonRimLight = new THREE.PointLight(new THREE.Color(selectedColor), 4.5, 8);
    neonRimLight.position.set(-3, 2, -2);
    scene.add(neonRimLight);

    const groundFillLight = new THREE.DirectionalLight(0x334466, 0.8);
    groundFillLight.position.set(0, -3, 2);
    scene.add(groundFillLight);

    // 5. Brutalist Ground Grid & Pedestal
    const gridHelper = new THREE.GridHelper(10, 20, 0x333333, 0x151515);
    gridHelper.position.y = -0.65;
    scene.add(gridHelper);

    // Subtle dark circular shadow catcher
    const shadowGeo = new THREE.CylinderGeometry(1.6, 1.6, 0.05, 32);
    const shadowMat = new THREE.MeshStandardMaterial({
      color: 0x09090b,
      roughness: 0.9,
      metalness: 0.1,
    });
    const pedestal = new THREE.Mesh(shadowGeo, shadowMat);
    pedestal.position.y = -0.68;
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // 6. Master Product Model Group
    const modelGroup = new THREE.Group();
    scene.add(modelGroup);
    modelGroupRef.current = modelGroup;

    // Helper: Build procedural 3D model according to active type
    buildProductGeometry(modelGroup, activeModelType, selectedColor, isWireframe);

    // 7. Interactive Mouse / Touch Orbit Interaction
    let isPointerDown = false;
    let previousPointerX = 0;
    let previousPointerY = 0;
    let rotationVelocityX = 0;
    let rotationVelocityY = 0;

    const onPointerDown = (e) => {
      isPointerDown = true;
      setIsDragging(true);
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      previousPointerX = clientX;
      previousPointerY = clientY;
    };

    const onPointerMove = (e) => {
      if (!isPointerDown) return;
      const clientX = e.clientX || (e.touches && e.touches[0].clientX);
      const clientY = e.clientY || (e.touches && e.touches[0].clientY);
      const deltaX = clientX - previousPointerX;
      const deltaY = clientY - previousPointerY;

      rotationVelocityY = deltaX * 0.007;
      rotationVelocityX = deltaY * 0.005;

      if (modelGroupRef.current) {
        modelGroupRef.current.rotation.y += rotationVelocityY;
        modelGroupRef.current.rotation.x = Math.max(-0.6, Math.min(0.6, modelGroupRef.current.rotation.x + rotationVelocityX));
      }

      previousPointerX = clientX;
      previousPointerY = clientY;
    };

    const onPointerUp = () => {
      isPointerDown = false;
      setIsDragging(false);
    };

    const onWheel = (e) => {
      e.preventDefault();
      if (!cameraRef.current) return;
      cameraRef.current.position.z = Math.max(2.2, Math.min(5.5, cameraRef.current.position.z + e.deltaY * 0.003));
    };

    const dom = renderer.domElement;
    dom.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    dom.addEventListener('touchstart', onPointerDown, { passive: true });
    window.addEventListener('touchmove', onPointerMove, { passive: true });
    window.addEventListener('touchend', onPointerUp);
    dom.addEventListener('wheel', onWheel, { passive: false });

    // 8. Animation Loop
    let animationFrameId;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();

      if (modelGroupRef.current) {
        // Auto-rotation if enabled and not currently dragging
        if (autoRotate && !isPointerDown) {
          modelGroupRef.current.rotation.y += delta * 0.6;
        }

        // Inertia damping
        if (!isPointerDown) {
          rotationVelocityX *= 0.92;
          rotationVelocityY *= 0.92;
          modelGroupRef.current.rotation.y += rotationVelocityY;
          modelGroupRef.current.rotation.x += rotationVelocityX;
        }

        // Subtle breathing floating motion
        const elapsedTime = clock.getElapsedTime();
        modelGroupRef.current.position.y = Math.sin(elapsedTime * 1.5) * 0.04;
      }

      renderer.render(scene, camera);
    };
    animate();

    // 9. Resize Handling
    const handleResize = () => {
      if (!container || !rendererRef.current || !cameraRef.current) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };
    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
      dom.removeEventListener('mousedown', onPointerDown);
      window.removeEventListener('mousemove', onPointerMove);
      window.removeEventListener('mouseup', onPointerUp);
      dom.removeEventListener('touchstart', onPointerDown);
      window.removeEventListener('touchmove', onPointerMove);
      window.removeEventListener('touchend', onPointerUp);
      dom.removeEventListener('wheel', onWheel);
      if (dom && container.contains(dom)) {
        container.removeChild(dom);
      }
      renderer.dispose();
    };
  }, [activeModelType]);

  // Update Material Color & Wireframe Reactively
  useEffect(() => {
    if (!modelGroupRef.current) return;
    materialsRef.current.forEach(mat => {
      if (mat.name === 'accent') {
        mat.color.set(selectedColor);
      }
      mat.wireframe = isWireframe;
      mat.needsUpdate = true;
    });
  }, [selectedColor, isWireframe]);

  // Procedural 3D Mesh Generator for Streetwear Staples
  function buildProductGeometry(group, type, accentHex, wireframe) {
    // Clear previous children
    while (group.children.length > 0) {
      group.remove(group.children[0]);
    }
    materialsRef.current = [];

    const accentColor = new THREE.Color(accentHex);
    const darkSoleMat = new THREE.MeshStandardMaterial({
      color: 0x111115,
      roughness: 0.85,
      metalness: 0.1,
      wireframe,
      name: 'dark'
    });
    const upperMat = new THREE.MeshStandardMaterial({
      color: 0x222228,
      roughness: 0.4,
      metalness: 0.3,
      wireframe,
      name: 'upper'
    });
    const neonAccentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      roughness: 0.2,
      metalness: 0.6,
      emissive: accentColor,
      emissiveIntensity: 0.35,
      wireframe,
      name: 'accent'
    });
    const chromeMat = new THREE.MeshStandardMaterial({
      color: 0xdddddd,
      metalness: 0.95,
      roughness: 0.1,
      wireframe,
      name: 'chrome'
    });
    const glassMat = new THREE.MeshPhysicalMaterial({
      color: accentColor,
      metalness: 0.1,
      roughness: 0.05,
      transmission: 0.85,
      thickness: 0.4,
      transparent: true,
      opacity: 0.75,
      wireframe,
      name: 'glass'
    });

    materialsRef.current.push(darkSoleMat, upperMat, neonAccentMat, chromeMat, glassMat);

    if (type === 'sneaker') {
      // --- CHUNKY STREETWEAR SNEAKER ---
      // Sole base (Chunky lugged bottom)
      const soleGeo = new THREE.BoxGeometry(1.0, 0.28, 2.2, 4, 2, 8);
      const soleMesh = new THREE.Mesh(soleGeo, darkSoleMat);
      soleMesh.position.y = -0.28;
      soleMesh.castShadow = true;
      group.add(soleMesh);

      // Midsole Air Bubble (Translucent)
      const airBubbleGeo = new THREE.CylinderGeometry(0.38, 0.42, 0.18, 16);
      airBubbleGeo.rotateZ(Math.PI / 2);
      const airBubbleMesh = new THREE.Mesh(airBubbleGeo, glassMat);
      airBubbleMesh.position.set(0, -0.24, -0.45);
      group.add(airBubbleMesh);

      // Main Foot Upper
      const upperGeo = new THREE.ConeGeometry(0.55, 1.4, 16);
      upperGeo.rotateX(-Math.PI / 3);
      upperGeo.scale(0.9, 0.7, 1.3);
      const upperMesh = new THREE.Mesh(upperGeo, upperMat);
      upperMesh.position.set(0, 0.05, -0.05);
      upperMesh.castShadow = true;
      group.add(upperMesh);

      // Cybernetic Cage Overlays (Brutalist Street Lines)
      const cageGeo1 = new THREE.TorusGeometry(0.48, 0.04, 8, 24, Math.PI);
      cageGeo1.rotateX(Math.PI / 2.3);
      const cageMesh1 = new THREE.Mesh(cageGeo1, neonAccentMat);
      cageMesh1.position.set(0, 0.1, 0.2);
      group.add(cageMesh1);

      const cageGeo2 = cageGeo1.clone();
      const cageMesh2 = new THREE.Mesh(cageGeo2, neonAccentMat);
      cageMesh2.position.set(0, 0.18, -0.2);
      group.add(cageMesh2);

      // High-collar Ankle Opening
      const collarGeo = new THREE.CylinderGeometry(0.36, 0.42, 0.5, 16, 1, true);
      const collarMesh = new THREE.Mesh(collarGeo, darkSoleMat);
      collarMesh.position.set(0, 0.4, -0.4);
      group.add(collarMesh);

      // Tongue & Laces
      const tongueGeo = new THREE.BoxGeometry(0.24, 0.65, 0.08);
      tongueGeo.rotateX(0.3);
      const tongueMesh = new THREE.Mesh(tongueGeo, neonAccentMat);
      tongueMesh.position.set(0, 0.42, -0.2);
      group.add(tongueMesh);

    } else if (type === 'watch') {
      // --- TACTICAL OCTAGONAL G-SHOCK WATCH ---
      // Octagonal Case Bezel
      const caseGeo = new THREE.CylinderGeometry(0.72, 0.75, 0.28, 8);
      const caseMesh = new THREE.Mesh(caseGeo, darkSoleMat);
      caseMesh.rotation.x = Math.PI / 2;
      caseMesh.castShadow = true;
      group.add(caseMesh);

      // Inner Accent Ring
      const ringGeo = new THREE.TorusGeometry(0.55, 0.04, 8, 32);
      const ringMesh = new THREE.Mesh(ringGeo, neonAccentMat);
      group.add(ringMesh);

      // Watch Dial Glass Face
      const dialGeo = new THREE.CircleGeometry(0.53, 32);
      const dialMesh = new THREE.Mesh(dialGeo, upperMat);
      dialMesh.position.z = 0.05;
      group.add(dialMesh);

      // Analog Hands & Digital Display Screen
      const handGeo = new THREE.BoxGeometry(0.04, 0.35, 0.02);
      const handMesh = new THREE.Mesh(handGeo, neonAccentMat);
      handMesh.position.set(0.08, 0.1, 0.07);
      handMesh.rotation.z = -0.7;
      group.add(handMesh);

      const lcdScreenGeo = new THREE.PlaneGeometry(0.36, 0.18);
      const lcdScreenMat = new THREE.MeshBasicMaterial({ color: accentColor, wireframe });
      const lcdMesh = new THREE.Mesh(lcdScreenGeo, lcdScreenMat);
      lcdMesh.position.set(0, -0.22, 0.07);
      group.add(lcdMesh);

      // Textured Resin Straps (Top & Bottom)
      const strapGeo = new THREE.BoxGeometry(0.58, 1.4, 0.14, 2, 6, 1);
      const topStrap = new THREE.Mesh(strapGeo, darkSoleMat);
      topStrap.position.set(0, 1.15, -0.15);
      topStrap.rotation.x = -0.2;
      topStrap.castShadow = true;
      group.add(topStrap);

      const btmStrap = new THREE.Mesh(strapGeo, darkSoleMat);
      btmStrap.position.set(0, -1.15, -0.15);
      btmStrap.rotation.x = 0.2;
      btmStrap.castShadow = true;
      group.add(btmStrap);

      // Metal Screws / Hardware
      [-0.55, 0.55].forEach(x => {
        [-0.55, 0.55].forEach(y => {
          const boltGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.32, 6);
          boltGeo.rotateX(Math.PI / 2);
          const boltMesh = new THREE.Mesh(boltGeo, chromeMat);
          boltMesh.position.set(x * 0.7, y * 0.7, 0);
          group.add(boltMesh);
        });
      });

    } else if (type === 'glasses') {
      // --- MATRIX Y2K WRAP SHIELD SUNGLASSES ---
      // Curving Monolithic Shield Lens
      const shieldGeo = new THREE.CylinderGeometry(0.9, 0.9, 0.55, 32, 1, true, 0, Math.PI);
      const shieldMesh = new THREE.Mesh(shieldGeo, glassMat);
      shieldMesh.position.set(0, 0, -0.4);
      shieldMesh.rotation.y = -Math.PI / 2;
      group.add(shieldMesh);

      // Top Brow Bar (Aerodynamic frame)
      const browGeo = new THREE.TorusGeometry(0.92, 0.05, 8, 32, Math.PI);
      browGeo.rotateX(Math.PI / 2);
      const browMesh = new THREE.Mesh(browGeo, neonAccentMat);
      browMesh.position.set(0, 0.28, -0.4);
      group.add(browMesh);

      // Cyber Temples / Arms
      const templeGeo = new THREE.BoxGeometry(0.06, 0.1, 1.3);
      const leftTemple = new THREE.Mesh(templeGeo, darkSoleMat);
      leftTemple.position.set(-0.9, 0.22, 0.25);
      group.add(leftTemple);

      const rightTemple = new THREE.Mesh(templeGeo, darkSoleMat);
      rightTemple.position.set(0.9, 0.22, 0.25);
      group.add(rightTemple);

      // Nose Pad Bridge
      const bridgeGeo = new THREE.BoxGeometry(0.18, 0.12, 0.1);
      const bridgeMesh = new THREE.Mesh(bridgeGeo, chromeMat);
      bridgeMesh.position.set(0, 0.05, 0.48);
      group.add(bridgeMesh);
    }

    // Default angle for aesthetic display
    group.rotation.y = 0.5;
    group.rotation.x = 0.15;
  }

  // Camera Reset
  const resetCamera = () => {
    if (cameraRef.current && modelGroupRef.current) {
      cameraRef.current.position.set(0, 1.2, 3.8);
      modelGroupRef.current.rotation.set(0.15, 0.5, 0);
    }
  };

  return (
    <div className="relative w-full h-[460px] sm:h-[520px] md:h-[580px] bg-creme-100/40 dark:bg-burgundy-950/70 border border-sand-300/70 dark:border-burgundy-800/60 overflow-hidden rounded-none flex flex-col justify-between select-none">
      {/* Top Streetwear Meta Banner */}
      <div className="absolute top-0 left-0 right-0 z-20 flex flex-wrap items-center justify-between p-3 sm:p-4 bg-creme-50/85 dark:bg-burgundy-950/85 backdrop-blur-md border-b border-sand-300/70 dark:border-burgundy-800/60 text-xs sm:text-sm font-mono">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full bg-burgundy-800 dark:bg-dusty-400 animate-pulse"></span>
          <span className="font-bold text-burgundy-950 dark:text-creme-100 tracking-wider sm:tracking-widest uppercase text-xs sm:text-sm">
            3D ATELIER // {activeModelType.toUpperCase()}
          </span>
          <span className="hidden sm:inline bg-sand-200/60 dark:bg-burgundy-900/60 text-burgundy-900 dark:text-dusty-300 border border-sand-400/40 dark:border-dusty-400/30 px-2.5 py-0.5 text-xs font-bold">
            {currentItem.dropTag}
          </span>
        </div>

        {/* 3D Item Switcher Tabs */}
        <div className="flex items-center gap-1 sm:gap-1.5 bg-creme-200/60 dark:bg-burgundy-900/50 border border-sand-300 dark:border-burgundy-800/60 p-0.5 sm:p-1 mt-1 sm:mt-0">
          <button
            onClick={() => setActiveModelType('sneaker')}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-xs sm:text-sm transition-all uppercase ${
              activeModelType === 'sneaker'
                ? 'bg-burgundy-900 text-creme-100 dark:bg-burgundy-800 dark:text-creme-100 font-bold shadow-sm'
                : 'text-neutral-600 dark:text-creme-200/60 hover:text-burgundy-900 dark:hover:text-creme-100'
            }`}
          >
            Sneaker
          </button>
          <button
            onClick={() => setActiveModelType('watch')}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-xs sm:text-sm transition-all uppercase ${
              activeModelType === 'watch'
                ? 'bg-burgundy-900 text-creme-100 dark:bg-burgundy-800 dark:text-creme-100 font-bold shadow-sm'
                : 'text-neutral-600 dark:text-creme-200/60 hover:text-burgundy-900 dark:hover:text-creme-100'
            }`}
          >
            G-Shock
          </button>
          <button
            onClick={() => setActiveModelType('glasses')}
            className={`px-2.5 sm:px-4 py-1 sm:py-1.5 font-mono text-xs sm:text-sm transition-all uppercase ${
              activeModelType === 'glasses'
                ? 'bg-burgundy-900 text-creme-100 dark:bg-burgundy-800 dark:text-creme-100 font-bold shadow-sm'
                : 'text-neutral-600 dark:text-creme-200/60 hover:text-burgundy-900 dark:hover:text-creme-100'
            }`}
          >
            Shades
          </button>
        </div>
      </div>

      {/* Main Three.js Canvas Mount */}
      <div
        ref={mountRef}
        className={`w-full h-full cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
      />

      {/* Floating Canvas UI Controls (Left Side) */}
      <div className="absolute left-2.5 sm:left-4 top-14 sm:top-20 z-20 flex flex-col gap-1.5 sm:gap-2">
        {/* Auto Rotate Toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-mono border backdrop-blur-md transition-all shadow-sm ${
            autoRotate
              ? 'bg-burgundy-900 text-creme-100 border-burgundy-900 dark:bg-burgundy-900/90 dark:text-dusty-300 dark:border-dusty-400/50'
              : 'bg-creme-50/90 dark:bg-burgundy-950/90 text-neutral-600 dark:text-creme-200/70 border-sand-300 dark:border-burgundy-800/60 hover:text-burgundy-950 dark:hover:text-creme-100'
          }`}
          title="Toggle Turntable Rotation"
        >
          <RotateCw className={`w-3 sm:w-3.5 h-3 sm:h-3.5 ${autoRotate ? 'animate-spin' : ''}`} />
          <span className="text-[9px] sm:text-[10px] uppercase font-bold">{autoRotate ? 'Spin ON' : 'Spin OFF'}</span>
        </button>

        {/* Wireframe Mode Toggle */}
        <button
          onClick={() => setIsWireframe(!isWireframe)}
          className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-mono border backdrop-blur-md transition-all shadow-sm ${
            isWireframe
              ? 'bg-burgundy-900 text-dusty-300 border-dusty-400 dark:bg-dusty-500/20 dark:text-dusty-300 dark:border-dusty-400/70'
              : 'bg-creme-50/90 dark:bg-burgundy-950/90 text-neutral-600 dark:text-creme-200/70 border-sand-300 dark:border-burgundy-800/60 hover:text-burgundy-950 dark:hover:text-creme-100'
          }`}
          title="Toggle Wireframe Architecture"
        >
          <Box className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          <span className="text-[9px] sm:text-[10px] uppercase font-bold">Wireframe</span>
        </button>

        {/* Reset Camera View */}
        <button
          onClick={resetCamera}
          className="flex items-center gap-1.5 px-2 sm:px-2.5 py-1 sm:py-1.5 text-xs font-mono bg-creme-50/90 dark:bg-burgundy-950/90 text-neutral-600 dark:text-creme-200/70 border border-sand-300 dark:border-burgundy-800/60 hover:text-burgundy-950 dark:hover:text-creme-100 backdrop-blur-md transition-all shadow-sm"
        >
          <Eye className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
          <span className="text-[9px] sm:text-[10px] uppercase font-bold">Reset 3D</span>
        </button>
      </div>

      {/* Interactive Helper Indicator (Center Top) */}
      <div className="absolute top-16 left-1/2 -translate-x-1/2 pointer-events-none z-10 hidden md:flex items-center gap-2 px-3 py-1 bg-creme-50/80 dark:bg-burgundy-950/80 border border-sand-300/70 dark:border-burgundy-800/60 text-neutral-600 dark:text-creme-200/80 text-[10px] font-mono tracking-widest uppercase backdrop-blur-sm shadow-sm">
        <Sparkles className="w-3 h-3 text-burgundy-800 dark:text-dusty-300" />
        <span>Click &amp; Drag to Rotate // Scroll to Zoom</span>
      </div>

      {/* Bottom Floating Card: Product Specs & Actionable Affiliate Cop */}
      <div className="absolute bottom-0 left-0 right-0 z-20 p-3 sm:p-4 bg-gradient-to-t from-creme-50 via-creme-50/95 to-transparent dark:from-burgundy-950 dark:via-burgundy-950/95 dark:to-transparent border-t border-sand-300/70 dark:border-burgundy-800/60">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-end justify-between gap-3 sm:gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono tracking-widest text-neutral-500 dark:text-creme-200/70 uppercase font-semibold">
                {currentItem.brand} // {currentItem.category}
              </span>
              <span className="text-[10px] sm:text-xs font-mono text-burgundy-900 dark:text-dusty-300 bg-sand-200/60 dark:bg-burgundy-900/60 px-2 py-0.5 border border-sand-400/40 dark:border-dusty-400/30 font-bold">
                VERIFIED AUTHENTIC
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl md:text-3xl font-serif font-medium text-burgundy-950 dark:text-creme-100 tracking-tight leading-tight">
              {currentItem.name}
            </h2>
            <div className="flex items-baseline gap-2.5 sm:gap-3 mt-1 sm:mt-1.5">
              <span className="text-2xl sm:text-3xl md:text-4xl font-mono font-bold text-burgundy-950 dark:text-creme-100">
                {currentItem.price}
              </span>
              <span className="text-xs sm:text-sm font-mono text-neutral-400 dark:text-creme-200/50 line-through">
                {(() => {
                  const raw = String(currentItem.price || '').replace(/[^0-9.]/g, '');
                  const num = parseFloat(raw) || 0;
                  return `₹${Math.round(num * 1.25).toLocaleString('en-IN')}`;
                })()}
              </span>
              <span className="text-xs font-mono text-dusty-600 dark:text-dusty-300 font-bold">Save 20% with [DRIP20]</span>
            </div>
          </div>

          {/* Colorway Switcher & Direct Cop Action */}
          <div className="flex flex-wrap items-center gap-2.5 sm:gap-3">
            {/* Colorway Pills */}
            <div className="flex items-center gap-1.5 sm:gap-2 bg-creme-100 dark:bg-burgundy-900/70 border border-sand-300 dark:border-burgundy-800/60 p-1.5 sm:p-2">
              <span className="text-xs font-mono font-medium text-neutral-600 dark:text-creme-200/80 uppercase mr-1">Shade:</span>
              {colorways.map((col) => (
                <button
                  key={col.hex}
                  onClick={() => setSelectedColor(col.hex)}
                  className={`w-5 sm:w-6 h-5 sm:h-6 rounded-none border transition-all ${
                    selectedColor === col.hex ? 'border-burgundy-950 dark:border-creme-100 scale-110 shadow-md ring-1 ring-burgundy-800' : 'border-sand-400/60 dark:border-burgundy-700/60 opacity-60 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>

            {/* Direct Affiliate Redirect Button */}
            <a
              href={currentItem.link}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-5 sm:px-8 py-2.5 sm:py-3.5 bg-burgundy-900 text-creme-100 dark:bg-burgundy-700 dark:text-creme-100 font-bold uppercase font-mono text-xs sm:text-sm tracking-wider border-2 border-burgundy-900 dark:border-dusty-400/60 hover:bg-burgundy-800 dark:hover:bg-burgundy-600 hover:shadow-lg dark:hover:shadow-[0_0_20px_rgba(200,164,159,0.3)] transition-all shadow-md"
            >
              <span>COP THIS DROP</span>
              <ExternalLink className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

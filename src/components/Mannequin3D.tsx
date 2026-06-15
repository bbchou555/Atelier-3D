import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { Client, CustomPoint } from "../types";

interface Mannequin3DProps {
  client: Client;
  onAddCustomPoint: (point: Omit<CustomPoint, "id">) => void;
  selectedPointId: string | null;
  onSelectPoint: (id: string | null) => void;
  onDeletePoint: (id: string) => void;
  theme?: string;
}

export default function Mannequin3D({
  client,
  onAddCustomPoint,
  selectedPointId,
  onSelectPoint,
  onDeletePoint,
  theme,
}: Mannequin3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const mannequinMeshRef = useRef<THREE.Group | null>(null);
  const standGroupRef = useRef<THREE.Group | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Rotation states managed via manual mousedown / mousemove (as OrbitControls is absent)
  const [rotationY, setRotationY] = useState<number>(0);
  const [rotationX, setRotationX] = useState<number>(0);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const dragStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const rotationStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Custom Point placement modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [pendingPoint, setPendingPoint] = useState<{ x: number; y: number; label: string; value: string } | null>(null);

  // Base Morphology values
  const { gender, morphology, size } = client;

  // Track size factor
  const sf = 0.74 + size * 0.13;

  // Initialize Scene, Camera, Renderer
  useEffect(() => {
    if (!containerRef.current) return;

    const width = containerRef.current.clientWidth || 400;
    const height = containerRef.current.clientHeight || 550;

    // Create Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf5f5f4); // Stone-50 background corresponding to Bento Grid theme
    sceneRef.current = scene;

    // Create Camera
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 1.5, 14);
    cameraRef.current = camera;

    // Create WebGLRenderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    // Clear previous children
    containerRef.current.innerHTML = "";
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.55);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xfff8ee, 0.8); // Warm main light
    dirLight1.position.set(5, 8, 5);
    dirLight1.castShadow = true;
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xeaefff, 0.5); // Cool rim light
    dirLight2.position.set(-5, 3, -5);
    scene.add(dirLight2);

    const softFillLight = new THREE.PointLight(0xffffff, 0.3, 20);
    softFillLight.position.set(0, 0, 5);
    scene.add(softFillLight);

    // Grid Floor or circle base shadows
    const gridHelper = new THREE.GridHelper(16, 16, 0xd6d3d1, 0xe7e5e4); // Stone-300 / 200 grid
    gridHelper.position.y = -5.0;
    scene.add(gridHelper);

    // Build Stand Base and pole (Cylinder + Sphere as Capsule is unsupported)
    const standGroup = new THREE.Group();
    
    // Pole
    const poleGeom = new THREE.CylinderGeometry(0.08, 0.08, 9, 16);
    const poleMat = new THREE.MeshStandardMaterial({
      color: 0xcca050, // Golden brass
      metalness: 0.8,
      roughness: 0.2,
    });
    const pole = new THREE.Mesh(poleGeom, poleMat);
    pole.position.y = -1.5;
    standGroup.add(pole);

    // Base plate
    const baseGeom = new THREE.CylinderGeometry(1.8, 1.8, 0.18, 24);
    const baseMat = new THREE.MeshStandardMaterial({
      color: 0x3e2723, // mahogany-style rich wood / metal
      roughness: 0.4,
      metalness: 0.3,
    });
    const baseMesh = new THREE.Mesh(baseGeom, baseMat);
    baseMesh.position.y = -5.0;
    standGroup.add(baseMesh);

    // Decorative brass sphere
    const sphereGeom = new THREE.SphereGeometry(0.3, 16, 16);
    const sphereMesh = new THREE.Mesh(sphereGeom, poleMat);
    sphereMesh.position.y = -4.5;
    standGroup.add(sphereMesh);

    scene.add(standGroup);
    standGroupRef.current = standGroup;

    // Clean observer up
    const resizeObserver = new ResizeObserver((entries) => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
      const entry = entries[0];
      const w = entry.contentRect.width;
      const h = entry.contentRect.height || 500;
      rendererRef.current.setSize(w, h);
      cameraRef.current.aspect = w / h;
      cameraRef.current.updateProjectionMatrix();
    });
    resizeObserver.observe(containerRef.current);

    // Render loop
    const render = () => {
      if (sceneRef.current && cameraRef.current && rendererRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
      animationFrameIdRef.current = requestAnimationFrame(render);
    };
    render();

    return () => {
      resizeObserver.disconnect();
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      renderer.dispose();
    };
  }, []);

  // Synchronize background color of 3D scene when theme changes
  useEffect(() => {
    if (!sceneRef.current) return;
    let colorHex = 0xf5f5f4; // Default Ecru
    if (theme === "sombre") colorHex = 0x0c0a09;
    if (theme === "rose") colorHex = 0xfaf5f5;
    if (theme === "emeraude") colorHex = 0xf4f7f5;
    if (theme === "denim") colorHex = 0xf0f4f8;
    sceneRef.current.background = new THREE.Color(colorHex);
  }, [theme]);

  // Update or Regenerate Mannequin Torso on Client Morphology changes
  useEffect(() => {
    if (!sceneRef.current) return;

    // Remove existing mannequin if present
    if (mannequinMeshRef.current) {
      sceneRef.current.remove(mannequinMeshRef.current);
      // Recursively dispose geometry and materials of children in the group
      mannequinMeshRef.current.traverse((node) => {
        if (node instanceof THREE.Mesh) {
          if (node.geometry) node.geometry.dispose();
          if (node.material) {
            if (Array.isArray(node.material)) {
              node.material.forEach((mat) => mat.dispose());
            } else {
              node.material.dispose();
            }
          }
        }
      });
      mannequinMeshRef.current = null;
    }

    // Prepare Group to hold all components of our artist mannequin drawing figure
    const group = new THREE.Group();

    // High fidelity materials for an expensive, haute-couture fashion studio feel
    const bodyMat = new THREE.MeshStandardMaterial({
      color: 0xeeece8, // Chalk-white ecru canvas/plaster texture
      roughness: 0.72,
      metalness: 0.05,
    });

    const jointMat = new THREE.MeshStandardMaterial({
      color: 0xc4bdae, // Polished dark wood articulation joints
      roughness: 0.52,
      metalness: 0.15,
    });

    // Helper function to create and position individual solid meshes
    const addPart = (
      geom: THREE.BufferGeometry,
      mat: THREE.Material,
      pos: [number, number, number],
      rot?: [number, number, number],
      scale?: [number, number, number]
    ) => {
      const m = new THREE.Mesh(geom, mat);
      m.position.set(...pos);
      if (rot) m.rotation.set(...rot);
      if (scale) m.scale.set(...scale);
      m.castShadow = true;
      m.receiveShadow = true;
      group.add(m);
      return m;
    };

    if (gender === "F") {
      // ==========================================
      // FEMALE ARTIST MANNEQUIN (Fashion Croquis)
      // ==========================================
      
      // Head (long, stylized oval)
      const headGeom = new THREE.SphereGeometry(0.35, 24, 24);
      addPart(headGeom, bodyMat, [0, 3.1, 0], undefined, [1, 1.35, 1]);

      // Neck (slender cylinder)
      const neckGeom = new THREE.CylinderGeometry(0.08, 0.1, 0.5, 16);
      addPart(neckGeom, bodyMat, [0, 2.7, 0]);

      // Upper Torso / Bust plate (trapezoidal and elegant)
      const chestGeom = new THREE.CylinderGeometry(0.55, 0.35, 1.1, 24);
      addPart(chestGeom, bodyMat, [0, 2.1, 0]);

      // Elegant pectoral/bust volumes matching the female sketch
      const bustSphereGeom = new THREE.SphereGeometry(0.18, 16, 16);
      addPart(bustSphereGeom, bodyMat, [-0.18, 2.15, 0.32], undefined, [1, 1, 1.1]);
      addPart(bustSphereGeom, bodyMat, [0.18, 2.15, 0.32], undefined, [1, 1, 1.1]);

      // Articulation Waist Sphere (classic drawing wooden mannequin joint)
      const waistGeom = new THREE.SphereGeometry(0.3, 16, 16);
      addPart(waistGeom, jointMat, [0, 1.55, 0], undefined, [1.0, 0.8, 1.0]);

      // Pelvis / Hourglass Hips Block
      const pelvisGeom = new THREE.CylinderGeometry(0.32, 0.56, 0.9, 24);
      addPart(pelvisGeom, bodyMat, [0, 1.05, 0], undefined, [1.0, 1.0, 0.85]);

      // Leg Joints (rotating socket spheres)
      const jointLegGeom = new THREE.SphereGeometry(0.14, 16, 16);
      addPart(jointLegGeom, jointMat, [0.24, 0.55, 0]);
      addPart(jointLegGeom, jointMat, [-0.24, 0.55, 0]);

      // Thighs (slender, tapered cylinders)
      const thighGeom = new THREE.CylinderGeometry(0.19, 0.11, 1.8, 16);
      addPart(thighGeom, bodyMat, [0.24, -0.35, 0]);
      addPart(thighGeom, bodyMat, [-0.24, -0.35, 0]);

      // Knee joints (articulation spheres)
      const kneeGeom = new THREE.SphereGeometry(0.11, 16, 16);
      addPart(kneeGeom, jointMat, [0.24, -1.3, 0]);
      addPart(kneeGeom, jointMat, [-0.24, -1.3, 0]);

      // Calves
      const calfGeom = new THREE.CylinderGeometry(0.11, 0.07, 1.7, 16);
      addPart(calfGeom, bodyMat, [0.24, -2.2, 0]);
      addPart(calfGeom, bodyMat, [-0.24, -2.2, 0]);

      // Ankle joints
      const ankleGeom = new THREE.SphereGeometry(0.065, 12, 12);
      addPart(ankleGeom, jointMat, [0.24, -3.1, 0]);
      addPart(ankleGeom, jointMat, [-0.24, -3.1, 0]);

      // Feet (delicate pointed wedges)
      const footGeom = new THREE.BoxGeometry(0.12, 0.15, 0.45);
      addPart(footGeom, bodyMat, [0.24, -3.3, 0.12], [0.25, 0, 0]);
      addPart(footGeom, bodyMat, [-0.24, -3.3, 0.12], [0.25, 0, 0]);

      // Upper limbs (Arm shoulders, upper-arms, elbows, forearms, hands)
      const shoulderGeom = new THREE.SphereGeometry(0.11, 16, 16);
      addPart(shoulderGeom, jointMat, [0.65, 2.5, 0]);
      addPart(shoulderGeom, jointMat, [-0.65, 2.5, 0]);

      const upperArmGeom = new THREE.CylinderGeometry(0.09, 0.075, 0.8, 16);
      addPart(upperArmGeom, bodyMat, [0.68, 2.0, 0]);
      addPart(upperArmGeom, bodyMat, [-0.68, 2.0, 0]);

      const elbowGeom = new THREE.SphereGeometry(0.08, 16, 16);
      addPart(elbowGeom, jointMat, [0.68, 1.55, 0]);
      addPart(elbowGeom, jointMat, [-0.68, 1.55, 0]);

      const forearmGeom = new THREE.CylinderGeometry(0.07, 0.05, 0.8, 16);
      addPart(forearmGeom, bodyMat, [0.68, 1.1, 0]);
      addPart(forearmGeom, bodyMat, [-0.68, 1.1, 0]);

      const handGeom = new THREE.ConeGeometry(0.05, 0.3, 12);
      addPart(handGeom, bodyMat, [0.68, 0.55, 0], [Math.PI, 0, 0]);
      addPart(handGeom, bodyMat, [-0.68, 0.55, 0], [Math.PI, 0, 0]);

    } else {
      // ==========================================
      // MALE ARTIST MANNEQUIN (Classical Croquis)
      // ==========================================

      // Head (masculine, structured oval)
      const headGeom = new THREE.SphereGeometry(0.38, 24, 24);
      addPart(headGeom, bodyMat, [0, 3.1, 0], undefined, [1.05, 1.3, 1.05]);

      // Neck (strong neck)
      const neckGeom = new THREE.CylinderGeometry(0.13, 0.15, 0.5, 16);
      addPart(neckGeom, bodyMat, [0, 2.7, 0]);

      // Upper Torso / Chest block (athletic and broad shoulder V-line)
      const chestGeom = new THREE.CylinderGeometry(0.72, 0.48, 1.1, 24);
      addPart(chestGeom, bodyMat, [0, 2.1, 0]);

      // Sculptural pectoral plates matching the drawings
      const pecGeom = new THREE.BoxGeometry(0.28, 0.35, 0.15);
      addPart(pecGeom, bodyMat, [-0.17, 2.1, 0.26], undefined, [1, 1, 0.8]);
      addPart(pecGeom, bodyMat, [0.17, 2.1, 0.26], undefined, [1, 1, 0.8]);

      // Waist / Midsection joint cylinder
      const waistGeom = new THREE.CylinderGeometry(0.42, 0.45, 0.3, 24);
      addPart(waistGeom, bodyMat, [0, 1.55, 0]);

      // Pelvis / Hips Block
      const pelvisGeom = new THREE.CylinderGeometry(0.46, 0.48, 0.9, 24);
      addPart(pelvisGeom, bodyMat, [0, 1.05, 0], undefined, [1.0, 1.0, 0.88]);

      // Hips Leg rotation sockets
      const jointLegGeom = new THREE.SphereGeometry(0.15, 16, 16);
      addPart(jointLegGeom, jointMat, [0.25, 0.55, 0]);
      addPart(jointLegGeom, jointMat, [-0.25, 0.55, 0]);

      // Thighs (stronger athletic muscles)
      const thighGeom = new THREE.CylinderGeometry(0.23, 0.15, 1.8, 16);
      addPart(thighGeom, bodyMat, [0.25, -0.35, 0]);
      addPart(thighGeom, bodyMat, [-0.25, -0.35, 0]);

      // Knee joints
      const kneeGeom = new THREE.SphereGeometry(0.13, 16, 16);
      addPart(kneeGeom, jointMat, [0.25, -1.3, 0]);
      addPart(kneeGeom, jointMat, [-0.25, -1.3, 0]);

      // Calves
      const calfGeom = new THREE.CylinderGeometry(0.15, 0.09, 1.7, 16);
      addPart(calfGeom, bodyMat, [0.25, -2.2, 0]);
      addPart(calfGeom, bodyMat, [-0.25, -2.2, 0]);

      // Ankle joints
      const ankleGeom = new THREE.SphereGeometry(0.08, 12, 12);
      addPart(ankleGeom, jointMat, [0.25, -3.1, 0]);
      addPart(ankleGeom, jointMat, [-0.25, -3.1, 0]);

      // Feet (athletic sculptural wedges)
      const footGeom = new THREE.BoxGeometry(0.15, 0.18, 0.45);
      addPart(footGeom, bodyMat, [0.25, -3.3, 0.12], [0.2, 0, 0]);
      addPart(footGeom, bodyMat, [-0.25, -3.3, 0.12], [0.2, 0, 0]);

      // Upper limbs (Arm shoulders, upper-arms, elbows, forearms, hands)
      const shoulderGeom = new THREE.SphereGeometry(0.14, 16, 16);
      addPart(shoulderGeom, jointMat, [0.85, 2.45, 0]);
      addPart(shoulderGeom, jointMat, [-0.85, 2.45, 0]);

      const upperArmGeom = new THREE.CylinderGeometry(0.12, 0.10, 0.8, 16);
      addPart(upperArmGeom, bodyMat, [0.9, 1.95, 0]);
      addPart(upperArmGeom, bodyMat, [-0.9, 1.95, 0]);

      const elbowGeom = new THREE.SphereGeometry(0.10, 16, 16);
      addPart(elbowGeom, jointMat, [0.9, 1.48, 0]);
      addPart(elbowGeom, jointMat, [-0.9, 1.48, 0]);

      const forearmGeom = new THREE.CylinderGeometry(0.09, 0.07, 0.8, 16);
      addPart(forearmGeom, bodyMat, [0.9, 1.02, 0]);
      addPart(forearmGeom, bodyMat, [-0.9, 1.02, 0]);

      const handGeom = new THREE.BoxGeometry(0.1, 0.06, 0.22);
      addPart(handGeom, bodyMat, [0.9, 0.55, 0], [0.15, 0, 0]);
      addPart(handGeom, bodyMat, [-0.9, 0.55, 0], [0.15, 0, 0]);
    }

    // Scale entire group to match size selection gracefully without distorting the drawn proportions
    const scaleFactor = 0.85 * sf;
    group.scale.set(scaleFactor, scaleFactor, scaleFactor);

    // Position slightly up so model aligns elegantly with the stand base
    group.position.y = -0.5;

    // Apply active rotations
    group.rotation.y = rotationY;
    group.rotation.x = rotationX;

    sceneRef.current.add(group);
    mannequinMeshRef.current = group;
  }, [gender, morphology, size, sf]);

  // Synchronize manual state rotation on mesh
  useEffect(() => {
    if (mannequinMeshRef.current) {
      mannequinMeshRef.current.rotation.y = rotationY;
      mannequinMeshRef.current.rotation.x = rotationX;
    }
  }, [rotationY, rotationX]);

  // Mouse Drag Events to rotate (simulate controls)
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX, y: e.clientY };
    rotationStartRef.current = { x: rotationY, y: rotationX };
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStartRef.current.x;
    const deltaY = e.clientY - dragStartRef.current.y;

    // Standard manual drag speed
    setRotationY(rotationStartRef.current.x + deltaX * 0.007);
    setRotationX(Math.max(-0.6, Math.min(0.6, rotationStartRef.current.y + deltaY * 0.007)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Click on canvas to handle pinning of new measurement markers
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging) return;
    // Don't register click if dragged significantly
    if (Math.abs(e.clientX - dragStartRef.current.x) > 4 || Math.abs(e.clientY - dragStartRef.current.y) > 4) {
      return;
    }

    if (!containerRef.current || !cameraRef.current || !mannequinMeshRef.current) return;

    // Get client position relative to container
    const rect = containerRef.current.getBoundingClientRect();
    const touchX = e.clientX - rect.left;
    const touchY = e.clientY - rect.top;

    // Normalize mouse coordinates for raycasting (-1 to +1)
    const mouse = new THREE.Vector2(
      (touchX / rect.width) * 2 - 1,
      -(touchY / rect.height) * 2 + 1
    );

    // Raycast
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, cameraRef.current);

    const intersects = raycaster.intersectObject(mannequinMeshRef.current, true);

    if (intersects.length > 0) {
      // Intersection detected on Mannequin! Let's get relative pixel overlay coordinates
      // We will place the custom point directly where the cursor clicked on the 2D plane
      const ratioX = touchX / rect.width;
      const ratioY = touchY / rect.height;

      setPendingPoint({
        x: ratioX,
        y: ratioY,
        label: "",
        value: "",
      });
      setShowAddModal(true);
    }
  };

  const handleConfirmAddPoint = () => {
    if (!pendingPoint || !pendingPoint.label || !pendingPoint.value) return;
    onAddCustomPoint({
      label: pendingPoint.label,
      value: pendingPoint.value,
      x: pendingPoint.x,
      y: pendingPoint.y,
    });
    setShowAddModal(false);
    setPendingPoint(null);
  };

  return (
    <div style={styles.mannequinPanel}>
      <div style={styles.badgeRow}>
        <span style={styles.morphologyBadge}>
          Morphologie <strong>{morphology}</strong>
        </span>
        <span style={styles.genderBadge}>
          Style <strong>{gender === "F" ? "Féminin" : "Masculin"}</strong>
        </span>
        <span style={styles.scaleBadge}>
          Tallage <strong>T{(size + 1) * 2 + 34}</strong>
        </span>
      </div>

      <div style={styles.canvasContainerWrap}>
        {/* Helper instructions */}
        <div style={styles.helperOverlay}>
          Glissez pour tourner le mannequin • Cliquez dessus pour tracer une mesure
        </div>

        {/* Dynamic Pins Overlay represent custom points */}
        <div 
          ref={containerRef}
          style={styles.canvasDiv}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onClick={handleCanvasClick}
          id="mannequin-three-root"
        />

        {/* Iterate client pins overlay */}
        {client.customPoints.map((pt) => {
          const isSelected = selectedPointId === pt.id;
          return (
            <div
              key={pt.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelectPoint(isSelected ? null : pt.id);
              }}
              style={{
                ...styles.landmarkPin,
                left: `${pt.x * 100}%`,
                top: `${pt.y * 100}%`,
                backgroundColor: isSelected ? "#cca050" : "#3e2723",
                boxShadow: isSelected ? "0 0 0 4px rgba(204, 160, 80, 0.4)" : "0 2px 5px rgba(0,0,0,0.35)",
                transform: `translate(-50%, -50%) scale(${isSelected ? 1.25 : 1})`,
              }}
              title={`${pt.label}: ${pt.value} cm`}
            >
              <div style={styles.landmarkPulse} />
              
              {/* Optional labels appearing near selected / hovered pin */}
              {isSelected && (
                <div style={styles.pinTooltip}>
                  <div style={styles.pinLabel}>{pt.label}</div>
                  <div style={styles.pinValue}>{pt.value} cm</div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePoint(pt.id);
                      onSelectPoint(null);
                    }}
                    style={styles.pinDeleteBtn}
                  >
                    Supprimer
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Manual rotate buttons */}
      <div style={styles.controlsRow}>
        <button
          onClick={() => setRotationY((r) => r - 0.4)}
          style={styles.rotateBtn}
          title="Tourner à gauche"
        >
          ↺ Gauche
        </button>
        <button
          onClick={() => {
            setRotationY(0);
            setRotationX(0);
          }}
          style={styles.rotateBtn}
          title="Face"
        >
          ▲ Face
        </button>
        <button
          onClick={() => setRotationY((r) => r + 0.4)}
          style={styles.rotateBtn}
          title="Tourner à droite"
        >
          ↻ Droite
        </button>
      </div>

      {/* Add Custom Point Dialog Overlay */}
      {showAddModal && pendingPoint && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>Ajouter une mesure personnalisée</div>
            <p style={styles.modalSubtext}>
              Saisissez l'intitulé (ex: Tour d'emmanchure) et sa valeur mesurée en centimètres pour l'épingler sur ce patron.
            </p>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Nom de la mesure</label>
              <input
                type="text"
                placeholder="Ex: Tour d'encolure basse"
                value={pendingPoint.label}
                onChange={(e) => setPendingPoint({ ...pendingPoint, label: e.target.value })}
                style={styles.textInput}
                autoFocus
              />
            </div>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Valeur (cm)</label>
              <input
                type="number"
                placeholder="Ex: 42"
                value={pendingPoint.value}
                onChange={(e) => setPendingPoint({ ...pendingPoint, value: e.target.value })}
                style={styles.textInput}
              />
            </div>
            <div style={styles.modalButtons}>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setPendingPoint(null);
                }}
                style={styles.cancelBtn}
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmAddPoint}
                style={styles.confirmBtn}
                disabled={!pendingPoint.label || !pendingPoint.value}
              >
                Épingler la mesure
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  mannequinPanel: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    width: "100%",
    backgroundColor: "var(--panel-bg)",
    borderRadius: "16px",
    border: "1px solid var(--border-color)",
    padding: "16px",
    boxShadow: "0 1px 3px 0 rgba(0,0,0,0.05), 0 1px 2px -1px rgba(0,0,0,0.05)",
    position: "relative" as const,
  },
  badgeRow: {
    display: "flex",
    gap: "8px",
    marginBottom: "12px",
    width: "100%",
    justifyContent: "center",
    flexWrap: "wrap" as const,
  },
  morphologyBadge: {
    backgroundColor: "var(--button-bg)",
    color: "var(--button-text)",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "0.75rem",
    fontWeight: "600",
    border: "none",
  },
  genderBadge: {
    backgroundColor: "var(--app-bg)",
    color: "var(--text-color)",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "0.75rem",
    border: "1px solid var(--border-color)",
  },
  scaleBadge: {
    backgroundColor: "var(--app-bg)",
    color: "var(--text-color)",
    padding: "4px 10px",
    borderRadius: "6px",
    fontSize: "0.75rem",
    border: "1px solid var(--border-color)",
  },
  canvasContainerWrap: {
    position: "relative" as const,
    width: "100%",
    height: "440px",
    border: "1px solid var(--border-color)",
    borderRadius: "12px",
    overflow: "hidden",
    cursor: "grab",
    backgroundColor: "var(--app-bg)",
  },
  canvasDiv: {
    width: "100%",
    height: "100%",
  },
  helperOverlay: {
    position: "absolute" as const,
    bottom: "8px",
    left: "0",
    right: "0",
    textAlign: "center" as const,
    fontSize: "0.75rem",
    color: "#78716c",
    pointerEvents: "none" as const,
    zIndex: 5,
    backgroundColor: "rgba(245, 245, 244, 0.85)",
    padding: "2px 0",
  },
  controlsRow: {
    display: "flex",
    justifyContent: "space-between",
    width: "100%",
    gap: "8px",
    marginTop: "12px",
  },
  rotateBtn: {
    flex: 1,
    padding: "6px 12px",
    fontSize: "0.8rem",
    backgroundColor: "#fff",
    border: "1px solid #e7e5e4",
    borderRadius: "8px",
    color: "#1c1917",
    fontWeight: "bold",
    cursor: "pointer",
    transition: "all 0.15s ease",
  },
  landmarkPin: {
    position: "absolute" as const,
    width: "12px",
    height: "12px",
    borderRadius: "50%",
    cursor: "pointer",
    zIndex: 10,
    border: "2px solid #fff",
    transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
  },
  landmarkPulse: {
    position: "absolute" as const,
    top: "-4px",
    left: "-4px",
    right: "-4px",
    bottom: "-4px",
    border: "1.5px solid rgba(28, 25, 23, 0.5)",
    borderRadius: "50%",
    animation: "pin-pulse 2s infinite",
    pointerEvents: "none" as const,
  },
  pinTooltip: {
    position: "absolute" as const,
    backgroundColor: "#1c1917",
    color: "#fff",
    padding: "8px 12px",
    borderRadius: "12px",
    bottom: "20px",
    left: "50%",
    transform: "translateX(-50%)",
    width: "160px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3)",
    zIndex: 200,
    fontSize: "0.8rem",
    textAlign: "center" as const,
    pointerEvents: "auto" as const,
  },
  pinLabel: {
    fontWeight: "bold",
    marginBottom: "2px",
    whiteSpace: "nowrap" as const,
    overflow: "hidden",
    textOverflow: "ellipsis",
  },
  pinValue: {
    color: "#e7e5e4",
    marginBottom: "8px",
  },
  pinDeleteBtn: {
    backgroundColor: "#ef4444",
    color: "#fff",
    border: "none",
    padding: "4px 8px",
    borderRadius: "4px",
    cursor: "pointer",
    fontSize: "0.75rem",
    width: "100%",
    fontWeight: "bold",
  },
  modalOverlay: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(28, 25, 23, 0.5)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
    backdropFilter: "blur(2px)",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderRadius: "16px",
    width: "90%",
    maxWidth: "320px",
    padding: "16px",
    boxShadow: "0 10px 25px rgba(0,0,0,0.1)",
    border: "1px solid #e7e5e4",
  },
  modalHeader: {
    fontSize: "0.95rem",
    fontWeight: "bold",
    color: "#1c1917",
    marginBottom: "8px",
  },
  modalSubtext: {
    fontSize: "0.75rem",
    color: "#78716c",
    marginBottom: "12px",
    lineHeight: "1.3",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "4px",
    marginBottom: "12px",
  },
  label: {
    fontSize: "0.75rem",
    color: "#78716c",
    fontWeight: 500,
  },
  textInput: {
    padding: "8px",
    borderRadius: "6px",
    border: "1px solid #e7e5e4",
    fontSize: "0.85rem",
    outline: "none",
  },
  modalButtons: {
    display: "flex",
    gap: "8px",
    justifyContent: "flex-end",
    marginTop: "16px",
  },
  cancelBtn: {
    padding: "6px 12px",
    fontSize: "0.8rem",
    borderRadius: "6px",
    border: "1px solid #e7e5e4",
    backgroundColor: "#fff",
    color: "#1c1917",
    cursor: "pointer",
  },
  confirmBtn: {
    padding: "6px 12px",
    fontSize: "0.8rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#1c1917",
    color: "#fff",
    fontWeight: "bold",
    cursor: "pointer",
  },
};

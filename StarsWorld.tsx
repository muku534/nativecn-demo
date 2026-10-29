import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  PanResponder,
  GestureResponderEvent,
  PanResponderGestureState,
  ScrollView,
} from 'react-native';
import Svg, {
  Defs,
  RadialGradient,
  Stop,
  Circle,
  Path,
  G,
  Rect,
  ClipPath,
  Text as SvgText,
} from 'react-native-svg';
import {
  ALL_GLOBE_DOTS,
  COUNTRIES_DATA,
  FEATURED_COUNTRIES,
  CountryInfo,
} from './worldData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type WorldMapMode = 'globe' | 'flat';

export interface DotTheme {
  id: string;
  name: string;
  dotColor: string;
  accentColor: string;
  oceanDotColor: string;
}

export interface GlobeCoreTheme {
  id: string;
  name: string;
  coreStart: string;
  coreMid: string;
  coreEnd: string;
  atmosphereColor: string;
  rimColor: string;
}

export const DOT_THEMES: DotTheme[] = [
  { id: 'cyan', name: 'Cyan', dotColor: '#00D4FF', accentColor: '#38BDF8', oceanDotColor: 'rgba(56, 189, 248, 0.22)' },
  { id: 'emerald', name: 'Emerald', dotColor: '#10B981', accentColor: '#34D399', oceanDotColor: 'rgba(52, 211, 153, 0.22)' },
  { id: 'amber', name: 'Gold', dotColor: '#F59E0B', accentColor: '#FBBF24', oceanDotColor: 'rgba(251, 191, 36, 0.22)' },
  { id: 'violet', name: 'Violet', dotColor: '#A855F7', accentColor: '#C084FC', oceanDotColor: 'rgba(192, 132, 252, 0.22)' },
  { id: 'rose', name: 'Rose', dotColor: '#F43F5E', accentColor: '#FB7185', oceanDotColor: 'rgba(251, 113, 133, 0.22)' },
  { id: 'silver', name: 'Silver', dotColor: '#F8FAFC', accentColor: '#FFFFFF', oceanDotColor: 'rgba(248, 250, 252, 0.28)' },
];

export const CORE_THEMES: GlobeCoreTheme[] = [
  { id: 'space', name: 'Deep Space', coreStart: '#0F172A', coreMid: '#0B132B', coreEnd: '#020617', atmosphereColor: '#00D4FF', rimColor: 'rgba(56, 189, 248, 0.18)' },
  { id: 'midnight', name: 'Midnight', coreStart: '#090D16', coreMid: '#030712', coreEnd: '#000000', atmosphereColor: '#64748B', rimColor: 'rgba(255, 255, 255, 0.12)' },
  { id: 'nebula', name: 'Nebula', coreStart: '#1C0D30', coreMid: '#120520', coreEnd: '#080110', atmosphereColor: '#A855F7', rimColor: 'rgba(168, 85, 247, 0.22)' },
  { id: 'teal', name: 'Cyber Teal', coreStart: '#04241C', coreMid: '#021611', coreEnd: '#010B08', atmosphereColor: '#10B981', rimColor: 'rgba(16, 185, 129, 0.22)' },
  { id: 'hologram', name: 'Translucent', coreStart: 'rgba(15, 23, 42, 0.35)', coreMid: 'rgba(11, 19, 43, 0.2)', coreEnd: 'rgba(2, 6, 23, 0.05)', atmosphereColor: '#38BDF8', rimColor: 'rgba(56, 189, 248, 0.25)' },
];

export interface StarsWorldProps {
  initialMode?: WorldMapMode;
  mode?: WorldMapMode;
  onModeChange?: (mode: WorldMapMode) => void;
  allowModeToggle?: boolean;
  size?: number;
  selectedCountryCode?: string | null;
  onSelectCountry?: (country: CountryInfo | null) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
  dotColor?: string;
  oceanDotColor?: string;
  globeCoreColor?: string;
  atmosphereColor?: string;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  showAtmosphere?: boolean;
  showCustomizationControls?: boolean;
}

// Pre-computed dispersed positions for starburst assembly
const SCATTER_SEED = ALL_GLOBE_DOTS.map((_, i) => {
  const angle = (i * 137.5 * Math.PI) / 180;
  const dist = 160 + (i % 65) * 3.8;
  return {
    sx: Math.cos(angle) * dist,
    sy: Math.sin(angle) * dist,
    sz: ((i % 120) - 60) * 3.6,
    delay: (i % 50) / 110,
  };
});

function circlePath(cx: number, cy: number, r: number): string {
  const roundedX = Math.round(cx * 10) / 10;
  const roundedY = Math.round(cy * 10) / 10;
  const roundedR = Math.round(r * 10) / 10;
  return `M${roundedX - roundedR} ${roundedY}a${roundedR} ${roundedR} 0 1 0 ${2 * roundedR} 0a${roundedR} ${roundedR} 0 1 0 ${-2 * roundedR} 0`;
}

export const StarsWorld: React.FC<StarsWorldProps> = ({
  initialMode = 'globe',
  mode: controlledMode,
  onModeChange,
  allowModeToggle = true,
  size = Math.min(SCREEN_WIDTH - 16, 380),
  selectedCountryCode,
  onSelectCountry,
  onInteractionChange,
  dotColor: propDotColor,
  oceanDotColor: propOceanDotColor,
  globeCoreColor: propGlobeCoreColor,
  atmosphereColor: propAtmosphereColor,
  autoRotate: initialAutoRotate = true,
  autoRotateSpeed: initialSpeed = 0.35,
  showAtmosphere = true,
  showCustomizationControls = true,
}) => {
  // Decoupled mode state: works seamlessly in both controlled & uncontrolled mode
  const [internalMode, setInternalMode] = useState<WorldMapMode>(initialMode);
  const activeMode = controlledMode !== undefined ? controlledMode : internalMode;

  // Morph progress: 1.0 = Globe, 0.0 = Flat Map
  const morphProgressRef = useRef<number>(activeMode === 'globe' ? 1 : 0);
  const [morphProgress, setMorphProgress] = useState<number>(activeMode === 'globe' ? 1 : 0);
  const morphAnimFrameRef = useRef<number | null>(null);

  // Themes
  const [selectedDotTheme, setSelectedDotTheme] = useState<string>('cyan');
  const [selectedCoreTheme, setSelectedCoreTheme] = useState<string>('space');
  const [currentSpeed, setCurrentSpeed] = useState<number>(initialSpeed);

  const activeDotTheme = DOT_THEMES.find((t) => t.id === selectedDotTheme) || DOT_THEMES[0];
  const activeCoreTheme = CORE_THEMES.find((t) => t.id === selectedCoreTheme) || CORE_THEMES[0];

  const currentDotColor = propDotColor || activeDotTheme.dotColor;
  const currentAccentColor = activeDotTheme.accentColor;
  const currentOceanDotColor = propOceanDotColor || activeDotTheme.oceanDotColor;
  const currentAtmosphereColor = propAtmosphereColor || activeCoreTheme.atmosphereColor;

  // Selected Country
  const [internalSelectedCode, setInternalSelectedCode] = useState<string | null>(
    selectedCountryCode !== undefined ? selectedCountryCode : 'IN'
  );
  const activeCode = selectedCountryCode !== undefined ? selectedCountryCode : internalSelectedCode;
  const activeCountry = activeCode ? COUNTRIES_DATA[activeCode] || null : null;

  // 3D Globe Rotation
  const initLng = activeCountry ? -activeCountry.lng : 15;
  const initLat = activeCountry ? -Math.max(-30, Math.min(30, activeCountry.lat * 0.45)) : 18;
  const rotationLngRef = useRef(initLng);
  const tiltLatRef = useRef(initLat);
  const [rotationState, setRotationState] = useState({ lng: initLng, lat: initLat });

  // 2D Flat Pan offset
  const flatPanRef = useRef({ x: 0, y: 0 });
  const [flatPan, setFlatPan] = useState({ x: 0, y: 0 });

  // Auto rotation
  const [isAutoRotating, setIsAutoRotating] = useState(initialAutoRotate);
  const isInteractingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);

  // Appearance build animation
  const [appearProgress, setAppearProgress] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Responsive adaptive canvas height: smoothly transitions from flat (size * 0.62) to globe (size * 0.98)
  const canvasHeight = Math.round(size * (0.62 + 0.36 * morphProgress));
  const center = { x: size / 2, y: canvasHeight / 2 };
  const radius = (size * 0.44) * (0.86 + 0.14 * morphProgress);

  // Trigger celestial dots build animation
  const playAppearAnimation = useCallback(() => {
    setAppearProgress(0);
    let startTime: number | null = null;
    const duration = 1800;

    const step = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const p = Math.min(1, elapsed / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setAppearProgress(eased);

      if (p < 1) {
        requestAnimationFrame(step);
      }
    };
    requestAnimationFrame(step);
  }, []);

  useEffect(() => {
    playAppearAnimation();
  }, [playAppearAnimation]);

  // Pulse phase interval for beacon
  useEffect(() => {
    let phase = 0;
    const interval = setInterval(() => {
      phase = (phase + 0.05) % 1;
      setPulsePhase(phase);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Robust 60fps Morphing between Flat Map and 3D Globe
  const animateMorphTo = useCallback((targetValue: number) => {
    if (morphAnimFrameRef.current) {
      cancelAnimationFrame(morphAnimFrameRef.current);
      morphAnimFrameRef.current = null;
    }
    const startVal = morphProgressRef.current;
    if (Math.abs(startVal - targetValue) < 0.001) {
      morphProgressRef.current = targetValue;
      setMorphProgress(targetValue);
      return;
    }

    let startTime: number | null = null;
    const duration = 680; // 680ms silky smooth transition

    const step = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const p = Math.min(1, elapsed / duration);
      // Quintic ease in-out
      const eased = p < 0.5 ? 16 * Math.pow(p, 5) : 1 - Math.pow(-2 * p + 2, 5) / 2;
      const current = startVal + (targetValue - startVal) * eased;

      morphProgressRef.current = current;
      setMorphProgress(current);

      if (p < 1) {
        morphAnimFrameRef.current = requestAnimationFrame(step);
      } else {
        morphProgressRef.current = targetValue;
        setMorphProgress(targetValue);
        morphAnimFrameRef.current = null;
      }
    };
    morphAnimFrameRef.current = requestAnimationFrame(step);
  }, []);

  // Sync if controlledMode changes from outside
  useEffect(() => {
    if (controlledMode !== undefined) {
      const target = controlledMode === 'globe' ? 1 : 0;
      if (Math.abs(morphProgressRef.current - target) > 0.01) {
        animateMorphTo(target);
      }
    }
  }, [controlledMode, animateMorphTo]);

  // Mode Switch Handler (Works unconditionally from flat <-> globe)
  const switchMode = (newMode: WorldMapMode) => {
    if (controlledMode === undefined) {
      setInternalMode(newMode);
    }
    onModeChange?.(newMode);
    animateMorphTo(newMode === 'globe' ? 1 : 0);
  };

  // Camera fly-to when country selected
  const flyToCountry = useCallback(
    (country: CountryInfo) => {
      isInteractingRef.current = true;
      const startLng = rotationLngRef.current;
      const startLat = tiltLatRef.current;

      const targetLng = -country.lng;
      const targetLat = -Math.max(-35, Math.min(35, country.lat * 0.45));

      let diffLng = (targetLng - startLng) % 360;
      if (diffLng > 180) diffLng -= 360;
      if (diffLng < -180) diffLng += 360;

      let startTime: number | null = null;
      const duration = 850;

      const animateFly = (time: number) => {
        if (!startTime) startTime = time;
        const elapsed = time - startTime;
        const t = Math.min(1, elapsed / duration);
        const eased = t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

        const currentLng = (startLng + diffLng * eased) % 360;
        const currentLat = startLat + (targetLat - startLat) * eased;

        rotationLngRef.current = currentLng;
        tiltLatRef.current = currentLat;
        setRotationState({ lng: currentLng, lat: currentLat });

        if (t < 1) {
          requestAnimationFrame(animateFly);
        } else {
          isInteractingRef.current = false;
        }
      };

      requestAnimationFrame(animateFly);
    },
    []
  );

  const handleCountryPress = (country: CountryInfo) => {
    const nextCode = activeCode === country.code ? null : country.code;
    setInternalSelectedCode(nextCode);
    if (onSelectCountry) {
      onSelectCountry(nextCode ? country : null);
    }
    if (nextCode) {
      flyToCountry(country);
    }
  };

  // 60FPS Continuous Auto-Rotation loop (active in globe mode)
  useEffect(() => {
    let lastTime = Date.now();

    const loop = () => {
      const now = Date.now();
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      if (!isInteractingRef.current && isAutoRotating && morphProgressRef.current > 0.25) {
        const delta = currentSpeed * 60 * dt;
        const newLng = (rotationLngRef.current + delta) % 360;
        rotationLngRef.current = newLng;
        setRotationState({ lng: newLng, lat: tiltLatRef.current });
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoRotating, currentSpeed]);

  // Gestures: Globe 3D Rotation or Flat 2D Pan
  const startRotationRef = useRef({ lng: initLng, lat: initLat });
  const startFlatPanRef = useRef({ x: 0, y: 0 });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isInteractingRef.current = true;
        startRotationRef.current = {
          lng: rotationLngRef.current,
          lat: tiltLatRef.current,
        };
        startFlatPanRef.current = { ...flatPanRef.current };
        onInteractionChange?.(true);
      },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        if (morphProgressRef.current > 0.4) {
          // 3D Globe Rotation
          const sensitivity = 0.55;
          const newLng = (startRotationRef.current.lng + gestureState.dx * sensitivity) % 360;
          const newLat = Math.max(
            -60,
            Math.min(60, startRotationRef.current.lat - gestureState.dy * (sensitivity * 0.7))
          );
          rotationLngRef.current = newLng;
          tiltLatRef.current = newLat;
          setRotationState({ lng: newLng, lat: newLat });
        } else {
          // 2D Flat Pan
          const newX = Math.max(-55, Math.min(55, startFlatPanRef.current.x + gestureState.dx * 0.5));
          const newY = Math.max(-35, Math.min(35, startFlatPanRef.current.y + gestureState.dy * 0.5));
          flatPanRef.current = { x: newX, y: newY };
          setFlatPan({ x: newX, y: newY });
        }
      },
      onPanResponderRelease: () => {
        isInteractingRef.current = false;
        onInteractionChange?.(false);
      },
      onPanResponderTerminate: () => {
        isInteractingRef.current = false;
        onInteractionChange?.(false);
      },
    })
  ).current;

  // Unified Dot Projection with Morphing Interpolation
  const { frontLandDots, frontOceanDots, backDotsPath, highlightDotsPath, beaconCenter } = useMemo(() => {
    const radLng = (rotationState.lng * Math.PI) / 180;
    const radLat = (rotationState.lat * Math.PI) / 180;
    const cosLatTilt = Math.cos(radLat);
    const sinLatTilt = Math.sin(radLat);

    // Flat map card frame dimensions
    const flatCardW = size * 0.96;
    const flatCardH = canvasHeight * 0.90;
    const flatCardX = (size - flatCardW) / 2;
    const flatCardY = (canvasHeight - flatCardH) / 2;

    // Safe inner padding so dots never touch or spill outside boundaries & rounded corners
    const padX = 18;
    const padY = 16;
    const flatW = flatCardW - padX * 2;
    const flatH = flatCardH - padY * 2;
    const flatLeft = flatCardX + padX + flatPan.x;
    const flatTop = flatCardY + padY + flatPan.y;

    let frontLandStr = '';
    let frontOceanStr = '';
    let backStr = '';
    let highlightStr = '';
    let selectedCentroidPx: { x: number; y: number; visible: boolean } | null = null;

    const m = morphProgress; // 1 = Globe, 0 = Flat

    for (let i = 0; i < ALL_GLOBE_DOTS.length; i++) {
      const dot = ALL_GLOBE_DOTS[i];
      const scatter = SCATTER_SEED[i];

      // Staggered local progress
      const localP = Math.max(0, Math.min(1, (appearProgress - scatter.delay) / (1 - scatter.delay)));
      const easedLocal =
        localP < 0.5 ? 4 * localP * localP * localP : 1 - Math.pow(-2 * localP + 2, 3) / 2;

      // 1. Globe 3D Coordinates
      const phi = (dot.lat * Math.PI) / 180;
      const theta = (dot.lng * Math.PI) / 180 + radLng;

      const x0 = Math.cos(phi) * Math.sin(theta);
      const y0 = -Math.sin(phi);
      const z0 = Math.cos(phi) * Math.cos(theta);

      const targetX = x0;
      const targetY = y0 * cosLatTilt - z0 * sinLatTilt;
      const targetZ = y0 * sinLatTilt + z0 * cosLatTilt;

      const startX = scatter.sx / radius;
      const startY = scatter.sy / radius;

      const globeX = center.x + (startX + (targetX - startX) * easedLocal) * radius;
      const globeY = center.y + (startY + (targetY - startY) * easedLocal) * radius;

      // 2. Flat 2D Map Coordinates (properly normalized within card boundaries)
      const normLng = (dot.lng + 180) / 360;
      const normLat = Math.max(0, Math.min(1, (84 - dot.lat) / 146));
      const targetFlatX = flatLeft + normLng * flatW;
      const targetFlatY = flatTop + normLat * flatH;

      const flatX = center.x + (scatter.sx * 0.75) * (1 - easedLocal) + (targetFlatX - center.x) * easedLocal;
      const flatY = center.y + (scatter.sy * 0.75) * (1 - easedLocal) + (targetFlatY - center.y) * easedLocal;

      // 3. Morphing Interpolation
      const px = flatX + (globeX - flatX) * m;
      const py = flatY + (globeY - flatY) * m;

      const isSelected = activeCode !== null && dot.code === activeCode && dot.isLand;

      // In Flat mode (m=0), all dots are visible. In Globe mode (m=1), targetZ determines front/back.
      const isFront = m < 0.25 || targetZ > -0.15;
      const depthScale = (1 - m) * 1.05 + m * (0.85 + Math.max(-0.2, targetZ) * 0.3);

      if (isFront) {
        if (isSelected) {
          highlightStr += circlePath(px, py, 2.5 * depthScale);
        } else if (dot.isLand) {
          frontLandStr += circlePath(px, py, 1.45 * depthScale);
        } else {
          // Oceans: subtle star matrix
          frontOceanStr += circlePath(px, py, 1.05 * depthScale);
        }
      } else if (appearProgress > 0.6 && m > 0.35) {
        // Holographic volume dots on globe back
        const backR = dot.isLand ? 0.85 : 0.65;
        backStr += circlePath(px, py, backR);
      }
    }

    // Project active country centroid
    if (activeCountry) {
      // Globe centroid
      const phi = (activeCountry.lat * Math.PI) / 180;
      const theta = (activeCountry.lng * Math.PI) / 180 + radLng;
      const x0 = Math.cos(phi) * Math.sin(theta);
      const y0 = -Math.sin(phi);
      const z0 = Math.cos(phi) * Math.cos(theta);
      const targetX = x0;
      const targetY = y0 * cosLatTilt - z0 * sinLatTilt;
      const targetZ = y0 * sinLatTilt + z0 * cosLatTilt;

      const globeCentroidX = center.x + targetX * radius;
      const globeCentroidY = center.y + targetY * radius;

      // Flat centroid
      const flatCentroidX = flatLeft + ((activeCountry.lng + 180) / 360) * flatW;
      const flatNormLat = Math.max(0, Math.min(1, (84 - activeCountry.lat) / 146));
      const flatCentroidY = flatTop + flatNormLat * flatH;

      const cx = flatCentroidX + (globeCentroidX - flatCentroidX) * m;
      const cy = flatCentroidY + (globeCentroidY - flatCentroidY) * m;

      const isCentroidVisible = m < 0.25 || targetZ > 0.05;

      if (isCentroidVisible) {
        selectedCentroidPx = {
          x: cx,
          y: cy,
          visible: true,
        };
      }
    }

    return {
      frontLandDots: frontLandStr,
      frontOceanDots: frontOceanStr,
      backDotsPath: backStr,
      highlightDotsPath: highlightStr,
      beaconCenter: selectedCentroidPx,
    };
  }, [
    rotationState,
    flatPan,
    morphProgress,
    appearProgress,
    activeCode,
    activeCountry,
    center.x,
    center.y,
    radius,
    size,
    canvasHeight,
  ]);

  // Core sphere body opacity fades in as dots arrive and fades out in flat mode
  const sphereBodyOpacity = Math.max(0, Math.min(1, (appearProgress - 0.35) / 0.65)) * morphProgress;
  const atmosphereOpacity = Math.max(0, Math.min(1, (appearProgress - 0.5) / 0.5)) * morphProgress;

  // Flat map card frame dimensions
  const flatCardW = size * 0.96;
  const flatCardH = canvasHeight * 0.90;
  const flatCardX = (size - flatCardW) / 2;
  const flatCardY = (canvasHeight - flatCardH) / 2;

  return (
    <View style={styles.container}>
      {/* Interactive SVG Canvas with adaptive height */}
      <View style={[styles.canvasWrapper, { width: size, height: canvasHeight }]}>
        <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
          <Svg width={size} height={canvasHeight}>
            <Defs>
              {/* Outer Cosmic Nebula Corona Glow */}
              <RadialGradient id="outerNebulaAura" cx="50%" cy="50%" r="50%">
                <Stop offset="52%" stopColor={currentAtmosphereColor} stopOpacity="0.25" />
                <Stop offset="76%" stopColor={currentAtmosphereColor} stopOpacity="0.08" />
                <Stop offset="100%" stopColor={currentAtmosphereColor} stopOpacity="0" />
              </RadialGradient>

              {/* 3D Spherical Specular & Void Shadow */}
              <RadialGradient id="globeCoreGlow" cx="34%" cy="28%" r="72%">
                <Stop offset="0%" stopColor={activeCoreTheme.coreStart} stopOpacity="0.95" />
                <Stop offset="62%" stopColor={activeCoreTheme.coreMid} stopOpacity="0.88" />
                <Stop offset="100%" stopColor={activeCoreTheme.coreEnd} stopOpacity="0.98" />
              </RadialGradient>

              {/* Atmospheric Rim Lighting Glow */}
              <RadialGradient id="atmosphereGlow" cx="50%" cy="50%" r="50%">
                <Stop offset="76%" stopColor={currentAtmosphereColor} stopOpacity="0" />
                <Stop offset="90%" stopColor={currentAtmosphereColor} stopOpacity="0.22" />
                <Stop offset="98%" stopColor={currentAtmosphereColor} stopOpacity="0.65" />
                <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0.4" />
              </RadialGradient>

              {/* Hardware-accelerated Card Frame Clipping Mask for Flat Map Mode */}
              <ClipPath id="flatCardClip">
                <Rect
                  x={flatCardX}
                  y={flatCardY}
                  width={flatCardW}
                  height={flatCardH}
                  rx={18}
                />
              </ClipPath>
            </Defs>

            {/* Flat Map Outer Card Matrix Frame (fades out in globe mode) */}
            {morphProgress < 0.99 && (
              <Rect
                x={flatCardX}
                y={flatCardY}
                width={flatCardW}
                height={flatCardH}
                rx={18}
                fill="rgba(15, 23, 42, 0.5)"
                stroke="rgba(255, 255, 255, 0.08)"
                strokeWidth={1}
                opacity={1 - morphProgress}
              />
            )}

            {/* Layer 0: Cosmic Nebula Corona Bloom */}
            {showAtmosphere && atmosphereOpacity > 0.01 && (
              <Circle
                cx={center.x}
                cy={center.y}
                r={radius * 1.28}
                fill="url(#outerNebulaAura)"
                pointerEvents="none"
                opacity={atmosphereOpacity}
              />
            )}

            {/* Celestial Sphere Body: Fades in as dots assemble & in globe mode */}
            {sphereBodyOpacity > 0.01 && (
              <Circle
                cx={center.x}
                cy={center.y}
                r={radius}
                fill="url(#globeCoreGlow)"
                stroke={activeCoreTheme.rimColor}
                strokeWidth={1}
                opacity={sphereBodyOpacity}
              />
            )}

            {/* Atmosphere Outer Ring Halo */}
            {showAtmosphere && atmosphereOpacity > 0.01 && (
              <Circle
                cx={center.x}
                cy={center.y}
                r={radius * 1.05}
                fill="url(#atmosphereGlow)"
                pointerEvents="none"
                opacity={atmosphereOpacity}
              />
            )}

            {/* Dots and Beacon Layers: Strictly bounded inside Card Frame in Flat Map mode */}
            <G clipPath={morphProgress < 0.99 ? 'url(#flatCardClip)' : undefined}>
              {/* Layer 1: Back-facing Ghost Dots (Holographic depth volume) */}
              {backDotsPath.length > 0 && (
                <Path d={backDotsPath} fill="rgba(71, 85, 105, 0.25)" />
              )}

              {/* Layer 2: Ocean / Celestial Sphere Dots */}
              {frontOceanDots.length > 0 && (
                <Path d={frontOceanDots} fill={currentOceanDotColor} />
              )}

              {/* Layer 3: Continent Landmass Star Dots */}
              {frontLandDots.length > 0 && (
                <Path d={frontLandDots} fill={currentDotColor} />
              )}

              {/* Layer 4: Highlighted Country Neon Star Dots */}
              {highlightDotsPath.length > 0 && (
                <Path
                  d={highlightDotsPath}
                  fill={currentAccentColor}
                  stroke="rgba(255, 255, 255, 0.9)"
                  strokeWidth={0.6}
                />
              )}

              {/* Layer 5: Pulsing Radar Beacon on Active Country Centroid */}
              {beaconCenter && (
                <G>
                  {/* Outer Expanding Sonar Waves */}
                  <Circle
                    cx={beaconCenter.x}
                    cy={beaconCenter.y}
                    r={6 + pulsePhase * 18}
                    fill="none"
                    stroke={currentAccentColor}
                    strokeWidth={1.5}
                    strokeOpacity={1 - pulsePhase}
                  />
                  <Circle
                    cx={beaconCenter.x}
                    cy={beaconCenter.y}
                    r={3 + ((pulsePhase + 0.5) % 1) * 18}
                    fill="none"
                    stroke={currentAccentColor}
                    strokeWidth={1.2}
                    strokeOpacity={1 - ((pulsePhase + 0.5) % 1)}
                  />
                  {/* Center Core Pin */}
                  <Circle
                    cx={beaconCenter.x}
                    cy={beaconCenter.y}
                    r={4}
                    fill="#FFFFFF"
                    stroke={currentAccentColor}
                    strokeWidth={2}
                  />
                </G>
              )}
            </G>
          </Svg>
        </View>
      </View>

      {/* Sleek Low-Profile Customization Dock with Mode Switcher */}
      {showCustomizationControls && (
        <View style={styles.compactDock}>
          {/* Row 1: Mode Switcher [ 🌐 3D Globe | 🗺️ 2D Flat ] + Rebuild */}
          <View style={styles.dockRow}>
            {allowModeToggle ? (
              <View style={styles.modeToggleWrap}>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.modeToggleBtn,
                    activeMode === 'globe' && {
                      backgroundColor: 'rgba(255, 255, 255, 0.16)',
                      borderColor: currentDotColor,
                    },
                  ]}
                  onPress={() => switchMode('globe')}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      activeMode === 'globe' && { color: currentDotColor, fontWeight: '800' },
                    ]}
                  >
                    🌐 3D Globe
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.8}
                  style={[
                    styles.modeToggleBtn,
                    activeMode === 'flat' && {
                      backgroundColor: 'rgba(255, 255, 255, 0.16)',
                      borderColor: currentDotColor,
                    },
                  ]}
                  onPress={() => switchMode('flat')}
                >
                  <Text
                    style={[
                      styles.modeToggleText,
                      activeMode === 'flat' && { color: currentDotColor, fontWeight: '800' },
                    ]}
                  >
                    🗺️ 2D Flat
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <Text style={styles.dockLabel}>
                {activeMode === 'globe' ? 'GLOBE' : 'FLAT'}
              </Text>
            )}

            <TouchableOpacity
              style={[styles.dockBtn, { borderColor: currentDotColor }]}
              activeOpacity={0.8}
              onPress={playAppearAnimation}
            >
              <Text style={[styles.dockBtnText, { color: currentDotColor }]}>✨ Rebuild</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Star Dots Color Swatches + Motion Controls */}
          <View style={styles.dockRow}>
            <Text style={styles.dockLabel}>STARS</Text>
            <View style={styles.dockSwatches}>
              {DOT_THEMES.map((theme) => {
                const isSelected = selectedDotTheme === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setSelectedDotTheme(theme.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    style={[
                      styles.dockSwatchWrap,
                      isSelected && {
                        borderColor: theme.dotColor,
                        backgroundColor: 'rgba(255, 255, 255, 0.16)',
                        shadowColor: theme.dotColor,
                        shadowOpacity: 0.8,
                        shadowRadius: 6,
                      },
                    ]}
                  >
                    <View style={[styles.dockSwatchDot, { backgroundColor: theme.dotColor }]} />
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Spin & Speed Controls */}
            <View style={styles.dockActionGroup}>
              <TouchableOpacity
                style={[
                  styles.dockMiniBtn,
                  isAutoRotating &&
                    activeMode === 'globe' && {
                      borderColor: currentDotColor,
                      backgroundColor: 'rgba(255, 255, 255, 0.08)',
                    },
                ]}
                activeOpacity={0.8}
                onPress={() => {
                  if (activeMode === 'flat') {
                    switchMode('globe');
                    setIsAutoRotating(true);
                  } else {
                    setIsAutoRotating((prev) => !prev);
                  }
                }}
              >
                <Text
                  style={[
                    styles.dockMiniBtnText,
                    isAutoRotating && activeMode === 'globe' && { color: currentDotColor },
                  ]}
                >
                  {isAutoRotating && activeMode === 'globe' ? '⏸' : '▶'}
                </Text>
              </TouchableOpacity>

              {activeMode === 'globe' && (
                <TouchableOpacity
                  style={styles.dockMiniBtn}
                  activeOpacity={0.8}
                  onPress={() => {
                    const speeds = [0.2, 0.35, 0.7];
                    const idx = speeds.indexOf(currentSpeed);
                    const nextSpeed = speeds[(idx + 1) % speeds.length];
                    setCurrentSpeed(nextSpeed);
                  }}
                >
                  <Text style={styles.dockMiniBtnText}>
                    {currentSpeed === 0.2 ? '0.5x' : currentSpeed === 0.7 ? '2x' : '1x'}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>
      )}

      {/* Featured Country Destination Quick-Select Horizontal Carousel */}
      <View style={styles.countryPickerWrap}>
        <View style={styles.pickerHeaderRow}>
          <Text style={styles.pickerSectionTitle}>EXPLORE DESTINATIONS</Text>
          <Text style={styles.pickerSubtitle}>Tap to fly & lock</Text>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.countryScrollRow}
        >
          {FEATURED_COUNTRIES.map((country) => {
            const isSelected = activeCode === country.code;
            return (
              <TouchableOpacity
                key={country.code}
                activeOpacity={0.8}
                style={[
                  styles.countryPill,
                  isSelected && {
                    backgroundColor: 'rgba(255, 255, 255, 0.14)',
                    borderColor: currentDotColor,
                    shadowColor: currentDotColor,
                    shadowOpacity: 0.5,
                    shadowRadius: 8,
                  },
                ]}
                onPress={() => handleCountryPress(country)}
              >
                <Text style={styles.pillFlag}>{country.flag}</Text>
                <Text
                  style={[
                    styles.pillText,
                    isSelected && { color: currentDotColor, fontWeight: '800' },
                  ]}
                >
                  {country.name}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  canvasWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactDock: {
    marginTop: 22,
    width: '92%',
    maxWidth: 380,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderRadius: 18,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    gap: 6,
  },
  dockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 28,
  },
  modeToggleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(2, 6, 23, 0.55)',
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 3,
  },
  modeToggleBtn: {
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  modeToggleText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  dockLabel: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.2,
    width: 44,
  },
  dockSwatches: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  dockSwatchWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'transparent',
  },
  dockSwatchDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  dockBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4.5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dockBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  dockActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dockMiniBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 28,
  },
  dockMiniBtnText: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#CBD5E1',
  },
  countryPickerWrap: {
    marginTop: 10,
    width: '100%',
  },
  pickerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 8,
  },
  pickerSectionTitle: {
    color: '#64748B',
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  pickerSubtitle: {
    color: '#475569',
    fontSize: 9.5,
    fontWeight: '600',
  },
  countryScrollRow: {
    paddingHorizontal: 16,
    gap: 8,
    alignItems: 'center',
  },
  countryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.72)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 6,
  },
  pillFlag: {
    fontSize: 13,
  },
  pillText: {
    color: '#CBD5E1',
    fontSize: 11.5,
    fontWeight: '600',
  },
});

export default StarsWorld;

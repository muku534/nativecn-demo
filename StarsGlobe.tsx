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
  Platform,
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
  Text as SvgText,
} from 'react-native-svg';
import {
  ALL_GLOBE_DOTS,
  COUNTRIES_DATA,
  FEATURED_COUNTRIES,
  CountryInfo,
} from './worldData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

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

export interface StarsGlobeProps {
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

// Pre-computed dispersed 3D positions for cosmic starburst assembly animation
const SCATTER_SEED = ALL_GLOBE_DOTS.map((_, i) => {
  const angle = (i * 137.5 * Math.PI) / 180;
  const dist = 140 + (i % 65) * 3.8;
  return {
    sx: Math.cos(angle) * dist,
    sy: Math.sin(angle) * dist,
    sz: ((i % 120) - 60) * 3.6,
    delay: (i % 50) / 110, // Stagger 0 - 0.45s
  };
});

function circlePath(cx: number, cy: number, r: number): string {
  const roundedX = Math.round(cx * 10) / 10;
  const roundedY = Math.round(cy * 10) / 10;
  const roundedR = Math.round(r * 10) / 10;
  return `M${roundedX - roundedR} ${roundedY}a${roundedR} ${roundedR} 0 1 0 ${2 * roundedR} 0a${roundedR} ${roundedR} 0 1 0 ${-2 * roundedR} 0`;
}

export const StarsGlobe: React.FC<StarsGlobeProps> = ({
  size = Math.min(340, SCREEN_WIDTH - 40),
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
  const radius = size * 0.44;
  const center = size / 2;

  // Customization Themes
  const [selectedDotTheme, setSelectedDotTheme] = useState<string>('cyan');
  const [selectedCoreTheme, setSelectedCoreTheme] = useState<string>('space');
  const [currentSpeed, setCurrentSpeed] = useState<number>(initialSpeed);

  const activeDotTheme = DOT_THEMES.find((t) => t.id === selectedDotTheme) || DOT_THEMES[0];
  const activeCoreTheme = CORE_THEMES.find((t) => t.id === selectedCoreTheme) || CORE_THEMES[0];

  const currentDotColor = propDotColor || activeDotTheme.dotColor;
  const currentAccentColor = activeDotTheme.accentColor;
  const currentOceanDotColor = propOceanDotColor || activeDotTheme.oceanDotColor;
  const currentAtmosphereColor = propAtmosphereColor || activeCoreTheme.atmosphereColor;

  // Selected Country state
  const [internalSelectedCode, setInternalSelectedCode] = useState<string | null>(
    selectedCountryCode !== undefined ? selectedCountryCode : 'IN'
  );
  const activeCode = selectedCountryCode !== undefined ? selectedCountryCode : internalSelectedCode;
  const activeCountry = activeCode ? COUNTRIES_DATA[activeCode] || null : null;

  // Rotation angles in degrees (face active country if selected)
  const initLng = activeCountry ? -activeCountry.lng : 15;
  const initLat = activeCountry ? -Math.max(-30, Math.min(30, activeCountry.lat * 0.45)) : 18;
  const rotationLngRef = useRef(initLng);
  const tiltLatRef = useRef(initLat);
  const [rotationState, setRotationState] = useState({ lng: initLng, lat: initLat });

  // Auto rotation & gestures
  const [isAutoRotating, setIsAutoRotating] = useState(initialAutoRotate);
  const isInteractingRef = useRef(false);
  const animFrameRef = useRef<number | null>(null);
  const inertiaVelocityRef = useRef({ vx: 0, vy: 0 });

  // Appear animation progress (0: dispersed stars, 1: fully assembled globe)
  const [appearProgress, setAppearProgress] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);

  // Trigger full assembly animation where dots build the entire globe
  const playAppearAnimation = useCallback(() => {
    setAppearProgress(0);
    let startTime: number | null = null;
    const duration = 2100; // 2.1s silky celestial build

    const step = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const p = Math.min(1, elapsed / duration);
      // Cubic ease-out
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

  // Pulse animation for selected country beacon
  useEffect(() => {
    let phase = 0;
    const interval = setInterval(() => {
      phase = (phase + 0.05) % 1;
      setPulsePhase(phase);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Smooth fly-to camera focus when selected country changes
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
      const duration = 900;

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

  useEffect(() => {
    if (selectedCountryCode && COUNTRIES_DATA[selectedCountryCode]) {
      flyToCountry(COUNTRIES_DATA[selectedCountryCode]);
    }
  }, [selectedCountryCode, flyToCountry]);

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

  // Auto-rotation & momentum loop
  useEffect(() => {
    const loop = () => {
      if (!isInteractingRef.current) {
        if (Math.abs(inertiaVelocityRef.current.vx) > 0.05 || Math.abs(inertiaVelocityRef.current.vy) > 0.05) {
          rotationLngRef.current = (rotationLngRef.current + inertiaVelocityRef.current.vx) % 360;
          tiltLatRef.current = Math.max(-55, Math.min(55, tiltLatRef.current + inertiaVelocityRef.current.vy));
          inertiaVelocityRef.current.vx *= 0.94;
          inertiaVelocityRef.current.vy *= 0.94;
          setRotationState({ lng: rotationLngRef.current, lat: tiltLatRef.current });
        } else if (isAutoRotating) {
          rotationLngRef.current = (rotationLngRef.current + currentSpeed) % 360;
          setRotationState({ lng: rotationLngRef.current, lat: tiltLatRef.current });
        }
      }

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [isAutoRotating, currentSpeed]);

  // Gesture handling: Direct 1:1 pan & momentum tracking
  const startRotationRef = useRef({ lng: initLng, lat: initLat });

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        isInteractingRef.current = true;
        setIsAutoRotating(false); // Pause auto-rotation on user grab
        startRotationRef.current = {
          lng: rotationLngRef.current,
          lat: tiltLatRef.current,
        };
        inertiaVelocityRef.current = { vx: 0, vy: 0 };
        onInteractionChange?.(true);
      },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const sensitivity = 0.55;
        const newLng = (startRotationRef.current.lng + gestureState.dx * sensitivity) % 360;
        const newLat = Math.max(
          -60,
          Math.min(60, startRotationRef.current.lat - gestureState.dy * (sensitivity * 0.7))
        );

        rotationLngRef.current = newLng;
        tiltLatRef.current = newLat;
        inertiaVelocityRef.current = {
          vx: Math.abs(gestureState.vx) > 0.05 ? Math.max(-6, Math.min(6, gestureState.vx * 0.7)) : 0,
          vy: Math.abs(gestureState.vy) > 0.05 ? Math.max(-6, Math.min(6, -gestureState.vy * 0.45)) : 0,
        };
        setRotationState({ lng: newLng, lat: newLat });
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

  // Project ALL dots (continents + oceans) onto 3D Sphere & apply appearance scatter
  const { frontLandDots, frontOceanDots, backDotsPath, highlightDotsPath, beaconCenter } = useMemo(() => {
    const radLng = (rotationState.lng * Math.PI) / 180;
    const radLat = (rotationState.lat * Math.PI) / 180;
    const cosLatTilt = Math.cos(radLat);
    const sinLatTilt = Math.sin(radLat);

    let frontLandStr = '';
    let frontOceanStr = '';
    let backStr = '';
    let highlightStr = '';
    let selectedCentroidPx: { x: number; y: number; visible: boolean } | null = null;

    for (let i = 0; i < ALL_GLOBE_DOTS.length; i++) {
      const dot = ALL_GLOBE_DOTS[i];
      const scatter = SCATTER_SEED[i];

      // Staggered local progress for starburst reveal
      const localP = Math.max(0, Math.min(1, (appearProgress - scatter.delay) / (1 - scatter.delay)));
      const easedLocal =
        localP < 0.5 ? 4 * localP * localP * localP : 1 - Math.pow(-2 * localP + 2, 3) / 2;

      // 1. Spherical coordinate on unit sphere
      const phi = (dot.lat * Math.PI) / 180;
      const theta = (dot.lng * Math.PI) / 180 + radLng;

      const x0 = Math.cos(phi) * Math.sin(theta);
      const y0 = -Math.sin(phi);
      const z0 = Math.cos(phi) * Math.cos(theta);

      // 2. Apply latitude tilt
      const targetX = x0;
      const targetY = y0 * cosLatTilt - z0 * sinLatTilt;
      const targetZ = y0 * sinLatTilt + z0 * cosLatTilt;

      // 3. Interpolate from dispersed scatter position to target sphere
      const startX = scatter.sx / radius;
      const startY = scatter.sy / radius;
      const startZ = scatter.sz / radius;

      const currX = startX + (targetX - startX) * easedLocal;
      const currY = startY + (targetY - startY) * easedLocal;
      const currZ = startZ + (targetZ - startZ) * easedLocal;

      const px = center + currX * radius;
      const py = center + currY * radius;

      const isSelected = activeCode !== null && dot.code === activeCode && dot.isLand;

      // Front hemisphere (currZ > 0) vs Back hemisphere (currZ <= 0)
      if (currZ > 0) {
        const depthScale = 0.8 + 0.45 * currZ;

        if (isSelected) {
          highlightStr += circlePath(px, py, 2.5 * depthScale);
        } else if (dot.isLand) {
          // Continents: prominent luminous star dots
          frontLandStr += circlePath(px, py, 1.45 * depthScale);
        } else {
          // Oceans & matrix: delicate celestial sphere dots
          frontOceanStr += circlePath(px, py, 1.05 * depthScale);
        }
      } else if (appearProgress > 0.6) {
        // Subtle holographic volume dots
        const backR = dot.isLand ? 0.9 : 0.7;
        backStr += circlePath(px, py, backR);
      }
    }

    // Project active country centroid for beacon ripple
    if (activeCountry) {
      const phi = (activeCountry.lat * Math.PI) / 180;
      const theta = (activeCountry.lng * Math.PI) / 180 + radLng;
      const x0 = Math.cos(phi) * Math.sin(theta);
      const y0 = -Math.sin(phi);
      const z0 = Math.cos(phi) * Math.cos(theta);

      const targetX = x0;
      const targetY = y0 * cosLatTilt - z0 * sinLatTilt;
      const targetZ = y0 * sinLatTilt + z0 * cosLatTilt;

      if (targetZ > 0.05) {
        selectedCentroidPx = {
          x: center + targetX * radius,
          y: center + targetY * radius,
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
  }, [rotationState, appearProgress, activeCode, activeCountry, center, radius]);

  // Core sphere body opacity fades in as dots arrive
  const sphereBodyOpacity = Math.max(0, Math.min(1, (appearProgress - 0.35) / 0.65));
  const atmosphereOpacity = Math.max(0, Math.min(1, (appearProgress - 0.5) / 0.5));

  return (
    <View style={styles.container}>
      {/* 3D Interactive SVG Globe */}
      <View style={[styles.globeWrapper, { width: size, height: size }]}>
        <View
          style={StyleSheet.absoluteFill}
          {...panResponder.panHandlers}
        >
          <Svg width={size} height={size}>
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
            </Defs>

            {/* Layer 0: Cosmic Nebula Corona Bloom */}
            {showAtmosphere && (
              <Circle
                cx={center}
                cy={center}
                r={radius * 1.28}
                fill="url(#outerNebulaAura)"
                pointerEvents="none"
                opacity={atmosphereOpacity}
              />
            )}

            {/* Celestial Sphere Body: Fades in as dots assemble */}
            <Circle
              cx={center}
              cy={center}
              r={radius}
              fill="url(#globeCoreGlow)"
              stroke={activeCoreTheme.rimColor}
              strokeWidth={1}
              opacity={sphereBodyOpacity}
            />

            {/* Atmosphere Outer Ring Halo */}
            {showAtmosphere && (
              <Circle
                cx={center}
                cy={center}
                r={radius * 1.05}
                fill="url(#atmosphereGlow)"
                pointerEvents="none"
                opacity={atmosphereOpacity}
              />
            )}

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
                  r={4.5}
                  fill="#FFFFFF"
                  stroke={currentAccentColor}
                  strokeWidth={2}
                />
                {/* Floating Holographic Country Name Tag */}
                {activeCountry && (
                  <G transform={`translate(${beaconCenter.x}, ${beaconCenter.y - 18})`}>
                    <Rect
                      x={-28}
                      y={-10}
                      width={56}
                      height={18}
                      rx={9}
                      fill="rgba(2, 6, 23, 0.92)"
                      stroke={currentAccentColor}
                      strokeWidth={1}
                    />
                    <SvgText
                      x={0}
                      y={2}
                      fill="#FFFFFF"
                      fontSize="9"
                      fontWeight="bold"
                      textAnchor="middle"
                      alignmentBaseline="middle"
                    >
                      {`${activeCountry.flag} ${activeCountry.code}`}
                    </SvgText>
                  </G>
                )}
              </G>
            )}
          </Svg>
        </View>

        {/* Floating Quick Action Overlay Buttons - temporarily hidden
        <View style={styles.floatingControls} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.glassIconButton}
            activeOpacity={0.7}
            onPress={() => setIsAutoRotating((prev) => !prev)}
          >
            <Text style={styles.iconButtonText}>{isAutoRotating ? '⏸' : '▶'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.glassIconButton}
            activeOpacity={0.7}
            onPress={playAppearAnimation}
          >
            <Text style={styles.iconButtonText}>✨</Text>
          </TouchableOpacity>
        </View>
        */}
      </View>

      {/* Sleek Low-Profile Customization Dock */}
      {showCustomizationControls && (
        <View style={styles.compactDock}>
          {/* Row 1: Star Dots Palette + Rebuild */}
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
            <TouchableOpacity
              style={[styles.dockBtn, { borderColor: currentDotColor }]}
              activeOpacity={0.8}
              onPress={playAppearAnimation}
            >
              <Text style={[styles.dockBtnText, { color: currentDotColor }]}>✨ Rebuild</Text>
            </TouchableOpacity>
          </View>

          {/* Row 2: Core Void Palette + Spin & Speed */}
          <View style={styles.dockRow}>
            <Text style={styles.dockLabel}>CORE</Text>
            <View style={styles.dockSwatches}>
              {CORE_THEMES.map((theme) => {
                const isSelected = selectedCoreTheme === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setSelectedCoreTheme(theme.id)}
                    activeOpacity={0.7}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    style={[
                      styles.dockSwatchWrap,
                      isSelected && {
                        borderColor: currentDotColor,
                        backgroundColor: 'rgba(255, 255, 255, 0.16)',
                        shadowColor: currentDotColor,
                        shadowOpacity: 0.8,
                        shadowRadius: 6,
                      },
                    ]}
                  >
                    <View
                      style={[
                        styles.dockSwatchDot,
                        {
                          backgroundColor: theme.coreStart,
                          borderWidth: 1,
                          borderColor: theme.atmosphereColor,
                        },
                      ]}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.dockActionGroup}>
              <TouchableOpacity
                style={[
                  styles.dockMiniBtn,
                  isAutoRotating && { borderColor: currentDotColor, backgroundColor: 'rgba(255, 255, 255, 0.08)' },
                ]}
                activeOpacity={0.8}
                onPress={() => setIsAutoRotating((prev) => !prev)}
              >
                <Text style={[styles.dockMiniBtnText, isAutoRotating && { color: currentDotColor }]}>
                  {isAutoRotating ? '⏸' : '▶'}
                </Text>
              </TouchableOpacity>

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
  globeWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingControls: {
    position: 'absolute',
    top: 10,
    right: 8,
    flexDirection: 'column',
    gap: 8,
  },
  glassIconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  iconButtonText: {
    fontSize: 14,
    color: '#F8FAFC',
  },
  compactDock: {
    marginTop: 10,
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
  telemetryBar: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    gap: 7,
  },
  telemetryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  telemetryTarget: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  telemetryDotSep: {
    fontSize: 10,
    color: '#475569',
  },
  telemetryData: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  telemetryLockBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  telemetryLockText: {
    fontSize: 8.5,
    fontWeight: '800',
    letterSpacing: 0.8,
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

export default StarsGlobe;

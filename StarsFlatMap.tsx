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
  Rect,
  Circle,
  Path,
  G,
  ClipPath,
  Text as SvgText,
} from 'react-native-svg';
import {
  WORLD_DOTS,
  OCEAN_SPHERE_DOTS,
  COUNTRIES_DATA,
  FEATURED_COUNTRIES,
  CountryInfo,
} from './worldData';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export interface FlatMapTheme {
  id: string;
  name: string;
  dotColor: string;
  accentColor: string;
  oceanDotColor: string;
}

export const FLATMAP_THEMES: FlatMapTheme[] = [
  { id: 'cyan', name: 'Cyan', dotColor: '#00D4FF', accentColor: '#38BDF8', oceanDotColor: 'rgba(56, 189, 248, 0.18)' },
  { id: 'emerald', name: 'Emerald', dotColor: '#10B981', accentColor: '#34D399', oceanDotColor: 'rgba(52, 211, 153, 0.18)' },
  { id: 'amber', name: 'Gold', dotColor: '#F59E0B', accentColor: '#FBBF24', oceanDotColor: 'rgba(251, 191, 36, 0.18)' },
  { id: 'violet', name: 'Violet', dotColor: '#A855F7', accentColor: '#C084FC', oceanDotColor: 'rgba(192, 132, 252, 0.18)' },
  { id: 'rose', name: 'Rose', dotColor: '#F43F5E', accentColor: '#FB7185', oceanDotColor: 'rgba(251, 113, 133, 0.18)' },
  { id: 'silver', name: 'Silver', dotColor: '#F8FAFC', accentColor: '#FFFFFF', oceanDotColor: 'rgba(248, 250, 252, 0.2)' },
];

export interface StarsFlatMapProps {
  width?: number;
  height?: number;
  selectedCountryCode?: string | null;
  onSelectCountry?: (country: CountryInfo | null) => void;
  onInteractionChange?: (isInteracting: boolean) => void;
  highlightColor?: string;
  baseDotColor?: string;
  showCustomizationControls?: boolean;
}

function circlePath(cx: number, cy: number, r: number): string {
  const roundedX = Math.round(cx * 10) / 10;
  const roundedY = Math.round(cy * 10) / 10;
  const roundedR = Math.round(r * 10) / 10;
  return `M${roundedX - roundedR} ${roundedY}a${roundedR} ${roundedR} 0 1 0 ${2 * roundedR} 0a${roundedR} ${roundedR} 0 1 0 ${-2 * roundedR} 0`;
}

export const StarsFlatMap: React.FC<StarsFlatMapProps> = ({
  width = Math.min(SCREEN_WIDTH - 24, 420),
  height = Math.min(SCREEN_WIDTH - 24, 420) * 0.58,
  selectedCountryCode,
  onSelectCountry,
  onInteractionChange,
  highlightColor: propHighlightColor,
  baseDotColor: propBaseDotColor,
  showCustomizationControls = true,
}) => {
  // Theme state
  const [selectedThemeId, setSelectedThemeId] = useState<string>('cyan');
  const activeTheme = FLATMAP_THEMES.find((t) => t.id === selectedThemeId) || FLATMAP_THEMES[0];

  const currentDotColor = propBaseDotColor || activeTheme.dotColor;
  const currentAccentColor = propHighlightColor || activeTheme.accentColor;
  const currentOceanColor = activeTheme.oceanDotColor;

  // Selected Country
  const [internalSelectedCode, setInternalSelectedCode] = useState<string | null>(
    selectedCountryCode !== undefined ? selectedCountryCode : 'IN'
  );
  const activeCode =
    selectedCountryCode !== undefined ? selectedCountryCode : internalSelectedCode;
  const activeCountry = activeCode ? COUNTRIES_DATA[activeCode] || null : null;

  // Pan & Zoom state
  const [scale, setScale] = useState(1);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const scaleRef = useRef(1);
  const panRef = useRef({ x: 0, y: 0 });

  // Staggered shockwave radial reveal animation progress
  const [appearProgress, setAppearProgress] = useState(0);
  const [pulsePhase, setPulsePhase] = useState(0);

  const playAppearAnimation = useCallback(() => {
    setAppearProgress(0);
    let startTime: number | null = null;
    const duration = 1800;

    const step = (time: number) => {
      if (!startTime) startTime = time;
      const elapsed = time - startTime;
      const p = Math.min(1, elapsed / duration);
      // Elastic overshoot ease
      const eased =
        p === 1
          ? 1
          : 1 - Math.pow(2, -10 * p) * Math.cos(((p * 10 - 0.75) * (2 * Math.PI)) / 3);
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

  // Radar ping pulse loop
  useEffect(() => {
    let phase = 0;
    const interval = setInterval(() => {
      phase = (phase + 0.05) % 1;
      setPulsePhase(phase);
    }, 40);
    return () => clearInterval(interval);
  }, []);

  // Pan gesture responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        panRef.current = { x: panX, y: panY };
        onInteractionChange?.(true);
      },
      onPanResponderMove: (_: GestureResponderEvent, gestureState: PanResponderGestureState) => {
        const nextX = panRef.current.x + gestureState.dx;
        const nextY = panRef.current.y + gestureState.dy;

        const maxPanX = (width * (scale - 1)) / 2 + 60;
        const maxPanY = (height * (scale - 1)) / 2 + 40;

        const clampedX = Math.max(-maxPanX, Math.min(maxPanX, nextX));
        const clampedY = Math.max(-maxPanY, Math.min(maxPanY, nextY));

        setPanX(clampedX);
        setPanY(clampedY);
      },
      onPanResponderRelease: () => {
        onInteractionChange?.(false);
      },
      onPanResponderTerminate: () => {
        onInteractionChange?.(false);
      },
    })
  ).current;

  // Zoom handlers
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + 0.35, 3.0));
  };

  const handleZoomOut = () => {
    setScale((prev) => Math.max(prev - 0.35, 0.85));
  };

  const handleReset = () => {
    setPanX(0);
    setPanY(0);
    setScale(1);
    panRef.current = { x: 0, y: 0 };
    scaleRef.current = 1;
  };

  // Map projection: lat, lng to flat map coordinates with safe inner padding
  const projectPoint = useCallback(
    (lat: number, lng: number) => {
      const padX = 18;
      const padY = 16;
      const mapW = width - padX * 2;
      const mapH = height - padY * 2;
      const normLng = (lng + 180) / 360;
      const normLat = Math.max(0, Math.min(1, (84 - lat) / 146));
      const x = padX + normLng * mapW;
      const y = padY + normLat * mapH;
      return { x, y };
    },
    [width, height]
  );

  // Country selection handler
  const handleCountryPress = (country: CountryInfo) => {
    const nextCode = activeCode === country.code ? null : country.code;
    setInternalSelectedCode(nextCode);
    if (onSelectCountry) {
      onSelectCountry(nextCode ? country : null);
    }

    if (nextCode) {
      const pt = projectPoint(country.lat, country.lng);
      const targetPanX = (width / 2 - pt.x) * (scale - 1);
      const targetPanY = (height / 2 - pt.y) * (scale - 1);
      setPanX(targetPanX);
      setPanY(targetPanY);
    }
  };

  // Generate 2D Star Dots Path with radial ripple appear animation
  const { baseDotsPath, oceanDotsPath, highlightDotsPath, beaconCenter } = useMemo(() => {
    const centerX = width / 2;
    const centerY = height / 2;
    const maxDist = Math.sqrt(centerX * centerX + centerY * centerY);

    let baseD = '';
    let oceanD = '';
    let highlightD = '';
    let beaconPt: { x: number; y: number } | null = null;

    // Continent landmass dots
    for (let i = 0; i < WORLD_DOTS.length; i++) {
      const dot = WORLD_DOTS[i];
      const pt = projectPoint(dot.lat, dot.lng);

      const distFromCenter = Math.sqrt(
        (pt.x - centerX) * (pt.x - centerX) + (pt.y - centerY) * (pt.y - centerY)
      );
      const normalizedDist = distFromCenter / (maxDist || 1);

      const dotAppearStart = normalizedDist * 0.65;
      const localP = Math.max(0, Math.min(1, (appearProgress - dotAppearStart) / 0.35));

      if (localP <= 0) continue;

      const easedScale =
        localP < 1 ? 1 + Math.sin(localP * Math.PI) * 0.35 : 1;

      const isSelected = activeCode !== null && dot.code === activeCode;
      const r = (isSelected ? 2.5 : 1.3) * easedScale;

      if (isSelected) {
        highlightD += circlePath(pt.x, pt.y, r);
      } else {
        baseD += circlePath(pt.x, pt.y, r);
      }
    }

    // Ocean matrix dots
    for (let i = 0; i < OCEAN_SPHERE_DOTS.length; i++) {
      const dot = OCEAN_SPHERE_DOTS[i];
      const pt = projectPoint(dot.lat, dot.lng);

      if (appearProgress > 0.4) {
        oceanD += circlePath(pt.x, pt.y, 0.9);
      }
    }

    if (activeCountry) {
      beaconPt = projectPoint(activeCountry.lat, activeCountry.lng);
    }

    return {
      baseDotsPath: baseD,
      oceanDotsPath: oceanD,
      highlightDotsPath: highlightD,
      beaconCenter: beaconPt,
    };
  }, [width, height, projectPoint, appearProgress, activeCode, activeCountry]);

  return (
    <View style={styles.container}>
      {/* 2D Interactive SVG Flat Map Container */}
      <View style={[styles.mapWrapper, { width, height }]}>
        <View
          style={StyleSheet.absoluteFill}
          {...panResponder.panHandlers}
        >
          <Svg width={width} height={height}>
            <Defs>
              <RadialGradient id="flatMapBg" cx="50%" cy="50%" r="65%">
                <Stop offset="0%" stopColor="#0B132B" stopOpacity="0.8" />
                <Stop offset="60%" stopColor="#050B18" stopOpacity="0.95" />
                <Stop offset="100%" stopColor="#020617" stopOpacity="1" />
              </RadialGradient>
              <ClipPath id="flatMapClip">
                <Rect x={0} y={0} width={width} height={height} rx={16} />
              </ClipPath>
            </Defs>

            {/* Map Canvas Background */}
            <Rect
              x={0}
              y={0}
              width={width}
              height={height}
              fill="url(#flatMapBg)"
              rx={16}
              stroke="rgba(255, 255, 255, 0.08)"
              strokeWidth={1}
            />

            {/* Transformed Group (Pan & Zoom) strictly clipped to canvas frame */}
            <G
              clipPath="url(#flatMapClip)"
              transform={`translate(${panX + (width * (1 - scale)) / 2}, ${
                panY + (height * (1 - scale)) / 2
              }) scale(${scale})`}
            >
              {/* Layer 1: Ocean Celestial Matrix Dots */}
              {oceanDotsPath.length > 0 && (
                <Path d={oceanDotsPath} fill={currentOceanColor} />
              )}

              {/* Layer 2: All Base Star Dots */}
              {baseDotsPath.length > 0 && (
                <Path d={baseDotsPath} fill={currentDotColor} />
              )}

              {/* Layer 3: Active Country Illuminated Star Dots */}
              {highlightDotsPath.length > 0 && (
                <Path
                  d={highlightDotsPath}
                  fill={currentAccentColor}
                  stroke="#FFFFFF"
                  strokeWidth={0.5}
                />
              )}

              {/* Layer 4: Centroid Radar Ping Beacon */}
              {beaconCenter && (
                <G>
                  <Circle
                    cx={beaconCenter.x}
                    cy={beaconCenter.y}
                    r={5 + pulsePhase * 18}
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
                  <Circle
                    cx={beaconCenter.x}
                    cy={beaconCenter.y}
                    r={4}
                    fill="#FFFFFF"
                    stroke={currentAccentColor}
                    strokeWidth={2}
                  />
                  {/* Floating Holographic Country Tag */}
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
            </G>
          </Svg>
        </View>

        {/* Floating Zoom & Animation Action Buttons - temporarily hidden
        <View style={styles.floatingControls} pointerEvents="box-none">
          <TouchableOpacity
            style={styles.glassIconButton}
            activeOpacity={0.7}
            onPress={handleZoomIn}
          >
            <Text style={styles.iconButtonText}>+</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.glassIconButton}
            activeOpacity={0.7}
            onPress={handleZoomOut}
          >
            <Text style={styles.iconButtonText}>−</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.glassIconButton}
            activeOpacity={0.7}
            onPress={handleReset}
          >
            <Text style={styles.iconButtonText}>⟲</Text>
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
          <View style={styles.dockRow}>
            <Text style={styles.dockLabel}>STARS</Text>
            <View style={styles.dockSwatches}>
              {FLATMAP_THEMES.map((theme) => {
                const isSelected = selectedThemeId === theme.id;
                return (
                  <TouchableOpacity
                    key={theme.id}
                    onPress={() => setSelectedThemeId(theme.id)}
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
        </View>
      )}



      {/* Featured Country Destination Quick-Select Horizontal Carousel */}
      <View style={styles.countryPickerWrap}>
        <View style={styles.pickerHeaderRow}>
          <Text style={styles.pickerSectionTitle}>EXPLORE DESTINATIONS</Text>
          <Text style={styles.pickerSubtitle}>Tap to focus</Text>
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
  mapWrapper: {
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 6 },
  },
  floatingControls: {
    position: 'absolute',
    top: 8,
    right: 8,
    flexDirection: 'column',
    gap: 6,
  },
  glassIconButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
  },
  iconButtonText: {
    fontSize: 13,
    color: '#F8FAFC',
    fontWeight: '700',
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

export default StarsFlatMap;

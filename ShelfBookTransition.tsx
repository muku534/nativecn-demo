import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
} from 'react-native';
import Animated, {
  interpolate,
  Extrapolation,
  useAnimatedStyle,
  SharedValue,
} from 'react-native-reanimated';
import FastImage from 'react-native-fast-image';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ALBUM_WIDTH = SCREEN_WIDTH - 32;
export const ALBUM_RENDER_HEIGHT = ALBUM_WIDTH * 0.75;
export const PAGE_WIDTH = ALBUM_WIDTH / 2;

export interface BookData {
  id: number;
  title: string;
  spineTitle?: string;
  color: string;
  thickness: number;
  height: number;
  titleColor?: string;
  subtitle?: string;
  date?: string;
}

export interface BookRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * BookSpineView: Photorealistic, publisher-quality book spine component.
 * Features:
 * - Cylindrical 3D lighting (curved highlight on left, deep hinge crease & shadow on right)
 * - Top & bottom cloth headbands and 3D embossed ribs
 * - Sharp, crystal-clear typography with high-contrast foil/deboss relief
 * - 100% mathematically bounded clear zone: text NEVER clips at the top or overlaps ribs!
 */
export const BookSpineView = ({
  album,
  width,
  height,
}: {
  album: BookData;
  width: number;
  height: number;
}) => {
  const displayTitle = album.spineTitle || album.title;
  const isDark = album.titleColor !== '#333' && album.titleColor !== '#111' && album.titleColor !== '#1F1A14';

  const len = displayTitle.length;
  let fontSize = 8.5;
  let letterSpacing = 0.5;

  if (len <= 7) {
    fontSize = 9.5;
    letterSpacing = 1.0;
  } else if (len <= 14) {
    fontSize = 8.5;
    letterSpacing = 0.5;
  } else if (len <= 20) {
    fontSize = 7.8;
    letterSpacing = 0.3;
  } else {
    fontSize = 7.0;
    letterSpacing = 0.1;
  }

  // Clear vertical height strictly between ribs (with 14px padding at each end)
  const availableLength = Math.max(20, height - 28);

  return (
    <View
      style={[
        styles.spineInnerBase,
        {
          backgroundColor: album.color,
          width,
          height,
        },
      ]}
    >
      {/* 1. Top & Bottom Headband cloth trims */}
      <View style={styles.spineTopHeadband} />
      <View style={styles.spineBottomFootband} />

      {/* 2. Top & Bottom 3D Embossed Ribs */}
      <View style={styles.spineRibTop}>
        <View style={styles.spineRibHighlight} />
        <View style={styles.spineRibShadow} />
      </View>
      <View style={styles.spineRibBottom}>
        <View style={styles.spineRibHighlight} />
        <View style={styles.spineRibShadow} />
      </View>

      {/* 3. 3D Cylindrical Curvature & Hinge Groove Shadows */}
      <View style={styles.spineLeftHighlight} />
      <View style={styles.spineLeftShine} />
      <View style={styles.spineRightGroove} />
      <View style={styles.spineRightShadow} />

      {/* 4. Perfectly Centered, Crisp Typography (Zero Overflow, Zero Clipping) */}
      <View style={styles.spineTitleArea} pointerEvents="none">
        <View
          style={[
            styles.spineTitleRotatedBox,
            {
              width: availableLength,
              height: width,
            },
          ]}
        >
          <Text
            numberOfLines={1}
            style={[
              styles.spineTitleText,
              {
                color: album.titleColor || (isDark ? '#F5E8C7' : '#1F1A14'),
                fontSize,
                letterSpacing,
                width: availableLength - 4,
                textShadowColor: isDark ? 'rgba(0,0,0,0.65)' : 'rgba(255,255,255,0.45)',
                textShadowOffset: { width: 0, height: 1 },
                textShadowRadius: 1,
              },
            ]}
          >
            {displayTitle}
          </Text>
        </View>
      </View>
    </View>
  );
};

/**
 * EmptyBookSlot: Renders the realistic dark recessed empty slot cavity on the shelf plank
 * where the book was removed from, showing ambient occlusion from neighbor books.
 */
export const EmptyBookSlot = ({
  width,
  height,
}: {
  width: number;
  height: number;
}) => {
  return (
    <View style={[styles.emptySlotContainer, { width, height }]}>
      {/* Dark interior shadow cavity */}
      <View style={styles.emptySlotInnerCavity} />

      {/* Ambient occlusion shadow cast by left neighboring book */}
      <View style={styles.emptySlotShadowLeft} />

      {/* Ambient occlusion shadow cast by right neighboring book */}
      <View style={styles.emptySlotShadowRight} />

      {/* Resting dust / groove line on the wooden plank */}
      <View style={styles.emptySlotPlankLine} />
    </View>
  );
};

interface ShelfBookActorProps {
  album: BookData;
  origin: BookRect;
  target: BookRect;
  pullProgress: SharedValue<number>;
}

/**
 * ShelfBookActor:
 * 1. Pull Out:
 *    - Stage 1 (p: 0.00 -> 0.42): Slides straight forward out of shelf in exact initial upright angle.
 *    - Stage 2 (p: 0.42 -> 0.88): In mid-air, 3D yaw rotation reveals full front cover while flying to reading center.
 *    - Stage 3 (p: 0.88 -> 1.00): Cushioned settle into reading position.
 * 2. Put Back:
 *    - In mid-air, flips back to initial spine-facing angle, then slides straight into shelf slot until flush.
 */
export const ShelfBookActor = ({
  album,
  origin,
  target,
  pullProgress,
}: ShelfBookActorProps) => {
  // Main moving container style
  const containerStyle = useAnimatedStyle(() => {
    const p = pullProgress.value;

    let curX = origin.x;
    let curY = origin.y;
    let curW = origin.width;
    let curH = origin.height;
    let curScale = 1.0;
    let rotateX = 0;
    let rotateZ = 0;

    if (p <= 0.42) {
      // Stage 1: Slide straight forward out of the shelf slot in the exact same angle
      const t1 = interpolate(p, [0, 0.42], [0, 1], Extrapolation.CLAMP);
      curX = origin.x;
      curY = origin.y + t1 * 32;
      curW = origin.width;
      curH = origin.height;
      curScale = 1.0 + t1 * 0.18;
      rotateX = 0;
      rotateZ = 0;
    } else {
      // Stage 2 & 3: Mid-air flight & 3D rotation
      const t2 = interpolate(p, [0.42, 0.90], [0, 1], Extrapolation.CLAMP);

      // Parabolic flight arc
      const arcLift = Math.sin(t2 * Math.PI) * 36;

      curX = interpolate(t2, [0, 1], [origin.x, target.x]);
      curY = interpolate(t2, [0, 1], [origin.y + 32, target.y]) - arcLift;
      curW = interpolate(t2, [0, 1], [origin.width, target.width]);
      curH = interpolate(t2, [0, 1], [origin.height, target.height]);
      curScale = interpolate(t2, [0, 1], [1.18, 1.0]);

      rotateX = 0;
      rotateZ = Math.sin(t2 * Math.PI) * -1.5;
    }

    // Dynamic elevation shadow beneath the book matching static shelf book at p=0
    const shadowOpacity = interpolate(p, [0, 0.42, 0.88, 1], [0.35, 0.45, 0.28, 0.22], Extrapolation.CLAMP);
    const shadowRadius = interpolate(p, [0, 0.42, 0.88, 1], [4, 14, 26, 20], Extrapolation.CLAMP);
    const shadowOffsetY = interpolate(p, [0, 0.42, 0.88, 1], [2, 10, 20, 16], Extrapolation.CLAMP);

    return {
      position: 'absolute',
      left: 0,
      top: 0,
      width: curW,
      height: curH,
      transform: [
        { translateX: curX },
        { translateY: curY },
        { perspective: 1200 },
        { rotateX: `${rotateX}deg` },
        { rotateZ: `${rotateZ}deg` },
        { scale: curScale },
      ],
      shadowColor: '#000',
      shadowOpacity,
      shadowRadius,
      shadowOffset: { width: 2, height: shadowOffsetY },
      elevation: interpolate(p, [0, 1], [5, 20], Extrapolation.CLAMP),
    };
  });

  // 3D Top Edge: Hardcover rim + paper top during slide out
  const topEdgeStyle = useAnimatedStyle(() => {
    const p = pullProgress.value;
    if (p > 0.50) {
      return { opacity: 0, height: 0 };
    }
    const t = interpolate(p, [0, 0.35], [0, 1], Extrapolation.CLAMP);
    const fadeOut = interpolate(p, [0.35, 0.50], [1, 0], Extrapolation.CLAMP);
    const edgeHeight = t * 10;

    return {
      opacity: fadeOut,
      height: edgeHeight,
      top: -edgeHeight + 1,
    };
  });

  // Spine Face: Rotates smoothly around to left edge during Stage 2
  const spineStyle = useAnimatedStyle(() => {
    const p = pullProgress.value;

    let opacity = 1.0;
    let rotateY = 0;

    if (p <= 0.42) {
      opacity = 1.0;
      rotateY = 0;
    } else {
      const t = interpolate(p, [0.42, 0.88], [0, 1], Extrapolation.CLAMP);
      opacity = interpolate(t, [0, 0.65], [1, 0], Extrapolation.CLAMP);
      rotateY = interpolate(t, [0, 1], [0, -85]);
    }

    return {
      ...StyleSheet.absoluteFill,
      opacity,
      transform: [{ rotateY: `${rotateY}deg` }],
    };
  });

  // Front Cover Face: Swings smoothly into view during Stage 2
  const coverStyle = useAnimatedStyle(() => {
    const p = pullProgress.value;

    let opacity = 0;
    let rotateY = 85;

    if (p <= 0.42) {
      opacity = 0;
      rotateY = 85;
    } else {
      const t = interpolate(p, [0.42, 0.88], [0, 1], Extrapolation.CLAMP);
      opacity = interpolate(t, [0.08, 0.65], [0, 1], Extrapolation.CLAMP);
      rotateY = interpolate(t, [0, 1], [85, 0]);
    }

    return {
      ...StyleSheet.absoluteFill,
      opacity,
      transform: [{ rotateY: `${rotateY}deg` }],
    };
  });

  // Contact shadow on the shelf plank
  const plankContactShadowStyle = useAnimatedStyle(() => {
    const p = pullProgress.value;
    let translateY = origin.y + origin.height - 2;

    if (p <= 0.42) {
      const t1 = interpolate(p, [0, 0.42], [0, 1], Extrapolation.CLAMP);
      translateY = origin.y + origin.height - 2 + t1 * 24;
    } else {
      translateY = origin.y + origin.height + 22;
    }

    const opacity = interpolate(p, [0, 0.42, 0.58], [0.60, 0.75, 0], Extrapolation.CLAMP);
    const shadowW = origin.width + 12;

    return {
      position: 'absolute',
      left: origin.x - 6,
      top: 0,
      width: shadowW,
      height: 6,
      opacity,
      transform: [{ translateY }],
    };
  });

  return (
    <>
      {/* 0. FLOOR CONTACT SHADOW on Shelf Plank */}
      <Animated.View
        style={[styles.plankContactShadow, plankContactShadowStyle]}
        pointerEvents="none"
      />

      {/* THE 3D MOVING BOOK */}
      <Animated.View style={containerStyle} pointerEvents="none">
        {/* 3D TOP EDGE (Page block top & hardcover rim) */}
        <Animated.View
          style={[
            styles.bookTopEdge,
            { borderColor: album.color },
            topEdgeStyle,
          ]}
        >
          <View style={styles.topPagePaper} />
        </Animated.View>

        {/* 1. THE SPINE (Visible in shelf and during Stage 1 slide-out) */}
        <Animated.View
          style={[
            StyleSheet.absoluteFill,
            spineStyle,
          ]}
        >
          <BookSpineView album={album} width={origin.width} height={origin.height} />
        </Animated.View>

        {/* 2. THE FRONT COVER (Swings around to face user during Stage 2) */}
        <Animated.View
          style={[
            styles.coverFace,
            { backgroundColor: album.color },
            coverStyle,
          ]}
        >
          <View style={styles.coverHinge} />
          <View style={styles.coverInnerBorder} />

          {/* Framed Photographic Plate */}
          <View style={styles.coverImageFrame}>
            <FastImage
              source={{ uri: `https://picsum.photos/id/${album.id + 20}/400/600` }}
              style={styles.coverImage}
              resizeMode={FastImage.resizeMode.cover}
            />
          </View>

          {/* Cover Typography */}
          <View style={styles.titleContainer}>
            <Text style={styles.coverSubtitle}>{album.subtitle || 'SPECIAL EDITION'}</Text>
            <View style={styles.divider} />
            <Text style={styles.coverTitle}>{album.title}</Text>
            <Text style={styles.coverDate}>{album.date || '2024'}</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  // Natural Empty Gap on Shelf between neighbor books
  emptySlotContainer: {
    marginHorizontal: 1,
    position: 'relative',
    backgroundColor: 'rgba(22, 11, 5, 0.76)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  emptySlotInnerCavity: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  emptySlotShadowLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  emptySlotShadowRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  emptySlotPlankLine: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },

  // Shelf Plank Contact Shadow
  plankContactShadow: {
    backgroundColor: 'rgba(0, 0, 0, 0.70)',
    borderRadius: 3,
    shadowColor: '#000',
    shadowOpacity: 0.85,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },

  // 3D Top Edge
  bookTopEdge: {
    position: 'absolute',
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    backgroundColor: '#ECE5D8',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
    overflow: 'hidden',
  },
  topPagePaper: {
    ...StyleSheet.absoluteFill,
    margin: 1.5,
    backgroundColor: '#F7F3EB',
  },

  // Photorealistic Spine Base
  spineInnerBase: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 3,
    overflow: 'hidden',
    position: 'relative',
  },

  // Headband cloth trims
  spineTopHeadband: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
  },
  spineBottomFootband: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: 'rgba(0, 0, 0, 0.26)',
  },

  // 3D Embossed Ribs (Top & Bottom)
  spineRibTop: {
    position: 'absolute',
    top: 11,
    left: 0,
    right: 0,
    height: 2.5,
  },
  spineRibBottom: {
    position: 'absolute',
    bottom: 11,
    left: 0,
    right: 0,
    height: 2.5,
  },
  spineRibHighlight: {
    height: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
  },
  spineRibShadow: {
    height: 1.3,
    backgroundColor: 'rgba(0, 0, 0, 0.22)',
  },

  // Cylindrical 3D Lighting & Grooves
  spineLeftHighlight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 1.5,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
  },
  spineLeftShine: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 3,
    width: 3.5,
    backgroundColor: 'rgba(255, 255, 255, 0.10)',
  },
  spineRightGroove: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 1.8,
    backgroundColor: 'rgba(0, 0, 0, 0.36)',
  },
  spineRightShadow: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 1.8,
    width: 4.5,
    backgroundColor: 'rgba(0, 0, 0, 0.18)',
  },

  // Bounded Clear Zone for Typography (NEVER clips, NEVER overlaps ribs)
  spineTitleArea: {
    position: 'absolute',
    top: 14,
    bottom: 14,
    left: 0,
    right: 0,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  spineTitleRotatedBox: {
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ rotate: '90deg' }],
  },
  spineTitleText: {
    textAlign: 'center',
    fontWeight: '700',
  },

  // 3D Front Cover Face
  coverFace: {
    borderRadius: 4,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  coverHinge: {
    position: 'absolute',
    left: 14,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: 'rgba(0,0,0,0.06)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  coverInnerBorder: {
    ...StyleSheet.absoluteFill,
    margin: 10,
    marginLeft: 22,
    borderWidth: 1,
    borderColor: 'rgba(58, 51, 43, 0.16)',
    borderRadius: 2,
  },
  coverImageFrame: {
    width: '75%',
    height: '45%',
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 1,
  },
  titleContainer: {
    alignItems: 'center',
    paddingLeft: 4,
  },
  coverSubtitle: {
    fontSize: 10,
    fontWeight: '400',
    color: '#6B6054',
    letterSpacing: 3,
    marginBottom: 8,
    textAlign: 'center',
  },
  divider: {
    width: 24,
    height: 1,
    backgroundColor: 'rgba(58, 51, 43, 0.2)',
    marginBottom: 12,
  },
  coverTitle: {
    fontSize: 18,
    fontWeight: '500',
    color: '#3A332B',
    letterSpacing: 3,
    marginBottom: 6,
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 1,
  },
  coverDate: {
    fontSize: 11,
    fontWeight: '400',
    color: 'rgba(58, 51, 43, 0.6)',
    letterSpacing: 2,
    textAlign: 'center',
  },
});

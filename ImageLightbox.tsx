import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
  runOnJS,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { X, ZoomIn } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface ImagePreviewData {
  uri: string;
  highResUri: string;
  title: string;
  subtitle?: string;
  aspectRatio: number;
}

export interface ImageLightboxProps {
  image: ImagePreviewData | null;
  onClose: () => void;
}

const SPRING_CONFIG = {
  damping: 26,
  stiffness: 240,
  mass: 0.8,
};

export default function ImageLightbox({ image, onClose }: ImageLightboxProps) {
  const visible = image !== null;

  // Active image data kept during exit transition so image doesn't vanish while animating out
  const [activeImage, setActiveImage] = useState<ImagePreviewData | null>(image);

  // Reanimated shared values
  const baseOpacity = useSharedValue(0);
  const baseScale = useSharedValue(0.92);
  const baseTranslateY = useSharedValue(18);

  const zoomScale = useSharedValue(1);
  const panX = useSharedValue(0);
  const panY = useSharedValue(0);
  const panStartX = useSharedValue(0);
  const panStartY = useSharedValue(0);

  const dragY = useSharedValue(0);
  const dragX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  const dragStartX = useSharedValue(0);

  const highResOpacity = useSharedValue(0);

  useEffect(() => {
    if (visible && image) {
      setActiveImage(image);
      zoomScale.value = 1;
      panX.value = 0;
      panY.value = 0;
      dragY.value = 0;
      dragX.value = 0;
      highResOpacity.value = 0;

      // Ultra-smooth entrance
      baseOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.cubic) });
      baseScale.value = withSpring(1, SPRING_CONFIG);
      baseTranslateY.value = withSpring(0, SPRING_CONFIG);
    }
  }, [
    visible,
    image,
    baseOpacity,
    baseScale,
    baseTranslateY,
    zoomScale,
    panX,
    panY,
    dragY,
    dragX,
    highResOpacity,
  ]);

  const handleDismiss = () => {
    baseOpacity.value = withTiming(0, { duration: 180, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
    baseScale.value = withTiming(0.92, { duration: 180 });
    baseTranslateY.value = withTiming(16, { duration: 180 });
  };

  const backdropAnimatedStyle = useAnimatedStyle(() => {
    const dragDistance = Math.abs(dragY.value);
    const dragFade = interpolate(dragDistance, [0, 240], [1, 0.35], Extrapolation.CLAMP);
    return {
      opacity: baseOpacity.value * dragFade,
    };
  });

  const cardAnimatedStyle = useAnimatedStyle(() => {
    const isZoomed = zoomScale.value > 1.05;
    const dragDistance = Math.abs(dragY.value);
    const dragScale = isZoomed ? 1 : interpolate(dragDistance, [0, 320], [1, 0.84], Extrapolation.CLAMP);

    return {
      opacity: baseOpacity.value,
      transform: [
        { translateX: panX.value + (isZoomed ? 0 : dragX.value) },
        { translateY: baseTranslateY.value + (isZoomed ? panY.value : dragY.value) },
        { scale: baseScale.value * zoomScale.value * dragScale },
      ],
    };
  });

  const highResAnimatedStyle = useAnimatedStyle(() => {
    return {
      opacity: highResOpacity.value,
    };
  });

  // Double-tap on image card toggles 1.85x zoom smoothly
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .maxDuration(280)
    .onEnd(() => {
      if (zoomScale.value > 1.15) {
        zoomScale.value = withSpring(1, SPRING_CONFIG);
        panX.value = withSpring(0, SPRING_CONFIG);
        panY.value = withSpring(0, SPRING_CONFIG);
      } else {
        zoomScale.value = withSpring(1.85, SPRING_CONFIG);
      }
    });

  // Pan gesture: interactive drag-to-dismiss when at 1x, or 2D image pan when zoomed
  const panGesture = Gesture.Pan()
    .onBegin(() => {
      if (zoomScale.value > 1.05) {
        panStartX.value = panX.value;
        panStartY.value = panY.value;
      } else {
        dragStartX.value = dragX.value;
        dragStartY.value = dragY.value;
      }
    })
    .onUpdate((e) => {
      if (zoomScale.value > 1.05) {
        // Pan around photo with smooth damping
        panX.value = panStartX.value + e.translationX / zoomScale.value;
        panY.value = panStartY.value + e.translationY / zoomScale.value;
      } else {
        // Fluid interactive drag-to-dismiss
        dragY.value = dragStartY.value + e.translationY;
        dragX.value = dragStartX.value + e.translationX * 0.35;
      }
    })
    .onEnd((e) => {
      if (zoomScale.value > 1.05) {
        // Clamp pan so image doesn't fly out of view
        const maxPanX = (SCREEN_WIDTH * (zoomScale.value - 1)) / 2;
        const maxPanY = (SCREEN_HEIGHT * (zoomScale.value - 1)) / 2;

        if (Math.abs(panX.value) > maxPanX) {
          panX.value = withSpring(Math.sign(panX.value) * maxPanX, SPRING_CONFIG);
        }
        if (Math.abs(panY.value) > maxPanY) {
          panY.value = withSpring(Math.sign(panY.value) * maxPanY, SPRING_CONFIG);
        }
      } else {
        // Check if dragged far enough or flicked with velocity to dismiss
        const passedDistance = Math.abs(dragY.value) > 85;
        const passedVelocity = Math.abs(e.velocityY) > 550;

        if (passedDistance || passedVelocity) {
          const targetY = dragY.value >= 0 ? SCREEN_HEIGHT * 0.9 : -SCREEN_HEIGHT * 0.9;
          dragY.value = withTiming(targetY, { duration: 180, easing: Easing.out(Easing.quad) }, (finished) => {
            if (finished) {
              runOnJS(onClose)();
            }
          });
          baseOpacity.value = withTiming(0, { duration: 160 });
        } else {
          // Snap back to resting center position
          dragY.value = withSpring(0, SPRING_CONFIG);
          dragX.value = withSpring(0, SPRING_CONFIG);
        }
      }
    });

  const cardGestures = Gesture.Simultaneous(doubleTapGesture, panGesture);

  if (!visible && baseOpacity.value === 0) {
    return null;
  }

  const currentImage = image || activeImage;
  if (!currentImage) return null;

  // Compute card bounds preserving aspect ratio
  const maxCardWidth = Math.min(SCREEN_WIDTH - 32, 430);
  const maxCardHeight = SCREEN_HEIGHT * 0.66;
  const ratio = currentImage.aspectRatio || 1;

  let cardWidth = maxCardWidth;
  let cardHeight = cardWidth / ratio;

  if (cardHeight > maxCardHeight) {
    cardHeight = maxCardHeight;
    cardWidth = cardHeight * ratio;
  }

  return (
    <Animated.View style={[styles.overlay, backdropAnimatedStyle]} pointerEvents="box-none">
      {/* Dark warm obsidian backdrop */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleDismiss}>
        <View style={styles.backdropDim} />
      </Pressable>

      {/* Top Header Floating Bar */}
      <View style={styles.topHeader} pointerEvents="box-none">
        <View style={styles.infoBadge}>
          <Text style={styles.infoTitle} numberOfLines={1}>
            {currentImage.title}
          </Text>
          {currentImage.subtitle && (
            <Text style={styles.infoSubtitle} numberOfLines={1}>
              {currentImage.subtitle}
            </Text>
          )}
        </View>

        <TouchableOpacity
          style={styles.closeButton}
          activeOpacity={0.7}
          hitSlop={{ top: 16, bottom: 16, left: 16, right: 16 }}
          onPress={handleDismiss}
        >
          <X size={18} color="#FFFFFF" strokeWidth={2.5} />
        </TouchableOpacity>
      </View>

      {/* Central Large Photo Container */}
      <View style={styles.centerContainer} pointerEvents="box-none">
        <GestureDetector gesture={cardGestures}>
          <Animated.View
            style={[
              styles.cardContainer,
              { width: cardWidth, height: cardHeight },
              cardAnimatedStyle,
            ]}
          >
            {/* 1. Base Image: Renders from cache in 0ms (no loading wait!) */}
            <FastImage
              source={{
                uri: currentImage.uri,
                priority: FastImage.priority.high,
              }}
              style={styles.largeImage}
              resizeMode={FastImage.resizeMode.cover}
            />

            {/* 2. Ultra High-Res Layer: Dissolves seamlessly on top once downloaded */}
            {currentImage.highResUri !== currentImage.uri && (
              <Animated.View style={[StyleSheet.absoluteFill, highResAnimatedStyle]} pointerEvents="none">
                <FastImage
                  source={{
                    uri: currentImage.highResUri,
                    priority: FastImage.priority.high,
                  }}
                  style={styles.largeImage}
                  resizeMode={FastImage.resizeMode.cover}
                  onLoadEnd={() => {
                    highResOpacity.value = withTiming(1, { duration: 260 });
                  }}
                />
              </Animated.View>
            )}

            {/* Subtle photo frame border */}
            <View style={styles.cardBorderOverlay} pointerEvents="none" />
          </Animated.View>
        </GestureDetector>
      </View>

      {/* Bottom Hint Pill */}
      <View style={styles.bottomBar} pointerEvents="none">
        <View style={styles.hintPill}>
          <ZoomIn size={13} color="rgba(255, 255, 255, 0.75)" strokeWidth={2} style={{ marginRight: 6 }} />
          <Text style={styles.hintText}>
            Swipe down to close • Double-tap to zoom
          </Text>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 25000,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdropDim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(8, 5, 3, 0.92)',
  },
  topHeader: {
    position: 'absolute',
    top: 54,
    left: 20,
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 26000,
  },
  infoBadge: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    maxWidth: SCREEN_WIDTH - 90,
  },
  infoTitle: {
    color: '#FFF8F0',
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  infoSubtitle: {
    color: '#E0D5C1',
    fontSize: 11,
    fontWeight: '400',
    marginTop: 2,
    letterSpacing: 0.2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.25)',
    shadowColor: '#000',
    shadowOpacity: 0.4,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContainer: {
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#1A1412',
    shadowColor: '#000',
    shadowOpacity: 0.75,
    shadowRadius: 28,
    shadowOffset: { width: 0, height: 16 },
    elevation: 25,
  },
  largeImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#261D1A',
  },
  cardBorderOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 38,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  hintPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  hintText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 11,
    fontWeight: '500',
    letterSpacing: 0.3,
  },
});

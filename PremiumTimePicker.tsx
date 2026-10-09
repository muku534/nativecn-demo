import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Pressable,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  interpolate,
  Extrapolation,
  useAnimatedScrollHandler,
  useDerivedValue,
  runOnJS,
  scrollTo,
  useAnimatedRef,
} from 'react-native-reanimated';

// ─── DATA GENERATION ────────────────────────────────────────────────────────

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;

const TIMES = Array.from({ length: 48 }, (_, i) => {
  const totalMinutes = i * 30;
  const h24 = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const h12 = h24 === 0 ? 12 : h24 > 12 ? h24 - 12 : h24;
  const ampm = h24 < 12 ? 'am' : 'pm';
  return {
    id: `time-${i}`,
    label: `${h12}:${m === 0 ? '00' : m} ${ampm}`,
    index: i,
  };
});

// ─── ICONS ──────────────────────────────────────────────────────────────────

function ClockIcon({ color, size = 18 }: { color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: 1.5,
        borderColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <View
        style={{
          width: 1.5,
          height: size * 0.25,
          backgroundColor: color,
          position: 'absolute',
          top: size * 0.15,
          borderRadius: 1,
        }}
      />
      <View
        style={{
          width: size * 0.2,
          height: 1.5,
          backgroundColor: color,
          position: 'absolute',
          top: size * 0.4,
          left: size * 0.4,
          borderRadius: 1,
        }}
      />
    </View>
  );
}

// ─── MAIN COMPONENT ─────────────────────────────────────────────────────────

export interface PremiumTimePickerProps {
  isDarkMode?: boolean;
  initialIndex?: number;
  onTimeChange?: (timeLabel: string) => void;
}

export default function PremiumTimePicker({
  isDarkMode = true,
  initialIndex = 38, // Default 7:00 pm (38 * 30 = 1140 mins = 19:00)
  onTimeChange,
}: PremiumTimePickerProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedLabel, setSelectedLabel] = useState(TIMES[initialIndex].label);

  const expandAnim = useSharedValue(0);
  const scrollY = useSharedValue(initialIndex * ITEM_HEIGHT);
  const scrollViewRef = useAnimatedRef<Animated.ScrollView>();

  const bgPrimary = isDarkMode ? '#1C1C1E' : '#FFFFFF';
  const bgSecondary = isDarkMode ? '#2C2C2E' : '#F2F2F7';
  const textPrimary = isDarkMode ? '#FFFFFF' : '#000000';
  const textSecondary = isDarkMode ? '#8E8E93' : '#8E8E93';
  const accentColor = '#0A84FF';

  // Toggle Expansion
  const toggleExpand = useCallback(() => {
    setIsExpanded((prev) => {
      const next = !prev;
      expandAnim.value = withSpring(next ? 1 : 0, {
        damping: 24,
        stiffness: 250,
      });
      return next;
    });
  }, [expandAnim]);

  // Scroll Handler
  const onScroll = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
    onMomentumEnd: (event) => {
      const activeIdx = Math.round(event.contentOffset.y / ITEM_HEIGHT);
      if (TIMES[activeIdx]) {
        runOnJS(setSelectedLabel)(TIMES[activeIdx].label);
        if (onTimeChange) {
          runOnJS(onTimeChange)(TIMES[activeIdx].label);
        }
      }
    },
  });

  // Effect to set initial scroll position after a tiny delay to ensure layout
  useEffect(() => {
    setTimeout(() => {
      if (scrollViewRef.current) {
        scrollViewRef.current.scrollTo({
          y: initialIndex * ITEM_HEIGHT,
          animated: false,
        });
      }
    }, 100);
  }, []);

  // Container Animation
  const containerStyle = useAnimatedStyle(() => {
    return {
      height: interpolate(
        expandAnim.value,
        [0, 1],
        [64, 380], // 64 collapsed, 380 expanded
        Extrapolation.CLAMP
      ),
      backgroundColor: bgPrimary,
    };
  });

  const expandedContentStyle = useAnimatedStyle(() => {
    return {
      opacity: expandAnim.value,
      pointerEvents: expandAnim.value > 0.5 ? 'auto' : 'none',
      transform: [
        {
          translateY: interpolate(
            expandAnim.value,
            [0, 1],
            [-20, 0],
            Extrapolation.CLAMP
          ),
        },
      ],
    };
  });

  // Derived values for the analog clock
  const activeIndexContinuous = useDerivedValue(() => scrollY.value / ITEM_HEIGHT);

  const hourHandStyle = useAnimatedStyle(() => {
    const timeInMinutes = activeIndexContinuous.value * 30;
    const hour = (timeInMinutes / 60) % 12;
    const rotation = hour * 30; // 360 / 12 = 30 deg per hour
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  const minuteHandStyle = useAnimatedStyle(() => {
    const timeInMinutes = activeIndexContinuous.value * 30;
    const minute = timeInMinutes % 60;
    const rotation = minute * 6; // 360 / 60 = 6 deg per minute
    return {
      transform: [{ rotate: `${rotation}deg` }],
    };
  });

  return (
    <Animated.View style={[styles.container, containerStyle]}>
      {/* HEADER (Always visible) */}
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={toggleExpand}
        style={styles.header}
      >
        <View style={styles.headerLeft}>
          <ClockIcon color={textSecondary} size={20} />
          <Text style={[styles.headerTitle, { color: textSecondary }]}>Time</Text>
        </View>
        <Text style={[styles.headerValue, { color: textPrimary }]}>
          {selectedLabel}
        </Text>
      </TouchableOpacity>

      {/* EXPANDED CONTENT */}
      <Animated.View style={[styles.expandedContent, expandedContentStyle]}>
        {/* SEGMENTED CONTROL (Visual only for single time) */}
        <View style={[styles.segmentedControl, { backgroundColor: bgSecondary }]}>
          <View style={[styles.segment, { backgroundColor: bgPrimary }]}>
            <View style={[styles.segmentDot, { backgroundColor: accentColor }]} />
            <Text style={[styles.segmentText, { color: textPrimary }]}>
              Single time
            </Text>
          </View>
          <View style={styles.segment}>
            <Text style={[styles.segmentText, { color: textSecondary }]}>
              Time range
            </Text>
          </View>
        </View>

        <View style={styles.mainRow}>
          {/* LEFT: ANALOG CLOCK */}
          <View style={styles.clockContainer}>
            <View style={[styles.clockFace, { backgroundColor: bgSecondary }]}>
              {/* Clock Ticks */}
              {Array.from({ length: 12 }).map((_, i) => (
                <View
                  key={i}
                  style={[
                    styles.clockTickWrapper,
                    { transform: [{ rotate: `${i * 30}deg` }] },
                  ]}
                >
                  <View style={[styles.clockTick, { backgroundColor: textSecondary }]} />
                </View>
              ))}

              {/* Hour Hand */}
              <Animated.View style={[styles.handWrapper, hourHandStyle]}>
                <View style={[styles.hourHand, { backgroundColor: textPrimary }]} />
              </Animated.View>

              {/* Minute Hand */}
              <Animated.View style={[styles.handWrapper, minuteHandStyle]}>
                <View style={[styles.minuteHand, { backgroundColor: accentColor }]} />
                {/* Dot at the end of the minute hand */}
                <View style={[styles.minuteDot, { backgroundColor: accentColor }]} />
              </Animated.View>

              {/* Center Dot */}
              <View style={[styles.centerDot, { backgroundColor: textPrimary }]} />
            </View>
          </View>

          {/* RIGHT: TIME LIST */}
          <View style={styles.listContainer}>
            <Animated.ScrollView
              ref={scrollViewRef}
              onScroll={onScroll}
              scrollEventThrottle={16}
              showsVerticalScrollIndicator={false}
              snapToInterval={ITEM_HEIGHT}
              decelerationRate="fast"
              contentContainerStyle={{
                paddingTop: ITEM_HEIGHT * 2,
                paddingBottom: ITEM_HEIGHT * 2,
              }}
            >
              {TIMES.map((item, i) => {
                const itemStyle = useAnimatedStyle(() => {
                  const distance = Math.abs(activeIndexContinuous.value - i);
                  const scale = interpolate(
                    distance,
                    [0, 1, 2],
                    [1.1, 0.9, 0.8],
                    Extrapolation.CLAMP
                  );
                  const opacity = interpolate(
                    distance,
                    [0, 1, 2],
                    [1, 0.5, 0.2],
                    Extrapolation.CLAMP
                  );
                  return {
                    transform: [{ scale }],
                    opacity,
                  };
                });

                return (
                  <Animated.View
                    key={item.id}
                    style={[styles.timeItem, itemStyle]}
                  >
                    <Text style={[styles.timeText, { color: textPrimary }]}>
                      {item.label}
                    </Text>
                  </Animated.View>
                );
              })}
            </Animated.ScrollView>
          </View>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

// ─── STYLES ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    width: '100%',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
      },
      android: {
        elevation: 10,
      },
    }),
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    zIndex: 10,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '500',
    marginLeft: 10,
  },
  headerValue: {
    fontSize: 17,
    fontWeight: '600',
  },
  expandedContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  segmentedControl: {
    flexDirection: 'row',
    height: 40,
    borderRadius: 20,
    padding: 3,
    marginBottom: 24,
  },
  segment: {
    flex: 1,
    borderRadius: 17,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '600',
  },
  mainRow: {
    flexDirection: 'row',
    flex: 1,
  },
  clockContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clockFace: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  clockTickWrapper: {
    position: 'absolute',
    width: 140,
    height: 140,
    alignItems: 'center',
    paddingTop: 8,
  },
  clockTick: {
    width: 2,
    height: 6,
    borderRadius: 1,
    opacity: 0.3,
  },
  handWrapper: {
    position: 'absolute',
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hourHand: {
    width: 4,
    height: 35,
    borderRadius: 2,
    position: 'absolute',
    top: 35,
  },
  minuteHand: {
    width: 2.5,
    height: 50,
    borderRadius: 1.5,
    position: 'absolute',
    top: 20,
  },
  minuteDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: 16,
  },
  centerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    position: 'absolute',
  },
  listContainer: {
    width: 130,
    height: 220, // 5 items * 44 height = 220
    alignItems: 'center',
    position: 'relative',
  },
  timeItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 18,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
});

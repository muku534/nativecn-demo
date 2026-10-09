import React, { useState } from 'react';
import { View, StyleSheet, Dimensions, Text, TextInput, Platform } from 'react-native';
import {
  Gesture,
  GestureDetector,
} from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  useDerivedValue,
  interpolate,
  Extrapolation,
  Easing,
} from 'react-native-reanimated';
import {
  Canvas,
  Path,
  Skia,
  Group,
  Shadow,
  Circle,
  RadialGradient,
  LinearGradient,
  vec,
  PathOp,
  FillType,
} from '@shopify/react-native-skia';

const { width } = Dimensions.get('window');

const NOTE_WIDTH = width * 0.75;
const NOTE_HEIGHT = NOTE_WIDTH * 1.05;
const TEAR_THRESHOLD = 35;
const PIN_Y = 35;

const BASE_NOTES = [
  {
    color: '#BDD0F6', // Blue
    headerColor: '#AABCE2',
    category: 'DESIGN',
    timeLabel: 'in 4h 15m',
    title: 'Review mockups\nwith Sarah\nat 2:00pm',
    linkText: 'Join Design Sync ↗',
    linkSub: 'meet.google.com/abc-xyz',
  },
  {
    color: '#F4BCA9', // Peach
    headerColor: '#E2AB99',
    category: 'DEVELOPMENT',
    timeLabel: 'in 2h 30m',
    title: 'Code pairing\non animations\nat 4:15pm',
    linkText: 'Join Pairing Session ↗',
    linkSub: 'github.com/codespaces/xyz',
  },
  {
    color: '#C7F2A4', // Green
    headerColor: '#B4E091',
    category: 'LAUNCH',
    timeLabel: 'in 1h 10m',
    title: 'Final testing\nfor V1 release\nat 10:00am',
    linkText: 'View Checklist ↗',
    linkSub: 'linear.app/project/launch',
  },
];

const NOTES_DATA = Array.from({ length: 15 }).map((_, i) => {
  const base = BASE_NOTES[i % 3];
  return {
    ...base,
    id: i + 1,
    rotation: (Math.random() - 0.5) * 8, // Random rotation between -4 and 4
  };
});

interface StickyNoteProps {
  note: typeof NOTES_DATA[0];
  onTear: (id: number) => void;
  index: number;
  isTop: boolean;
}

const InteractiveNote: React.FC<StickyNoteProps> = ({ note, onTear, index, isTop }) => {
  const [noteText, setNoteText] = useState(note.title);
  const [categoryText, setCategoryText] = useState(`[ ${note.category} ]`);
  const [timeLabelText, setTimeLabelText] = useState(note.timeLabel.toUpperCase());
  const [linkText, setLinkText] = useState(note.linkText);
  const [linkSubText, setLinkSubText] = useState(note.linkSub);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const isTorn = useSharedValue(false);
  const isDragging = useSharedValue(false);

  // Freeze the tear angle when the paper snaps
  const frozenDx = useSharedValue(0);
  const frozenDy = useSharedValue(-1);

  const scale = useSharedValue(1);
  const fallRotate = useSharedValue(0);

  const gesture = Gesture.Pan()
    .enabled(isTop || isTorn.value)
    .onBegin(() => {
      isDragging.value = true;
      scale.value = withSpring(1.02, { damping: 15, stiffness: 200 });
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
      if (!isTorn.value) {
        translateY.value = Math.max(-10, e.translationY);
        frozenDx.value = -e.translationX;
        frozenDy.value = -e.translationY;
      } else {
        translateY.value = e.translationY;
      }

      if (!isTorn.value && e.translationY > TEAR_THRESHOLD) {
        isTorn.value = true;
        runOnJS(onTear)(note.id);
      }
    })
    .onEnd((e) => {
      isDragging.value = false;
      if (!isTorn.value) {
        if (translateY.value > 15 || Math.abs(translateX.value) > 15) {
          isTorn.value = true;
          runOnJS(onTear)(note.id);
          translateY.value = withTiming(800, { duration: 700, easing: Easing.in(Easing.poly(3)) });
          translateX.value = withTiming(e.translationX + (e.translationX > 0 ? 50 : -50), { duration: 700 });
          scale.value = withTiming(0.85, { duration: 700 });
          fallRotate.value = withTiming((e.translationX > 0 ? 1 : -1) * 15, { duration: 700 });
        } else {
          translateX.value = withSpring(0, { damping: 14, stiffness: 120 });
          translateY.value = withSpring(0, { damping: 14, stiffness: 120 });
          scale.value = withSpring(1, { damping: 15, stiffness: 200 });
        }
      } else {
        translateX.value = withTiming(e.translationX + e.velocityX * 0.2, { duration: 400 });
        translateY.value = withTiming(e.translationY + e.velocityY * 0.2, { duration: 400 });
        scale.value = withTiming(0.85, { duration: 700 });
        fallRotate.value = withTiming((e.translationX > 0 ? 1 : -1) * 15, { duration: 700 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const rotateZ = isTorn.value ? fallRotate.value : (isDragging.value ? translateX.value * 0.015 : 0);
    return {
      position: 'absolute',
      width: NOTE_WIDTH,
      height: NOTE_HEIGHT,
      transform: [
        { translateX: translateX.value },
        { translateY: translateY.value },
        { rotate: `${note.rotation + rotateZ}deg` },
        { scale: scale.value }
      ],
      zIndex: (isTorn.value || isDragging.value) ? 100 : index,
    };
  });

  const path = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    const cx = NOTE_WIDTH / 2;
    
    p.addRect(Skia.XYWHRect(0, 0, NOTE_WIDTH, NOTE_HEIGHT));

    let dx = isTorn.value ? frozenDx.value : -translateX.value;
    let dy = isTorn.value ? frozenDy.value : -translateY.value;

    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0.1 || isTorn.value) {
      const safeDist = Math.max(dist, 1);
      const dirX = dx / safeDist;
      const dirY = dy / safeDist;
      
      let tBorder = 1000;
      if (dirX < -0.001) tBorder = Math.min(tBorder, -cx / dirX);
      else if (dirX > 0.001) tBorder = Math.min(tBorder, (NOTE_WIDTH - cx) / dirX);
      
      if (dirY < -0.001) tBorder = Math.min(tBorder, -PIN_Y / dirY);
      else if (dirY > 0.001) tBorder = Math.min(tBorder, (NOTE_HEIGHT - PIN_Y) / dirY);
      
      const effectiveDist = isTorn.value ? tBorder : Math.min(dist, tBorder); 
      
      const normX = -dirY;
      const normY = dirX;
      const tearWidth = Math.min(safeDist * 0.4, 18);
      
      const tipX = cx + dirX * effectiveDist;
      const tipY = PIN_Y + dirY * effectiveDist;

      p.moveTo(tipX, tipY);
      
      const steps = 14;
      for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const px = tipX - dirX * effectiveDist * t;
          const py = tipY - dirY * effectiveDist * t;
          const rand = Math.abs(Math.sin(i * 12.9898)) * 0.7 + 0.3; 
          const w = tearWidth * t * rand; 
          p.lineTo(px - normX * w, py - normY * w);
      }
      
      p.lineTo(cx - dirX * 3, PIN_Y - dirY * 3);
      
      for (let i = steps - 1; i >= 1; i--) {
          const t = i / steps;
          const px = tipX - dirX * effectiveDist * t;
          const py = tipY - dirY * effectiveDist * t;
          const rand = Math.abs(Math.sin(i * 78.233)) * 0.7 + 0.3;
          const w = tearWidth * t * rand;
          p.lineTo(px + normX * w, py + normY * w);
      }
      p.close();
    }
    return p.detach();
  });

  const headerPath = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    if (path.value) {
      p.addPath(path.value);
    }
    const rect = Skia.PathBuilder.Make();
    rect.addRect(Skia.XYWHRect(-100, -200, NOTE_WIDTH + 200, 255));
    
    const result = Skia.Path.MakeFromOp(p.detach(), rect.detach(), PathOp.Intersect);
    return result || Skia.Path.Make();
  });

  const slitHighlightPath = useDerivedValue(() => {
    const p = Skia.PathBuilder.Make();
    const cx = NOTE_WIDTH / 2;
    
    let dx = isTorn.value ? frozenDx.value : -translateX.value;
    let dy = isTorn.value ? frozenDy.value : -translateY.value;

    const dist = Math.sqrt(dx*dx + dy*dy);
    if (dist > 0.1 || isTorn.value) {
      const safeDist = Math.max(dist, 1);
      const dirX = dx / safeDist;
      const dirY = dy / safeDist;
      
      let tBorder = 1000;
      if (dirX < -0.001) tBorder = Math.min(tBorder, -cx / dirX);
      else if (dirX > 0.001) tBorder = Math.min(tBorder, (NOTE_WIDTH - cx) / dirX);
      if (dirY < -0.001) tBorder = Math.min(tBorder, -PIN_Y / dirY);
      else if (dirY > 0.001) tBorder = Math.min(tBorder, (NOTE_HEIGHT - PIN_Y) / dirY);
      
      const effectiveDist = isTorn.value ? tBorder : Math.min(dist, tBorder); 
      
      const normX = -dirY;
      const normY = dirX;
      const tearWidth = Math.min(safeDist * 0.4, 18);
      
      const tipX = cx + dirX * effectiveDist;
      const tipY = PIN_Y + dirY * effectiveDist;

      p.moveTo(tipX, tipY);
      const steps = 14;
      for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const px = tipX - dirX * effectiveDist * t;
          const py = tipY - dirY * effectiveDist * t;
          const rand = Math.abs(Math.sin(i * 12.9898)) * 0.7 + 0.3;
          const w = tearWidth * t * rand; 
          p.lineTo(px - normX * w, py - normY * w);
      }
      p.lineTo(cx - dirX * 3, PIN_Y - dirY * 3);
      for (let i = steps - 1; i >= 1; i--) {
          const t = i / steps;
          const px = tipX - dirX * effectiveDist * t;
          const py = tipY - dirY * effectiveDist * t;
          const rand = Math.abs(Math.sin(i * 78.233)) * 0.7 + 0.3;
          const w = tearWidth * t * rand;
          p.lineTo(px + normX * w, py + normY * w);
      }
      p.close();
    }
    return p.detach();
  });

  const shadowBlur = useDerivedValue(() => isDragging.value ? 25 : 8);
  const shadowDy = useDerivedValue(() => isDragging.value ? 15 : 3);
  const shadowOpacity = useDerivedValue(() => isDragging.value ? 0.2 : 0.1);

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View style={animatedStyle}>
        <Canvas style={{ width: NOTE_WIDTH, height: NOTE_HEIGHT + 100, top: -50, left: 0, position: 'absolute' }} pointerEvents="none">
          <Group transform={[{ translateY: 50 }]}>
            <Path path={path} color={note.color}>
              <Shadow dx={0} dy={shadowDy} blur={shadowBlur} color="rgba(0,0,0,0.15)" />
              <Shadow dx={0} dy={2} blur={2} color="rgba(0,0,0,0.06)" />
            </Path>

            <Path path={path}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(NOTE_WIDTH, NOTE_HEIGHT)}
                colors={['rgba(255,255,255,0.4)', 'rgba(255,255,255,0.0)', 'rgba(0,0,0,0.04)']}
              />
            </Path>
            
            <Path path={headerPath} color={note.headerColor} />

            {!isTorn.value && (
              <Circle cx={NOTE_WIDTH / 2} cy={PIN_Y} r={5} color="rgba(0,0,0,0.25)" />
            )}
            
            {isTorn.value && (
              <>
                <Path path={slitHighlightPath} color="rgba(0,0,0,0.08)" style="stroke" strokeWidth={3} />
                <Path path={slitHighlightPath} color="rgba(255,255,255,0.9)" style="stroke" strokeWidth={1} />
              </>
            )}
          </Group>
        </Canvas>

        <View style={styles.noteContentContainer} pointerEvents="box-none">
          <View style={styles.stationeryHeader}>
            <TextInput 
              style={styles.stationeryCategory}
              value={categoryText}
              onChangeText={setCategoryText}
              spellCheck={false}
              autoCorrect={false}
            />
            <TextInput 
              style={styles.stationeryTime}
              value={timeLabelText}
              onChangeText={setTimeLabelText}
              spellCheck={false}
              autoCorrect={false}
            />
          </View>
          <View style={styles.headerDivider} />
          
          <View style={styles.mainContent}>
            <TextInput 
              style={styles.titleInput} 
              value={noteText}
              onChangeText={setNoteText}
              multiline
              spellCheck={false}
              autoCorrect={false}
              placeholder="Write a note..."
              placeholderTextColor="rgba(0,0,0,0.3)"
            />
          </View>

          <View style={styles.footer}>
            <TextInput 
              style={styles.footerLinkText}
              value={linkText}
              onChangeText={setLinkText}
              spellCheck={false}
              autoCorrect={false}
            />
            <TextInput 
              style={styles.footerSubText}
              value={linkSubText}
              onChangeText={setLinkSubText}
              spellCheck={false}
              autoCorrect={false}
            />
          </View>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

const PushPin = () => {
  return (
    <View style={styles.pinContainer} pointerEvents="none">
      <Canvas style={{ width: 40, height: 40 }}>
        <Circle cx={20} cy={28} r={6} color="rgba(0,0,0,0.25)">
           <Shadow dx={0} dy={4} blur={6} color="rgba(0,0,0,0.3)" />
        </Circle>
        <Path path="M 19 22 L 21 22 L 20 30 Z" color="#333" />
        <Path path="M 16 16 L 24 16 L 22 22 L 18 22 Z" color="#1A1A1A" />
        <Circle cx={20} cy={12} r={8} color="#111">
          <RadialGradient 
            c={vec(17, 9)} 
            r={6} 
            colors={['#888', '#222', '#050505']} 
          />
        </Circle>
        <Circle cx={16.5} cy={8.5} r={1.5} color="rgba(255,255,255,0.8)" />
      </Canvas>
    </View>
  );
};

export default function StickyNotesBundle() {
  const [notes, setNotes] = useState([...NOTES_DATA].reverse());
  const [topNoteId, setTopNoteId] = useState(notes[notes.length - 1].id);

  const handleTear = (id: number) => {
    setNotes((prev) => {
      const index = prev.findIndex((n) => n.id === id);
      if (index > 0) {
        setTopNoteId(prev[index - 1].id);
      } else {
        setTopNoteId(-1);
      }
      return prev;
    });
  };

  return (
    <View style={styles.bundleContainer}>
      <View style={[styles.stackBase, { zIndex: 1 }]}>
        {notes.map((note, index) => {
          const isTop = note.id === topNoteId;
          return (
            <View 
              key={note.id} 
              style={[styles.noteWrapper, { zIndex: index }]}
              pointerEvents="box-none"
            >
              <InteractiveNote 
                note={note}
                index={index}
                isTop={isTop}
                onTear={handleTear} 
              />
            </View>
          );
        })}
      </View>
      
      {topNoteId !== -1 && <PushPin />}
    </View>
  );
}

const styles = StyleSheet.create({
  bundleContainer: {
    width: NOTE_WIDTH,
    height: NOTE_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackBase: {
    width: NOTE_WIDTH,
    height: NOTE_HEIGHT,
    position: 'relative',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
  },
  noteWrapper: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: NOTE_WIDTH,
    height: NOTE_HEIGHT,
  },
  pinContainer: {
    position: 'absolute',
    top: -4, 
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  noteContentContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: NOTE_WIDTH,
    height: NOTE_HEIGHT,
    padding: 24,
    justifyContent: 'space-between',
  },
  stationeryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 8,
    marginTop: 6,
  },
  stationeryCategory: {
    fontFamily: 'Courier',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 2,
    color: 'rgba(0,0,0,0.6)',
  },
  stationeryTime: {
    fontFamily: 'Courier',
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 1,
    color: 'rgba(0,0,0,0.4)',
  },
  headerDivider: {
    height: 1,
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.1)',
    marginBottom: 10,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    paddingLeft: 4,
  },
  titleText: {
    fontFamily: 'Palatino',
    fontSize: 28,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.85)',
    lineHeight: 34,
  },
  titleInput: {
    fontFamily: Platform.select({ ios: 'Bradley Hand', android: 'cursive', default: 'System' }),
    fontSize: 32,
    color: '#1a1a24',
    lineHeight: 38,
    flex: 1,
    textAlignVertical: 'top',
    padding: 0,
    margin: 0,
  },
  footer: {
    borderTopWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
    paddingTop: 12,
    paddingBottom: 8,
  },
  footerLinkText: {
    fontFamily: 'Courier',
    fontSize: 11,
    fontWeight: '700',
    color: 'rgba(0,0,0,0.7)',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  footerSubText: {
    fontFamily: 'Courier',
    fontSize: 9,
    color: 'rgba(0,0,0,0.4)',
  },
});

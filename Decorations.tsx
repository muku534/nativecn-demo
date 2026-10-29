import React from 'react';
import { View, StyleSheet, Text } from 'react-native';

export const GhostLamp = () => (
  <View style={styles.ghostContainer}>
    <View style={styles.ghostBody}>
      <View style={styles.ghostEyeLeft} />
      <View style={styles.ghostEyeRight} />
    </View>
  </View>
);

export const CandleJar = () => (
  <View style={styles.candleContainer}>
    <View style={styles.candleWax} />
    <View style={styles.candleFlame} />
    <View style={styles.candleLabel}>
      <View style={{ width: 10, height: 1, backgroundColor: '#888', marginBottom: 2 }} />
      <View style={{ width: 14, height: 1, backgroundColor: '#888', marginBottom: 2 }} />
      <View style={{ width: 8, height: 1, backgroundColor: '#888' }} />
    </View>
  </View>
);

export const PottedPlant = () => (
  <View style={styles.pottedPlantContainer}>
    <Text style={{ fontSize: 50, marginBottom: -10 }}>🪴</Text>
  </View>
);

export const HangingPlant = () => (
  <View style={styles.hangingPlantContainer}>
    {Array.from({ length: 6 }).map((_, i) => (
      <Text 
        key={i} 
        style={[
          { position: 'absolute', fontSize: 28 }, 
          { 
            top: i * 22, 
            left: 8 + Math.sin(i) * 8,
            transform: [{ rotate: `${Math.sin(i) * 35 + 175}deg` }] 
          }
        ]} 
      >🌿</Text>
    ))}
  </View>
);

export const PhotoFrame = () => (
  <View style={styles.frameContainer}>
    <View style={styles.frameInner}>
      <View style={styles.framePhoto}>
        {/* Simple landscape shapes */}
        <View style={styles.mountain} />
        <View style={[styles.mountain, { left: -10, top: 10, borderBottomWidth: 30, opacity: 0.8 }]} />
      </View>
    </View>
  </View>
);

export const HorizontalBooks = () => (
  <View style={styles.horizontalBooksContainer}>
    <View style={[styles.hBook, { width: 80, backgroundColor: '#EAE1D0' }]} />
    <View style={[styles.hBook, { width: 85, backgroundColor: '#D4A373' }]} />
    <View style={[styles.hBook, { width: 90, backgroundColor: '#EAE1D0' }]} />
  </View>
);

export const PencilCup = () => (
  <View style={styles.pencilCupContainer}>
    {/* Pencils */}
    <View style={[styles.pencil, { left: 8, transform: [{ rotate: '-15deg' }] }]} />
    <View style={[styles.pencil, { left: 15, top: -2, transform: [{ rotate: '-5deg' }] }]} />
    <View style={[styles.pencil, { left: 22, top: -5, transform: [{ rotate: '5deg' }] }]} />
    <View style={[styles.pencil, { left: 28, transform: [{ rotate: '20deg' }] }]} />
    {/* Cup */}
    <View style={styles.cup}>
      <Text style={{ fontSize: 4, color: '#666', textAlign: 'center', marginTop: 15 }}>BETTER</Text>
      <Text style={{ fontSize: 4, color: '#666', textAlign: 'center' }}>IDEAS</Text>
    </View>
  </View>
);

export const VintageGlobe = () => (
  <View style={styles.globeContainer}>
    <View style={styles.globeBase} />
    <View style={styles.globeStand} />
    <View style={styles.globeArc} />
    <View style={styles.globeSphere}>
      <View style={styles.globeMap1} />
      <View style={styles.globeMap2} />
    </View>
  </View>
);

export const SmallVase = () => (
  <View style={styles.vaseContainer}>
    <Text style={{ position: 'absolute', top: -15, fontSize: 30 }}>🌿</Text>
    <View style={styles.vaseStem} />
    <View style={styles.vaseGlass} />
  </View>
);

const styles = StyleSheet.create({
  // Ghost
  ghostContainer: { shadowColor: '#FFD700', shadowOpacity: 0.8, shadowRadius: 16, shadowOffset: { width: 0, height: 0 }, elevation: 8, marginBottom: 2 },
  ghostBody: { width: 38, height: 42, backgroundColor: '#FFFDF9', borderTopLeftRadius: 21, borderTopRightRadius: 21, borderBottomLeftRadius: 8, borderBottomRightRadius: 8, justifyContent: 'center', alignItems: 'center' },
  ghostEyeLeft: { position: 'absolute', width: 3.5, height: 5, backgroundColor: '#333', borderRadius: 2, top: 16, left: 10 },
  ghostEyeRight: { position: 'absolute', width: 3.5, height: 5, backgroundColor: '#333', borderRadius: 2, top: 16, right: 10 },

  // Candle
  candleContainer: { width: 38, height: 46, backgroundColor: 'rgba(255, 255, 255, 0.45)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.7)', borderRadius: 6, justifyContent: 'flex-end', alignItems: 'center', overflow: 'hidden', shadowColor: '#FFD700', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 0 } },
  candleWax: { width: '100%', height: '50%', backgroundColor: '#FFF5E6', opacity: 0.9 },
  candleFlame: { position: 'absolute', top: 10, width: 5, height: 10, backgroundColor: '#FFA500', borderRadius: 2.5, opacity: 0.85 },
  candleLabel: { position: 'absolute', bottom: 8, width: 22, height: 13, backgroundColor: '#FFF', justifyContent: 'center', alignItems: 'center', borderRadius: 2 },

  // Potted Plant
  pottedPlantContainer: { width: 44, height: 58, alignItems: 'center', justifyContent: 'flex-end', marginBottom: 2 },
  leaf: { position: 'absolute', width: 14, height: 22, backgroundColor: '#2D5A27', borderTopLeftRadius: 14, borderBottomRightRadius: 14, borderBottomLeftRadius: 2, borderTopRightRadius: 2 },
  pot: { width: 32, height: 28, backgroundColor: '#EBEBEB', borderBottomLeftRadius: 6, borderBottomRightRadius: 6, borderTopWidth: 2, borderColor: '#D4D4D4', zIndex: 5 },

  // Hanging Plant
  hangingPlantContainer: { position: 'absolute', top: -6, left: 4, width: 48, height: 170, zIndex: 100 },
  hangingLeaf: { position: 'absolute', width: 18, height: 18, backgroundColor: '#3A5A40', borderRadius: 9, borderTopRightRadius: 2 },

  // Photo Frame
  frameContainer: { width: 48, height: 60, backgroundColor: '#7D4E27', padding: 3, justifyContent: 'center', alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.35, shadowRadius: 4, shadowOffset: { width: 2, height: 3 } },
  frameInner: { width: '100%', height: '100%', backgroundColor: '#FFF', padding: 3 },
  framePhoto: { width: '100%', height: '100%', backgroundColor: '#87CEEB', overflow: 'hidden' },
  mountain: { position: 'absolute', bottom: 0, width: 0, height: 0, borderLeftWidth: 20, borderRightWidth: 20, borderBottomWidth: 32, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderBottomColor: '#4A646C' },

  // Horizontal Books
  horizontalBooksContainer: { justifyContent: 'flex-end', alignItems: 'center', gap: 1.5, marginBottom: 2 },
  hBook: { height: 11, borderRadius: 2, borderLeftWidth: 2, borderLeftColor: 'rgba(255,255,255,0.3)', borderRightWidth: 3, borderRightColor: 'rgba(0,0,0,0.2)' },

  // Pencil Cup
  pencilCupContainer: { width: 34, height: 50, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 2 },
  pencil: { position: 'absolute', bottom: 25, width: 3.5, height: 28, backgroundColor: '#F4D03F', borderRadius: 1.5 },
  cup: { width: 30, height: 30, backgroundColor: '#F0EAD6', borderBottomLeftRadius: 4, borderBottomRightRadius: 4, borderTopWidth: 1, borderColor: '#CCC', zIndex: 5 },

  // Vintage Globe
  globeContainer: { width: 50, height: 68, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 2 },
  globeBase: { width: 22, height: 7, backgroundColor: '#4A2511', borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 2, borderBottomRightRadius: 2 },
  globeStand: { width: 3.5, height: 12, backgroundColor: '#B8860B' },
  globeArc: { position: 'absolute', top: 8, left: 9, width: 38, height: 38, borderRadius: 19, borderLeftWidth: 2.5, borderTopWidth: 2.5, borderColor: '#B8860B', transform: [{ rotate: '45deg' }] },
  globeSphere: { position: 'absolute', top: 10, left: 13, width: 32, height: 32, borderRadius: 16, backgroundColor: '#D2B48C', overflow: 'hidden' },
  globeMap1: { position: 'absolute', top: 4, left: 4, width: 16, height: 12, backgroundColor: '#8FBC8F', borderRadius: 8, transform: [{ rotate: '20deg' }] },
  globeMap2: { position: 'absolute', bottom: 4, right: -4, width: 20, height: 16, backgroundColor: '#8FBC8F', borderRadius: 8, transform: [{ rotate: '-10deg' }] },

  // Small Vase
  vaseContainer: { width: 26, height: 42, justifyContent: 'flex-end', alignItems: 'center', marginBottom: 2 },
  vaseStem: { position: 'absolute', bottom: 12, width: 2, height: 24, backgroundColor: '#2D5A27' },
  vaseGlass: { width: 18, height: 20, backgroundColor: 'rgba(200, 220, 255, 0.4)', borderRadius: 9, borderWidth: 1, borderColor: 'rgba(255,255,255,0.6)', overflow: 'hidden' },
});

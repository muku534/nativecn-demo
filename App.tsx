import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Modal, Dimensions, ScrollView, ActivityIndicator, Animated, Easing } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import PhotoAlbum from './PhotoAlbum';
import StickyNotesBundle from './StickyNotes';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALBUMS = [
  { id: 1, title: 'HOWARD BEACH', subtitle: 'A PHOTOGRAPHIC JOURNEY', date: 'SEPTEMBER 2026', imageId: 1018, color: '#34302D' },
  { id: 2, title: 'SUMMER VIBES', subtitle: 'BEACH & SUN', date: 'AUGUST 2026', imageId: 1040, color: '#A3998A' },
  { id: 3, title: 'MOUNTAIN PEAKS', subtitle: 'HIKING TRAILS', date: 'JULY 2026', imageId: 1036, color: '#665F54' },
  { id: 4, title: 'CITY LIGHTS', subtitle: 'URBAN EXPLORATION', date: 'JUNE 2026', imageId: 1043, color: '#2A2F2B' },
  { id: 5, title: 'DESERT SANDS', subtitle: 'SAFARI ADVENTURE', date: 'MAY 2026', imageId: 1047, color: '#8E7D6A' },
  { id: 6, title: 'OCEAN WAVES', subtitle: 'SURFING DIARIES', date: 'APRIL 2026', imageId: 1050, color: '#4E4841' },
];

const innerImages = [
  1015, 1036, 1037, 1038, 1039, 1040
];

export default function App() {
  const [selectedAlbum, setSelectedAlbum] = useState<typeof ALBUMS[0] | null>(null);
  const [isAlbumReady, setIsAlbumReady] = useState(false);
  const [modalAnim] = useState(new Animated.Value(0));
  const [pullingAlbumId, setPullingAlbumId] = useState<number | null>(null);
  const [pullAnim] = useState(new Animated.Value(0));

  const handleOpenAlbum = (album: typeof ALBUMS[0]) => {
    setPullingAlbumId(album.id);
    setSelectedAlbum(album);
    setIsAlbumReady(true);
    pullAnim.setValue(0);

    setTimeout(() => {
      Animated.sequence([
        Animated.timing(pullAnim, { toValue: 2, duration: 150, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(pullAnim, { toValue: 30, duration: 250, easing: Easing.in(Easing.cubic), useNativeDriver: true }),
        Animated.timing(pullAnim, { toValue: 80, duration: 300, easing: Easing.linear, useNativeDriver: true }),
        Animated.timing(pullAnim, { toValue: 102, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(pullAnim, { toValue: 100, duration: 150, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
      ]).start();
    }, 10);
  };

  const handleCloseAlbum = () => {
    Animated.sequence([
      Animated.timing(pullAnim, { toValue: 80, duration: 300, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      Animated.timing(pullAnim, { toValue: 20, duration: 350, easing: Easing.linear, useNativeDriver: true }),
      Animated.timing(pullAnim, { toValue: -2, duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(pullAnim, { toValue: 0, duration: 150, easing: Easing.inOut(Easing.quad), useNativeDriver: true })
    ]).start(() => {
      setSelectedAlbum(null);
      setIsAlbumReady(false);
      setPullingAlbumId(null);
    });
  };

  const generatePages = (album: typeof ALBUMS[0]) => {
    return [
      // Custom Cover Page
      <View key="cover" style={[styles.coverPage, { backgroundColor: album.color }]}>
        <View style={styles.coverHinge} />
        <View style={styles.coverInnerBorder} />
        <View style={styles.imageContainer}>
          <FastImage source={{ uri: `https://picsum.photos/id/${album.imageId}/400/600` }} style={styles.coverImage} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.coverSubtitle}>{album.subtitle}</Text>
          <View style={styles.divider} />
          <Text style={styles.coverTitle}>{album.title}</Text>
          <Text style={styles.coverDate}>{album.date}</Text>
        </View>
      </View>,

      // Inside Pages (Rich Premium Textbook Layouts)
      ...innerImages.map((id, index) => {
        const layoutType = index % 3;

        return (
          <View key={`page-${index}`} style={styles.photoBookPage}>
            {/* Layout 0: Full Bleed Single Image */}
            {layoutType === 0 && (
              <FastImage source={{ uri: `https://picsum.photos/id/${id}/600/800` }} style={styles.fullBleedImage} />
            )}

            {/* Layout 1: Split Stack (Two Horizontal Images) */}
            {layoutType === 1 && (
              <View style={styles.splitStack}>
                <FastImage source={{ uri: `https://picsum.photos/id/${id}/600/400` }} style={styles.halfImage} />
                <FastImage source={{ uri: `https://picsum.photos/id/${id + 10}/600/400` }} style={styles.halfImage} />
              </View>
            )}

            {/* Layout 2: Collage Grid (One Large, Two Small) */}
            {layoutType === 2 && (
              <View style={styles.collageGrid}>
                <FastImage source={{ uri: `https://picsum.photos/id/${id}/600/400` }} style={styles.collageLarge} />
                <View style={styles.collageRow}>
                  <FastImage source={{ uri: `https://picsum.photos/id/${id + 5}/300/300` }} style={styles.collageSmall} />
                  <FastImage source={{ uri: `https://picsum.photos/id/${id + 8}/300/300` }} style={styles.collageSmall} />
                </View>
              </View>
            )}

            {/* Minimalist Page Number */}
            <View style={styles.modernPageNumber}>
              <Text style={styles.modernPageText}>0{index + 1}</Text>
            </View>
          </View>
        );
      }),

      // Back Cover
      <View key="back-cover" style={[styles.backCover, { backgroundColor: album.color }]}>
        <View style={[styles.coverHinge, { left: undefined, right: 14 }]} />
        <Text style={styles.backCoverText}>FINIS</Text>
      </View>
    ];
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={[styles.container, { alignItems: 'center', justifyContent: 'center' }]}>
        {/* Realistic Built-In Bookshelf Matching Reference Image */}
        <View style={styles.bookshelfCabinet}>
          {/* Render exactly 4 physical shelves for albums */}
          {Array.from({ length: 4 }).map((_, rowIndex) => {
            // Put up to 3-4 albums on each shelf
            const shelfBooks = ALBUMS.slice(rowIndex * 4, (rowIndex + 1) * 4);

            return (
              <View key={`shelf-${rowIndex}`} style={styles.shelfContainer}>
                <View style={styles.booksRow}>
                  {shelfBooks.map((album) => {
                    const isPulling = pullingAlbumId === album.id;

                    return (
                      <TouchableOpacity
                        key={album.id}
                        activeOpacity={0.9}
                        onPress={() => !pullingAlbumId && handleOpenAlbum(album)}
                      >
                        <Animated.View style={[
                          styles.spineContainer,
                          { backgroundColor: album.color },
                          isPulling && {
                            zIndex: 999,
                            // Fades out instantly at exactly 80% when edge-on
                            opacity: pullAnim.interpolate({ inputRange: [0, 79.9, 80, 100], outputRange: [1, 1, 0, 0], extrapolate: 'clamp' }),
                            transform: [
                              { perspective: 1000 },
                              { rotateX: pullAnim.interpolate({ inputRange: [0, 5, 30, 80, 100], outputRange: ['0deg', '0deg', '-3deg', '-5deg', '-5deg'], extrapolate: 'clamp' }) },
                              { rotateZ: pullAnim.interpolate({ inputRange: [0, 10, 30, 80, 100], outputRange: ['0deg', '0deg', '2deg', '3deg', '3deg'], extrapolate: 'clamp' }) },
                              { translateY: pullAnim.interpolate({ inputRange: [0, 2, 30, 80, 100], outputRange: [0, -1, -15, -80, -100] }) },
                              { translateX: pullAnim.interpolate({ inputRange: [0, 30, 80, 100], outputRange: [0, -5, -40, -50] }) },
                              { scale: pullAnim.interpolate({ inputRange: [0, 30, 80, 100], outputRange: [1, 1.05, 1.5, 1.8], extrapolate: 'clamp' }) },
                              { rotateY: pullAnim.interpolate({ inputRange: [0, 50, 80, 100], outputRange: ['0deg', '0deg', '90deg', '180deg'] }) }
                            ]
                          }
                        ]}>
                          <Animated.View style={[styles.spineCurveShadow, {
                            opacity: pullAnim.interpolate({ inputRange: [0, 30, 80], outputRange: [1, 0.5, 0], extrapolate: 'clamp' })
                          }]} />

                          <View style={styles.spineTopDetail} />
                          <Text style={styles.spineSubtitle}>ALBUM</Text>

                          <View style={styles.spineCenterWrap}>
                            <Text style={styles.spineTitle} numberOfLines={1}>{album.title.toUpperCase()}</Text>
                          </View>

                          <View style={styles.spineBottomDetail} />
                        </Animated.View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                {/* The Thick Physical Shelf Plank */}
                <View style={styles.shelfPlank}>
                  <View style={styles.shelfPlankHighlight} />
                  <View style={styles.shelfPlankShadow} />
                </View>
              </View>
            );
          })}

          {/* Bottom Cabinet (matching the photo) */}
          <View style={styles.bottomCabinet}>
            <View style={styles.cabinetDoorLeft}>
              <View style={styles.cabinetKnobRight} />
            </View>
            <View style={styles.cabinetDoorRight}>
              <View style={styles.cabinetKnobLeft} />
            </View>
          </View>
        </View>

        {selectedAlbum && (
          <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} pointerEvents="box-none">
            {/* Subtle transparent background to maintain the shelf visibility while blocking touches */}
            <Animated.View style={[StyleSheet.absoluteFill, {
              backgroundColor: 'rgba(0,0,0,0.4)',
              opacity: pullAnim.interpolate({ inputRange: [0, 80, 100], outputRange: [0, 0.5, 1], extrapolate: 'clamp' })
            }]} />

            <Animated.View style={[styles.modalOverlay, { pointerEvents: 'box-none' }]}>
              {/* Close Button fixed - Opacity applied directly so it receives touches */}
              <Animated.View style={[styles.closeButton, { opacity: pullAnim.interpolate({ inputRange: [0, 80, 100], outputRange: [0, 0, 1], extrapolate: 'clamp' }) }]}>
                <TouchableOpacity style={{ width: 40, height: 40, alignItems: 'center', justifyContent: 'center' }} onPress={handleCloseAlbum}>
                  <Text style={styles.closeText}>✕</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* The 3D Book Cover Flips in during final phase */}
              <Animated.View style={[styles.modalContent, {
                opacity: pullAnim.interpolate({ inputRange: [0, 79.9, 80, 100], outputRange: [0.01, 0.01, 1, 1], extrapolate: 'clamp' }),
                // Dynamic realistic shadow that grows as the book comes out of the shelf
                shadowColor: '#000',
                shadowOpacity: pullAnim.interpolate({ inputRange: [80, 100], outputRange: [0.2, 0.5], extrapolate: 'clamp' }),
                shadowRadius: pullAnim.interpolate({ inputRange: [80, 100], outputRange: [10, 30], extrapolate: 'clamp' }),
                shadowOffset: { width: 0, height: 15 },
                transform: [
                  { perspective: 1000 },
                  { rotateX: pullAnim.interpolate({ inputRange: [0, 80, 100], outputRange: ['-5deg', '-5deg', '-8deg'] }) },
                  { rotateY: pullAnim.interpolate({ inputRange: [0, 50, 80, 100], outputRange: ['-180deg', '-180deg', '-90deg', '0deg'] }) },
                  { scale: pullAnim.interpolate({ inputRange: [0, 80, 100], outputRange: [0.8, 0.9, 1], extrapolate: 'clamp' }) }
                ]
              }]}>
                {isAlbumReady && <PhotoAlbum pages={generatePages(selectedAlbum)} />}
              </Animated.View>
            </Animated.View>
          </View>
        )}

        {/* Centered Sticky Notes Demo Widget */}
        <View style={{ position: 'absolute', top: 150, left: 60, zIndex: 9999 }} pointerEvents="box-none">
          <StickyNotesBundle />
        </View>
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F0E6',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3A332B',
    textAlign: 'center',
    marginVertical: 20,
    letterSpacing: 1,
  },
  bookshelfCabinet: {
    flex: 1,
    backgroundColor: '#A8A096',
    borderLeftWidth: 16,
    borderRightWidth: 16,
    borderTopWidth: 20,
    borderColor: '#C6BDB0',
  },
  shelfContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  booksRow: {
    flexDirection: 'row',
    paddingHorizontal: 25,
    alignItems: 'flex-end',
    justifyContent: 'flex-end',
    zIndex: 10,
    gap: 2,
  },
  shelfPlank: {
    width: '100%',
    height: 16,
    backgroundColor: '#C6BDB0',
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#B0A79A',
    zIndex: 5,
  },
  shelfPlankHighlight: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  shelfPlankShadow: {
    position: 'absolute',
    top: 16,
    left: 0,
    right: 0,
    height: 25,
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  bottomCabinet: {
    height: 120,
    flexDirection: 'row',
    backgroundColor: '#C6BDB0',
    borderTopWidth: 2,
    borderColor: '#B0A79A',
  },
  cabinetDoorLeft: {
    flex: 1,
    borderRightWidth: 1,
    borderColor: '#A8A096',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 15,
  },
  cabinetDoorRight: {
    flex: 1,
    borderLeftWidth: 1,
    borderColor: '#D8D0C3',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 15,
  },
  cabinetKnobRight: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B7B61',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 1, height: 1 },
  },
  cabinetKnobLeft: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#8B7B61',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 2,
    shadowOffset: { width: 1, height: 1 },
  },
  spineContainer: {
    width: 32,
    height: 140,
    borderTopLeftRadius: 3,
    borderBottomLeftRadius: 2,
    borderTopRightRadius: 2,
    borderBottomRightRadius: 2,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    shadowOffset: { width: -2, height: 2 },
    elevation: 4,
    alignItems: 'center',
    paddingVertical: 12,
    overflow: 'hidden',
  },
  spineCurveShadow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.15)',
    borderLeftWidth: 2,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  spineTopDetail: {
    width: '100%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.4)',
    marginBottom: 15,
    zIndex: 2,
  },
  spineSubtitle: {
    fontSize: 5,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
    letterSpacing: 1,
    transform: [{ rotate: '90deg' }],
    width: 40,
    textAlign: 'center',
    marginTop: 15,
    zIndex: 2,
  },
  spineCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  spineTitle: {
    fontSize: 7,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.95)',
    letterSpacing: 1,
    transform: [{ rotate: '90deg' }],
    width: 120,
    textAlign: 'center',
  },
  spineBottomDetail: {
    width: '100%',
    height: 8,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(0,0,0,0.2)',
    marginBottom: 5,
    zIndex: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    zIndex: 100,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  closeText: {
    fontSize: 18,
    color: '#D7B86A',
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    borderRadius: 6,
  },
  coverPage: {
    flex: 1,
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
    backgroundColor: 'rgba(0,0,0,0.04)',
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  coverInnerBorder: {
    ...StyleSheet.absoluteFill,
    margin: 10,
    marginLeft: 22,
    borderWidth: 1,
    borderColor: 'rgba(58, 51, 43, 0.15)',
    borderRadius: 2,
  },
  imageContainer: {
    width: '75%',
    height: '45%',
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 6,
    borderRadius: 2,
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
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
    fontWeight: '400',
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
  backCover: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backCoverText: {
    fontSize: 12,
    color: 'rgba(58, 51, 43, 0.4)',
    letterSpacing: 3,
    textTransform: 'uppercase',
  },
  photoBookPage: {
    flex: 1,
    backgroundColor: '#F9F8F6',
  },
  fullBleedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  splitStack: {
    flex: 1,
    flexDirection: 'column',
    padding: 8,
    gap: 8,
    backgroundColor: '#F9F8F6',
  },
  halfImage: {
    flex: 1,
    width: '100%',
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  collageGrid: {
    flex: 1,
    padding: 8,
    gap: 8,
    backgroundColor: '#F9F8F6',
  },
  collageLarge: {
    flex: 1.2,
    width: '100%',
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  collageRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  collageSmall: {
    flex: 1,
    height: '100%',
    resizeMode: 'cover',
    backgroundColor: '#EAEAEA',
  },
  modernPageNumber: {
    position: 'absolute',
    bottom: 8,
    right: 12,
  },
  modernPageText: {
    fontSize: 8,
    color: 'rgba(0,0,0,0.3)',
    fontWeight: '300',
    letterSpacing: 2,
  },
});

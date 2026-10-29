import React, { useState, useEffect } from 'react';
import { View, StyleSheet, SafeAreaView, Text, TouchableOpacity, Modal, Dimensions, ScrollView, ActivityIndicator, Animated, Easing, StatusBar, Platform } from 'react-native';
import { BlurView } from '@react-native-community/blur';
import FastImage from 'react-native-fast-image';
import PhotoAlbum from './PhotoAlbum';
import StickyNotesBundle from './StickyNotes';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GhostLamp, CandleJar, PottedPlant, HangingPlant, PhotoFrame, HorizontalBooks, PencilCup, VintageGlobe, SmallVase } from './Decorations';
import StarsGlobe from './StarsGlobe';
import StarsFlatMap from './StarsFlatMap';
import StarsWorld, { WorldMapMode } from './StarsWorld';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const ALBUMS = [
  // SHELF 1 (Top)
  { id: 1, title: 'Atomic Habits', color: '#F0EAD6', thickness: 27, height: 122, titleColor: '#333' },
  { id: 2, title: 'The Psychology of Money', color: '#4A5D23', thickness: 27, height: 125, titleColor: '#F0EAD6' },
  { id: 3, title: 'DUNE', color: '#B35A3D', thickness: 25, height: 120, titleColor: '#F0EAD6' },
  { id: 4, title: 'Sapiens', color: '#E8DCC2', thickness: 27, height: 124, titleColor: '#333' },
  { id: 5, title: 'The Hobbit', color: '#2C3E50', thickness: 27, height: 122, titleColor: '#E8DCC2' },
  { id: 6, title: 'A Little Life', color: '#EBE1D0', thickness: 27, height: 120, titleColor: '#333' },

  // SHELF 2
  { id: 7, title: 'Ikigai', color: '#E6D5C3', thickness: 26, height: 120, titleColor: '#333' },
  { id: 8, title: 'The Alchemist', color: '#D4A373', thickness: 27, height: 124, titleColor: '#333' },
  { id: 9, title: 'Mental Focus', color: '#2F4F4F', thickness: 26, height: 122, titleColor: '#F0EAD6' },
  { id: 10, title: 'Daisy Jones & The Six', color: '#E2A76F', thickness: 27, height: 125, titleColor: '#333' },
  { id: 11, title: 'Beach Read', color: '#CD5C5C', thickness: 27, height: 120, titleColor: '#111' },
  { id: 12, title: 'The Silent Patient', color: '#F0EAD6', thickness: 26, height: 123, titleColor: '#333' },
  { id: 13, title: 'Verity', color: '#1B2631', thickness: 27, height: 125, titleColor: '#D4A373' },

  // SHELF 3
  { id: 14, title: 'Clean Code', color: '#1C1C1C', thickness: 27, height: 122, titleColor: '#D4A373' },
  { id: 15, title: 'Design Patterns', color: '#EBE1D0', thickness: 27, height: 124, titleColor: '#333' },
  { id: 16, title: 'Deep Work', color: '#3A5A40', thickness: 27, height: 120, titleColor: '#D4A373' },
  { id: 17, title: 'The Pragmatic Programmer', color: '#8B4513', thickness: 27, height: 124, titleColor: '#EBE1D0' },
  { id: 18, title: 'Think Like a Monk', color: '#E6D5C3', thickness: 27, height: 122, titleColor: '#333' },
  { id: 19, title: 'Steal Like an Artist', color: '#111111', thickness: 25, height: 118, titleColor: '#FFF' },
  { id: 20, title: 'Zero to One', color: '#B0C4DE', thickness: 27, height: 122, titleColor: '#333' },

  // SHELF 4
  { id: 21, title: 'The Subtle Art of Not Giving a F*ck', color: '#EAE1D0', thickness: 27, height: 122, titleColor: '#333' },
  { id: 22, title: '1984', color: '#A08D7B', thickness: 25, height: 118, titleColor: '#333' },
  { id: 23, title: 'The Shining', color: '#1A1C20', thickness: 27, height: 124, titleColor: '#D4A373' },
  { id: 24, title: 'IT', color: '#6A2E2A', thickness: 28, height: 122, titleColor: '#EAE1D0' },
  { id: 25, title: 'Misery', color: '#E6D5C3', thickness: 26, height: 120, titleColor: '#333' },
  { id: 26, title: 'Project Hail Mary', color: '#2B2E33', thickness: 28, height: 125, titleColor: '#EAE1D0' },

  // SHELF 5 (Bottom)
  { id: 27, title: 'The Midnight Library', color: '#1C2833', thickness: 27, height: 124, titleColor: '#D4A373' },
  { id: 28, title: 'The Seven Husbands of Evelyn Hugo', color: '#8B4513', thickness: 27, height: 125, titleColor: '#EAE1D0' },
  { id: 29, title: 'Carrie Soto is Back', color: '#6B8E23', thickness: 27, height: 122, titleColor: '#FFF' },
  { id: 30, title: 'Malibu Rising', color: '#5F9EA0', thickness: 27, height: 124, titleColor: '#FFF' },
  { id: 31, title: 'Happy Place', color: '#D4A373', thickness: 27, height: 120, titleColor: '#111' },
  { id: 32, title: 'People We Meet On Vacation', color: '#CD5C5C', thickness: 27, height: 122, titleColor: '#FFF' },
  { id: 33, title: 'Better Ideas Ahead', color: '#F0EAD6', thickness: 27, height: 124, titleColor: '#333' }
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
  const [activeComponent, setActiveComponent] = useState<'album' | 'globe' | 'flatmap'>('globe');
  const [worldMapMode, setWorldMapMode] = useState<WorldMapMode>('globe');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>('IN');
  const [isCosmicInteracting, setIsCosmicInteracting] = useState(false);

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
          <FastImage source={{ uri: `https://picsum.photos/id/${album.id + 20}/400/600` }} style={styles.coverImage} />
        </View>
        <View style={styles.titleContainer}>
          <Text style={styles.coverSubtitle}>{(album as any).subtitle || 'SPECIAL EDITION'}</Text>
          <View style={styles.divider} />
          <Text style={styles.coverTitle}>{album.title}</Text>
          <Text style={styles.coverDate}>{(album as any).date || '2024'}</Text>
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
      <StatusBar barStyle="light-content" />
      <View style={[styles.container, activeComponent !== 'album' && styles.darkContainer]}>

        {/* Floating Top Segmented Navigation Bar - temporarily hidden
        <View style={styles.navHeader} pointerEvents="box-none">
          <View style={styles.navSegmentContainer} pointerEvents="auto">
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveComponent('album')}
              style={[
                styles.navSegmentButton,
                activeComponent === 'album' && styles.navSegmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.navSegmentText,
                  activeComponent === 'album' && styles.navSegmentTextActive,
                ]}
              >
                📚 Shelf
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveComponent('globe')}
              style={[
                styles.navSegmentButton,
                activeComponent === 'globe' && styles.navSegmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.navSegmentText,
                  activeComponent === 'globe' && styles.navSegmentTextActive,
                ]}
              >
                🌐 Stars Globe
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setActiveComponent('flatmap')}
              style={[
                styles.navSegmentButton,
                activeComponent === 'flatmap' && styles.navSegmentButtonActive,
              ]}
            >
              <Text
                style={[
                  styles.navSegmentText,
                  activeComponent === 'flatmap' && styles.navSegmentTextActive,
                ]}
              >
                🗺️ Flat Map
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        */}

        {activeComponent === 'album' && (
          <>
            {/* Realistic Built-In Bookshelf Matching Reference Image */}
            <View style={styles.bookshelfCabinet}>
              {/* Top Wooden Valance (behind notch & status bar) */}
              <View style={styles.topValance}>
                <View style={styles.valanceBevel} />
              </View>

              {/* Side Vertical Wooden Uprights */}
              <View style={styles.sideUprightLeft} pointerEvents="none" />
              <View style={styles.sideUprightRight} pointerEvents="none" />

              {/* 5 Shelves Area - Evenly filling the height */}
              <View style={styles.shelvesWrapper}>
                {Array.from({ length: 5 }).map((_, rowIndex) => {
                  const shelfBooks = ALBUMS.slice(
                    rowIndex === 0 ? 0 : rowIndex === 1 ? 6 : rowIndex === 2 ? 13 : rowIndex === 3 ? 20 : 26,
                    rowIndex === 0 ? 6 : rowIndex === 1 ? 13 : rowIndex === 2 ? 20 : rowIndex === 3 ? 26 : 33
                  );

                  return (
                    <View key={`shelf-${rowIndex}`} style={styles.shelfContainer}>
                      {/* Realistic Warm Amber Backwall */}
                      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#563620' }]} />
                      {/* Warm ambient LED glow coming from top of the shelf down the backwall */}
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 48, backgroundColor: '#FF9E2C', opacity: 0.28 }} />
                      <View style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 18, backgroundColor: '#FFE292', opacity: 0.2 }} />

                      {/* Under-shelf LED Strip mounted on ceiling */}
                      <View style={styles.shelfLedBar} />

                      <View style={styles.booksRow}>
                        {/* Shelf 1 */}
                        {rowIndex === 0 && (
                          <>
                            <HangingPlant />
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2, paddingLeft: 14 }}>
                              {shelfBooks.map((album) => {
                                const isPulling = pullingAlbumId === album.id;
                                return (
                                  <TouchableOpacity key={album.id} style={{ marginHorizontal: 1 }} activeOpacity={0.9} onPress={() => !pullingAlbumId && handleOpenAlbum(album)}>
                                    <Animated.View style={[
                                      styles.spineContainer,
                                      { backgroundColor: album.color, width: album.thickness, height: album.height },
                                    ]}>
                                      <View style={styles.spineRidges} />
                                      <Animated.View style={[styles.spineCurveShadow]} />
                                      <View style={styles.spineCenterWrap}>
                                        <Text style={[styles.spineTitle, { color: album.titleColor || 'rgba(255,255,255,0.95)' }]} numberOfLines={1}>{album.title}</Text>
                                      </View>
                                    </Animated.View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                              <PottedPlant />
                              <GhostLamp />
                            </View>
                          </>
                        )}

                        {/* Shelf 2 */}
                        {rowIndex === 1 && (
                          <>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', zIndex: 1 }}>
                              <PhotoFrame />
                              <View style={{ marginLeft: -22, marginBottom: -4 }}>
                                <CandleJar />
                              </View>
                              <View style={{ marginLeft: 2 }}>
                                <SmallVase />
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                              {shelfBooks.map((album) => {
                                const isPulling = pullingAlbumId === album.id;
                                return (
                                  <TouchableOpacity key={album.id} style={{ marginHorizontal: 1 }} activeOpacity={0.9} onPress={() => !pullingAlbumId && handleOpenAlbum(album)}>
                                    <Animated.View style={[
                                      styles.spineContainer,
                                      { backgroundColor: album.color, width: album.thickness, height: album.height },
                                    ]}>
                                      <View style={styles.spineRidges} />
                                      <Animated.View style={[styles.spineCurveShadow]} />
                                      <View style={styles.spineCenterWrap}>
                                        <Text style={[styles.spineTitle, { color: album.titleColor || 'rgba(255,255,255,0.95)' }]} numberOfLines={1}>{album.title}</Text>
                                      </View>
                                    </Animated.View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                          </>
                        )}

                        {/* Shelf 3 */}
                        {rowIndex === 2 && (
                          <>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                              {shelfBooks.map((album) => {
                                const isPulling = pullingAlbumId === album.id;
                                return (
                                  <TouchableOpacity key={album.id} style={{ marginHorizontal: 1 }} activeOpacity={0.9} onPress={() => !pullingAlbumId && handleOpenAlbum(album)}>
                                    <Animated.View style={[
                                      styles.spineContainer,
                                      { backgroundColor: album.color, width: album.thickness, height: album.height },
                                    ]}>
                                      <View style={styles.spineRidges} />
                                      <Animated.View style={[styles.spineCurveShadow]} />
                                      <View style={styles.spineCenterWrap}>
                                        <Text style={[styles.spineTitle, { color: album.titleColor || 'rgba(255,255,255,0.95)' }]} numberOfLines={1}>{album.title}</Text>
                                      </View>
                                    </Animated.View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 4 }}>
                              <PottedPlant />
                              <GhostLamp />
                            </View>
                          </>
                        )}

                        {/* Shelf 4 */}
                        {rowIndex === 3 && (
                          <>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                              {shelfBooks.map((album) => {
                                const isPulling = pullingAlbumId === album.id;
                                return (
                                  <TouchableOpacity key={album.id} style={{ marginHorizontal: 1 }} activeOpacity={0.9} onPress={() => !pullingAlbumId && handleOpenAlbum(album)}>
                                    <Animated.View style={[
                                      styles.spineContainer,
                                      { backgroundColor: album.color, width: album.thickness, height: album.height },
                                    ]}>
                                      <View style={styles.spineRidges} />
                                      <Animated.View style={[styles.spineCurveShadow]} />
                                      <View style={styles.spineCenterWrap}>
                                        <Text style={[styles.spineTitle, { color: album.titleColor || 'rgba(255,255,255,0.95)' }]} numberOfLines={1}>{album.title}</Text>
                                      </View>
                                    </Animated.View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            <View style={{ alignItems: 'center', justifyContent: 'flex-end' }}>
                              <PhotoFrame />
                              <HorizontalBooks />
                            </View>
                            <PencilCup />
                          </>
                        )}

                        {/* Shelf 5 */}
                        {rowIndex === 4 && (
                          <>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                              <VintageGlobe />
                              <View style={{ marginLeft: -12, zIndex: 5 }}>
                                <SmallVase />
                              </View>
                            </View>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                              {shelfBooks.map((album) => {
                                const isPulling = pullingAlbumId === album.id;
                                return (
                                  <TouchableOpacity key={album.id} style={{ marginHorizontal: 1 }} activeOpacity={0.9} onPress={() => !pullingAlbumId && handleOpenAlbum(album)}>
                                    <Animated.View style={[
                                      styles.spineContainer,
                                      { backgroundColor: album.color, width: album.thickness, height: album.height },
                                    ]}>
                                      <View style={styles.spineRidges} />
                                      <Animated.View style={[styles.spineCurveShadow]} />
                                      <View style={styles.spineCenterWrap}>
                                        <Text style={[styles.spineTitle, { color: album.titleColor || 'rgba(255,255,255,0.95)' }]} numberOfLines={1}>{album.title}</Text>
                                      </View>
                                    </Animated.View>
                                  </TouchableOpacity>
                                );
                              })}
                            </View>
                            <PencilCup />
                          </>
                        )}
                      </View>
                      {/* Physical Wooden Shelf Plank */}
                      <View style={styles.shelfPlank}>
                        <View style={styles.shelfPlankHighlight} />
                        <View style={styles.shelfPlankShadow} />
                      </View>
                    </View>
                  );
                })}
              </View>

              {/* Bottom Wooden Plinth / Baseboard (around home indicator) */}
              <View style={styles.bottomPlinth}>
                <View style={styles.bottomPlinthHighlight} />
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
                      { rotateX: pullAnim.interpolate({ inputRange: [0, 80, 100], outputRange: ['-5deg', '-5deg', '0deg'] }) },
                      { rotateY: pullAnim.interpolate({ inputRange: [0, 50, 80, 100], outputRange: ['-180deg', '-180deg', '-90deg', '0deg'] }) },
                      { scale: pullAnim.interpolate({ inputRange: [0, 80, 100], outputRange: [0.8, 0.9, 1], extrapolate: 'clamp' }) }
                    ]
                  }]}>
                    {isAlbumReady && <PhotoAlbum pages={generatePages(selectedAlbum)} />}
                  </Animated.View>
                </Animated.View>
              </View>
            )}
          </>
        )}

        {activeComponent !== 'album' && (
          <ScrollView
            style={styles.cosmicScrollView}
            contentContainerStyle={styles.cosmicScrollContent}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!isCosmicInteracting}
            bounces={false}
          >
            {/* Exact spacing preserved so the globe stays at the exact same vertical position */}
            <View style={styles.topHeaderSpacer} />

            <StarsWorld
              mode={worldMapMode}
              onModeChange={setWorldMapMode}
              allowModeToggle={true}
              size={Math.min(SCREEN_WIDTH - 16, 385)}
              selectedCountryCode={selectedCountryCode}
              onSelectCountry={(country) => setSelectedCountryCode(country?.code ?? null)}
              onInteractionChange={setIsCosmicInteracting}
            />
          </ScrollView>
        )}
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#382214',
  },
  darkContainer: {
    backgroundColor: '#030712',
  },
  navHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    zIndex: 99999,
    alignItems: 'center',
  },
  navSegmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
    borderRadius: 30,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    gap: 4,
  },
  navSegmentButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 24,
    backgroundColor: 'transparent',
  },
  navSegmentButtonActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
  },
  navSegmentText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#94A3B8',
    letterSpacing: 0.3,
  },
  navSegmentTextActive: {
    color: '#F8FAFC',
    fontWeight: '700',
  },
  cosmicScrollView: {
    flex: 1,
    backgroundColor: '#030712',
  },
  cosmicScrollContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 54 : 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 20,
  },
  topHeaderSpacer: {
    height: 98,
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
    width: '100%',
    backgroundColor: '#4A2E1A',
    position: 'relative',
  },
  topValance: {
    width: '100%',
    height: 50,
    backgroundColor: '#442816',
    borderBottomWidth: 1.5,
    borderBottomColor: '#2B160B',
    zIndex: 25,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  valanceBevel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  sideUprightLeft: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: 13,
    backgroundColor: '#462A17',
    borderRightWidth: 1,
    borderRightColor: '#2E190D',
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 0 },
  },
  sideUprightRight: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    width: 13,
    backgroundColor: '#442816',
    borderLeftWidth: 1,
    borderLeftColor: '#2E190D',
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: -2, height: 0 },
  },
  shelvesWrapper: {
    flex: 1,
    width: '100%',
  },
  shelfContainer: {
    flex: 1,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  shelfLedBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2.5,
    backgroundColor: '#FFE9A6',
    shadowColor: '#FFA726',
    shadowOpacity: 0.9,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 6,
    zIndex: 10,
  },
  booksRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    paddingLeft: 16,
    paddingRight: 16,
    zIndex: 2,
    marginBottom: 0,
  },
  shelfPlank: {
    width: '100%',
    height: 16,
    backgroundColor: '#4C2F1A',
    borderTopWidth: 1.5,
    borderTopColor: '#7A4E2F',
    borderBottomWidth: 2,
    borderBottomColor: '#28150A',
    zIndex: 5,
    shadowColor: '#000',
    shadowOpacity: 0.45,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
  shelfPlankHighlight: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  shelfPlankShadow: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    height: 4,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  bottomPlinth: {
    width: '100%',
    height: 36,
    backgroundColor: '#3E2413',
    borderTopWidth: 1.5,
    borderTopColor: '#241208',
    zIndex: 25,
  },
  bottomPlinthHighlight: {
    width: '100%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  spineContainer: {
    borderTopLeftRadius: 4,
    borderBottomLeftRadius: 3,
    borderTopRightRadius: 4,
    borderBottomRightRadius: 3,
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 2 },
    elevation: 5,
    alignItems: 'center',
    paddingVertical: 10,
    overflow: 'hidden',
  },
  spineCurveShadow: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'transparent',
    borderLeftWidth: 2.5,
    borderLeftColor: 'rgba(255, 255, 255, 0.28)',
    borderRightWidth: 5,
    borderRightColor: 'rgba(0, 0, 0, 0.3)',
  },
  spineRidges: {
    position: 'absolute',
    top: 14,
    bottom: 14,
    left: 0,
    right: 0,
    borderTopWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
    zIndex: 1,
  },
  spineCenterWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  spineTitle: {
    fontSize: 6.8,
    fontWeight: '600',
    letterSpacing: 0.5,
    transform: [{ rotate: '90deg' }],
    width: 130,
    textAlign: 'center',
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

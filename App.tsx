import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, Text, TouchableOpacity, Dimensions, ScrollView, StatusBar, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
  Extrapolation,
  runOnJS,
} from 'react-native-reanimated';
import PhotoAlbum, { PhotoAlbumRef, PAGE_WIDTH, ALBUM_RENDER_HEIGHT } from './PhotoAlbum';
import { EmptyBookSlot, ShelfBookActor, BookSpineView, BookRect } from './ShelfBookTransition';
import ImageLightbox, { ImagePreviewData } from './ImageLightbox';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { GhostLamp, CandleJar, PottedPlant, HangingPlant, PhotoFrame, HorizontalBooks, PencilCup, VintageGlobe, SmallVase } from './Decorations';
import StarsWorld, { WorldMapMode } from './StarsWorld';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TARGET_RECT: BookRect = {
  x: (SCREEN_WIDTH - PAGE_WIDTH) / 2,
  y: (SCREEN_HEIGHT - ALBUM_RENDER_HEIGHT) / 2,
  width: PAGE_WIDTH,
  height: ALBUM_RENDER_HEIGHT,
};

const ALBUMS = [
  // SHELF 1 (Top)
  { id: 1, title: 'Atomic Habits', color: '#F0EAD6', thickness: 27, height: 122, titleColor: '#1F1A14' },
  { id: 2, title: 'The Psychology of Money', spineTitle: 'Psychology of Money', color: '#4A5D23', thickness: 27, height: 125, titleColor: '#F5E8C7' },
  { id: 3, title: 'DUNE', color: '#B35A3D', thickness: 25, height: 120, titleColor: '#F5E8C7' },
  { id: 4, title: 'Sapiens', color: '#E8DCC2', thickness: 27, height: 124, titleColor: '#1F1A14' },
  { id: 5, title: 'The Hobbit', color: '#2C3E50', thickness: 27, height: 122, titleColor: '#F5E8C7' },
  { id: 6, title: 'A Little Life', color: '#EBE1D0', thickness: 27, height: 120, titleColor: '#1F1A14' },

  // SHELF 2
  { id: 7, title: 'Ikigai', color: '#E6D5C3', thickness: 26, height: 120, titleColor: '#1F1A14' },
  { id: 8, title: 'The Alchemist', color: '#D4A373', thickness: 27, height: 124, titleColor: '#1F1A14' },
  { id: 9, title: 'Mental Focus', color: '#2F4F4F', thickness: 26, height: 122, titleColor: '#F5E8C7' },
  { id: 10, title: 'Daisy Jones & The Six', spineTitle: 'Daisy Jones & The Six', color: '#E2A76F', thickness: 27, height: 125, titleColor: '#1F1A14' },
  { id: 11, title: 'Beach Read', color: '#CD5C5C', thickness: 27, height: 120, titleColor: '#FFFFFF' },
  { id: 12, title: 'The Silent Patient', color: '#F0EAD6', thickness: 26, height: 123, titleColor: '#1F1A14' },
  { id: 13, title: 'Verity', color: '#1B2631', thickness: 27, height: 125, titleColor: '#F5E8C7' },

  // SHELF 3
  { id: 14, title: 'Clean Code', color: '#1C1C1C', thickness: 27, height: 122, titleColor: '#F5E8C7' },
  { id: 15, title: 'Design Patterns', color: '#EBE1D0', thickness: 27, height: 124, titleColor: '#1F1A14' },
  { id: 16, title: 'Deep Work', color: '#3A5A40', thickness: 27, height: 120, titleColor: '#F5E8C7' },
  { id: 17, title: 'The Pragmatic Programmer', spineTitle: 'Pragmatic Programmer', color: '#8B4513', thickness: 27, height: 124, titleColor: '#F5E8C7' },
  { id: 18, title: 'Think Like a Monk', color: '#E6D5C3', thickness: 27, height: 122, titleColor: '#1F1A14' },
  { id: 19, title: 'Steal Like an Artist', color: '#111111', thickness: 25, height: 118, titleColor: '#FFFFFF' },
  { id: 20, title: 'Zero to One', color: '#B0C4DE', thickness: 27, height: 122, titleColor: '#1F1A14' },

  // SHELF 4
  { id: 21, title: 'The Subtle Art of Not Giving a F*ck', spineTitle: 'The Subtle Art', color: '#EAE1D0', thickness: 27, height: 122, titleColor: '#1F1A14' },
  { id: 22, title: '1984', color: '#A08D7B', thickness: 25, height: 118, titleColor: '#FFFFFF' },
  { id: 23, title: 'The Shining', color: '#1A1C20', thickness: 27, height: 124, titleColor: '#F5E8C7' },
  { id: 24, title: 'IT', color: '#6A2E2A', thickness: 28, height: 122, titleColor: '#F5E8C7' },
  { id: 25, title: 'Misery', color: '#E6D5C3', thickness: 26, height: 120, titleColor: '#1F1A14' },
  { id: 26, title: 'Project Hail Mary', color: '#2B2E33', thickness: 28, height: 125, titleColor: '#F5E8C7' },

  // SHELF 5 (Bottom)
  { id: 27, title: 'The Midnight Library', color: '#1C2833', thickness: 27, height: 124, titleColor: '#F5E8C7' },
  { id: 28, title: 'The Seven Husbands of Evelyn Hugo', spineTitle: 'The Seven Husbands', color: '#8B4513', thickness: 27, height: 125, titleColor: '#F5E8C7' },
  { id: 29, title: 'Carrie Soto is Back', color: '#6B8E23', thickness: 27, height: 122, titleColor: '#FFFFFF' },
  { id: 30, title: 'Malibu Rising', color: '#5F9EA0', thickness: 27, height: 124, titleColor: '#FFFFFF' },
  { id: 31, title: 'Happy Place', color: '#D4A373', thickness: 27, height: 120, titleColor: '#1F1A14' },
  { id: 32, title: 'People We Meet On Vacation', spineTitle: 'People We Meet', color: '#CD5C5C', thickness: 27, height: 122, titleColor: '#FFFFFF' },
  { id: 33, title: 'Better Ideas Ahead', color: '#F0EAD6', thickness: 27, height: 124, titleColor: '#1F1A14' }
];

const innerImages = [
  1015, 1036, 1037, 1038, 1039, 1040
];

export default function App() {
  const [selectedAlbum, setSelectedAlbum] = useState<typeof ALBUMS[0] | null>(null);
  const [pullingAlbumId, setPullingAlbumId] = useState<number | null>(null);
  const [originRect, setOriginRect] = useState<BookRect | null>(null);
  const [isPhotoAlbumActive, setIsPhotoAlbumActive] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);
  const [canTapBackdropToClose, setCanTapBackdropToClose] = useState(false);
  const [activeComponent, _setActiveComponent] = useState<'album' | 'globe' | 'flatmap'>('album');
  const [worldMapMode, setWorldMapMode] = useState<WorldMapMode>('globe');
  const [selectedCountryCode, setSelectedCountryCode] = useState<string | null>('IN');
  const [isCosmicInteracting, setIsCosmicInteracting] = useState(false);
  const [selectedPreviewImage, setSelectedPreviewImage] = useState<ImagePreviewData | null>(null);

  const pullProgress = useSharedValue(0);
  const photoAlbumRef = useRef<PhotoAlbumRef>(null);
  const bookRefs = useRef<{ [id: number]: any }>({});
  const bookLayouts = useRef<{ [id: number]: BookRect }>({});

  const getFallbackShelfRect = (album: typeof ALBUMS[0]): BookRect => {
    const cabinetHeight = SCREEN_HEIGHT;
    const shelfAreaHeight = cabinetHeight - 86;
    const shelfHeight = shelfAreaHeight / 5;

    let rowIndex = 0;
    if (album.id <= 6) rowIndex = 0;
    else if (album.id <= 13) rowIndex = 1;
    else if (album.id <= 20) rowIndex = 2;
    else if (album.id <= 26) rowIndex = 3;
    else rowIndex = 4;

    const shelfTop = 50 + rowIndex * shelfHeight;
    const bookY = shelfTop + shelfHeight - album.height - 16;
    const bookX = 30 + ((album.id - 1) % 7) * (album.thickness + 2);

    return {
      x: bookX,
      y: bookY,
      width: album.thickness,
      height: album.height,
    };
  };

  const handleBookPress = (album: typeof ALBUMS[0]) => {
    if (pullingAlbumId !== null || isAnimating) return;
    setIsAnimating(true);

    const cached = bookLayouts.current[album.id];
    if (cached && cached.width > 0 && cached.height > 0) {
      // Instant execution on exact touch frame with pre-cached coordinates - 0ms delay!
      startPullOut(album, cached);
      return;
    }

    const ref = bookRefs.current[album.id];
    const fallback = getFallbackShelfRect(album);

    if (ref && typeof ref.measureInWindow === 'function') {
      ref.measureInWindow((x: number, y: number, width: number, height: number) => {
        if (width > 0 && height > 0 && !isNaN(x) && !isNaN(y)) {
          bookLayouts.current[album.id] = { x, y, width, height };
          startPullOut(album, { x, y, width, height });
        } else {
          startPullOut(album, fallback);
        }
      });
    } else {
      startPullOut(album, fallback);
    }
  };

  const preloadAlbumImages = (album: typeof ALBUMS[0]) => {
    const urls: { uri: string }[] = [];
    const coverId = album.id + 20;
    urls.push({ uri: `https://picsum.photos/id/${coverId}/400/600` });
    urls.push({ uri: `https://picsum.photos/id/${coverId}/1200/1800` });

    innerImages.forEach((id) => {
      // Standard resolution (used in book layout)
      urls.push({ uri: `https://picsum.photos/id/${id}/600/800` });
      urls.push({ uri: `https://picsum.photos/id/${id}/600/400` });
      urls.push({ uri: `https://picsum.photos/id/${id + 5}/300/300` });
      urls.push({ uri: `https://picsum.photos/id/${id + 8}/300/300` });
      urls.push({ uri: `https://picsum.photos/id/${id + 10}/600/400` });

      // High-res resolution (used in lightbox)
      urls.push({ uri: `https://picsum.photos/id/${id}/1200/1600` });
      urls.push({ uri: `https://picsum.photos/id/${id}/1500/1000` });
      urls.push({ uri: `https://picsum.photos/id/${id + 5}/1000/1000` });
      urls.push({ uri: `https://picsum.photos/id/${id + 8}/1000/1000` });
      urls.push({ uri: `https://picsum.photos/id/${id + 10}/1500/1000` });
    });

    try {
      FastImage.preload(urls);
    } catch {
      // Safe fallback
    }
  };

  useEffect(() => {
    // Warm cache on launch with first albums so images load instantaneously
    preloadAlbumImages(ALBUMS[0]);
    if (ALBUMS[6]) preloadAlbumImages(ALBUMS[6]);
  }, []);

  const startPullOut = (album: typeof ALBUMS[0], rect: BookRect) => {
    preloadAlbumImages(album);
    setCanTapBackdropToClose(false);
    setPullingAlbumId(album.id);
    setSelectedAlbum(album);
    setOriginRect(rect);
    setIsPhotoAlbumActive(false);
    pullProgress.value = 0;

    // Authentic, deliberate real-world speed (~1400ms)
    // 1. Stage 1 (0 -> 0.42, ~588ms): Pull straight out in exact same initial angle (spine facing front)
    // 2. Stage 2 (0.42 -> 0.88, ~644ms): Mid-air 3D rotation to front cover angle (Image 2) & flight
    // 3. Stage 3 (0.88 -> 1.00, ~168ms): Cushioned settle in reading position
    pullProgress.value = withTiming(1, {
      duration: 1400,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
    }, (finished) => {
      if (finished) {
        runOnJS(handlePullFinished)();
      }
    });
  };

  const handlePullFinished = () => {
    setIsPhotoAlbumActive(true);
    setIsAnimating(false);
    // Grace period: lock backdrop touch dismiss for 600ms so user touches on the book
    // never accidentally dismiss the book back into the shelf!
    setTimeout(() => {
      setCanTapBackdropToClose(true);
    }, 600);
  };

  const handleCloseAlbum = () => {
    if (!selectedAlbum) return;
    if (isAnimating) return;
    setSelectedPreviewImage(null);
    setCanTapBackdropToClose(false);
    setIsAnimating(true);

    const startReturnFlight = () => {
      // Switch from PhotoAlbum to ShelfBookActor only once pages are closed
      setIsPhotoAlbumActive(false);
      // Put back sequence:
      // 1. Stage 2 Reversed (1.0 -> 0.42, ~780ms): Flips back to initial angle in mid-air
      // 2. Stage 1 Reversed (0.42 -> 0.00, ~570ms): Slides straight into shelf slot in exact initial angle
      pullProgress.value = withTiming(0, {
        duration: 1350,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1.0),
      }, (finished) => {
        if (finished) {
          runOnJS(handlePutBackFinished)();
        }
      });
    };

    if (photoAlbumRef.current && typeof photoAlbumRef.current.closeBook === 'function') {
      let closed = false;
      const safeClose = () => {
        if (closed) return;
        closed = true;
        startReturnFlight();
      };

      // Smoothly spring pages shut to cover
      photoAlbumRef.current.closeBook(safeClose);

      // Fail-safe: ensure return flight executes even if worklet callback is dropped
      setTimeout(safeClose, 400);
    } else {
      startReturnFlight();
    }
  };

  const handlePutBackFinished = () => {
    setSelectedAlbum(null);
    setPullingAlbumId(null);
    setOriginRect(null);
    setIsPhotoAlbumActive(false);
    setIsAnimating(false);
    setCanTapBackdropToClose(false);
  };

  const backdropStyle = useAnimatedStyle(() => {
    const p = pullProgress.value;
    // During extraction (p <= 0.32), backdrop stays subtle (0 to 0.12) so shelf is clearly visible
    // During flight & reading position (p: 0.32 -> 1.0), deep warm walnut dimming (0.12 -> 0.90) so shelf highlights never show through
    const opacity = interpolate(p, [0, 0.32, 0.85, 1], [0, 0.12, 0.88, 0.90], Extrapolation.CLAMP);
    return {
      opacity,
    };
  });

  const topHeaderStyle = useAnimatedStyle(() => {
    const p = pullProgress.value;
    const opacity = interpolate(p, [0.75, 1], [0, 1], Extrapolation.CLAMP);
    const translateY = interpolate(p, [0.75, 1], [-15, 0], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateY }],
    };
  });

  const renderShelfBook = (album: typeof ALBUMS[0]) => {
    const isPulling = pullingAlbumId === album.id;
    if (isPulling) {
      return (
        <EmptyBookSlot
          key={album.id}
          width={album.thickness}
          height={album.height}
        />
      );
    }

    return (
      <TouchableOpacity
        key={album.id}
        style={{ marginHorizontal: 1 }}
        activeOpacity={0.88}
        hitSlop={{ top: 10, bottom: 10, left: 4, right: 4 }}
        onPress={() => handleBookPress(album)}
      >
        <View
          ref={(el) => {
            bookRefs.current[album.id] = el;
          }}
          onLayout={() => {
            const el = bookRefs.current[album.id];
            if (el && typeof el.measureInWindow === 'function') {
              el.measureInWindow((x: number, y: number, width: number, height: number) => {
                if (width > 0 && height > 0 && !isNaN(x) && !isNaN(y)) {
                  bookLayouts.current[album.id] = { x, y, width, height };
                }
              });
            }
          }}
          style={[
            styles.spineShadowWrapper,
            { width: album.thickness, height: album.height },
          ]}
        >
          <BookSpineView album={album} width={album.thickness} height={album.height} />
        </View>
      </TouchableOpacity>
    );
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

  const getImageAtCoordinates = (
    album: typeof ALBUMS[0],
    currentSheet: number,
    x: number,
    y: number
  ): ImagePreviewData | null => {
    // 1. Closed book (Cover)
    if (currentSheet === 0) {
      const id = album.id + 20;
      return {
        uri: `https://picsum.photos/id/${id}/400/600`,
        highResUri: `https://picsum.photos/id/${id}/1200/1800`,
        title: album.title,
        subtitle: 'Cover Photo • Special Edition',
        aspectRatio: 400 / 600,
      };
    }

    // 2. Open page spreads
    const isLeft = x < PAGE_WIDTH;
    const pageIndex = isLeft ? currentSheet * 2 - 1 : currentSheet * 2;
    const px = isLeft ? x : x - PAGE_WIDTH;
    const py = y;

    // Pages range from 1 to 6 (page 0 is cover, 7 is back cover)
    if (pageIndex < 1 || pageIndex > 6) {
      return null;
    }

    const innerIndex = pageIndex - 1; // 0 to 5
    const id = innerImages[innerIndex];
    const layoutType = innerIndex % 3;
    const pageNumStr = `Page 0${innerIndex + 1}`;

    if (layoutType === 0) {
      // Layout 0: Full Bleed Single Image
      return {
        uri: `https://picsum.photos/id/${id}/600/800`,
        highResUri: `https://picsum.photos/id/${id}/1200/1600`,
        title: album.title,
        subtitle: `${pageNumStr} • Full Bleed Photo`,
        aspectRatio: 600 / 800,
      };
    } else if (layoutType === 1) {
      // Layout 1: Split Stack (Two Horizontal Images)
      const isTop = py < ALBUM_RENDER_HEIGHT / 2;
      if (isTop) {
        return {
          uri: `https://picsum.photos/id/${id}/600/400`,
          highResUri: `https://picsum.photos/id/${id}/1500/1000`,
          title: album.title,
          subtitle: `${pageNumStr} • Upper Landscape`,
          aspectRatio: 600 / 400,
        };
      } else {
        const bottomId = id + 10;
        return {
          uri: `https://picsum.photos/id/${bottomId}/600/400`,
          highResUri: `https://picsum.photos/id/${bottomId}/1500/1000`,
          title: album.title,
          subtitle: `${pageNumStr} • Lower Landscape`,
          aspectRatio: 600 / 400,
        };
      }
    } else {
      // Layout 2: Collage Grid (One Large, Two Small)
      const isTop = py < ALBUM_RENDER_HEIGHT * 0.55;
      if (isTop) {
        return {
          uri: `https://picsum.photos/id/${id}/600/400`,
          highResUri: `https://picsum.photos/id/${id}/1500/1000`,
          title: album.title,
          subtitle: `${pageNumStr} • Hero Landscape`,
          aspectRatio: 600 / 400,
        };
      } else {
        const isLeftSmall = px < PAGE_WIDTH / 2;
        if (isLeftSmall) {
          const smallLeftId = id + 5;
          return {
            uri: `https://picsum.photos/id/${smallLeftId}/300/300`,
            highResUri: `https://picsum.photos/id/${smallLeftId}/1000/1000`,
            title: album.title,
            subtitle: `${pageNumStr} • Detail Left`,
            aspectRatio: 1,
          };
        } else {
          const smallRightId = id + 8;
          return {
            uri: `https://picsum.photos/id/${smallRightId}/300/300`,
            highResUri: `https://picsum.photos/id/${smallRightId}/1000/1000`,
            title: album.title,
            subtitle: `${pageNumStr} • Detail Right`,
            aspectRatio: 1,
          };
        }
      }
    }
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
                              {shelfBooks.map(renderShelfBook)}
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
                              {shelfBooks.map(renderShelfBook)}
                            </View>
                          </>
                        )}

                        {/* Shelf 3 */}
                        {rowIndex === 2 && (
                          <>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 2 }}>
                              {shelfBooks.map(renderShelfBook)}
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
                              {shelfBooks.map(renderShelfBook)}
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
                              {shelfBooks.map(renderShelfBook)}
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

            {selectedAlbum && originRect && (
              <View style={[StyleSheet.absoluteFill, { zIndex: 1000 }]} pointerEvents="box-none">
                {/* 1. Warm Ambient Backdrop Dimming */}
                <Animated.View
                  style={[styles.ambientBackdrop, backdropStyle]}
                  pointerEvents={canTapBackdropToClose ? 'auto' : 'none'}
                >
                  <TouchableOpacity
                    style={StyleSheet.absoluteFill}
                    activeOpacity={1}
                    disabled={!canTapBackdropToClose}
                    onPress={handleCloseAlbum}
                  />
                </Animated.View>

                {/* 2. The Authentic 3D Book Actor (visible during extraction, flight, and put-back) */}
                {!isPhotoAlbumActive && (
                  <ShelfBookActor
                    album={selectedAlbum}
                    origin={originRect}
                    target={TARGET_RECT}
                    pullProgress={pullProgress}
                  />
                )}

                {/* 3. Interactive PhotoAlbum (seamlessly active in hands) */}
                {isPhotoAlbumActive && (
                  <View style={styles.interactiveAlbumContainer}>
                    <PhotoAlbum
                      ref={photoAlbumRef}
                      pages={generatePages(selectedAlbum)}
                      onDoubleTap={(x, y, currentSheet) => {
                        if (!selectedAlbum) return;
                        const target = getImageAtCoordinates(selectedAlbum, currentSheet, x, y);
                        if (target) {
                          setSelectedPreviewImage(target);
                        }
                      }}
                    />
                  </View>
                )}

                {/* 4. Top Action Bar: Return to Shelf (rendered LAST so it's always topmost and touchable) */}
                <Animated.View style={[styles.topActionHeader, topHeaderStyle]} pointerEvents="box-none">
                  <TouchableOpacity
                    style={styles.returnButton}
                    activeOpacity={0.8}
                    hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
                    onPress={handleCloseAlbum}
                  >
                    <Text style={styles.returnButtonIcon}>←</Text>
                    <Text style={styles.returnButtonText}>Return to Shelf</Text>
                  </TouchableOpacity>

                  <View style={styles.bookInfoPill}>
                    <Text style={styles.bookInfoTitle} numberOfLines={1}>{selectedAlbum.title}</Text>
                  </View>
                </Animated.View>

                {/* 5. Separate Large Image Explorer View (Lightbox) */}
                <ImageLightbox
                  image={selectedPreviewImage}
                  onClose={() => setSelectedPreviewImage(null)}
                />
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
  spineShadowWrapper: {
    shadowColor: '#000',
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 2, height: 2 },
    elevation: 5,
  },
  ambientBackdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#0D0704',
  },
  topActionHeader: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 54 : 24,
    left: 16,
    right: 16,
    zIndex: 9999,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  returnButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.22)',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  returnButtonIcon: {
    fontSize: 14,
    color: '#FFE6B0',
    marginRight: 6,
    fontWeight: '700',
  },
  returnButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#F8FAFC',
    letterSpacing: 0.3,
  },
  bookInfoPill: {
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    maxWidth: 160,
  },
  bookInfoTitle: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.8)',
    fontWeight: '500',
    letterSpacing: 0.4,
  },
  interactiveAlbumContainer: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'box-none',
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

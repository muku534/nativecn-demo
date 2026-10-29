import React, { forwardRef, useImperativeHandle } from 'react';
import {
    View,
    Dimensions,
    StyleSheet,
} from 'react-native';

import Animated, {
    interpolate,
    Extrapolation,
    useAnimatedStyle,
    useSharedValue,
    useDerivedValue,
    withSpring,
    SharedValue,
    runOnJS,
} from 'react-native-reanimated';

import {
    Gesture,
    GestureDetector,
} from 'react-native-gesture-handler';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const ALBUM_WIDTH = SCREEN_WIDTH - 32;
export const ALBUM_RENDER_HEIGHT = ALBUM_WIDTH * 0.75;

export const PAGE_WIDTH = ALBUM_WIDTH / 2;

const SPRING = {
    damping: 24,
    stiffness: 100,
    mass: 0.8,
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.01,
};

export interface PhotoAlbumProps {
    pages: React.ReactNode[];
    onProgressChange?: (progress: number) => void;
}

export interface PhotoAlbumRef {
    closeBook: (onClosed?: () => void) => void;
    getProgress: () => number;
}

const N = 12;
const STRIP_WIDTH = PAGE_WIDTH / N;

interface StripProps {
    stripIndex: number;
    localProgress: SharedValue<number>;
    frontPage: React.ReactNode;
    backPage: React.ReactNode;
    children?: React.ReactNode;
    isFrontCover?: boolean;
    isBackCover?: boolean;
}

const Strip = ({
    stripIndex,
    localProgress,
    frontPage,
    backPage,
    children,
    isFrontCover,
    isBackCover,
}: StripProps) => {
    const isSpine = stripIndex === 0;

    const animatedStyle = useAnimatedStyle(() => {
        const p = localProgress.value;

        if (isSpine) {
            const rotateY = interpolate(p, [0, 1], [0, -180], Extrapolation.CLAMP);
            return {
                transform: [
                    { perspective: 1200 },
                    { translateX: -STRIP_WIDTH / 2 },
                    { rotateY: `${rotateY}deg` },
                    { translateX: STRIP_WIDTH / 2 },
                ]
            };
        } else {
            // Progressive bend: outer strips bend more than inner strips
            // This creates a natural cylindrical curl like a real page turning
            const stripFactor = stripIndex / (N - 1);
            const maxBendForStrip = 32 * (0.15 + 0.85 * stripFactor);
            const bend = interpolate(p, [0, 0.5, 1], [0, maxBendForStrip, 0], Extrapolation.CLAMP);
            return {
                transform: [
                    { perspective: 1200 },
                    { translateX: -STRIP_WIDTH / 2 },
                    { rotateY: `${bend}deg` },
                    { translateX: STRIP_WIDTH / 2 },
                ]
            };
        }
    });

    const shift = -stripIndex * STRIP_WIDTH;

    // Use the spine's rotation to determine visibility so the entire page flips at the exact same moment.
    const spineRotation = useDerivedValue(() => {
        return interpolate(localProgress.value, [0, 1], [0, -180], Extrapolation.CLAMP);
    });

    const frontOpacityStyle = useAnimatedStyle(() => {
        return { opacity: spineRotation.value > -90 ? 1 : 0 };
    });

    const backOpacityStyle = useAnimatedStyle(() => {
        return { opacity: spineRotation.value <= -90 ? 1 : 0 };
    });

    // Cover uses coverContent style (no padding), inner pages use pageContent (with padding)
    const frontStyle = isFrontCover ? [styles.coverContent, styles.coverStyle] : styles.pageContent;
    const backStyle = isBackCover ? [styles.coverContent, styles.coverStyle] : styles.pageContent;

    return (
        <Animated.View style={[styles.strip, { left: isSpine ? 0 : STRIP_WIDTH }, animatedStyle]}>
            {/* FRONT FACE */}
            <Animated.View style={[styles.stripFace, isFrontCover ? styles.coverStripFace : undefined, frontOpacityStyle]}>
                <View style={[frontStyle, { left: shift }]}>
                    {frontPage}
                </View>
            </Animated.View>

            {/* BACK FACE */}
            <Animated.View style={[styles.stripFace, isBackCover ? styles.coverStripFace : undefined, backOpacityStyle]}>
                <View style={[backStyle, { left: shift, transform: [{ scaleX: -1 }] }]}>
                    {backPage}
                </View>
            </Animated.View>

            {children}
        </Animated.View>
    );
};

interface PageProps {
    index: number;
    progress: SharedValue<number>;
    frontPage: React.ReactNode;
    backPage: React.ReactNode;
    sheetCount: number;
    isFrontCover?: boolean;
    isBackCover?: boolean;
}

const Page = ({
    index,
    progress,
    frontPage,
    backPage,
    sheetCount,
    isFrontCover,
    isBackCover,
}: PageProps) => {
    const localProgress = useDerivedValue(() => {
        const p = progress.value - index;
        return Math.max(0, Math.min(1, p));
    });

    const zIndexStyle = useAnimatedStyle(() => {
        const z = localProgress.value < 0.5 ? sheetCount - index : index;
        return {
            zIndex: Math.round(z * 10),
        };
    });

    // Cast shadow: the turning page casts a shadow onto the page underneath
    const castShadowStyle = useAnimatedStyle(() => {
        const p = localProgress.value;
        const shadowOpacity = interpolate(p, [0, 0.3, 0.5, 0.7, 1], [0, 0.18, 0.25, 0.18, 0], Extrapolation.CLAMP);
        const shadowX = interpolate(p, [0, 0.5, 1], [8, 0, -8], Extrapolation.CLAMP);
        return {
            shadowColor: '#000',
            shadowOffset: { width: shadowX, height: 4 },
            shadowOpacity: shadowOpacity,
            shadowRadius: interpolate(p, [0, 0.5, 1], [2, 12, 2], Extrapolation.CLAMP),
            elevation: interpolate(p, [0, 0.5, 1], [0, 8, 0], Extrapolation.CLAMP),
        };
    });

    let content: React.ReactNode = null;
    for (let i = N - 1; i >= 0; i--) {
        content = (
            <Strip
                key={`strip-${i}`}
                stripIndex={i}
                localProgress={localProgress}
                frontPage={frontPage}
                backPage={backPage}
                isFrontCover={isFrontCover}
                isBackCover={isBackCover}
            >
                {content}
            </Strip>
        );
    }

    return (
        <Animated.View style={[styles.pageContainer, zIndexStyle, castShadowStyle]} pointerEvents="none">
            {content}
        </Animated.View>
    );
};


// Spine gutter — deep V-shaped shadow like a real book binding
const SpineGutter = ({ progress, sheetCount }: { progress: SharedValue<number>; sheetCount: number }) => {
    const gutterOpacity = useAnimatedStyle(() => {
        const p = progress.value;
        const openness = interpolate(p, [0, 0.3, sheetCount - 0.3, sheetCount], [0, 1, 1, 0], Extrapolation.CLAMP);
        return { opacity: openness };
    });

    return (
        <Animated.View style={[styles.gutterContainer, gutterOpacity]} pointerEvents="none">
            <View style={[styles.gutterLayer, { left: PAGE_WIDTH - 30, width: 60, backgroundColor: 'rgba(0,0,0,0.02)' }]} />
            <View style={[styles.gutterLayer, { left: PAGE_WIDTH - 20, width: 40, backgroundColor: 'rgba(0,0,0,0.04)' }]} />
            <View style={[styles.gutterLayer, { left: PAGE_WIDTH - 12, width: 24, backgroundColor: 'rgba(0,0,0,0.08)' }]} />
            <View style={[styles.gutterLayer, { left: PAGE_WIDTH - 6, width: 12, backgroundColor: 'rgba(0,0,0,0.15)' }]} />
            <View style={[styles.gutterLayer, { left: PAGE_WIDTH - 2, width: 4, backgroundColor: 'rgba(0,0,0,0.30)' }]} />
        </Animated.View>
    );
};

// Book spine — visible binding strip, always shown when open
const BookSpine = ({ progress, sheetCount }: { progress: SharedValue<number>; sheetCount: number }) => {
    const spineStyle = useAnimatedStyle(() => {
        const p = progress.value;
        const closedFront = interpolate(p, [0, 0.5], [1, 0], Extrapolation.CLAMP);
        const closedBack = interpolate(p, [sheetCount - 0.5, sheetCount], [0, 1], Extrapolation.CLAMP);
        const closedness = Math.max(closedFront, closedBack);
        const openness = interpolate(p, [0.3, 1, sheetCount - 1, sheetCount - 0.3], [0, 1, 1, 0], Extrapolation.CLAMP);

        const width = closedness > 0
            ? interpolate(closedness, [0, 1], [0, 8], Extrapolation.CLAMP)
            : interpolate(openness, [0, 1], [0, 3], Extrapolation.CLAMP);

        const opacity = Math.max(closedness, openness * 0.85);

        const leftPos = closedness > 0
            ? interpolate(closedness, [0, 1], [-width / 2, 0], Extrapolation.CLAMP)
            : -width / 2;

        return {
            width,
            left: leftPos,
            opacity,
        };
    });

    return (
        <Animated.View style={[styles.bookSpine, spineStyle]} pointerEvents="none" />
    );
};

const PhotoAlbum = forwardRef<PhotoAlbumRef, PhotoAlbumProps>(({ pages, onProgressChange }, ref) => {
    const progress = useSharedValue(0);
    const context = useSharedValue(0);
    const sheetCount = Math.ceil(pages.length / 2);

    useImperativeHandle(ref, () => ({
        closeBook: (onClosed) => {
            if (progress.value > 0.05) {
                let fired = false;
                const done = () => {
                    if (fired) return;
                    fired = true;
                    if (onClosed) onClosed();
                };

                const workletDone = () => {
                    'worklet';
                    runOnJS(done)();
                };

                progress.value = withSpring(0, SPRING, (finished) => {
                    'worklet';
                    if (finished) {
                        workletDone();
                    }
                });

                setTimeout(done, 380);
            } else {
                if (onClosed) onClosed();
            }
        },
        getProgress: () => progress.value,
    }));

    const panGesture = Gesture.Pan()
        .onBegin(() => {
            context.value = progress.value;
        })
        .onUpdate((e) => {
            const deltaProgress = -e.translationX / PAGE_WIDTH;
            progress.value = Math.max(0, Math.min(sheetCount, context.value + deltaProgress));
            if (onProgressChange) {
                runOnJS(onProgressChange)(progress.value);
            }
        })
        .onEnd((e) => {
            const velocity = -e.velocityX / PAGE_WIDTH;
            const currentResting = Math.round(progress.value);

            let target = Math.round(progress.value + velocity * 0.2);
            target = Math.max(currentResting - 1, Math.min(currentResting + 1, target));
            target = Math.max(0, Math.min(sheetCount, target));

            progress.value = withSpring(target, SPRING, (finished) => {
                if (finished && onProgressChange) {
                    runOnJS(onProgressChange)(target);
                }
            });
        });

    const tapGesture = Gesture.Tap()
        .maxDuration(250)
        .onEnd((e) => {
            const current = Math.round(progress.value);
            if (current === 0) {
                // Tapped anywhere on the closed front cover -> flip open to page 1
                progress.value = withSpring(1, SPRING, () => {
                    if (onProgressChange) runOnJS(onProgressChange)(1);
                });
            } else if (e.x > PAGE_WIDTH) {
                // Tapped right page -> flip forward
                if (current < sheetCount) {
                    progress.value = withSpring(current + 1, SPRING, () => {
                        if (onProgressChange) runOnJS(onProgressChange)(current + 1);
                    });
                }
            } else {
                // Tapped left page -> flip backward
                if (current > 0) {
                    progress.value = withSpring(current - 1, SPRING, () => {
                        if (onProgressChange) runOnJS(onProgressChange)(current - 1);
                    });
                }
            }
        });

    const gesture = Gesture.Exclusive(panGesture, tapGesture);

    const albumAnimatedStyle = useAnimatedStyle(() => {
        const p = progress.value;

        let translateX = 0;

        if (p < 1) {
            translateX = interpolate(p, [0, 1], [-PAGE_WIDTH / 2, 0], Extrapolation.CLAMP);
        } else if (p > sheetCount - 1) {
            translateX = interpolate(p, [sheetCount - 1, sheetCount], [0, PAGE_WIDTH / 2], Extrapolation.CLAMP);
        }

        return {
            transform: [{ translateX }],
        };
    });

    // Dynamic book shadow
    const bookShadowStyle = useAnimatedStyle(() => {
        const p = progress.value;
        const openness = interpolate(p, [0, 1, sheetCount - 1, sheetCount], [0, 1, 1, 0], Extrapolation.CLAMP);
        return {
            shadowColor: '#000',
            shadowOffset: {
                width: 0,
                height: interpolate(openness, [0, 1], [6, 16], Extrapolation.CLAMP),
            },
            shadowOpacity: interpolate(openness, [0, 1], [0.15, 0.28], Extrapolation.CLAMP),
            shadowRadius: interpolate(openness, [0, 1], [10, 30], Extrapolation.CLAMP),
            elevation: interpolate(openness, [0, 1], [6, 20], Extrapolation.CLAMP),
        };
    });

    return (
        <GestureDetector gesture={gesture}>
            <Animated.View style={[styles.albumWrapper, albumAnimatedStyle, bookShadowStyle]}>
                {Array.from({ length: sheetCount }).map((_, index) => {
                    const frontPage = pages[index * 2];
                    const backPage = pages[index * 2 + 1];

                    const isFrontCover = index === 0;
                    const isBackCover = index === sheetCount - 1;

                    return (
                        <Page
                            key={index}
                            index={index}
                            progress={progress}
                            frontPage={frontPage}
                            backPage={backPage}
                            sheetCount={sheetCount}
                            isFrontCover={isFrontCover}
                            isBackCover={isBackCover}
                        />
                    );
                })}

                {/* Central spine gutter shadow */}
                <SpineGutter progress={progress} sheetCount={sheetCount} />

                {/* Book spine */}
                <BookSpine progress={progress} sheetCount={sheetCount} />
            </Animated.View>
        </GestureDetector>
    );
});

export default PhotoAlbum;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#e6e5e1',
    },
    albumWrapper: {
        width: ALBUM_WIDTH,
        height: ALBUM_RENDER_HEIGHT,
        position: 'relative',
    },
    pageContainer: {
        position: 'absolute',
        width: PAGE_WIDTH,
        height: '100%',
        right: 0,
        top: 0,
    },
    strip: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: STRIP_WIDTH,
    },
    coverStyle: {
        backgroundColor: '#CFC7BB',
        borderTopRightRadius: 4,
        borderBottomRightRadius: 4,
    },
    coverContent: {
        position: 'absolute',
        top: 0,
        width: PAGE_WIDTH,
        height: '100%',
        backgroundColor: 'transparent',
    },
    coverStripFace: {
        backgroundColor: 'transparent',
    },
    stripFace: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: STRIP_WIDTH,
        height: '100%',
        overflow: 'hidden',
        backgroundColor: 'transparent',
    },
    pageContent: {
        position: 'absolute',
        top: 0,
        width: PAGE_WIDTH,
        height: '100%',
        backgroundColor: '#faf9f5',
        padding: 10,
    },
    overlay: {
        ...StyleSheet.absoluteFill,
    },
    gloss: {
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
    },

    // Spine edge line
    spineEdgeLine: {
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: 1,
        backgroundColor: 'rgba(255,255,255,0.2)',
    },

    // Book spine — subtle binding band visible when closed
    bookSpine: {
        position: 'absolute',
        top: -1,
        bottom: -1,
        backgroundColor: 'rgba(0,0,0,0.08)',
        zIndex: 1000,
        borderRadius: 2,
    },

    // Spine gutter — overlapping centered shadow layers
    gutterContainer: {
        position: 'absolute',
        left: 0,
        right: 0,
        top: 0,
        bottom: 0,
        zIndex: 997,
        alignItems: 'center',
        justifyContent: 'center',
    },
    gutterLayer: {
        position: 'absolute',
        left: PAGE_WIDTH - 14,
        top: 0,
        bottom: 0,
    },
    innerPageShadow: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
    innerPageShadowRight: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.03)',
    },
});

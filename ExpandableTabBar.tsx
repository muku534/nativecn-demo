import React, { useState } from 'react';
import {
    View,
    Text,
    StyleSheet,
    Pressable,
    Dimensions,
} from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    withSpring,
    interpolate,
    Extrapolate,
    interpolateColor,
} from 'react-native-reanimated';
import { Home, User, Plus, MessageCircle, Users, Archive, X, Search, Bell } from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const TAB_BAR_HEIGHT = 80;
const FAB_SIZE = 56;
const SPRING_CONFIG = { damping: 20, stiffness: 150, mass: 1 };

export default function ExpandableTabBar() {
    const [expanded, setExpanded] = useState(false);
    const progress = useSharedValue(0);

    const toggleExpand = () => {
        const newValue = expanded ? 0 : 1;
        setExpanded(!expanded);
        progress.value = withSpring(newValue, SPRING_CONFIG);
    };

    const backdropStyle = useAnimatedStyle(() => {
        return {
            opacity: progress.value,
            pointerEvents: progress.value > 0 ? 'auto' : 'none',
        };
    });

    const fabStyle = useAnimatedStyle(() => {
        return {
            transform: [
                { rotate: `${progress.value * 45}deg` }
            ],
            backgroundColor: interpolateColor(
                progress.value,
                [0, 1],
                ['#000000', '#f4f4f5'] // From black to light gray
            )
        };
    });

    const iconColorStyle = useAnimatedStyle(() => {
        return {
            color: progress.value > 0.5 ? '#000000' : '#ffffff'
        };
    });

    const modalStyle = useAnimatedStyle(() => {
        return {
            opacity: progress.value,
            transform: [
                { translateY: interpolate(progress.value, [0, 1], [100, 0], Extrapolate.CLAMP) },
                { scale: interpolate(progress.value, [0, 1], [0.8, 1], Extrapolate.CLAMP) }
            ],
            pointerEvents: progress.value > 0 ? 'auto' : 'none',
        };
    });

    return (
        <View style={styles.container}>
            {/* Backdrop */}
            <Animated.View style={[styles.backdrop, backdropStyle]}>
                <Pressable style={StyleSheet.absoluteFill} onPress={toggleExpand} />
            </Animated.View>

            {/* Modal Content */}
            <Animated.View style={[styles.modalContainer, modalStyle]}>
                <View style={styles.modalContent}>
                    <Pressable style={styles.modalItem}>
                        <View style={styles.modalIconContainer}>
                            <MessageCircle size={24} color="#000" />
                        </View>
                        <View style={styles.modalTextContainer}>
                            <Text style={styles.modalTitle}>New Chat</Text>
                            <Text style={styles.modalSubtitle}>Send a message to your contact</Text>
                        </View>
                    </Pressable>
                    <Pressable style={styles.modalItem}>
                        <View style={styles.modalIconContainer}>
                            <Users size={24} color="#000" />
                        </View>
                        <View style={styles.modalTextContainer}>
                            <Text style={styles.modalTitle}>New Contacts</Text>
                            <Text style={styles.modalSubtitle}>Add a contact to be able to send a message</Text>
                        </View>
                    </Pressable>
                    <Pressable style={styles.modalItem}>
                        <View style={styles.modalIconContainer}>
                            <Archive size={24} color="#000" />
                        </View>
                        <View style={styles.modalTextContainer}>
                            <Text style={styles.modalTitle}>Archived</Text>
                            <Text style={styles.modalSubtitle}>See the Archived Chats</Text>
                        </View>
                    </Pressable>
                </View>
            </Animated.View>

            {/* Tab Bar Container */}
            <View style={styles.tabBarContainer}>
                {/* Left Tabs */}
                <Pressable style={styles.tabItem}>
                    <Home size={24} color="#52525b" />
                </Pressable>
                <Pressable style={styles.tabItem}>
                    <Search size={24} color="#52525b" />
                </Pressable>

                {/* FAB */}
                <View style={styles.centerTabItem}>
                    <Pressable style={styles.fabContainer} onPress={toggleExpand}>
                        <Animated.View style={[styles.fab, fabStyle]}>
                            <Plus size={24} color="#ffffff" />
                        </Animated.View>
                    </Pressable>
                </View>

                {/* Right Tabs */}
                <Pressable style={styles.tabItem}>
                    <Bell size={24} color="#52525b" />
                </Pressable>
                <Pressable style={styles.tabItem}>
                    <User size={24} color="#52525b" />
                </Pressable>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: 'center',
    },
    backdrop: {
        position: 'absolute',
        bottom: 0,
        left: -SCREEN_WIDTH,
        right: -SCREEN_WIDTH,
        height: SCREEN_HEIGHT,
        backgroundColor: 'rgba(0, 0, 0, 0.4)',
    },
    tabBarContainer: {
        flexDirection: 'row',
        height: TAB_BAR_HEIGHT,
        backgroundColor: '#ffffff',
        width: '100%',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 10,
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingBottom: 20, // For safe area
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    centerTabItem: {
        width: 80,
        alignItems: 'center',
        justifyContent: 'center',
    },
    fabContainer: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: -32,
    },
    fab: {
        width: FAB_SIZE,
        height: FAB_SIZE,
        borderRadius: FAB_SIZE / 2,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 6,
        elevation: 8,
    },
    modalContainer: {
        position: 'absolute',
        bottom: TAB_BAR_HEIGHT + 24,
        width: SCREEN_WIDTH - 48,
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 8,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        elevation: 10,
    },
    modalContent: {
        flexDirection: 'column',
    },
    modalItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
    },
    modalIconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#f4f4f5',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    modalTextContainer: {
        flex: 1,
    },
    modalTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: '#18181b',
        marginBottom: 2,
    },
    modalSubtitle: {
        fontSize: 13,
        color: '#71717a',
    },
});

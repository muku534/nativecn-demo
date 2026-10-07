import React, { useRef } from 'react';
import { ScrollView, Dimensions, StyleSheet, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface Props {
  pages: React.ReactNode[];
}

export default function PhotoAlbum({ pages }: Props) {
  const scrollViewRef = useRef<ScrollView>(null);

  return (
    <View style={styles.shadowContainer}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        style={styles.container}
        bounces={false}
      >
        {pages.map((page, index) => (
          <View key={index} style={styles.pageContainer}>
            {page}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  shadowContainer: {
    width: width * 0.85,
    height: height * 0.65,
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 10,
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
  },
  pageContainer: {
    width: width * 0.85,
    height: height * 0.65,
    overflow: 'hidden',
  },
});

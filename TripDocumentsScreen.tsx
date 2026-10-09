import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, StatusBar, Text } from 'react-native';
import { DynamicUpload } from './DynamicUpload';

export function TripDocumentsScreen() {
  const [documents, setDocuments] = useState([
    { id: '1', name: 'Flight_Tickets.pdf', total: '2.4MB' }
  ]);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* Header mimicking LinearGradient */}
      <View style={styles.headerGradient}>
        <View style={styles.header}>
          <Text style={styles.title}>Trip Documents</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.listContainer}>
          {/* Showcasing the real use case with DynamicUpload */}
          <View style={styles.uploadWrapper}>
            <DynamicUpload
              fileName="Passport_Copy.jpg"
              fileSize="1.2MB"
              totalSize="3.5MB"
            />
          </View>
          
          {documents.map((doc) => (
            <View key={doc.id} style={styles.uploadWrapper}>
              <DynamicUpload 
                fileName={doc.name} 
                fileSize={doc.total} 
                totalSize={doc.total} 
              />
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F7F7',
  },
  headerGradient: {
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  header: {
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
  },
  scrollContent: {
    padding: 24,
  },
  listContainer: {
    gap: 16,
  },
  uploadWrapper: {
    marginBottom: 16,
  }
});

export default TripDocumentsScreen;

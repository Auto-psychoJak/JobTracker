import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

// Define the Job type
type Job = {
  id: string;
  date: string;
  location: string;
  paymentStatus: string;
  paymentMethod: string;
};

export default function App() {
  // Dummy job data
  const [jobs, setJobs] = useState<Job[]>([
    { id: '1', date: '2025-01-01', location: 'City A', paymentStatus: 'Paid', paymentMethod: 'Cash' },
    { id: '2', date: '2025-01-02', location: 'City B', paymentStatus: 'Unpaid', paymentMethod: 'Check' },
  ]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Tracker</Text>
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <Text>Date: {item.date}</Text>
            <Text>Location: {item.location}</Text>
            <Text>Status: {item.paymentStatus}</Text>
            <Text>Payment: {item.paymentMethod}</Text>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  jobCard: {
    padding: 15,
    marginVertical: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
});

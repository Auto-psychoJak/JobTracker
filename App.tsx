import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Button, Alert } from 'react-native';
import uuid from 'react-native-uuid';

// Define the Job type
type Job = {
  id: string;
  date: string;
  location: string;
  paymentStatus: string;
  paymentMethod: string;
};

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([
    { id: '1', date: '2025-01-01', location: 'City A', paymentStatus: 'Paid', paymentMethod: 'Cash' },
    { id: '2', date: '2025-01-02', location: 'City B', paymentStatus: 'Unpaid', paymentMethod: 'Check' },
  ]);

  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Add or edit a job
  const addJob = () => {
    if (!date || !location || !paymentStatus || !paymentMethod) {
      Alert.alert('Error', 'All fields are required');
      return;
    }
  
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      Alert.alert('Error', 'Invalid date format. Use YYYY-MM-DD');
      return;
    }
  
    if (editingJobId) {
      setJobs(jobs.map((job) =>
        job.id === editingJobId
          ? { ...job, date, location, paymentStatus, paymentMethod }
          : job
      ));
      setEditingJobId(null);
    } else {
      const newJob: Job = {
        id: uuid.v4() as string, // Generate a unique ID
        date,
        location,
        paymentStatus,
        paymentMethod,
      };
      setJobs([...jobs, newJob]);
    }
  
    setDate('');
    setLocation('');
    setPaymentStatus('');
    setPaymentMethod('');
  };
  
  

  // Delete a job
  const deleteJob = (id: string) => {
    setJobs(jobs.filter((job) => job.id !== id));
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Tracker</Text>

      {/* Job Form */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Date (YYYY-MM-DD)"
          value={date}
          onChangeText={setDate}
        />
        <TextInput
          style={styles.input}
          placeholder="Location"
          value={location}
          onChangeText={setLocation}
        />
        <TextInput
          style={styles.input}
          placeholder="Payment Status (Paid/Unpaid)"
          value={paymentStatus}
          onChangeText={setPaymentStatus}
        />
        <TextInput
          style={styles.input}
          placeholder="Payment Method (Cash/Check/Zelle)"
          value={paymentMethod}
          onChangeText={setPaymentMethod}
        />
        <Button title={editingJobId ? "Update Job" : "Add Job"} onPress={addJob} />
        {editingJobId && (
          <Button
            title="Cancel Edit"
            onPress={() => {
              setEditingJobId(null);
              setDate('');
              setLocation('');
              setPaymentStatus('');
              setPaymentMethod('');
            }}
            color="#FF5C5C"
          />
        )}
      </View>

      {/* Job List */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <Text>Date: {item.date}</Text>
            <Text>Location: {item.location}</Text>
            <Text>Status: {item.paymentStatus}</Text>
            <Text>Payment: {item.paymentMethod}</Text>
            <View style={styles.buttonRow}>
              <Button
                title="Edit"
                onPress={() => {
                  setEditingJobId(item.id);
                  setDate(item.date);
                  setLocation(item.location);
                  setPaymentStatus(item.paymentStatus);
                  setPaymentMethod(item.paymentMethod);
                }}
              />
              <Button
                title="Delete"
                onPress={() => deleteJob(item.id)}
                color="#FF5C5C"
              />
            </View>
          </View>
        )}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f5f5f5' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  form: { marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 10,
    marginBottom: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
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
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
});

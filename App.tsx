import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, TextInput, Button, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

type Job = {
  id: string;
  date: string;
  location: string;
  paymentStatus: string;
  paymentMethod: string;
};

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [date, setDate] = useState('');
  const [location, setLocation] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  // Save jobs to AsyncStorage
  const saveJobs = async (jobsToSave: Job[]) => {
    try {
      await AsyncStorage.setItem('jobs', JSON.stringify(jobsToSave));
    } catch (error) {
      console.error('Error saving jobs:', error);
    }
  };

  // Load jobs from AsyncStorage
  const loadJobs = async () => {
    try {
      const savedJobs = await AsyncStorage.getItem('jobs');
      if (savedJobs) {
        setJobs(JSON.parse(savedJobs));
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

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
      const updatedJobs = jobs.map((job) =>
        job.id === editingJobId
          ? { ...job, date, location, paymentStatus, paymentMethod }
          : job
      );
      setJobs(updatedJobs);
      saveJobs(updatedJobs); // Save changes to AsyncStorage
      setEditingJobId(null);
    } else {
      const newJob: Job = {
        id: uuid.v4() as string,
        date,
        location,
        paymentStatus,
        paymentMethod,
      };
      const updatedJobs = [...jobs, newJob];
      setJobs(updatedJobs);
      saveJobs(updatedJobs); // Save changes to AsyncStorage
    }

    setDate('');
    setLocation('');
    setPaymentStatus('');
    setPaymentMethod('');
  };

  // Delete a job
  const deleteJob = (id: string) => {
    const updatedJobs = jobs.filter((job) => job.id !== id);
    setJobs(updatedJobs);
    saveJobs(updatedJobs); // Save changes to AsyncStorage
  };

  // Load jobs when the app starts
  useEffect(() => {
    loadJobs();
  }, []);

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

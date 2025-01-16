import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TextInput,
  Button,
  Alert,
  Switch,
  Modal,
  TouchableOpacity,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import RNPickerSelect from 'react-native-picker-select';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

type Job = {
  id: string;
  date: string;
  companyName: string;
  address: string;
  city: string;
  yards: number;
  paymentStatus: 'Paid' | 'Unpaid';
  paymentMethod: 'Cash' | 'Check' | 'Zelle' | 'Charge';
  notes: string;
};

export default function App() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [yards, setYards] = useState('');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Check' | 'Zelle' | 'Charge'>('Cash');
  const [notes, setNotes] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);

  const saveJobs = async (jobsToSave: Job[]) => {
    try {
      await AsyncStorage.setItem('jobs', JSON.stringify(jobsToSave));
    } catch (error) {
      console.error('Error saving jobs:', error);
    }
  };

  const loadJobs = async () => {
    try {
      const savedJobs = await AsyncStorage.getItem('jobs');
      if (savedJobs) {
        const parsedJobs: Job[] = JSON.parse(savedJobs).map((job: any) => ({
          ...job,
          paymentStatus: job.paymentStatus as 'Paid' | 'Unpaid',
          paymentMethod: job.paymentMethod as 'Cash' | 'Check' | 'Zelle' | 'Charge',
        }));
        setJobs(parsedJobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };
  const deleteJob = (id: string) => {
    const updatedJobs = jobs.filter((job) => job.id !== id);
    setJobs(updatedJobs);
    saveJobs(updatedJobs);
  };

  const addJob = () => {
    if (!address || !city || !yards || !paymentStatus || !paymentMethod) {
      Alert.alert('Error', 'All fields except "Company Name" are required');
      return;
    }


    const formattedDate = date.toISOString().split('T')[0];

    if (editingJobId) {
      const updatedJobs = jobs.map((job) =>
        job.id === editingJobId
          ? {
              ...job,
              date: formattedDate,
              companyName,
              address,
              city,
              yards: parseFloat(yards),
              paymentStatus,
              paymentMethod,
              notes,
            }
          : job
      );
      setJobs(updatedJobs);
      saveJobs(updatedJobs);
      setEditingJobId(null);
    } else {
      const newJob: Job = {
        id: uuid.v4() as string,
        date: formattedDate,
        companyName,
        address,
        city,
        yards: parseFloat(yards),
        paymentStatus,
        paymentMethod,
        notes,
      };
      const updatedJobs = [...jobs, newJob];
      setJobs(updatedJobs);
      saveJobs(updatedJobs);
    }

    closeModal();
  };

  const openModal = () => {
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setDate(new Date());
    setCompanyName('');
    setAddress('');
    setCity('');
    setYards('');
    setPaymentStatus('Paid');
    setPaymentMethod('Cash');
    setNotes('');
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Job Tracker</Text>

      <Button title="Add Job" onPress={openModal} />

      {/* Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={closeModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editingJobId ? 'Edit Job' : 'New Job'}</Text>
            <TouchableOpacity
              onPress={() => setShowDatePicker(true)}
              style={styles.datePicker}
            >
              <Text>{date.toISOString().split('T')[0]}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={date}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selectedDate) => {
                  setShowDatePicker(false);
                  if (selectedDate) setDate(selectedDate);
                }}
              />
            )}
            <TextInput style={styles.input} placeholder="Company Name (optional)" value={companyName} onChangeText={setCompanyName} />
            <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
            <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
            <TextInput style={styles.input} placeholder="Yards (e.g., 3)" value={yards} keyboardType="numeric" onChangeText={(text) => setYards(text.replace(/[^0-9]/g, ''))} />
            <View style={styles.switchContainer}>
              <Text>Payment Status: {paymentStatus}</Text>
              <Switch value={paymentStatus === 'Paid'} onValueChange={(value) => setPaymentStatus(value ? 'Paid' : 'Unpaid')} />
            </View>
            <RNPickerSelect
              onValueChange={(value) => setPaymentMethod(value)}
              items={[
                { label: 'Cash', value: 'Cash' },
                { label: 'Check', value: 'Check' },
                { label: 'Zelle', value: 'Zelle' },
                { label: 'Charge', value: 'Charge' },
              ]}
              value={paymentMethod}
              placeholder={{ label: 'Select Payment Method', value: null }}
              style={pickerSelectStyles}
            />
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Notes" value={notes} onChangeText={setNotes} multiline />
            <Button title={editingJobId ? 'Update Job' : 'Add Job'} onPress={addJob} />
            <Button title="Cancel" onPress={closeModal} color="#FF5C5C" />
          </View>
        </View>
      </Modal>

      {/* Job List */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <Text>Company: {item.companyName}</Text>
            <Text>Address: {item.address}</Text>
            <Text>City: {item.city}</Text>
            <Text>Yards: {item.yards}</Text>
            <Text>Date: {item.date}</Text>
            <Text>Status: {item.paymentStatus}</Text>
            <Text>Payment: {item.paymentMethod}</Text>
            <Text>Notes: {item.notes}</Text>
            <View style={styles.buttonRow}>
              <Button title="Edit" onPress={() => {
                setEditingJobId(item.id);
                setDate(new Date(item.date));
                setCompanyName(item.companyName);
                setAddress(item.address);
                setCity(item.city);
                setYards(item.yards.toString());
                setPaymentStatus(item.paymentStatus);
                setPaymentMethod(item.paymentMethod);
                setNotes(item.notes);
                openModal();
              }} />
              <Button title="Delete" onPress={() => deleteJob(item.id)} color="#FF5C5C" />
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
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff' },
  datePicker: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  jobCard: { padding: 15, marginVertical: 10, backgroundColor: '#fff', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});

const pickerSelectStyles = {
  inputIOS: { fontSize: 16, paddingVertical: 12, paddingHorizontal: 10, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, color: 'black', paddingRight: 30, marginBottom: 10, backgroundColor: '#fff' },
  inputAndroid: { fontSize: 16, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: '#ccc', borderRadius: 4, color: 'black', paddingRight: 30, marginBottom: 10, backgroundColor: '#fff' },
};

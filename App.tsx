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
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import uuid from 'react-native-uuid';

type Job = {
  id: string;
  date: string;
  companyName: string;
  address: string;
  city: string;
  yards: number;
  paymentMethod: 'Cash' | 'Check' | 'Zelle' |'Square'|'Charge';
  paymentStatus: 'Paid' | 'Unpaid';
  checkNumber?: string;
  billingInfo?: {
    companyName?: string;
    address?: string;
    phone?: string;
    email?: string;
  } | null;
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
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Check' | 'Zelle' |'Square'| 'Charge'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [checkNumber, setCheckNumber] = useState('');
  const [billingInfo, setBillingInfo] = useState({ companyName: '', address: '', phone: '' , email: '' });
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
        setJobs(JSON.parse(savedJobs));
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const deleteJob = (id: string) => {
    const updatedJobs = jobs.filter((job) => job.id !== id);
    setJobs(updatedJobs); // Update the state with the filtered array
    saveJobs(updatedJobs); // Save the updated array to AsyncStorage
  };
  

  const addJob = () => {
    if (!address || !city || !yards || !paymentStatus || !paymentMethod) {
      Alert.alert('Error', 'All fields except "Company Name" are required');
      return;
    }
  
    const formattedDate = date.toISOString().split('T')[0];
  
    const newJob: Job = {
      id: uuid.v4() as string,
      date: formattedDate,
      companyName,
      address,
      city,
      yards: parseFloat(yards),
      paymentStatus,
      paymentMethod,
      checkNumber: paymentMethod === 'Check' ? checkNumber : undefined,
      billingInfo: paymentMethod === 'Charge' ? billingInfo : null,
      notes,
    };
  
    if (editingJobId) {
      const updatedJobs = jobs.map((job) =>
        job.id === editingJobId ? { ...job, ...newJob } : job
      );
      setJobs(updatedJobs);
      saveJobs(updatedJobs);
      setEditingJobId(null);
    } else {
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
    setPaymentMethod('Cash');
    setPaymentStatus('Paid');
    setCheckNumber('');
    setBillingInfo({ companyName: '', address: '', phone: '' , email: '' });
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
          <ScrollView contentContainerStyle={styles.scrollContainer}>
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
            
            {/* Payment Method */}
            <View style={styles.radioGroup}>
              <Text style={styles.sectionTitle}>Payment Method:</Text>
              {['Cash', 'Check', 'Zelle','Square', 'Charge'].map((method) => (
                <TouchableOpacity
                  key={method}
                  style={styles.radioOption}
                  onPress={() => setPaymentMethod(method as Job['paymentMethod'])}
                >
                  <Text>{method}</Text>
                  {paymentMethod === method && <View style={styles.radioSelected} />}
                </TouchableOpacity>
              ))}
            </View>

            {/* Sub-Forms */}
            {paymentMethod === 'Check' && (
              <TextInput
                style={styles.input}
                placeholder="Check Number"
                value={checkNumber}
                onChangeText={setCheckNumber}
                keyboardType="numeric"
              />
            )}

          {paymentMethod === 'Charge' && (
            <View>
              <TextInput
                style={styles.input}
                placeholder="Company Name"
                value={billingInfo?.companyName || ''}
                onChangeText={(text) =>
                  setBillingInfo((prev) => ({ ...prev, companyName: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Address"
                value={billingInfo?.address || ''}
                onChangeText={(text) =>
                  setBillingInfo((prev) => ({ ...prev, address: text }))
                }
              />
              <TextInput
                style={styles.input}
                placeholder="Phone"
                value={billingInfo?.phone || ''}
                onChangeText={(text) =>
                  setBillingInfo((prev) => ({ ...prev, phone: text }))
                }
                keyboardType="phone-pad"
              />
              <TextInput
                style={styles.input}
                placeholder="Email"
                value={billingInfo?.email || ''}
                onChangeText={(text) =>
                  setBillingInfo((prev) => ({ ...prev, email: text }))
                }
                keyboardType="email-address"
              />
            </View>
            )}
            <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Notes" value={notes} onChangeText={setNotes} multiline />
            <Button title={editingJobId ? 'Update Job' : 'Add Job'} onPress={addJob} />
            <Button title="Cancel" onPress={closeModal} color="#FF5C5C" />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Job List */}
      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.jobCard}>
            <Text>{item.date}</Text>
            <Text>{item.companyName}</Text>
            <Text>{item.address}</Text>
            <Text>{item.city}</Text>
            <Text>{item.yards}</Text>
            <Text>{item.paymentMethod}</Text>
            {item.paymentMethod === 'Check' && <Text>{item.checkNumber}</Text>}
            {item.paymentMethod === 'Charge' && (
              <View>
                <Text>Company Name: {item.billingInfo?.companyName}</Text>
                <Text>Address: {item.billingInfo?.address}</Text>
                <Text>Phone: {item.billingInfo?.phone}</Text>
                <Text>Email: {item.billingInfo?.email}</Text>
              </View>
            )}
            <Text>{item.paymentStatus}</Text>
            <Text>{item.notes}</Text>
            <View style={styles.buttonRow}>
              <Button title="Edit" onPress={() => {
                setEditingJobId(item.id);
                setDate(new Date(item.date));
                setCompanyName(item.companyName);
                setAddress(item.address);
                setCity(item.city);
                setYards(item.yards.toString());
                setPaymentMethod(item.paymentMethod);
                setPaymentStatus(item.paymentStatus);
                setCheckNumber(item.checkNumber || '');
                setBillingInfo(item.billingInfo || {companyName: '', address: '', phone: '' , email: '' });
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
  sectionTitle:{fontSize: 15, fontWeight: 'bold', marginBottom: 10, textAlign: 'center'},
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff' },
  datePicker: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center' },
  switchContainer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  radioGroup: { marginBottom: 15 },
  radioOption: { flexDirection: 'row', alignItems: 'center', marginVertical: 5 },
  radioSelected: { width: 16, height: 16, borderRadius: 8, backgroundColor: '#000', marginLeft: 10 },
  jobCard: { padding: 15, marginVertical: 10, backgroundColor: '#fff', borderRadius: 8, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 3, elevation: 3 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
});

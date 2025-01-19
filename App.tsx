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
  total: number;
  paymentMethod: 'Cash' | 'Check' | 'Zelle' | 'Charge' | 'Square';
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
  const [total, setTotal] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'Check' | 'Zelle' | 'Charge' | 'Square'>('Cash');
  const [paymentStatus, setPaymentStatus] = useState<'Paid' | 'Unpaid'>('Paid');
  const [checkNumber, setCheckNumber] = useState('');
  const [billingInfo, setBillingInfo] = useState({ companyName: '', address: '', phone: '', email: '' });
  const [notes, setNotes] = useState('');
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc'); // Default to oldest to newest
  const sortJobs = (jobs: Job[], order: 'asc' | 'desc') => {
    return [...jobs].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return order === 'asc' ? dateA - dateB : dateB - dateA; // Ascending or descending
    });
  };
  
  
  // Function to generate dummy jobs
  const generateDummyJobs = (): Job[] => {
    const dummyJobs: Job[] = [];
    const paymentMethods: Job['paymentMethod'][] = ['Cash', 'Check', 'Zelle', 'Charge', 'Square'];
    const paymentStatuses: Job['paymentStatus'][] = ['Paid', 'Unpaid'];
    const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
    const companyNames = ['Acme Concrete', 'BuildSmart', 'ConcretePro', 'Solid Foundations', 'Urban Builders'];
  
    for (let i = 0; i < 14; i++) {
      const randomDate = new Date();
      randomDate.setDate(randomDate.getDate() + i);
  
      const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
      const randomPaymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
      const randomCity = cities[Math.floor(Math.random() * cities.length)];
      const randomCompanyName = companyNames[Math.floor(Math.random() * companyNames.length)];
  
      const dummyJob: Job = {
        id: uuid.v4() as string,
        date: randomDate.toISOString().split('T')[0], // Save date as YYYY-MM-DD
        companyName: randomCompanyName,
        address: `123 Main St, ${randomCity}`,
        city: randomCity,
        yards: Math.floor(Math.random() * 10) + 1, // Random yards between 1 and 10
        total: Math.floor(Math.random() * 5000) + 500, // Random total between $500 and $5500
        paymentMethod: randomPaymentMethod,
        paymentStatus: randomPaymentStatus,
        checkNumber: randomPaymentMethod === 'Check' ? `${Math.floor(Math.random() * 100000)}` : undefined,
        billingInfo: randomPaymentMethod === 'Charge'
          ? { companyName: randomCompanyName, address: `456 Elm St, ${randomCity}`, phone: '555-1234', email: 'info@company.com' }
          : null,
        notes: 'Test job generated for testing purposes.',
      };
  
      dummyJobs.push(dummyJob);
    }
  
    return dummyJobs;
  };
  
  // Hook to load dummy data into the app
  useEffect(() => {
    const dummyData = generateDummyJobs();
    setJobs(dummyData);
    saveJobs(dummyData);
  }, []);
  

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
        const parsedJobs = JSON.parse(savedJobs).map((job: any) => ({
          ...job,
          total: job.total || 0,
        }));
        setJobs(parsedJobs);
      }
    } catch (error) {
      console.error('Error loading jobs:', error);
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short', // Mon
      month: 'short',   // Jan
      day: '2-digit',   // 16
    });
  };

  const addJob = () => {
    if (!address || !city || !yards || !paymentMethod || !total) {
      Alert.alert('Error', 'All required fields must be filled.');
      return;
    }
  
    const formattedDate = date.toISOString().split('T')[0];
  
    if (editingJobId) {
      // Update an existing job
      const updatedJobs = jobs.map((job) =>
        job.id === editingJobId
          ? {
              ...job,
              date: formattedDate,
              companyName,
              address,
              city,
              yards: parseFloat(yards),
              total: parseFloat(total),
              paymentMethod,
               paymentStatus, // Save the payment status
              checkNumber: paymentMethod === 'Check' ? checkNumber : undefined,
              billingInfo: paymentMethod === 'Charge' ? billingInfo : null,
              notes,
            }
          : job
      );
      setJobs(updatedJobs);
      saveJobs(updatedJobs);
      setEditingJobId(null); // Reset editingJobId after editing
    } else {
      // Add a new job
      const newJob: Job = {
        id: uuid.v4() as string,
        date: formattedDate,
        companyName,
        address,
        city,
        yards: parseFloat(yards),
        total: parseFloat(total),
        paymentMethod,
        paymentStatus,
        checkNumber: paymentMethod === 'Check' ? checkNumber : undefined,
        billingInfo: paymentMethod === 'Charge' ? billingInfo : null,
        notes,
      };
      setJobs([...jobs, newJob]);
      saveJobs([...jobs, newJob]);
    }
  
    closeModal(); // Close the modal and reset the form
  };
  
  const deleteJob = (id: string) => {
    const updatedJobs = jobs.filter((job) => job.id !== id); // Remove the job with the given ID
    setJobs(updatedJobs); // Update the state
    saveJobs(updatedJobs); // Save the updated list to AsyncStorage
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
    setTotal('');
    setPaymentMethod('Cash');
    setPaymentStatus('Paid');
    setCheckNumber('');
    setBillingInfo({ companyName: '', address: '', phone: '', email: '' });
    setNotes('');
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      const localDate = new Date(
        selectedDate.getFullYear(),
        selectedDate.getMonth(),
        selectedDate.getDate()
      );
      setDate(localDate);
    }
  };

  useEffect(() => {
    loadJobs();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Pump Hub</Text>

      <TouchableOpacity style={styles.addButton} onPress={openModal}>
        <Text style={styles.addButtonText}>+</Text>
      </TouchableOpacity>


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
                <Text style={styles.dateText}>{formatDate(date)}</Text>
              </TouchableOpacity>

              {showDatePicker && (
                <DateTimePicker
                  value={date}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={onDateChange}
                />
              )}
              <TextInput style={styles.input} placeholder="Company Name (optional)" value={companyName} onChangeText={setCompanyName} />
              <TextInput style={styles.input} placeholder="Address" value={address} onChangeText={setAddress} />
              <TextInput style={styles.input} placeholder="City" value={city} onChangeText={setCity} />
              <TextInput style={styles.input} placeholder="Yards (e.g., 3)" value={yards} keyboardType="numeric" onChangeText={(text) => setYards(text.replace(/[^0-9.]/g, ''))} />
              <TextInput style={styles.input} placeholder="Total Amount" value={total} keyboardType="numeric" onChangeText={(text) => setTotal(text.replace(/[^0-9.]/g, ''))} />
              <View style={styles.switchContainer}>
                <Text>Payment Status: {paymentStatus}</Text>
                <Switch
                  value={paymentStatus === 'Paid'}
                  onValueChange={(value) => setPaymentStatus(value ? 'Paid' : 'Unpaid')}
                />
              </View>

              {/* Payment Method */}
              <View style={styles.tabsContainer}>
                {/* Cash Tab */}
                <TouchableOpacity
                  style={[styles.tab, styles.cashTab, paymentMethod === 'Cash' && styles.activeTab]}
                  onPress={() => setPaymentMethod('Cash')}
                >
                  <Text style={paymentMethod === 'Cash' ? styles.activeTabText : styles.tabText}>
                    Cash
                  </Text>
                </TouchableOpacity>

                {/* Other Tabs */}
                <View style={styles.rowContainer}>
                  {['Check', 'Zelle', 'Charge', 'Square'].map((method) => (
                    <TouchableOpacity
                      key={method}
                      style={[
                        styles.tab,
                        paymentMethod === method && styles.activeTab,
                      ]}
                      onPress={() => setPaymentMethod(method as Job['paymentMethod'])}
                    >
                      <Text style={paymentMethod === method ? styles.activeTabText : styles.tabText}>
                        {method}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
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
                    value={billingInfo.companyName}
                    onChangeText={(text) => setBillingInfo((prev) => ({ ...prev, companyName: text }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Address"
                    value={billingInfo.address}
                    onChangeText={(text) => setBillingInfo((prev) => ({ ...prev, address: text }))}
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Phone"
                    value={billingInfo.phone}
                    onChangeText={(text) => setBillingInfo((prev) => ({ ...prev, phone: text }))}
                    keyboardType="phone-pad"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="Email"
                    value={billingInfo.email}
                    onChangeText={(text) => setBillingInfo((prev) => ({ ...prev, email: text }))}
                    keyboardType="email-address"
                  />
                </View>
              )}

              <TextInput style={[styles.input, { height: 100, textAlignVertical: 'top' }]} placeholder="Notes" value={notes} onChangeText={setNotes} multiline />
              <TouchableOpacity style={styles.button} onPress={addJob}>
                <Text style={styles.buttonText}>{editingJobId ? 'Update Job' : 'Add Job'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Job List */}
      <TouchableOpacity
        style={styles.sortButton}
        onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        <Text style={styles.sortButtonText}>
          Sort: {sortOrder === 'asc' ? 'Oldest to Newest' : 'Newest to Oldest'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={sortJobs(jobs, sortOrder)} // Apply sorting before rendering
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View
            style={[
              styles.jobCard,
              item.paymentStatus === 'Paid' ? styles.paidCard : styles.unpaidCard,
            ]}
          >
            
            
            <Text style={styles.dateText}>{formatDate(new Date(item.date))}</Text>

            <Text>{item.companyName}</Text>
            <Text>{item.address}</Text>
            <Text>{item.city}</Text>
            <Text>{item.yards} yrds</Text>
            <Text>${item.total.toFixed(2)}</Text>
            <Text>{item.paymentMethod}</Text>
            <View style={styles.buttonRow}>
              <Button title="Edit" onPress={() => {
                setEditingJobId(item.id);
                setDate(new Date(item.date));
                setCompanyName(item.companyName);
                setAddress(item.address);
                setCity(item.city);
                setYards(item.yards.toString());
                setTotal(item.total.toString());
                setPaymentMethod(item.paymentMethod);
                setPaymentStatus(item.paymentStatus);
                setCheckNumber(item.checkNumber || '');
                setBillingInfo(
                  item.billingInfo
                    ? {
                        companyName: item.billingInfo.companyName || '', // Default to empty string
                        address: item.billingInfo.address || '',
                        phone: item.billingInfo.phone || '',
                        email: item.billingInfo.email || '',
                      }
                    : { companyName: '', address: '', phone: '', email: '' } // Default object
                );
                
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
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, marginTop: 20, textAlign: 'center' },
  modalContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0, 0, 0, 0.5)' },
  modalContent: { width: '90%', backgroundColor: 'white', padding: 20, borderRadius: 10, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5, elevation: 5 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff' },
  datePicker: { borderWidth: 1, borderColor: '#ccc', padding: 10, marginBottom: 10, borderRadius: 5, backgroundColor: '#fff', alignItems: 'center' },
  dateText: { fontSize: 18, fontWeight: 'bold', color: '#333' },
  button: { backgroundColor: '#007BFF', paddingVertical: 10, borderRadius: 5, alignItems: 'center', marginBottom: 10 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { backgroundColor: '#FF5C5C', paddingVertical: 10, borderRadius: 5, alignItems: 'center' },
  cancelButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  scrollContainer: {
    flexGrow: 1, // Ensure ScrollView grows to fit content
    justifyContent: 'center',
  },
  tabsContainer: {
    marginBottom: 15,
  },
  cashTab: {
    width: '100%', // Full width for the Cash tab
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around', // Distribute other tabs evenly
  },
  tab: {
    flex: 1, // Even width for all tabs in the second row
    paddingVertical: 10,
    marginHorizontal: 5,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
  },
  activeTab: {
    backgroundColor: '#007BFF',
  },
  tabText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#333',
  },
  activeTabText: {
    textAlign: 'center',
    fontSize: 14,
    color: '#fff',
    fontWeight: 'bold',
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
  paidCard: { backgroundColor: '#d4edda', borderColor: '#c3e6cb', borderWidth: 1 },
  unpaidCard: { backgroundColor: '#f8d7da', borderColor: '#f5c6cb', borderWidth: 1 },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },

  switchContainer: {

  },

  addButton: {
    position: 'absolute',      // Float the button
    bottom: 20,                // Distance from the bottom of the screen
    alignSelf: 'center',       // Center horizontally
    backgroundColor: 'rgb(0, 0, 255)', // Semi-transparent blue
    width: 60,                 // Circular dimensions
    height: 60,
    borderRadius: 30,          // Half of width/height for a circle
    justifyContent: 'center',  // Center content inside the button
    alignItems: 'center',
    elevation: 5,              // Add shadow for a floating effect
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    zIndex: 100, // Bring button to the top
  },
  addButtonText: {
    fontSize: 28,              // Large plus symbol
    color: '#fff',             // White text color
    fontWeight: 'bold',
  },

  sortButton: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 15,
  },
  sortButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

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
import MainNavigator from './MainNavigator'; // Replace './App' with the new navigator
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList, WeeklySummary  } from './types'; 



type HomeScreenNavigationProp = StackNavigationProp<RootStackParamList, 'Home'>;

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

  const navigation = useNavigation<HomeScreenNavigationProp>();

  const calculateWeeklyData = (jobs: Job[]): WeeklySummary[] => {
    const groupedData = groupJobsByWeek(jobs, 'asc'); // Group jobs by week in ascending order
    return groupedData.map((group) => ({
      weekEnding: group.weekEnding,
      totalJobs: group.jobs.length,
      totalEarned: group.jobs.reduce((sum, job) => sum + job.total, 0),
      unpaidJobs: group.jobs.filter((job) => job.paymentStatus === 'Unpaid').length,
    }));
  };
  
  
  // Function to generate dummy jobs
  // const generateDummyJobs = (): Job[] => {
  //   const dummyJobs: Job[] = [];
  //   const paymentMethods: Job['paymentMethod'][] = ['Cash', 'Check', 'Zelle', 'Charge', 'Square'];
  //   const paymentStatuses: Job['paymentStatus'][] = ['Paid', 'Unpaid'];
  //   const cities = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix'];
  //   const companyNames = ['Acme Concrete', 'BuildSmart', 'ConcretePro', 'Solid Foundations', 'Urban Builders'];
  
  //   for (let i = 0; i < 14; i++) {
  //     const randomDate = new Date();
  //     randomDate.setDate(randomDate.getDate() + i);
  
  //     const randomPaymentMethod = paymentMethods[Math.floor(Math.random() * paymentMethods.length)];
  //     const randomPaymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
  //     const randomCity = cities[Math.floor(Math.random() * cities.length)];
  //     const randomCompanyName = companyNames[Math.floor(Math.random() * companyNames.length)];
  
  //     const dummyJob: Job = {
  //       id: uuid.v4() as string,
  //       date: randomDate.toISOString().split('T')[0], // Save date as YYYY-MM-DD
  //       companyName: randomCompanyName,
  //       address: `123 Main St, ${randomCity}`,
  //       city: randomCity,
  //       yards: Math.floor(Math.random() * 10) + 1, // Random yards between 1 and 10
  //       total: Math.floor(Math.random() * 5000) + 500, // Random total between $500 and $5500
  //       paymentMethod: randomPaymentMethod,
  //       paymentStatus: randomPaymentStatus,
  //       checkNumber: randomPaymentMethod === 'Check' ? `${Math.floor(Math.random() * 100000)}` : undefined,
  //       billingInfo: randomPaymentMethod === 'Charge'
  //         ? { companyName: randomCompanyName, address: `456 Elm St, ${randomCity}`, phone: '555-1234', email: 'info@company.com' }
  //         : null,
  //       notes: 'Test job generated for testing purposes.',
  //     };
  
  //     dummyJobs.push(dummyJob);
  //   }
  
  //   return dummyJobs;
  // };
  
  // // Hook to load dummy data into the app
  // useEffect(() => {
  //   const dummyData = generateDummyJobs();
  //   setJobs(dummyData);
  //   saveJobs(dummyData);
  // }, []);
  

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
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);

  const toggleCardExpansion = (id: string) => {
    setExpandedCardId((prev) => (prev === id ? null : id)); // Expand or collapse the card
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

  const getWeekEnding = (date: string): string => {
    const jobDate = new Date(date);
    const dayOfWeek = jobDate.getDay(); // 0 for Sunday, ..., 6 for Saturday
    const daysToSaturday = 6 - dayOfWeek; // Days to the next Saturday
    const saturdayDate = new Date(jobDate);
    saturdayDate.setDate(jobDate.getDate() + daysToSaturday);
    return saturdayDate.toLocaleDateString('en-US', {
      weekday: 'short', // Sat
      month: 'short',   // Jan
      day: '2-digit',   // 20
    });
  };

  const groupJobsByWeek = (jobs: Job[], sortOrder: 'asc' | 'desc'): { weekEnding: string; jobs: Job[]; total: number }[] => {
    const sortedJobs = [...jobs].sort((a, b) => {
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  
    const groupedJobs: { [key: string]: { jobs: Job[]; total: number } } = {};
  
    sortedJobs.forEach((job) => {
      const weekEnding = getWeekEnding(job.date);
      if (!groupedJobs[weekEnding]) {
        groupedJobs[weekEnding] = { jobs: [], total: 0 };
      }
      groupedJobs[weekEnding].jobs.push(job);
      groupedJobs[weekEnding].total += job.total; // Add to the weekly total
    });
  
    return Object.keys(groupedJobs).map((weekEnding) => ({
      weekEnding,
      jobs: groupedJobs[weekEnding].jobs,
      total: groupedJobs[weekEnding].total, // Include the total
    }));
  };
  
  const calculateMonthlyTotal = (jobs: Job[]): number => {
    const currentMonth = new Date().getMonth(); // Get the current month (0-based)
    const currentYear = new Date().getFullYear();
    return jobs
      .filter((job) => {
        const jobDate = new Date(job.date);
        return jobDate.getMonth() === currentMonth && jobDate.getFullYear() === currentYear;
      })
      .reduce((sum, job) => sum + job.total, 0); // Sum the totals
  };


  useEffect(() => {
    loadJobs();
  }, []);

  return (
    
    <View style={styles.container}>
      <Text style={styles.title}>Pump Hub</Text>
      {/* Navigate to Weekly Summary Screen */}
      
      {/* Navigate to Weekly Summary Screen */}
      <TouchableOpacity
        style={styles.summaryButton}
        onPress={() =>
          navigation.navigate('WeeklySummary', { weeklyData: calculateWeeklyData(jobs) })
        }
      >
        <Text style={styles.summaryButtonText}>View Weekly Summary</Text>
      </TouchableOpacity>

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
                <Text>{paymentStatus}</Text>
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
        style={styles.sortIcon}
        onPress={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
      >
        <Text style={styles.sortIconText}>{sortOrder === 'asc' ? '↑' : '↓'}</Text>
      </TouchableOpacity>


      <FlatList
  data={groupJobsByWeek(jobs, sortOrder)} // Group and sort jobs by week
  keyExtractor={(item, index) => `week-${index}`} // Unique key for each week
  renderItem={({ item }) => (
    <View>
      {/* Week Header */}
      <Text style={styles.weekHeader}>
        Week ending in {item.weekEnding} - Total: ${item.total.toFixed(2)}
      </Text>

      {/* Horizontal Line */}
      <View style={styles.horizontalLine} />

      {/* Job Cards for the Week */}
      {item.jobs.map((job) => (
        <TouchableOpacity
          key={job.id}
          onPress={() => toggleCardExpansion(job.id)} // Toggle expansion
          style={[
            styles.jobCard,
            job.paymentStatus === 'Paid' ? styles.paidCard : styles.unpaidCard,
          ]}
        >
          {/* Always Visible Summary */}
          <Text style={styles.dateText}>{formatDate(new Date(job.date))}</Text>
          <Text>Company: {job.companyName}</Text>
          <Text>Total: ${job.total.toFixed(2)}</Text>

          {/* Expanded Details */}
          {expandedCardId === job.id && (
            <View>
              <Text>Address: {job.address}</Text>
              <Text>City: {job.city}</Text>
              <Text>Yards: {job.yards}</Text>
              <Text>Payment Method: {job.paymentMethod}</Text>
              <Text>Payment Status: {job.paymentStatus}</Text>
              {job.notes && <Text>Notes: {job.notes}</Text>}

              {/* Edit/Delete Buttons */}
              <View style={styles.buttonRow}>
                <Button
                  title="Edit"
                  onPress={() => {
                    setEditingJobId(job.id); // Set the job ID for editing
                    setDate(new Date(job.date));
                    setCompanyName(job.companyName);
                    setAddress(job.address);
                    setCity(job.city);
                    setYards(job.yards.toString());
                    setTotal(job.total.toString());
                    setPaymentMethod(job.paymentMethod);
                    setPaymentStatus(job.paymentStatus);
                    setCheckNumber(job.checkNumber || '');
                    setBillingInfo(
                      job.billingInfo
                        ? {
                            companyName: job.billingInfo.companyName || '',
                            address: job.billingInfo.address || '',
                            phone: job.billingInfo.phone || '',
                            email: job.billingInfo.email || '',
                          }
                        : { companyName: '', address: '', phone: '', email: '' }
                    );
                    setNotes(job.notes);
                    openModal(); // Open the modal for editing
                  }}
                />
                <Button
                  title="Delete"
                  onPress={() => deleteJob(job.id)} // Delete the job
                  color="#FF5C5C"
                />
              </View>
            </View>
          )}
        </TouchableOpacity>
      ))}
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

  sortIcon: {
    position: 'absolute',
    top: 45,                // Distance from the top
    right: 10,              // Distance from the right edge
    backgroundColor: '#007BFF',
    borderRadius: 20,       // Circular shape
    width: 40,              // Icon size
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,           // Add shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  sortIconText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },

  weekHeader: {
    marginTop: 20,
    marginBottom: 10,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  horizontalLine: {
    height: 2, // Slightly thicker line for visibility
    backgroundColor: '#007BFF', // Blue line for emphasis
    marginVertical: 15, // Space around the line
    marginHorizontal: 10, // Align with job cards
  },
  monthlyTotal: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
    color: '#007BFF',
  },
  summaryButton: {
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
    alignItems: 'center',
  },
  summaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  
});




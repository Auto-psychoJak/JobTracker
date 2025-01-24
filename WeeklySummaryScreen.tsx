import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { WeeklySummary } from './types'
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from './types'; // Adjust the path if necessary

type WeeklySummaryScreenRouteProp = RouteProp<RootStackParamList, 'WeeklySummary'>;

const WeeklySummaryScreen = ({ route }: { route: WeeklySummaryScreenRouteProp }) => {
  const { weeklyData } = route.params;


  return (
    <FlatList
      data={weeklyData}
      keyExtractor={(item) => item.weekEnding}
      renderItem={({ item }) => (
        <View style={styles.summaryCard}>
          <Text style={styles.weekText}>Week ending in {item.weekEnding}</Text>
          <Text>Total Jobs: {item.totalJobs}</Text>
          <Text>Total Earned: ${item.totalEarned.toFixed(2)}</Text>
          <Text>Unpaid Jobs: {item.unpaidJobs}</Text>
        </View>
      )}
    />
  );
};


const styles = StyleSheet.create({
  summaryCard: {
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
  weekText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 5,
  },
});

export default WeeklySummaryScreen;

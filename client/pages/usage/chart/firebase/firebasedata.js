// firebase.js
import { firestore } from './firebase';

const getFirestoreData = async (userId, callback) => {
  try {
    const userActivityRef = firestore.collection('userActivity');

    // Assuming you want to order the data by timestamp in descending order
    const querySnapshot = await userActivityRef
      .where('userId', '==', userId)
      .orderBy('timestamp', 'desc')
      .get();

    const chartData = {
      labels: [], // Timestamps
      datasets: [
        {
          label: 'LLM Cost',
          data: [], // LLM Cost values
          backgroundColor: '#1cdf95',
        },
      ],
    };

    querySnapshot.forEach((doc) => {
      const { timestamp, llm_cost } = doc.data();

      // Assuming llm_cost is a number
      chartData.labels.push(timestamp);
      chartData.datasets[0].data.push(llm_cost);
    });

    // Callback function to pass the chart data to the component
    callback(chartData);

    return () => {}; // This can be used for cleanup if needed
  } catch (error) {
    console.error('Error getting user data:', error);
  }
};

export { getFirestoreData };

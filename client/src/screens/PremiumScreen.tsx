// PremiumScreen.js
import React, {useState} from 'react';
import {View, Text, Button, Alert, Linking} from 'react-native';
import axios from 'axios';
import {URI} from '../../redux/URI'; // Ensure this points to your backend URI

const PremiumScreen = () => {
  const [paymentStatus, setPaymentStatus] = useState('Not Paid');
  const [paymentUrl, setPaymentUrl] = useState(null);

  const handlePayment = async () => {
    try {
      // Request to create a payment intent on your server
      const response = await axios.post(`${URI}/create-payment-intent`, {});

      // The response should include the payment intent details
      const paymentIntent = response.data;

      // Check for next_action and open 3D Secure URL if necessary
      const {next_action} = paymentIntent.data.attributes;
      if (next_action && next_action.redirect.url) {
        const url = next_action.redirect.url;

        // Open the 3D Secure URL in the default browser
        const supported = await Linking.canOpenURL(url);
        if (supported) {
          await Linking.openURL(url);
          setPaymentStatus('Payment Processing');
        } else {
          setPaymentStatus('Payment Failed');
          Alert.alert('Payment Error', 'Unable to process payment');
        }
      } else {
        setPaymentStatus('Payment Failed');
        Alert.alert('Payment Error', 'Unable to process payment');
      }
    } catch (error) {
      console.error('Error creating payment intent:', error);
      Alert.alert('Payment Error', 'Unable to create payment intent');
    }
  };

  return (
    <View>
      <Text>PremiumScreen</Text>
      <Text>Payment Status: {paymentStatus}</Text>
      <Button title="Pay" onPress={handlePayment} />
    </View>
  );
};

export default PremiumScreen;

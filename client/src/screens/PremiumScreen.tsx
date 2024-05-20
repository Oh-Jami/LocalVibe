import React, {useState} from 'react';
import {View, Text, Button, Alert} from 'react-native';
import {createPaymentIntent} from '../../redux/actions/paymentAction';
import {useDispatch} from 'react-redux';

const PremiumScreen = () => {
  const [paymentStatus, setPaymentStatus] = useState('Not Paid');
  const dispatch = useDispatch();

  const handlePayment = async () => {
    try {
      await createPaymentIntent()(dispatch);
    } catch (error) {
      console.error('Error creating payment screen:', error);
      Alert.alert('Payment Error', 'Unable to create payment intent.');
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
function dispatch(arg0: {type: string; payload?: any}): void {
  throw new Error('Function not implemented.');
}

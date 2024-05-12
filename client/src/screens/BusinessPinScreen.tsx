import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {useNavigation} from '@react-navigation/native';

type Props = {
  route: any;
};

const BusinessPinScreen = ({route}: Props) => {
  const {pins} = route.params;
  const navigation = useNavigation();

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <Image source={{uri: pins.image.url}} style={styles.image} />
      <View style={styles.detailsContainer}>
        <Text style={styles.businessName}>{pins.businessName}</Text>
        <Text style={styles.description}>{pins.description}</Text>
        <Text style={styles.contactInfo}>Contact Info:</Text>
        <Text style={styles.contactInfo}>Phone: {pins.contactInfo.phone}</Text>
        <Text style={styles.contactInfo}>Email: {pins.contactInfo.email}</Text>
        <Text style={styles.contactInfo}>
          Website: {pins.contactInfo.website}
        </Text>
      </View>
      <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    marginBottom: 20,
  },
  detailsContainer: {
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  businessName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    marginBottom: 10,
    textAlign: 'center',
  },
  contactInfo: {
    fontSize: 14,
    marginBottom: 5,
    textAlign: 'center',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'blue',
  },
});

export default BusinessPinScreen;

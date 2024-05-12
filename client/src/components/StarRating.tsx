import React from 'react';
import {StyleSheet, View, Text, Image} from 'react-native';

const StarRating = (props: any) => {
  // This array will contain our star tags. We will include this
  // array between the view tag.
  let stars = [];
  // Loop 5 times
  for (var i = 1; i <= 5; i++) {
    // set the path to filled stars
    let name = 'ios-star';
    // If ratings is lower, set the path to unfilled stars
    if (i > props.ratings) {
      name = 'ios-star-outline';
    }

    stars.push(
      <View style={styles.star}>
        <Image source={require('../assets/maps/star.png')} />
      </View>,
    );
  }

  return (
    <View style={styles.container}>
      {stars}
      <Text style={styles.text}>({props.reviews})</Text>
    </View>
  );
};

export default StarRating;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  star: {
    color: '#FF8C00',
  },
  text: {
    fontSize: 12,
    marginLeft: 5,
    color: '#444',
  },
});

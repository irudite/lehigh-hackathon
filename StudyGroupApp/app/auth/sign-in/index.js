import { View, Text, TextInput, StyleSheet } from 'react-native'
import React, { useEffect, useState } from 'react'
import { router, useNavigation } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from './../../../configs/FirebaseConfig'

export default function SignIn() {

  const navigation = useNavigation();

  const [email, setEmail] = useState();
  const [password, setPassword] = useState();

  useEffect(() => {
    navigation.setOptions({
      headerShown: false
    })
  }, [])

  const OnLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        console.log(email, password);
        const user = userCredential.user;
        console.log(user);
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
  }

  return (
    <View
      style={{
        padding: 25,
        marginTop: 25
      }}
    >
      <Text
        style={{
          textAlign: 'center',
          fontSize: 35,
        }}
      >
        Sign In
      </Text>

      <View>
        <Text
          style={{
            fontSize: 20,
          }}>Email</Text>
        <TextInput style={styles.input} placeholder='Enter Email'
        onChangeText={(value) => setEmail(value)}></TextInput>
      </View>

      <View>
        <Text
          style={{
            fontSize: 20,
          }}>Password</Text>
        <TextInput
          style={styles.input}
          type='passwrd'
          placeholder='Enter Password'
          secureTextEntry={true}
          onChangeText={(value) => setPassword(value)}></TextInput>
      </View>

      <TouchableOpacity style={styles.button} onPress={ OnLogin }>
        <Text style={styles.buttonText}>Sign In</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => router.replace('auth/sign-up')}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  input: {
    padding: 15,
    margin: 10,
    borderWidth: 1,
    borderRadius: 15,
    borderColor: 'black',
  },

  button: {
    padding: 20,
    backgroundColor: 'black', // Ensure this color is defined
    borderRadius: 20, // This will create a circular effect
    marginTop: 20,
    alignItems: 'center', // Center text inside the button
    justifyContent: 'center'
  },

  buttonText: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
  },
})

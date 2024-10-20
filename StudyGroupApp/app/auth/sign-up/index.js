import { View, Text, StyleSheet, TextInput } from 'react-native'
import React, { useEffect, useState } from 'react'
import { useNavigation, useRouter } from 'expo-router'
import { TouchableOpacity } from 'react-native'
import { createUserWithEmailAndPassword } from 'firebase/auth'
import { auth } from './../../../configs/FirebaseConfig'

export default function SignUp() {
    const navigation = useNavigation();
    const router = useRouter();

    const [email, setEmail] = useState();
    const [password, setPassword] = useState();

    useEffect(() => {
        navigation.setOptions({
            headerShown: false
        })
    }, []);

    const OnCreateAccount =()=> {
            createUserWithEmailAndPassword(auth, email, password)
            .then((userCredential) => {
                console.log(email, password);
                // Signed up 
                const user = userCredential.user;
                console.log(user);
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;
                console.log(errorMessage, errorCode);
            });
    }

    return (
        <View
            style={{
                padding: 25,
                paddingTop: 50,
            }}
        >
            <Text
                style={{
                    fontSize: 35,
                    padding: 10,
                }}
            >Create New Account</Text>

            <View>
                <Text
                    style={{
                        fontSize: 20,
                    }}>Email</Text>
                <TextInput style={styles.input}
                    placeholder='Enter Email'
                    onChangeText={(value) => setEmail(value)}></TextInput>
            </View>

            <View>
                <Text
                    style={{
                        fontSize: 20,
                    }}>Password</Text>
                <TextInput
                    style={styles.input}
                    type='password'
                    placeholder='Enter Password'
                    secureTextEntry={true}
                    onChangeText={(value) => setPassword(value)}>
                </TextInput>
            </View>

            <TouchableOpacity style={styles.button} onPress={OnCreateAccount}>
                <Text style={styles.buttonText}>Create Account</Text>
            </TouchableOpacity>


            <TouchableOpacity style={styles.button} onPress={() => router.replace('auth/sign-in')}>
                <Text style={styles.buttonText}>Sign In</Text>
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
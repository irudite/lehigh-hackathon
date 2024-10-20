import { View, Text, Image, StyleSheet, TouchableOpacity} from 'react-native'
import React from 'react'
import {Colors} from './../constants/Colors'
import { useRouter } from 'expo-router'

export default function Login() {

    const router=useRouter();

    return (
    <View style={styles.container}>
        <Image source={require('./../assets/images/login_wallpaper.jpg')}/> 
        <View style={styles.overlay}>
            <Text style={styles.welcomeText}>Welcome to StudyBud!</Text>
            <Text style={styles.slogan}>Learn Together, Succeed Together!</Text>
            <TouchableOpacity style={styles.button}
                onPress={()=>router.push('auth/sign-in')}
            >
                <Text style={styles.buttonText}>Login</Text>
            </TouchableOpacity>
        </View>
    </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center', // Center content
        justifyContent: 'center', // Center vertically
    },
    overlay: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
    },
    welcomeText: {
        textAlign: 'center',
        padding: 20,
        fontSize: 24,
        fontWeight: 'bold',
    },
    slogan: {
        textAlign: 'center',
        fontSize: 18,
        marginVertical: 10,
    },
    button: {
        padding: 20,
        backgroundColor: Colors.BLACK, // Ensure this color is defined
        borderRadius: 20, // This will create a circular effect
        marginTop: 20,
        alignItems: 'center', // Center text inside the button
    },
    buttonText: {
        color: 'white',
        fontWeight: 'bold',
        textAlign: 'center',
    },
});
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getAuth } from "firebase/auth";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyCQfJ2ihXlDXdn0b6Zg8iT2gn7z8P0uTZA",
  authDomain: "study-bud-5a430.firebaseapp.com",
  projectId: "study-bud-5a430",
  storageBucket: "study-bud-5a430.appspot.com",
  messagingSenderId: "418452552601",
  appId: "1:418452552601:web:2a40ecf3a580cd2c537108",
  measurementId: "G-YC1XG46BKJ"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
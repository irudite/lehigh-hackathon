//imports
import { Text, View, /* @tutinfo Import <CODE>StyleSheet</CODE> to define styles. */ StyleSheet } from 'react-native';
import Login from './../components/Login'

export default function Index() {
  return (
    <View 
        style={{
            alignItems: 'center',
            flex: 1,
            justifyContent: 'center',
        }}
    >
        <Login></Login>
    </View>
  );
}


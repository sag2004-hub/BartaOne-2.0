import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../hooks/useAuth';

// Import Auth Screens
import Welcome from './(auth)/Welcome';
import SelectRole from './(auth)/SelectRole';
import ViewerLogin from './(auth)/ViewerLogin';
import ViewerSignup from './(auth)/ViewerSignup';
import OwnerLogin from './(auth)/OwnerLogin';
import OwnerSignup from './(auth)/OwnerSignup';
import ForgotPassword from './(auth)/ForgotPassword';
import VerifyEmail from './(auth)/VerifyEmail';

// Import Viewer Screens
import Home from './(viewer)/Home';
import Search from './(viewer)/Search';
import ChannelDetails from './(viewer)/ChannelDetails';
import ArticleDetails from './(viewer)/ArticleDetails';
import VideoPlayer from './(viewer)/VideoPlayer';
import LiveTV from './(viewer)/LiveTV';
import Profile from './(viewer)/Profile';
import Settings from './(viewer)/Settings';

// Import Owner Screens
import Dashboard from './(owner)/Dashboard';
import CreateChannel from './(owner)/CreateChannel';
import UploadArticle from './(owner)/UploadArticle';
import UploadVideo from './(owner)/UploadVideo';
import GoLive from './(owner)/GoLive';
import ManagePosts from './(owner)/ManagePosts';
import Subscribers from './(owner)/Subscribers';
import OwnerProfile from './(owner)/Profile';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Viewer Tab Navigator
function ViewerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Search') {
            iconName = focused ? 'search' : 'search-outline';
          } else if (route.name === 'Live') {
            iconName = focused ? 'tv' : 'tv-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={Home} 
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Search" 
        component={Search} 
        options={{
          tabBarLabel: 'Search',
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={LiveTV} 
        options={{
          tabBarLabel: 'Live',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={Profile} 
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

// Owner Tab Navigator
function OwnerTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          if (route.name === 'Dashboard') {
            iconName = focused ? 'grid' : 'grid-outline';
          } else if (route.name === 'Upload') {
            iconName = focused ? 'cloud-upload' : 'cloud-upload-outline';
          } else if (route.name === 'Live') {
            iconName = focused ? 'radio' : 'radio-outline';
          } else if (route.name === 'OwnerProfile') {
            iconName = focused ? 'person' : 'person-outline';
          }
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#FF6B6B',
        tabBarInactiveTintColor: '#888',
        tabBarStyle: {
          backgroundColor: '#FFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
          paddingBottom: 8,
          paddingTop: 8,
          height: 60,
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Dashboard" 
        component={Dashboard} 
        options={{
          tabBarLabel: 'Dashboard',
        }}
      />
      <Tab.Screen 
        name="Upload" 
        component={UploadArticle} 
        options={{
          tabBarLabel: 'Upload',
        }}
      />
      <Tab.Screen 
        name="Live" 
        component={GoLive} 
        options={{
          tabBarLabel: 'Go Live',
        }}
      />
      <Tab.Screen 
        name="OwnerProfile" 
        component={OwnerProfile} 
        options={{
          tabBarLabel: 'Profile',
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppLayout() {
  // You can use useAuth hook here to check user state
  // const { user, isLoading } = useAuth();
  
  // For now, we'll use a simple check
  // This will be expanded when we implement the AuthContext

  return (
    <Stack.Navigator 
      initialRouteName="Welcome"
      screenOptions={{
        headerStyle: {
          backgroundColor: '#FFF',
        },
        headerTitleStyle: {
          color: '#333',
          fontWeight: '600',
        },
        headerTintColor: '#333',
        headerShadowVisible: false,
        animation: 'slide_from_right',
      }}
    >
      {/* Auth Screens - No header on Welcome */}
      <Stack.Screen 
        name="Welcome" 
        component={Welcome} 
        options={{ 
          headerShown: false,
          animation: 'fade',
        }} 
      />
      <Stack.Screen 
        name="SelectRole" 
        component={SelectRole} 
        options={{ 
          title: 'Select Role',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="ViewerLogin" 
        component={ViewerLogin} 
        options={{ 
          title: 'Viewer Login',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="ViewerSignup" 
        component={ViewerSignup} 
        options={{ 
          title: 'Create Account',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="OwnerLogin" 
        component={OwnerLogin} 
        options={{ 
          title: 'Owner Login',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="OwnerSignup" 
        component={OwnerSignup} 
        options={{ 
          title: 'Create Owner Account',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="ForgotPassword" 
        component={ForgotPassword} 
        options={{ 
          title: 'Reset Password',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="VerifyEmail" 
        component={VerifyEmail} 
        options={{ 
          title: 'Verify Email',
          headerBackTitle: 'Back',
        }} 
      />
      
      {/* Viewer Screens - Main App */}
      <Stack.Screen 
        name="ViewerHome" 
        component={ViewerTabs} 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      
      {/* Owner Screens - Main App */}
      <Stack.Screen 
        name="OwnerDashboard" 
        component={OwnerTabs} 
        options={{ 
          headerShown: false,
          gestureEnabled: false,
        }} 
      />
      
      {/* Shared Screens - Accessible from both roles */}
      <Stack.Screen 
        name="ChannelDetails" 
        component={ChannelDetails} 
        options={{ 
          title: 'Channel',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="ArticleDetails" 
        component={ArticleDetails} 
        options={{ 
          title: 'Article',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="VideoPlayer" 
        component={VideoPlayer} 
        options={{ 
          title: 'Video',
          headerBackTitle: 'Back',
          headerShown: false,
        }} 
      />
      
      {/* Viewer-only Screens */}
      <Stack.Screen 
        name="Settings" 
        component={Settings} 
        options={{ 
          title: 'Settings',
          headerBackTitle: 'Back',
        }} 
      />
      
      {/* Owner-only Screens */}
      <Stack.Screen 
        name="CreateChannel" 
        component={CreateChannel} 
        options={{ 
          title: 'Create Channel',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="UploadArticle" 
        component={UploadArticle} 
        options={{ 
          title: 'Write Article',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="UploadVideo" 
        component={UploadVideo} 
        options={{ 
          title: 'Upload Video',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="GoLive" 
        component={GoLive} 
        options={{ 
          title: 'Go Live',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="ManagePosts" 
        component={ManagePosts} 
        options={{ 
          title: 'Manage Posts',
          headerBackTitle: 'Back',
        }} 
      />
      <Stack.Screen 
        name="Subscribers" 
        component={Subscribers} 
        options={{ 
          title: 'Subscribers',
          headerBackTitle: 'Back',
        }} 
      />
    </Stack.Navigator>
  );
}
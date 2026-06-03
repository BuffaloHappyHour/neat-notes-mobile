const IS_DEV_CLIENT = process.env.APP_VARIANT === "development";

module.exports = {
  expo: {
    name: IS_DEV_CLIENT ? "Neat Notes Dev" : "Neat Notes",
    slug: "neat-notes",
    version: "1.1.4",
    orientation: "portrait",
    icon: "./assets/images/icon.png",
    scheme: IS_DEV_CLIENT ? "neatnotesdev" : "neatnotes",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,

    ios: {
      supportsTablet: true,
      bundleIdentifier: IS_DEV_CLIENT
        ? "com.neatnotesapp.neatnotes.dev"
        : "com.neatnotesapp.neatnotes",
      buildNumber: "50",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
        NSUserNotificationUsageDescription:
          "Allow Neat Notes to send you palate updates and event notifications",
        NSAppleSignInUsageDescription:
          "Sign in quickly and securely with your Apple ID",
      },
    },

    android: {
      package: IS_DEV_CLIENT
        ? "com.neatnotesapp.neatnotes.dev"
        : "com.neatnotesapp.neatnotes",
      googleServicesFile: process.env.GOOGLE_SERVICES_JSON ?? "./google-services.json",
      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      permissions: [
        "android.permission.CAMERA",
        "android.permission.WRITE_EXTERNAL_STORAGE",
      ],
    },

    web: {
      output: "single",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      "@react-native-community/datetimepicker",
      [
        "expo-camera",
        {
          cameraPermission: "Allow Neat Notes to access your camera",
        },
      ],
      [
        "expo-notifications",
        {
          iosDisplayInForeground: true,
        },
      ],
      [
        "expo-location",
        {
          locationWhenInUsePermission:
            "Neat Notes uses your location to find nearby whiskey events and venues",
        },
      ],
      [
        "expo-media-library",
        {
          photosPermission: "Allow Neat Notes to save your event QR code to your photo library",
          savePhotosPermission: "Allow Neat Notes to save your event QR code to your photo library",
          isAccessMediaLocationEnabled: false,
          granularPermissions: [],
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 1179,
          resizeMode: "cover",
          backgroundColor: "#1a0f00",
          dark: {
            backgroundColor: "#1a0f00",
          },
        },
      ],
      "expo-apple-authentication",
      [
        "expo-build-properties",
        {
          android: {
            newArchEnabled: true,
          },
        },
      ],
    ],

    updates: {
      url: "https://u.expo.dev/85720fd6-e8f6-405c-b247-40af3fea9563",
    },

   runtimeVersion: {
  policy: "fingerprint",
},

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      googleIosClientId: "532540782942-1ri6cahndukdd8q5u7cd4ibhv9mv2aqn.apps.googleusercontent.com",
      router: {},
      eas: {
        projectId: "85720fd6-e8f6-405c-b247-40af3fea9563",
      },
    },
  },
};
const IS_DEV_CLIENT = process.env.APP_VARIANT === "development";

module.exports = {
  expo: {
    name: IS_DEV_CLIENT ? "Neat Notes Dev" : "Neat Notes",
    slug: "neat-notes",
    version: "1.0.5",
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
      buildNumber: "47",
      infoPlist: {
        ITSAppUsesNonExemptEncryption: false,
      },
    },

    android: {
      package: IS_DEV_CLIENT
        ? "com.neatnotesapp.neatnotes.dev"
        : "com.neatnotesapp.neatnotes",
      adaptiveIcon: {
        backgroundColor: "#000000",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
    },

    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
    },

    plugins: [
      "expo-router",
      [
        "expo-camera",
        {
          cameraPermission: "Allow Neat Notes to access your camera",
        },
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#000000",
          dark: {
            backgroundColor: "#000000",
          },
        },
      ],
      [
        "expo-build-properties",
        {
          android: {
            newArchEnabled: true,
          },
        },
      ],
    ],

    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },

    extra: {
      router: {},
      eas: {
        projectId: "85720fd6-e8f6-405c-b247-40af3fea9563",
      },
    },
  },
};
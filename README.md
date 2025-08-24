# HikeSafeChat

HikeSafeChat is a mobile application designed to help hikers communicate safely and efficiently, even in remote areas. Built with React Native, it provides real-time chat, location sharing, and safety features tailored for outdoor enthusiasts and group adventures.

---

## 📱 Screenshots

![Chat Screen](assets/screenshot-chat.png)
![Location Sharing](assets/screenshot-location.png)

---

## 🚀 Features
- **Real-time Chat:** Seamless messaging between hikers, even with intermittent connectivity.
- **Location Sharing:** Share your live location with your group for safety and coordination.
- **Emergency Alerts:** Instantly notify your group and emergency contacts in case of trouble.
- **Device-to-Device BLE:** Communicate over Bluetooth Low Energy when no cell service is available.
- **User-friendly Interface:** Simple and intuitive design for quick access to essential features.
- **Cross-platform:** Runs on both Android and iOS devices.

---

## 🛠️ Installation

### Prerequisites
- Node.js (v14 or newer)
- npm or yarn
- React Native CLI
- Android Studio or Xcode (for device emulation)

### Setup
1. Clone the repository:
   ```bash
   git clone <repo-url>
   cd HikeSafeChat
   ```
2. Install dependencies:
   ```bash
   npm install
   # or
yarn install
   ```
3. Start the Metro bundler:
   ```bash
   npx react-native start
   ```
4. Run on Android:
   ```bash
   npx react-native run-android
   ```
   Or on iOS:
   ```bash
   npx react-native run-ios
   ```

---

## ▶️ Usage
1. Launch the app on your device or emulator.
2. Pair with nearby devices using Bluetooth (BLE) for offline chat.
3. Start a chat, share your location, or send emergency alerts as needed.
4. Use the intuitive navigation to switch between chat, device connection, and settings screens.

---

## 📁 Project Structure
```
HikeSafeChat/
├── App.js                # Main application entry
├── assets/               # App icons, images, and screenshots
├── components/           # React Native UI components
├── services/             # BLE and other service logic
├── styles/               # App-wide styles
├── android/              # Android native project
├── ios/                  # iOS native project
├── package.json          # Project metadata & dependencies
├── README.md             # Project documentation
└── ...
```

---

## 📦 Dependencies
See `package.json` for the full list. Key dependencies include:
- `react`
- `react-native`
- `react-navigation`
- `@react-native-community/ble-plx` (for BLE communication)

---

## 🤝 Contributing
Contributions are welcome! Please fork the repo and submit a pull request. For major changes, open an issue first to discuss what you would like to change.

---

## 📝 License
This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

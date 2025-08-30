// BLE Configuration
export const BLE_CONFIG = {
  SERVICE_UUID: "12345678-1234-1234-1234-123456789abc",
  SEND_CHAR_UUID: "11111111-2222-3333-4444-555555555555",
  MESH_CHAR_UUID: "87654321-4321-4321-4321-cba987654321",
  SCAN_TIMEOUT: 15000,
  MAX_MESSAGE_LENGTH: 200,
  COLORS: {
    primary: '#3498db',
    secondary: '#2ecc71',
    background: '#2c3e50',
    text: '#ecf0f1',
    error: '#e74c3c',
    success: '#2ecc71',
    warning: '#f39c12',
    disabled: '#95a5a6',
  }
};

// Storage Keys
export const STORAGE_KEYS = {
  MESSAGES: '@HikeSafe:messages',
  DEVICE: '@HikeSafe:lastDevice',
};

// Message Types
export const MESSAGE_TYPES = {
  SENT: 'sent',
  RECEIVED: 'received',
  SYSTEM: 'system',
  ERROR: 'error',
};
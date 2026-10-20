const { withAndroidManifest } = require('@expo/config-plugins');

// Lingo Frekans tamamen offline çalışır. Bazı kütüphaneler prebuild
// sırasında ihtiyaç duyulmayan izinleri otomatik ekliyor
// (INTERNET, SYSTEM_ALERT_WINDOW, READ/WRITE_EXTERNAL_STORAGE).
// Bu plugin, her `expo prebuild` sonrasında bu izinleri manifestten
// kaldırarak Play Store incelemesinde gereksiz izin uyarısı almayı önler.
const PERMISSIONS_TO_REMOVE = [
  'android.permission.SYSTEM_ALERT_WINDOW',
  'android.permission.READ_EXTERNAL_STORAGE',
  'android.permission.WRITE_EXTERNAL_STORAGE',
];

module.exports = function withCleanPermissions(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    if (Array.isArray(manifest['uses-permission'])) {
      manifest['uses-permission'] = manifest['uses-permission'].filter((perm) => {
        const name = perm.$ && perm.$['android:name'];
        return !PERMISSIONS_TO_REMOVE.includes(name);
      });
    }
    return config;
  });
};

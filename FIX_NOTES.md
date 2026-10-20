# Lingo Frekans 2.0.1 — Android açılış düzeltmeleri

Bu sürüm kaynak proje incelemesine göre güncellendi.

## Yapılan düzeltmeler

- Expo SDK 57 bağımlılığı `~57.0.15` ile hizalandı.
- `expo-status-bar` `~57.0.1` ile hizalandı.
- React Native `0.86.2` ile Expo 57 güncel patch seviyesi eşleştirildi.
- Android `versionCode` 2 → 3 ve uygulama sürümü 2.0.0 → 2.0.1 yapıldı; eski APK'nın üzerine güncel sürüm kurulabilmesi kolaylaştırıldı.
- Release Android projesindeki gereksiz Network Inspector ayarı kaldırıldı.
- Splash ekranı arka planı uygulamanın koyu temasına hizalandı.
- Eksik olduğu halde README'de referans verilen Windows APK build scripti eklendi.

## Önemli teşhis

Önceki projede `package.json` Expo'yu `~57.0.1` olarak tanımlarken lock dosyasında Expo `57.0.15` ve React Native `0.86.2` bulunuyordu. Expo SDK 57'nin güncel patch sürümlerinde React Native 0.86.2 kullanımı öneriliyor; sürüm hizasızlığı Android açılışında native/JS uyumsuzluklarına yol açabilir.

Ayrıca Expo SDK 57 ile ilgili bazı Android açılış/çökme problemleri güncel patch sürümlerinde düzeltilmiş durumda. Bu nedenle sadece uygulama kodunu değil, native Expo sürümünü de hizalamak gerekliydi.

## APK üretimi

Windows'ta `BUILD_APK_WINDOWS.bat` dosyasını çalıştır. Script:

1. `npm ci`
2. Expo bağımlılık kontrolü
3. temiz Android prebuild
4. release APK build

adımlarını uygular.

APK çıktısı:

`android/app/build/outputs/apk/release/app-release.apk`

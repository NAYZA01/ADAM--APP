# ADAM — Google ile Giriş / Bulut Yedekleme Kurulumu

## ✅ Tamamlananlar
- Firebase projesi oluşturuldu: `adam-viking-english`
- Authentication'da Google ve Email/Password sağlayıcıları açık
- Firestore Database oluşturuldu (test modunda)
- Web app config kodun içine işlendi (`services/firebase.ts`)
- Web Client ID ve Android Client ID kodun içine işlendi (`services/googleAuth.ts`)
- `App.tsx` güncellendi: Google ile giriş, ayarlarda hesap/senkronizasyon bölümü, otomatik bulut yedekleme
- SHA-1 sertifikası Google Cloud Console'a eklendi (`preview` build profili için)

## ⚠️ Şu an geçerli olan build: sadece "preview" profili
SHA-1'i EAS'in `preview` build profilinin keystore'undan aldık. Yani Google girişi **sadece bu keystore ile
alınan APK'larda** çalışır (`eas build --platform android --profile preview`).

İleride Play Store'a yüklemek için `production` profiliyle build alırsan, o profilin **kendi SHA-1'i**
farklı olacağı için Google girişi o build'de çalışmaz — o zaman aynı adımları (`eas credentials` →
production profilini seç → SHA-1'i al → Google Cloud Console'a yeni bir Android OAuth Client ID daha
ekle → o Client ID'yi de `services/googleAuth.ts` dosyasına ekle, örn. ikinci bir androidClientId olarak
ya da mevcut olanın yanına) tekrar yapman gerekecek. İstersen o zaman yine buraya gel, birlikte hallederiz.

## 🔒 Firestore güvenlik kuralı — MUTLAKA UYGULA
Firestore şu an "test modunda" — yani 30 gün boyunca **herkes** (kimliği doğrulanmış ya da değil) tüm
veriyi okuyup yazabilir. Bu süre dolmadan önce, hatta hemen şimdi, projeye eklediğim
`firestore.rules` dosyasındaki kuralı Firebase Console'a yapıştırmalısın:

1. Firebase Console → Firestore Database → üstteki **Rules** sekmesine git
2. Oradaki içeriği sil, `firestore.rules` dosyasının içeriğini yapıştır
3. **Publish** butonuna bas

Bu kural sayesinde her kullanıcı SADECE kendi verisine erişebilir, başkasının ilerlemesini göremez/değiştiremez.

## 📲 Uygulamayı test etme
1. Zip'i açıp projenin üzerine kopyala (mevcut `node_modules` klasörünü silip yeniden `npm install` çalıştır,
   çünkü `package.json`'a yeni paketler eklendi)
2. `npm install`
3. `eas build --platform android --profile preview` ile yeni bir APK al (Google girişi olan ilk build bu olacak)
4. Telefona kur, aç, "Continue with Google" butonuna bas, kendi Gmail hesabınla giriş yap
5. Ayarlar ekranından da bağlantı durumunu ve çıkış yap seçeneğini görebilirsin
6. Uygulamayı silip tekrar kurup aynı Google hesabıyla giriş yaptığında ilerlemenin geri geldiğini göreceksin —
   bu, verinin gerçekten bulutta (Firestore'da) saklandığının kanıtı

## 🗂️ Nerede ne var (kod tarafı)
- `services/firebase.ts` — Firebase başlatma + senin proje bilgilerin
- `services/googleAuth.ts` — Google giriş akışı + Client ID'lerin
- `services/syncService.ts` — İlerlemeyi Firestore'a yazma/okuma fonksiyonları
- `firestore.rules` — Güvenlik kuralı (yukarıda anlatıldığı gibi Console'a yapıştırılacak)
- `App.tsx` — Giriş ekranı ve Ayarlar ekranındaki hesap/senkronizasyon entegrasyonu

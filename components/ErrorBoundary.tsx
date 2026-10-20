import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/theme';

type Props = { children: React.ReactNode };
type State = { hasError: boolean };

// Beklenmeyen bir render hatası olursa (örn. bozuk AsyncStorage verisi),
// uygulamayı tamamen çökertip beyaz ekranda bırakmak yerine bu ekranı
// gösterir ve kullanıcının uygulamayı sıfırlayıp devam etmesine izin verir.
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: unknown) {
    // İleride Sentry/Crashlytics buraya bağlanabilir.
    console.error('Lingo Frekans crash yakalandı:', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.wrap}>
          <Text style={styles.title}>Bir şeyler ters gitti</Text>
          <Text style={styles.text}>
            Uygulama beklenmedik bir hatayla karşılaştı. Aşağıdaki butona dokunarak
            devam edebilirsin. Sorun tekrar ederse uygulamayı kapatıp yeniden aç.
          </Text>
          <TouchableOpacity style={styles.button} onPress={this.handleReset}>
            <Text style={styles.buttonText}>Devam Et</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: Colors.bgDeep,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 12, textAlign: 'center' },
  text: { fontSize: 14, color: Colors.textDim, textAlign: 'center', lineHeight: 21, marginBottom: 22 },
  button: { backgroundColor: Colors.amber, paddingVertical: 14, paddingHorizontal: 28, borderRadius: 16 },
  buttonText: { color: Colors.amberDark, fontWeight: '900' },
});

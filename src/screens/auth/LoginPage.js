// Importa as ferramentas do React e React Native
import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

// IMPORTANTE: Importa as ferramentas de autenticação do Firebase.
// O caminho '../firebase' supõe que seu arquivo firebase.js está em 'src/firebase.js'
// Se estiver em outro lugar, ajuste o caminho.
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

// Este é o "molde" da nossa tela de login
const TherapistLoginScreen = () => {
  // Caixinhas para guardar o email e a senha que o terapeuta digita
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Função que é chamada quando o botão "Entrar" é apertado
  const handleLogin = () => {
    // Pega a instância da autenticação do Firebase
    const auth = getAuth();

    // Tenta fazer o login com o email e senha fornecidos
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        // Se o login der certo...
        const user = userCredential.user;
        console.log('Login bem-sucedido!', user.email);
        Alert.alert('Sucesso!', `Bem-vindo(a) de volta!`);
        // No futuro, aqui navegaremos para a tela principal do terapeuta
      })
      .catch((error) => {
        // Se o login der errado...
        console.error("Erro no login:", error.message);
        // Mostra uma mensagem de erro amigável para o usuário
        Alert.alert('Erro no Login', 'E-mail ou senha inválidos. Por favor, tente novamente.');
      });
  };

  // O que aparece na tela do celular
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Área do Musicoterapeuta</Text>
      <Text style={styles.label}>E-mail:</Text>
      <TextInput
        style={styles.input}
        placeholder="seu@email.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address" // Teclado otimizado para email
        autoCapitalize="none" // Não coloca a primeira letra em maiúsculo
      />

      <Text style={styles.label}>Senha:</Text>
      <TextInput
        style={styles.input}
        placeholder="Sua senha"
        value={password}
        onChangeText={setPassword}
        secureTextEntry // Esconde a senha (mostra bolinhas)
      />

      <Button title="Entrar" onPress={handleLogin} />
    </View>
  );
};

// Estilos para a tela
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center', // Centraliza o conteúdo verticalmente
    padding: 20,
    backgroundColor: '#f0f8ff', // Um azul bem clarinho, cor calmante
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fff',
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#ddd',
  },
});

export default TherapistLoginScreen;
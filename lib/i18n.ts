import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: { translation: { login: { title: "Login", email: "Email", password: "Password", submit: "Sign in" }, home: { hello: "Hello" }, map: { title: "Nearby events" }, chat: { send: "Send" } } },
  fr: { translation: { login: { title: "Connexion", email: "Email", password: "Mot de passe", submit: "Se connecter" }, home: { hello: "Bonjour" }, map: { title: "Événements à proximité" }, chat: { send: "Envoyer" } } }
};

i18n.use(initReactI18next).init({
  resources,
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
export type Locale =
  | 'en' | 'fi' | 'sv' | 'de' | 'fr' | 'es' | 'it' | 'pt' | 'nl'
  | 'pl' | 'ro' | 'cs' | 'el' | 'hu' | 'bg' | 'da' | 'sk' | 'lt'
  | 'lv' | 'et' | 'sl' | 'hr' | 'ga' | 'mt'

export const LOCALES: Record<Locale, string> = {
  en: 'English', fi: 'Suomi', sv: 'Svenska', de: 'Deutsch', fr: 'Français',
  es: 'Español', it: 'Italiano', pt: 'Português', nl: 'Nederlands',
  pl: 'Polski', ro: 'Română', cs: 'Čeština', el: 'Ελληνικά', hu: 'Magyar',
  bg: 'Български', da: 'Dansk', sk: 'Slovenčina', lt: 'Lietuvių',
  lv: 'Latviešu', et: 'Eesti', sl: 'Slovenščina', hr: 'Hrvatski',
  ga: 'Gaeilge', mt: 'Malti',
}

export const LOCALE_SHORT: Record<Locale, string> = {
  en: 'EN', fi: 'FI', sv: 'SV', de: 'DE', fr: 'FR', es: 'ES',
  it: 'IT', pt: 'PT', nl: 'NL', pl: 'PL', ro: 'RO', cs: 'CS',
  el: 'EL', hu: 'HU', bg: 'BG', da: 'DA', sk: 'SK', lt: 'LT',
  lv: 'LV', et: 'ET', sl: 'SL', hr: 'HR', ga: 'GA', mt: 'MT',
}

type TranslationKeys = {
  login_subtitle: string
  login_user_id: string
  login_user_id_placeholder: string
  login_password: string
  login_password_placeholder: string
  login_submit: string
  login_authenticating: string
  login_footer: string
  dashboard_portfolio: string
  dashboard_properties: string
  dashboard_current_visitors: string
  dashboard_annual_sales: string
  dashboard_visitors_now: string
  dashboard_annual_visitors: string
  dashboard_dwell_time: string
  dashboard_shops: string
  dashboard_conversion: string
  dashboard_back_to_portfolio: string
  dashboard_shop_categories: string
  header_ask_stelthion: string
  header_export: string
  header_logout: string
  nav_portfolio: string
  nav_properties: string
  nav_campaigns: string
  nav_analytics: string
  nav_scenarios: string
  nav_assistants: string
  nav_shoppermind: string
  nav_settings: string
  unit_min: string
  unit_million_short: string
}

const en: TranslationKeys = {
  login_subtitle: 'Property Manager Secure Login',
  login_user_id: 'User ID',
  login_user_id_placeholder: 'Enter your user ID',
  login_password: 'Password',
  login_password_placeholder: 'Enter your password',
  login_submit: 'Sign In',
  login_authenticating: 'Authenticating...',
  login_footer: 'Secure access for authorized personnel only',
  dashboard_portfolio: 'Portfolio',
  dashboard_properties: 'Properties',
  dashboard_current_visitors: 'Current Visitors',
  dashboard_annual_sales: 'Annual Sales',
  dashboard_visitors_now: 'Visitors now',
  dashboard_annual_visitors: 'Annual Visitors',
  dashboard_dwell_time: 'Dwell time',
  dashboard_shops: 'Shops',
  dashboard_conversion: 'Conversion',
  dashboard_back_to_portfolio: 'Back to portfolio',
  dashboard_shop_categories: 'Shop Categories',
  header_ask_stelthion: 'Ask Stelthion',
  header_export: 'Export',
  header_logout: 'Logout',
  nav_portfolio: 'Portfolio',
  nav_properties: 'My Properties',
  nav_campaigns: 'Campaigns',
  nav_analytics: 'Analytics',
  nav_scenarios: 'Scenarios',
  nav_assistants: 'Assistants',
  nav_shoppermind: 'ShopperMind',
  nav_settings: 'Settings',
  unit_min: 'min',
  unit_million_short: 'M',
}

const fi: TranslationKeys = {
  login_subtitle: 'Kiinteistöpäällikön suojattu kirjautuminen',
  login_user_id: 'Käyttäjätunnus',
  login_user_id_placeholder: 'Syötä käyttäjätunnuksesi',
  login_password: 'Salasana',
  login_password_placeholder: 'Syötä salasanasi',
  login_submit: 'Kirjaudu',
  login_authenticating: 'Todennetaan...',
  login_footer: 'Suojattu pääsy vain valtuutetulle henkilöstölle',
  dashboard_portfolio: 'Portfolio',
  dashboard_properties: 'Kohteet',
  dashboard_current_visitors: 'Nykyiset kävijät',
  dashboard_annual_sales: 'Vuosimyynti',
  dashboard_visitors_now: 'Kävijöitä nyt',
  dashboard_annual_visitors: 'Vuosikävijät',
  dashboard_dwell_time: 'Viipymäaika',
  dashboard_shops: 'Liikkeet',
  dashboard_conversion: 'Konversio',
  dashboard_back_to_portfolio: 'Takaisin portfolioon',
  dashboard_shop_categories: 'Liikekategoriat',
  header_ask_stelthion: 'Kysy Stelthionilta',
  header_export: 'Vie',
  header_logout: 'Kirjaudu ulos',
  nav_portfolio: 'Portfolio',
  nav_properties: 'Kohteet',
  nav_campaigns: 'Kampanjat',
  nav_analytics: 'Analytiikka',
  nav_scenarios: 'Skenaariot',
  nav_assistants: 'Avustajat',
  nav_shoppermind: 'ShopperMind',
  nav_settings: 'Asetukset',
  unit_min: 'min',
  unit_million_short: 'M',
}

const sv: TranslationKeys = {
  login_subtitle: 'Säker inloggning för fastighetsförvaltare',
  login_user_id: 'Användar-ID',
  login_user_id_placeholder: 'Ange ditt användar-ID',
  login_password: 'Lösenord',
  login_password_placeholder: 'Ange ditt lösenord',
  login_submit: 'Logga in',
  login_authenticating: 'Autentiserar...',
  login_footer: 'Säker åtkomst för behörig personal',
  dashboard_portfolio: 'Portfölj',
  dashboard_properties: 'Fastigheter',
  dashboard_current_visitors: 'Aktuella besökare',
  dashboard_annual_sales: 'Årsförsäljning',
  dashboard_visitors_now: 'Besökare nu',
  dashboard_annual_visitors: 'Årsbesökare',
  dashboard_dwell_time: 'Uppehållstid',
  dashboard_shops: 'Butiker',
  dashboard_conversion: 'Konvertering',
  dashboard_back_to_portfolio: 'Tillbaka till portfölj',
  dashboard_shop_categories: 'Butikskategorier',
  header_ask_stelthion: 'Fråga Stelthion',
  header_export: 'Exportera',
  header_logout: 'Logga ut',
  nav_portfolio: 'Portfölj',
  nav_properties: 'Fastigheter',
  nav_campaigns: 'Kampanjer',
  nav_analytics: 'Analys',
  nav_scenarios: 'Scenarier',
  nav_assistants: 'Assistenter',
  nav_shoppermind: 'ShopperMind',
  nav_settings: 'Inställningar',
  unit_min: 'min',
  unit_million_short: 'M',
}

const de: TranslationKeys = { ...en, login_subtitle: 'Sicherer Zugang für Immobilienverwalter', login_user_id: 'Benutzer-ID', login_password: 'Passwort', login_submit: 'Anmelden', login_authenticating: 'Authentifizierung...', login_footer: 'Sicherer Zugang nur für autorisiertes Personal', header_logout: 'Abmelden', dashboard_portfolio: 'Portfolio', dashboard_properties: 'Immobilien', dashboard_current_visitors: 'Aktuelle Besucher', dashboard_annual_sales: 'Jahresumsatz', dashboard_visitors_now: 'Besucher jetzt', dashboard_dwell_time: 'Verweildauer', dashboard_shops: 'Geschäfte', dashboard_conversion: 'Konversion', dashboard_back_to_portfolio: 'Zurück zum Portfolio', dashboard_shop_categories: 'Geschäftskategorien', unit_min: 'Min' }

const fr: TranslationKeys = { ...en, login_subtitle: 'Connexion sécurisée gestionnaire', login_user_id: 'Identifiant', login_password: 'Mot de passe', login_submit: 'Se connecter', login_authenticating: 'Authentification...', login_footer: 'Accès sécurisé pour le personnel autorisé', header_logout: 'Déconnexion', dashboard_portfolio: 'Portefeuille', dashboard_properties: 'Propriétés', dashboard_current_visitors: 'Visiteurs actuels', dashboard_annual_sales: 'Ventes annuelles', dashboard_visitors_now: 'Visiteurs actuels', dashboard_dwell_time: 'Temps de séjour', dashboard_shops: 'Boutiques', dashboard_conversion: 'Conversion', dashboard_back_to_portfolio: 'Retour au portefeuille', dashboard_shop_categories: 'Catégories de boutiques', unit_min: 'min' }

const es: TranslationKeys = { ...en, login_subtitle: 'Acceso seguro para administradores', login_user_id: 'ID de usuario', login_password: 'Contraseña', login_submit: 'Iniciar sesión', login_authenticating: 'Autenticando...', login_footer: 'Acceso seguro solo para personal autorizado', header_logout: 'Cerrar sesión', dashboard_portfolio: 'Cartera', dashboard_properties: 'Propiedades', dashboard_current_visitors: 'Visitantes actuales', dashboard_annual_sales: 'Ventas anuales', dashboard_visitors_now: 'Visitantes ahora', dashboard_dwell_time: 'Tiempo de estancia', dashboard_shops: 'Tiendas', dashboard_conversion: 'Conversión', dashboard_back_to_portfolio: 'Volver a cartera', dashboard_shop_categories: 'Categorías de tiendas', unit_min: 'min' }

const it: TranslationKeys = { ...en, login_subtitle: 'Accesso sicuro per gestori immobiliari', login_user_id: 'ID utente', login_password: 'Password', login_submit: 'Accedi', login_authenticating: 'Autenticazione...', login_footer: 'Accesso sicuro solo per personale autorizzato', header_logout: 'Esci', dashboard_portfolio: 'Portafoglio', dashboard_properties: 'Proprietà', dashboard_current_visitors: 'Visitatori attuali', dashboard_annual_sales: 'Vendite annuali', dashboard_visitors_now: 'Visitatori ora', dashboard_dwell_time: 'Tempo di permanenza', dashboard_shops: 'Negozi', dashboard_conversion: 'Conversione', dashboard_back_to_portfolio: 'Torna al portafoglio', dashboard_shop_categories: 'Categorie negozi', unit_min: 'min' }

const pt: TranslationKeys = { ...en, login_subtitle: 'Acesso seguro para gestores', login_user_id: 'ID do utilizador', login_password: 'Palavra-passe', login_submit: 'Entrar', login_authenticating: 'A autenticar...', login_footer: 'Acesso seguro apenas para pessoal autorizado', header_logout: 'Terminar sessão', dashboard_portfolio: 'Portfólio', dashboard_properties: 'Propriedades', dashboard_current_visitors: 'Visitantes atuais', dashboard_annual_sales: 'Vendas anuais', dashboard_visitors_now: 'Visitantes agora', dashboard_dwell_time: 'Tempo de permanência', dashboard_shops: 'Lojas', dashboard_conversion: 'Conversão', dashboard_back_to_portfolio: 'Voltar ao portfólio', dashboard_shop_categories: 'Categorias de lojas', unit_min: 'min' }

const nl: TranslationKeys = { ...en, login_subtitle: 'Beveiligde toegang voor beheerders', login_user_id: 'Gebruikers-ID', login_password: 'Wachtwoord', login_submit: 'Inloggen', login_authenticating: 'Authenticatie...', login_footer: 'Beveiligde toegang alleen voor geautoriseerd personeel', header_logout: 'Uitloggen', dashboard_portfolio: 'Portfolio', dashboard_properties: 'Eigendommen', dashboard_current_visitors: 'Huidige bezoekers', dashboard_annual_sales: 'Jaarlijkse omzet', dashboard_visitors_now: 'Bezoekers nu', dashboard_dwell_time: 'Verblijftijd', dashboard_shops: 'Winkels', dashboard_conversion: 'Conversie', dashboard_back_to_portfolio: 'Terug naar portfolio', dashboard_shop_categories: 'Winkelcategorieën', unit_min: 'min' }

const pl: TranslationKeys = { ...en, login_subtitle: 'Bezpieczne logowanie zarządcy', login_user_id: 'ID użytkownika', login_password: 'Hasło', login_submit: 'Zaloguj się', header_logout: 'Wyloguj', dashboard_properties: 'Nieruchomości', dashboard_current_visitors: 'Aktualni odwiedzający', dashboard_annual_sales: 'Roczna sprzedaż', dashboard_shops: 'Sklepy' }
const ro: TranslationKeys = { ...en, login_subtitle: 'Acces securizat administrator', login_user_id: 'ID utilizator', login_password: 'Parolă', login_submit: 'Autentificare', header_logout: 'Deconectare', dashboard_properties: 'Proprietăți', dashboard_current_visitors: 'Vizitatori actuali', dashboard_annual_sales: 'Vânzări anuale', dashboard_shops: 'Magazine' }
const cs: TranslationKeys = { ...en, login_subtitle: 'Bezpečné přihlášení správce', login_user_id: 'ID uživatele', login_password: 'Heslo', login_submit: 'Přihlásit se', header_logout: 'Odhlásit se', dashboard_properties: 'Nemovitosti', dashboard_current_visitors: 'Aktuální návštěvníci', dashboard_annual_sales: 'Roční tržby', dashboard_shops: 'Obchody' }
const el: TranslationKeys = { ...en, login_subtitle: 'Ασφαλής σύνδεση διαχειριστή', login_user_id: 'ID χρήστη', login_password: 'Κωδικός', login_submit: 'Σύνδεση', header_logout: 'Αποσύνδεση', dashboard_properties: 'Ακίνητα', dashboard_current_visitors: 'Τρέχοντες επισκέπτες', dashboard_annual_sales: 'Ετήσιες πωλήσεις', dashboard_shops: 'Καταστήματα' }
const hu: TranslationKeys = { ...en, login_subtitle: 'Biztonságos bejelentkezés', login_user_id: 'Felhasználó-azonosító', login_password: 'Jelszó', login_submit: 'Bejelentkezés', header_logout: 'Kijelentkezés', dashboard_properties: 'Ingatlanok', dashboard_current_visitors: 'Jelenlegi látogatók', dashboard_annual_sales: 'Éves értékesítés', dashboard_shops: 'Üzletek' }
const bg: TranslationKeys = { ...en, login_subtitle: 'Защитен достъп за управители', login_user_id: 'Потребителски ID', login_password: 'Парола', login_submit: 'Вход', header_logout: 'Изход', dashboard_properties: 'Имоти', dashboard_current_visitors: 'Текущи посетители', dashboard_annual_sales: 'Годишни продажби', dashboard_shops: 'Магазини' }
const da: TranslationKeys = { ...en, login_subtitle: 'Sikker adgang for administratorer', login_user_id: 'Bruger-ID', login_password: 'Adgangskode', login_submit: 'Log ind', header_logout: 'Log ud', dashboard_properties: 'Ejendomme', dashboard_current_visitors: 'Aktuelle besøgende', dashboard_annual_sales: 'Årligt salg', dashboard_shops: 'Butikker' }
const sk: TranslationKeys = { ...en, login_subtitle: 'Bezpečné prihlásenie správcu', login_user_id: 'ID používateľa', login_password: 'Heslo', login_submit: 'Prihlásiť sa', header_logout: 'Odhlásiť sa', dashboard_properties: 'Nehnuteľnosti', dashboard_current_visitors: 'Aktuálni návštevníci', dashboard_annual_sales: 'Ročný predaj', dashboard_shops: 'Obchody' }
const lt: TranslationKeys = { ...en, login_subtitle: 'Saugi prieiga valdytojams', login_user_id: 'Vartotojo ID', login_password: 'Slaptažodis', login_submit: 'Prisijungti', header_logout: 'Atsijungti', dashboard_properties: 'Turtas', dashboard_current_visitors: 'Esami lankytojai', dashboard_annual_sales: 'Metiniai pardavimai', dashboard_shops: 'Parduotuvės' }
const lv: TranslationKeys = { ...en, login_subtitle: 'Droša piekļuve pārvaldniekiem', login_user_id: 'Lietotāja ID', login_password: 'Parole', login_submit: 'Pieslēgties', header_logout: 'Iziet', dashboard_properties: 'Īpašumi', dashboard_current_visitors: 'Pašreizējie apmeklētāji', dashboard_annual_sales: 'Gada pārdošana', dashboard_shops: 'Veikali' }
const et: TranslationKeys = { ...en, login_subtitle: 'Turvaline juurdepääs halduritele', login_user_id: 'Kasutaja ID', login_password: 'Parool', login_submit: 'Logi sisse', header_logout: 'Logi välja', dashboard_properties: 'Kinnisvara', dashboard_current_visitors: 'Praegused külastajad', dashboard_annual_sales: 'Aastane müük', dashboard_shops: 'Poed' }
const sl: TranslationKeys = { ...en, login_subtitle: 'Varen dostop za upravljavce', login_user_id: 'ID uporabnika', login_password: 'Geslo', login_submit: 'Prijava', header_logout: 'Odjava', dashboard_properties: 'Nepremičnine', dashboard_current_visitors: 'Trenutni obiskovalci', dashboard_annual_sales: 'Letna prodaja', dashboard_shops: 'Trgovine' }
const hr: TranslationKeys = { ...en, login_subtitle: 'Siguran pristup za upravitelje', login_user_id: 'Korisnički ID', login_password: 'Lozinka', login_submit: 'Prijava', header_logout: 'Odjava', dashboard_properties: 'Nekretnine', dashboard_current_visitors: 'Trenutni posjetitelji', dashboard_annual_sales: 'Godišnja prodaja', dashboard_shops: 'Trgovine' }
const ga: TranslationKeys = { ...en, login_subtitle: 'Rochtain shlán do bhainisteoirí', login_user_id: 'ID úsáideora', login_password: 'Pasfhocal', login_submit: 'Sínigh isteach', header_logout: 'Sínigh amach', dashboard_properties: 'Maoine', dashboard_current_visitors: 'Cuairteoirí reatha', dashboard_annual_sales: 'Díolacháin bhliantúla', dashboard_shops: 'Siopaí' }
const mt: TranslationKeys = { ...en, login_subtitle: 'Aċċess sigur għall-maniġers', login_user_id: 'ID tal-utent', login_password: 'Password', login_submit: 'Idħol', header_logout: 'Oħroġ', dashboard_properties: 'Proprjetajiet', dashboard_current_visitors: 'Viżitaturi attwali', dashboard_annual_sales: 'Bejgħ annwali', dashboard_shops: 'Ħwienet' }

export const translations: Record<Locale, TranslationKeys> = {
  en, fi, sv, de, fr, es, it, pt, nl, pl, ro, cs, el, hu, bg, da, sk, lt, lv, et, sl, hr, ga, mt,
}

export function t(locale: Locale, key: keyof TranslationKeys): string {
  return translations[locale]?.[key] ?? translations.en[key] ?? key
}
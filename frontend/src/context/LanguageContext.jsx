import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    milkEntry: 'Milk Entry',
    buffalo: 'Buffalo',
    orders: 'Orders',
    payments: 'Payments',
    customers: 'Customers',
    expenses: 'Expenses',
    broadcaster: 'Broadcaster',
    analytics: 'Analytics',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    add: 'Add',
    search: 'Search',
    filter: 'Filter',
    export: 'Export',
    loading: 'Loading...',
    noData: 'No data available',
    success: 'Success',
    error: 'Error',
    warning: 'Warning',
    confirm: 'Confirm',
    
    // Auth
    login: 'Login',
    logout: 'Logout',
    register: 'Register',
    username: 'Username',
    password: 'Password',
    phone: 'Phone',
    email: 'Email',
    
    // Dashboard
    welcomeBack: 'Welcome back!',
    todayOrders: "Today's Orders",
    totalCustomers: 'Total Customers',
    totalRevenue: 'Total Revenue',
    pendingOrders: 'Pending Orders',
    recentOrders: 'Recent Orders',
    
    // Milk
    quantity: 'Quantity (L)',
    rate: 'Rate (₹/L)',
    fat: 'FAT %',
    snf: 'SNF %',
    session: 'Session',
    morning: 'Morning',
    evening: 'Evening',
    
    // Status
    pending: 'Pending',
    confirmed: 'Confirmed',
    cancelled: 'Cancelled',
    accepted: 'Accepted',
    rejected: 'Rejected',
    paid: 'Paid',
    
    // Actions
    accept: 'Accept',
    reject: 'Reject',
    viewDetails: 'View Details',
    
    // Settings
    settings: 'Settings',
    profile: 'Profile',
    language: 'Language',
    theme: 'Theme',
    darkMode: 'Dark Mode',
    lightMode: 'Light Mode',
    
    // Notifications
    notifications: 'Notifications',
    newOrder: 'New order placed',
    orderAccepted: 'Order accepted',
    orderRejected: 'Order rejected',
    paymentReceived: 'Payment received',
    markAllRead: 'Mark all as read',
    
    // Messages
    savedSuccess: 'Saved successfully',
    deleteConfirm: 'Are you sure you want to delete?',
    networkError: 'Network error. Please try again.',
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    milkEntry: 'दूध प्रविष्टि',
    buffalo: 'भैंस प्रबंधन',
    orders: 'आर्डर सूची',
    payments: 'भुगतान',
    customers: 'ग्राहक',
    expenses: 'खर्च',
    broadcaster: 'प्रसारक',
    analytics: 'विश्लेषण',
    
    // Common
    save: 'सहेजें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    add: 'जोड़ें',
    search: 'खोजें',
    filter: 'फ़िल्टर',
    export: 'निर्यात',
    loading: 'लोड हो रहा है...',
    noData: 'कोई डेटा उपलब्ध नहीं',
    success: 'सफल',
    error: 'त्रुटि',
    warning: 'चेतावनी',
    confirm: 'पुष्टि करें',
    
    // Auth
    login: 'लॉगिन',
    logout: 'लॉगआउट',
    register: 'रजिस्टर',
    username: 'उपयोगकर्ता नाम',
    password: 'पासवर्ड',
    phone: 'फ़ोन',
    email: 'ईमेल',
    
    // Dashboard
    welcomeBack: 'वापसी पर स्वागत है!',
    todayOrders: 'आज के आर्डर',
    totalCustomers: 'कुल ग्राहक',
    totalRevenue: 'कुल राजस्व',
    pendingOrders: 'लंबित आर्डर',
    recentOrders: 'हाल के आर्डर',
    
    // Milk
    quantity: 'मात्रा (L)',
    rate: 'दर (₹/L)',
    fat: 'वसा %',
    snf: 'एसएनएफ %',
    session: 'सत्र',
    morning: 'सुबह',
    evening: 'शाम',
    
    // Status
    pending: 'लंबित',
    confirmed: 'पुष्टि',
    cancelled: 'रद्द',
    accepted: 'स्वीकृत',
    rejected: 'अस्वीकृत',
    paid: 'भुगतान किया',
    
    // Actions
    accept: 'स्वीकार करें',
    reject: 'अस्वीकार करें',
    viewDetails: 'विवरण देखें',
    
    // Settings
    settings: 'सेटिंग्स',
    profile: 'प्रोफ़ाइल',
    language: 'भाषा',
    theme: 'थीम',
    darkMode: 'डार्क मोड',
    lightMode: 'लाइट मोड',
    
    // Notifications
    notifications: 'सूचनाएं',
    newOrder: 'नया आर्डर',
    orderAccepted: 'आर्डर स्वीकृत',
    orderRejected: 'आर्डर अस्वीकृत',
    paymentReceived: 'भुगतान प्राप्त',
    markAllRead: 'सभी पढ़े गए',
    
    // Messages
    savedSuccess: 'सफलतापूर्वक सहेजा गया',
    deleteConfirm: 'क्या आप हटाना चाहते हैं?',
    networkError: 'त्रुटि। पुनः प्रयास करें।',
  },
  te: {
    // Navigation
    dashboard: 'డాష్‌బోర్డ్',
    milkEntry: 'పాల నమోదు',
    buffalo: 'గేదెల నిర్వహణ',
    orders: 'ఆర్డర్లు',
    payments: 'చెల్లింపులు',
    customers: 'వినియోగదారులు',
    expenses: 'ఖర్చులు',
    broadcaster: 'సమాచార ప్రసారం',
    analytics: 'విశ్లేషణలు',
    
    // Common
    save: 'సేవ్ చేయి',
    cancel: 'రద్దు చేయి',
    delete: 'తొలగించు',
    edit: 'సవరించు',
    add: 'జోడించు',
    search: 'వెతకండి',
    filter: 'వడపోత',
    export: 'ఎగుమతి',
    loading: 'లోడ్ అవుతోంది...',
    noData: 'డేటా అందుబాటులో లేదు',
    success: 'విజయం',
    error: 'లోపం',
    warning: 'హెచ్చరిక',
    confirm: 'నిర్ధారించు',
    
    // Auth
    login: 'లాగిన్',
    logout: 'లాగ్అవుట్',
    register: 'నమోదు చేయి',
    username: 'వినియోగదారు పేరు',
    password: 'పాస్‌వర్డ్',
    phone: 'ఫోన్ నంబర్',
    email: 'ఈమెయిల్',
    
    // Dashboard
    welcomeBack: 'మళ్ళీ స్వాగతం!',
    todayOrders: 'ఈరోజు ఆర్డర్లు',
    totalCustomers: 'మొత్తం వినియోగదారులు',
    totalRevenue: 'మొత్తం రాబడి',
    pendingOrders: 'పెండింగ్ ఆర్డర్లు',
    recentOrders: 'ఇటీవలి ఆర్డర్లు',
    
    // Milk
    quantity: 'పరిమాణం (లీటర్లు)',
    rate: 'ధర (₹/లీటర్)',
    fat: 'ఫ్యాట్ %',
    snf: 'ఎస్.ఎన్.ఎఫ్ %',
    session: 'సమయం',
    morning: 'ఉదయం',
    evening: 'సాయంత్రం',
    
    // Status
    pending: 'పెండింగ్',
    confirmed: 'స్థిరపడింది',
    cancelled: 'రద్దు చేయబడింది',
    accepted: 'ఆమోదించబడింది',
    rejected: 'తిరస్కరించబడింది',
    paid: 'చెల్లించబడింది',
    
    // Actions
    accept: 'ఆమోదించు',
    reject: 'తిరస్కరించు',
    viewDetails: 'వివరాలు చూడు',
    
    // Settings
    settings: 'సెట్టింగ్లు',
    profile: 'ప్రొఫైల్',
    language: 'భాష',
    theme: 'థీమ్',
    darkMode: 'డార్క్ మోడ్',
    lightMode: 'లైట్ మోడ్',
    
    // Notifications
    notifications: 'నోటిఫికేషన్లు',
    newOrder: 'కొత్త ఆర్డర్ వచ్చింది',
    orderAccepted: 'ఆరడర్ ఆమోదించబడింది',
    orderRejected: 'ఆర్డర్ తిరస్కరించబడింది',
    paymentReceived: 'చెల్లింపు అందింది',
    markAllRead: 'అన్నీ చదివినట్లు గుర్తించు',
    
    // Messages
    savedSuccess: 'విజయవంతంగా సేవ్ చేయబడింది',
    deleteConfirm: 'మీరు ఖచ్చితంగా తొలగించాలనుకుంటున్నారా?',
    networkError: 'నెట్‌వర్క్ లోపం. దయచేసి మళ్ళీ ప్రయత్నించండి.',
  }
};

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    const saved = localStorage.getItem('language');
    return saved || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.setAttribute('lang', language);
  }, [language]);

  const t = (key) => {
    return translations[language]?.[key] || translations['en'][key] || key;
  };

  const changeLanguage = (lang) => {
    if (translations[lang]) {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, t, languages: Object.keys(translations) }}>
      {children}
    </LanguageContext.Provider>
  );
};

export default LanguageProvider;
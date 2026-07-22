import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    // Navigation
    dashboard: 'Dashboard',
    milkEntry: 'Milk Entry',
    orders: 'Orders',
    payments: 'Payments',
    customers: 'Customers',
    expenses: 'Expenses',
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
  ta: {
    // Navigation
    dashboard: 'ட্যাষ்போர்டு',
    milkEntry: 'பால் எண்ணெய்',
    orders: ' ஆர்டர்கள்',
    payments: 'பணம்',
    customers: 'வாடிக்கையாளர்கள்',
    expenses: 'செலவுகள்',
    analytics: 'பகுப்பாய்வு',
    
    // Common
    save: 'சேமி',
    cancel: 'ரத்து',
    delete: 'அழி',
    edit: 'திருத்து',
    add: 'சேர்',
    search: 'தேடு',
    filter: 'வடிகட்டு',
    export: 'ஏற்று',
    loading: 'ஏற்றுகிறது...',
    noData: 'தரவு இல்லை',
    success: 'வெற்றி',
    error: 'பிழை',
    warning: 'எச்சரிக்கை',
    confirm: 'உறுதிப்படுத்து',
    
    // Auth
    login: 'உள்நுழை',
    logout: 'வெளியேறு',
    register: 'பதிவு',
    username: 'பயன்பாப்பு பெயர்',
    password: 'கடவுச்சொல்',
    phone: 'தொலைபேசி',
    email: 'மின்னஞ்சல்',
    
    // Dashboard
    welcomeBack: 'மீண்டும் வரவேற்கிறோம்!',
    todayOrders: 'இன்றைய ஆர்டர்கள்',
    totalCustomers: 'மொத்த வாடிக்கையாளர்கள்',
    totalRevenue: 'மொத்த வருமானம்',
    pendingOrders: 'நிலுவையில் உள்ள ஆர்டர்கள்',
    recentOrders: 'சமீபத்திய ஆர்டர்கள்',
    
    // Milk
    quantity: 'அளவு (L)',
    rate: 'விகிதம் (₹/L)',
    fat: 'கொழுப்பு %',
    snf: 'எஸ்என்எஃப் %',
    session: 'அமர்வு',
    morning: 'காலை',
    evening: 'மாலை',
    
    // Status
    pending: 'நிலுவையில்',
    confirmed: 'உறுதிப்படுத்தப்பட்டது',
    cancelled: 'ரத்து',
    accepted: 'ஏற்கப்பட்டது',
    rejected: 'மறுக்கப்பட்டது',
    paid: 'பணம் செலுத்தியது',
    
    // Actions
    accept: 'ஏற்க',
    reject: 'மறு',
    viewDetails: 'விவரங்களைக் காண்க',
    
    // Settings
    settings: 'அமைகள்',
    profile: 'சுயவிவரம்',
    language: 'மொழி',
    theme: 'தீம்',
    darkMode: 'கரு Mode',
    lightMode: 'வெள்ளை Mode',
    
    // Notifications
    notifications: 'அறிவிப்புகள்',
    newOrder: 'புதிய ஆர்டர்',
    orderAccepted: 'ஆர்டர் ஏற்கப்பட்டது',
    orderRejected: 'ஆர்டர் மறுக்கப்பட்டது',
    paymentReceived: 'பணம் பெறப்பட்டது',
    markAllRead: 'அனைத்தையும் படித்ததாகக் குறி',
    
    // Messages
    savedSuccess: 'வெற்றிகரமாக சேமிக்கப்பட்டது',
    deleteConfirm: 'நீக்க விரும்புகிறீர்களா?',
    networkError: 'பிழை. மீண்டும் முயற்சிக்கவும்.',
  },
  hi: {
    // Navigation
    dashboard: 'डैशबोर्ड',
    milkEntry: 'दूध प्रविष्टि',
    orders: 'आर्डर',
    payments: 'भुगतान',
    customers: 'ग्राहक',
    expenses: 'खर्च',
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
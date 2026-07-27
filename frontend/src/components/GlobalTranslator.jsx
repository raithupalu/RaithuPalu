import { useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';

// Standard dictionary matching English terms to Hindi and Telugu translations.
// Keeps lookup keys in lowercase to ensure flexible matching regardless of CSS text-transforms.
const lookupDictionary = {
  // Navigation / Headers
  'dashboard': { te: 'డాష్‌బోర్డ్', hi: 'डैशबोर्ड' },
  'milk entry': { te: 'పాల నమోదు', hi: 'दूध प्रविष्टि' },
  'buffalo': { te: 'గేదెల నిర్వహణ', hi: 'भैंस प्रबंधन' },
  'expenses': { te: 'ఖర్చులు', hi: 'खर्च' },
  'orders': { te: 'ఆర్డర్లు', hi: 'आर्डर सूची' },
  'payments': { te: 'చెల్లింపులు', hi: 'भुगतान' },
  'customers': { te: 'వినియోగదారులు', hi: 'ग्राहक' },
  'broadcaster': { te: 'సమాచార ప్రసారం', hi: 'प्रसारक' },
  'analytics': { te: 'విశ్లేషణలు', hi: 'विश्लेषण' },
  'logout': { te: 'లాగ్అవుట్', hi: 'लॉगआउट' },

  // Payments and Billing page
  'payments & billing': { te: 'చెల్లింపులు & బిల్లింగ్', hi: 'भुगतान और बिलिंग' },
  'generate monthly bills from milk records, then record collections': { 
    te: 'పాల రికార్డుల నుండి నెలవారీ బిల్లులను సృష్టించండి, ఆపై వసూళ్లను నమోదు చేయండి', 
    hi: 'दूध के रिकॉर्ड से मासिक बिल बनाएं, फिर संग्रह दर्ज करें' 
  },
  'total collected': { te: 'మొత్తం వసూలు చేసినది', hi: 'कुल एकत्रित' },
  'outstanding': { te: 'చెల్లించవలసిన బాకీ', hi: 'बकाया' },
  'bills': { te: 'బిల్లులు', hi: 'बिल' },
  'generate bill': { te: 'బిల్లును సృష్టించండి', hi: 'बिल बनाएं' },
  'bills use recorded milk for the selected period.': { 
    te: 'ఎంచుకున్న కాలానికి నమోదు చేసిన పాలు ఆధారంగా బిల్లులు లెక్కించబడతాయి.', 
    hi: 'विधेयक चयनित अवधि के लिए दर्ज दूध का उपयोग करते हैं।' 
  },
  'customer': { te: 'వినియోగదారుడు', hi: 'ग्राहक' },
  'select customer...': { te: 'వినియోగదారుడిని ఎంచుకోండి...', hi: 'ग्राहक चुनें...' },
  'month': { te: 'నెల', hi: 'महीना' },
  'year': { te: 'సంవత్సరం', hi: 'वर्ष' },
  'june': { te: 'జూన్', hi: 'जून' },
  'july': { te: 'జూలై', hi: 'जुलाई' },
  'download invoice': { te: 'ఇన్వాయిస్ డౌన్‌లోడ్ చేయి', hi: 'इनवॉइस डाउनलोड करें' },

  // Broadcaster page
  'compose new alert': { te: 'కొత్త హెచ్చరికను రాయండి', hi: 'नया संदेश लिखें' },
  'target audience': { te: 'లక్ష్య వినియోగదారులు', hi: 'सक्रिय ग्राहक' },
  'all active customers': { te: 'యాక్టివ్ వినియోగదారులందరూ', hi: 'सभी सक्रिय ग्राहक' },
  'message templates': { te: 'సందేశ టెంప్లేట్లు', hi: 'संदेश टेम्प्लेट' },
  'rain delay': { te: 'వర్షం ఆలస్యం', hi: 'बारिश के कारण देरी' },
  'fresh ghee stock': { te: 'తాజా నెయ్యి స్టాక్', hi: 'ताजा घी स्टॉक' },
  'payment due alert': { te: 'చెల్లింపు బాకీ హెచ్చరిక', hi: 'भुगतान देय अलर्ट' },
  'festive holiday pause': { te: 'పండుగ సెలవు నిలిపివేత', hi: 'त्योहार की छुट्टी रोक' },
  'alert message (whatsapp & in-app)': { te: 'హెచ్చరిక సందేశం (వాట్సాప్ & ఇన్-యాప్)', hi: 'चेतावनी संदेश (व्हाट्सएप और इन-ऐप)' },
  'type your message here...': { te: 'మీ సందేశాన్ని ఇక్కడ టైప్ చేయండి...', hi: 'अपना संदेश यहाँ लिखें...' },
  'keep text clear and brief.': { te: 'సందేశాన్ని స్పష్టంగా మరియు క్లుప్తంగా ఉంచండి.', hi: 'पाठ को स्पष्ट और संक्षिप्त रखें।' },
  'dispatch broadcast alert': { te: 'బ్రాడ్‌కాస్ట్ హెచ్చరికను పంపండి', hi: 'प्रसारण चेतावनी भेजें' },
  'multi-channel dispatch': { te: 'మల్టీ-ఛానల్ డిస్పాచ్', hi: 'मल्टी-चैनल प्रेषण' },
  'last broadcast dispatch log': { te: 'చివరి సమాచార ప్రసారాల లాగ్', hi: 'अंतिम प्रसारण लॉग' },

  // Orders page
  'order management': { te: 'ఆర్డర్ నిర్వహణ', hi: 'आर्डर प्रबंधन' },
  'manage and track customer orders': { te: 'వినియోగదారుల ఆర్డర్లను నిర్వహించండి & ట్రాక్ చేయండి', hi: 'ग्राहक आर्डर प्रबंधित और ट्रैक करें' },
  'all orders': { te: 'అన్ని ఆర్డర్లు', hi: 'सभी आर्डर' },
  'create new order': { te: 'కొత్త ఆర్డర్ సృష్టించు', hi: 'नया आर्डर बनाएं' },
  'order id': { te: 'ఆర్డర్ ఐడి', hi: 'आर्डर आईडी' },
  'quantity': { te: 'పరిమాణం', hi: 'मात्रा' },
  'time slot': { te: 'సమయ స్లాట్', hi: 'समय' },
  'time': { te: 'సమయం', hi: 'समय' },
  'actions': { te: 'చర్యలు', hi: 'कार्रवाई' },
  'date': { te: 'తేదీ', hi: 'तारीख' },
  'morning': { te: 'ఉదయం', hi: 'सुबह' },
  'evening': { te: 'సాయంత్రం', hi: 'शाम' },
  'rate': { te: 'ధర', hi: 'दर' },
  'total litres': { te: 'మొత్తం లీటర్లు', hi: 'कुल लीटर' },
  'total amount': { te: 'మొత్తం ధర', hi: 'कुल राशि' },

  // Milk Entry page
  'milk volume trends from your records': { te: 'మీ రికార్డుల నుండి పాల పరిమాణాల ట్రెండ్స్', hi: 'आपके रिकॉर्ड से दूध की मात्रा का रुझान' },
  'manage daily milk collection': { te: 'రోజువారీ పాల సేకరణను నిర్వహించండి', hi: 'दैनिक दूध संग्रह प्रबंधित करें' },
  'recent entries': { te: 'ఇటీవలి నమోదులు', hi: 'हाल की प्रविष्टियां' },
  'total entries': { te: 'మొత్తం నమోదులు', hi: 'कुल प्रविष्टियां' },
  'avg per entry': { te: 'సగటు నమోదు', hi: 'औसत प्रति प्रविष्टि' },
  'add milk entry': { te: 'పాల నమోదును జోడించు', hi: 'दूध प्रविष्टि जोड़ें' },

  // Buffalo page
  'buffalo herd overview': { te: 'గేదెల మంద వివరాలు', hi: 'भैंस झुंड अवलोकन' },
  'search & filter by status': { te: 'స్థితి ఆధారంగా శోధించండి & వడపోయండి', hi: 'खोजें और स्थिति फ़िल्टर करें' },
  'add buffalo': { te: 'గేదెను జోడించు', hi: 'भैंस जोड़ें' },
  'active': { te: 'యాక్టివ్', hi: 'सक्रिय' },
  'pregnant': { te: 'గర్భవతి', hi: 'गर्भवती' },
  'ready': { te: 'సిద్ధంగా ఉంది', hi: 'तैयार' },
  'dried': { te: 'ఎండినది', hi: 'सूखा' },
  'breed': { te: 'జాతి', hi: 'नस्ल' },
  'age': { te: 'వయస్సు', hi: 'उम्र' },
  'milk capacity': { te: 'పాల సామర్థ్యం', hi: 'दूध क्षमता' },
  'tag id': { te: 'ట్యాగ్ ఐడి', hi: 'ట్యాగ్ ఐడి' },

  // Expenses page
  'manage farm expenses': { te: 'ఫామ్ ఖర్చులను నిర్వహించండి', hi: 'खर्च प्रबंधित करें' },
  'category': { te: 'వర్గం', hi: 'श्रेणी' },
  'description': { te: 'వివరణ', hi: 'विवरण' },
  'add expense': { te: 'ఖర్చును జోడించు', hi: 'खर्च जोड़ें' },
  'total expenses': { te: 'మొత్తం ఖర్చులు', hi: 'कुल खर्च' },
  'recent expenses': { te: 'ఇటీవలి ఖర్చులు', hi: 'हाल के खर्च' },

  // Customers Page
  'manage customer profiles and balances': { te: 'వినియోగదారుల ప్రొఫైల్స్ మరియు బ్యాలెన్స్ నిర్వహించండి', hi: 'ग्राहक प्रोफाइल प्रबंधित करें' },
  'add customer': { te: 'వినియోగదారుడిని జోడించు', hi: 'ग्राहक जोड़ें' },
  'phone number': { te: 'ఫోన్ నంబర్', hi: 'फ़ोन नंबर' },
  'balance': { te: 'బ్యాలెన్స్', hi: 'शेष राशि' },
  'joined': { te: 'చేరిన తేదీ', hi: 'शामिल हुए' },

  // Dashboard Overview
  'welcome back': { te: 'మళ్ళీ స్వాగతం!', hi: 'वापसी पर स्वागत है!' },
  'total customers': { te: 'మొత్తం వినియోగదారులు', hi: 'कुल ग्राहक' },
  'total revenue': { te: 'మొత్తం రాబడి', hi: 'कुल राजस्व' },
  'pending orders': { te: 'పెండింగ్ ఆర్డర్లు', hi: 'लंबित आर्डर' },
  'recent orders': { te: 'ఇటీవలి ఆర్డర్లు', hi: 'हाल के आर्डर' }
};

// Translates recursively starting from any DOM node
const runDomTranslation = (node, lang) => {
  if (node.nodeType === Node.TEXT_NODE) {
    const text = node.nodeValue.trim();
    if (!text) return;

    // Cache the original English text to restore later on-demand
    if (node._originalText === undefined) {
      node._originalText = node.nodeValue;
    }

    if (lang === 'en') {
      if (node.nodeValue !== node._originalText) {
        node.nodeValue = node._originalText;
      }
      return;
    }

    // Lookup translated equivalent
    const cleanKey = text.toLowerCase().replace(/[:?]/g, '').trim();
    if (lookupDictionary[cleanKey] && lookupDictionary[cleanKey][lang]) {
      const suffix = node._originalText.endsWith(':') ? ':' : node._originalText.endsWith('?') ? '?' : '';
      node.nodeValue = lookupDictionary[cleanKey][lang] + suffix;
    }
  } else {
    // Avoid translating raw scripts, stylesheet styles, or input texts
    if (node.nodeName === 'SCRIPT' || node.nodeName === 'STYLE' || node.nodeName === 'INPUT' || node.nodeName === 'TEXTAREA') {
      return;
    }

    // Dynamically translate placeholders on input elements
    if (node.placeholder && typeof node.placeholder === 'string') {
      if (node._originalPlaceholder === undefined) {
        node._originalPlaceholder = node.placeholder;
      }
      if (lang === 'en') {
        node.placeholder = node._originalPlaceholder;
      } else {
        const cleanPlaceholder = node._originalPlaceholder.toLowerCase().replace(/[:?.]/g, '').trim();
        if (lookupDictionary[cleanPlaceholder] && lookupDictionary[cleanPlaceholder][lang]) {
          node.placeholder = lookupDictionary[cleanPlaceholder][lang];
        }
      }
    }

    // Traverse all child nodes recursively
    for (let child of node.childNodes) {
      runDomTranslation(child, lang);
    }
  }
};

const GlobalTranslator = () => {
  const { language } = useLanguage();

  useEffect(() => {
    // Immediate translation on render
    runDomTranslation(document.body, language);

    // MutationObserver monitors the DOM tree and translates newly loaded API data or elements on-the-fly
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          runDomTranslation(node, language);
        });
      });
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    return () => observer.disconnect();
  }, [language]);

  return null; // Silent background helper component
};

export default GlobalTranslator;
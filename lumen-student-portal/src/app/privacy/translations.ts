export interface LanguageOption {
  code: string;
  name: string;
  nativeName: string;
  region: "Indian" | "International";
  direction?: "ltr" | "rtl";
}

export const SUPPORTED_LANGUAGES: LanguageOption[] = [
  { code: "en", name: "English", nativeName: "English", region: "International" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी", region: "Indian" },
  { code: "bn", name: "Bengali", nativeName: "বাংলা", region: "Indian" },
  { code: "mr", name: "Marathi", nativeName: "मराठी", region: "Indian" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்", region: "Indian" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు", region: "Indian" },
  { code: "gu", name: "Gujarati", nativeName: "ગુજરાતી", region: "Indian" },
  { code: "es", name: "Spanish", nativeName: "Español", region: "International" },
  { code: "fr", name: "French", nativeName: "Français", region: "International" },
  { code: "de", name: "German", nativeName: "Deutsch", region: "International" },
  { code: "ja", name: "Japanese", nativeName: "日本語", region: "International" },
  { code: "ar", name: "Arabic", nativeName: "العربية", region: "International", direction: "rtl" },
];

export interface PolicyTranslation {
  heroBadge: string;
  heroTitle: string;
  heroSubtitle: string;
  effectiveDateLabel: string;
  policyVersionLabel: string;
  statutoryCompliance: string;
  selectLanguageLabel: string;
  pillars: {
    title: string;
    desc: string;
  }[];
  tocTitle: string;
  needHelpTitle: string;
  needHelpDesc: string;
  sections: {
    id: string;
    num: string;
    title: string;
    content: string[];
    highlight?: {
      title: string;
      points: string[];
    };
  }[];
  bottomCta: {
    title: string;
    desc: string;
    btn: string;
  };
}

export const TRANSLATIONS: Record<string, PolicyTranslation> = {
  en: {
    heroBadge: "Trust & Data Governance Framework",
    heroTitle: "Privacy Policy & Student Data Charter",
    heroSubtitle:
      "At Medhashine, we believe educational curiosity thrives only in an environment of total digital safety. We do not sell student data, we do not run behavioral advertising networks, and we hold ourselves to the highest global data protection standards.",
    effectiveDateLabel: "Effective Date: September 19, 2026",
    policyVersionLabel: "Policy: Version 2.4 (Enterprise Edition)",
    statutoryCompliance: "DPDP Act (India) 2023 & COPPA Compliant",
    selectLanguageLabel: "Language / भाषा",
    pillars: [
      {
        title: "Zero Data Selling",
        desc: "We never monetize, rent, trade, or auction learner or teacher data to data brokers or advertisers.",
      },
      {
        title: "Student-First Safety",
        desc: "Full protection for minors under Section 9 of the DPDP Act 2023 & US COPPA. No behavioral tracking of kids.",
      },
      {
        title: "Enterprise Security",
        desc: "AES-256 encryption at rest, TLS 1.3 in transit, HttpOnly SameSite cookie isolation, and robust CSRF defense.",
      },
      {
        title: "Full Data Sovereignty",
        desc: "You own your information. Complete rights to download, rectify, or permanently purge your account anytime.",
      },
    ],
    tocTitle: "Policy Table of Contents",
    needHelpTitle: "Need Privacy Support?",
    needHelpDesc: "Have questions about your personal data or minor protection? Contact our dedicated Data Protection Officer.",
    sections: [
      {
        id: "charter",
        num: "Section 1",
        title: "Our Privacy Charter & Core Promise",
        content: [
          "Medhashine operates a premier digital educational reading platform and pedagogical publishing network. We believe that genuine academic curiosity, intellectual depth, and independent critical thinking can only flourish when individuals are free from digital surveillance and deceptive data extraction.",
          "This Privacy Policy describes our practices regarding the collection, handling, storage, and protection of information across the Medhashine portal, teacher tools, and related services.",
        ],
        highlight: {
          title: "The Medhashine Guarantee",
          points: [
            "We never sell your personal information or school reading logs to third parties.",
            "We never display targeted third-party advertisements to students or educators.",
            "We never engage in behavioral profiling or automated surveillance of minors.",
          ],
        },
      },
      {
        id: "collection",
        num: "Section 2",
        title: "Categories of Information We Collect",
        content: [
          "In strict adherence to the data minimization principle under modern privacy legislation, we only collect data that is strictly necessary to deliver high-quality educational experiences.",
          "Account Registration & Profile Data: When you voluntarily create an account as a student or educator, we collect your name, email, encrypted password hashes, and academic grade preferences.",
          "Educator Verification Data: To maintain rigorous pedagogical standards, educators provide verified academic credentials, teaching experience, and a mandatory 10-digit mobile number used solely for two-factor identity verification and administrative governance.",
          "Technical & Security Telemetry: We collect IP addresses and browser user-agents strictly to protect the platform against brute-force attacks, DDoS, and account hijacking.",
        ],
      },
      {
        id: "usage",
        num: "Section 3",
        title: "How We Use Educational Data",
        content: [
          "We process your information exclusively under lawful bases defined by applicable data protection laws: performance of contract, legitimate interest, and explicit consent.",
          "Core Platform Delivery: Authenticating users, organizing curriculum taxonomy (classes, subjects, topics), and rendering formatted teacher insights.",
          "Peer Feedback & Discussions: Facilitating teacher-moderated student comments and intellectual discussions on essays and guides.",
          "Network Defense: Identifying automated bots, blocking Cross-Site Request Forgery (CSRF), and enforcing rate-limiting thresholds to protect platform integrity.",
          "Direct Notifications: Sending essential administrative emails (password resets, application reviews, ticket resolutions). We do not spam.",
        ],
      },
      {
        id: "minors",
        num: "Section 4",
        title: "Student & Minor Privacy (Under 18 Protection)",
        content: [
          "Medhashine is fundamentally built for learners, many of whom are young students. Protecting children is our paramount legal and moral duty under the Digital Personal Data Protection Act, 2023 (India) and the Children’s Online Privacy Protection Act (COPPA, USA).",
          "Section 9 DPDP Act (India): No tracking, behavioral monitoring, or targeted advertisements directed at individuals under 18 years of age.",
          "Parental Rights: Parents and legal guardians may review, request a copy of, or instruct the permanent erasure of their child’s account at any time by contacting privacy@medhashine.in.",
        ],
      },
      {
        id: "security",
        num: "Section 5",
        title: "Technical Architecture & Security Safeguards",
        content: [
          "Session Encryption & Isolation: User sessions are managed through cryptographically secured, browser-isolated authentication cookies equipped with strict security flags (HttpOnly and Secure), preventing unauthorized client-side script interception.",
          "Input Sanitization & Injection Defense: Every piece of incoming content passes through multi-stage sanitizers that strip raw HTML, neutralize cross-site scripting (XSS) vectors, and escape search queries to prevent NoSQL injection attacks.",
          "CSRF Origin Validation: Our API enforces strict Origin and Referer validation on all mutating HTTP methods to reject unauthorized cross-site requests originating from malicious third-party websites.",
          "Intelligent Rate Limiting: Multi-tier IP rate limiting prevents brute-force authentication attempts, automated content scraping, and denial-of-service spamming across public endpoints.",
        ],
      },
      {
        id: "sharing",
        num: "Section 6",
        title: "Zero Data-Selling & Authorized Service Providers",
        content: [
          "We never monetize, rent, or trade your personal data. To provide reliable, globally available educational services, we partner strictly with vetted enterprise service providers who act as data processors on our behalf under legally binding Data Processing Agreements (DPAs).",
          "Categories of Service Providers: Cloud Compute & Hosting Infrastructure, Encrypted Database Storage Providers, Media Content Delivery Networks (CDNs), and Transactional Email Delivery Services.",
          "All service providers are bound to strict SOC 2, ISO 27001, and TLS 1.3 encryption standards with zero rights to independently use or monetize user data.",
        ],
      },
      {
        id: "retention",
        num: "Section 7",
        title: "Data Retention & Right to Complete Erasure",
        content: [
          "Active Accounts: Retained while your profile remains open to preserve your bookmarks and educational contributions.",
          "Teacher Content: When an educator deletes an insight, it is placed in a 30-day soft-delete Recycle Bin, after which it is permanently purged from production databases.",
          "Permanent Account Deletion: You have an absolute right to account closure. When you request erasure, all personal identifiers are permanently purged within 30 days.",
        ],
      },
      {
        id: "rights",
        num: "Section 8",
        title: "Your Legal Rights as a Data Principal",
        content: [
          "Under the Indian Digital Personal Data Protection Act (DPDP Act, 2023), GDPR, and associated international laws, you hold unambiguous rights over your data:",
          "Right to Access and Confirmation: Request a full summary of the personal data we hold about you.",
          "Right to Correction & Rectification: Update inaccurate or incomplete biographical and educational data.",
          "Right to Erasure ('Right to Be Forgotten'): Instruct us to permanently delete your personal profile and credentials.",
          "Right of Grievance Redressal: Have your privacy concerns addressed by our designated Grievance Officer within statutory response timelines.",
        ],
      },
      {
        id: "cookies",
        num: "Section 9",
        title: "Cookies & Session Technologies Policy",
        content: [
          "We use cookies exclusively for functional authentication, platform security, and user session continuity.",
          "Authentication & Session Continuity Cookies: Strictly necessary, cryptographically secure session cookies that keep you safely signed in as you explore learning topics.",
          "Security & CSRF Protection Markers: Temporary security verification tokens used to confirm that requests originate legitimately from you and protect against cross-site request forgery.",
          "Educational Preferences: Ephemeral settings that remember your selected subject filter or reading layout preference.",
          "We do NOT use invasive advertising tracking cookies, marketing pixels, or third-party behavioral profiling.",
        ],
      },
      {
        id: "grievance",
        num: "Section 10",
        title: "Grievance Officer & Official Regulatory Contact",
        content: [
          "Pursuant to Rule 5(9) of the Information Technology (Intermediary Guidelines and Digital Media Ethics Code) Rules, 2021, and the provisions of the Digital Personal Data Protection Act, 2023, the details of our designated Grievance Redressal Officer are published below:",
          "Designated Officer: Data Protection & Legal Governance Officer | Medhashine Educational Technologies",
          "Direct Privacy Contact: privacy@medhashine.in | Grievance Escalations: grievance@medhashine.in",
          "Standard Response Window: Within 24–48 hours | Statutory Dispute Resolution: Maximum 15 calendar days.",
        ],
      },
    ],
    bottomCta: {
      title: "Have questions or suggestions about our policies?",
      desc: "We welcome dialogue with students, educators, academic institutions, and parents.",
      btn: "Contact Our Legal Team",
    },
  },

  hi: {
    heroBadge: "विश्वास एवं डेटा गवर्नेंस रूपरेखा",
    heroTitle: "गोपनीयता नीति एवं छात्र डेटा चार्टर",
    heroSubtitle:
      "मेधाशाइन (Medhashine) में हमारा दृढ़ विश्वास है कि शैक्षणिक जिज्ञासा केवल पूर्ण डिजिटल सुरक्षा के वातावरण में ही फल-फूल सकती है। हम कभी भी छात्र डेटा नहीं बेचते, कोई विज्ञापन नेटवर्क नहीं चलाते, और उच्चतम वैश्विक डेटा सुरक्षा मानकों का पालन करते हैं।",
    effectiveDateLabel: "प्रभावी तिथि: 19 सितम्बर 2026",
    policyVersionLabel: "नीति संस्करण: 2.4 (एंटरप्राइज संस्करण)",
    statutoryCompliance: "DPDP अधिनियम (भारत) 2023 एवं COPPA अनुपालित",
    selectLanguageLabel: "भाषा चुनें / Select Language",
    pillars: [
      {
        title: "शून्य डेटा बिक्री (Zero Selling)",
        desc: "हम छात्रों या शिक्षकों का डेटा कभी भी विज्ञापनदाताओं या डेटा दलालों को नहीं बेचते, किराए पर नहीं देते या नीलाम नहीं करते।",
      },
      {
        title: "छात्र सुरक्षा सर्वोपरि",
        desc: "DPDP अधिनियम 2023 की धारा 9 और COPPA के तहत नाबालिगों को पूर्ण सुरक्षा। बच्चों की कोई व्यवहारिक ट्रैकिंग नहीं।",
      },
      {
        title: "एंटरप्राइज-ग्रेड सुरक्षा",
        desc: "AES-256 एन्क्रिप्शन, TLS 1.3 डेटा ट्रांसमिशन, HttpOnly कुकी सुरक्षा और मजबूत CSRF साइबर सुरक्षा।",
      },
      {
        title: "पूर्ण डेटा संप्रभुता",
        desc: "आप अपने डेटा के पूर्ण स्वामी हैं। अपना डेटा डाउनलोड करने, सुधारने या स्थायी रूप से मिटाने का पूर्ण अधिकार।",
      },
    ],
    tocTitle: "नीति अनुक्रमणिका (विषय-सूची)",
    needHelpTitle: "गोपनीयता सहायता चाहिए?",
    needHelpDesc: "अपने व्यक्तिगत डेटा या बाल सुरक्षा से जुड़े किसी भी प्रश्न के लिए हमारे डेटा संरक्षण अधिकारी से संपर्क करें।",
    sections: [
      {
        id: "charter",
        num: "खंड 1",
        title: "हमारा गोपनीयता चार्टर एवं मूल संकल्प",
        content: [
          "मेधाशाइन एक अग्रणी डिजिटल शैक्षणिक मंच है। हमारा मानना है कि वास्तविक अकादमिक जिज्ञासा और स्वतंत्र विचार तभी संभव हैं जब उपयोगकर्ता डिजिटल निगरानी और भ्रामक डेटा संकलन से पूरी तरह मुक्त हों।",
          "यह नीति मेधाशाइन पोर्टल और शिक्षक उपकरणों पर जानकारी के संकलन, संरक्षण और सुरक्षा के नियमों को स्पष्ट करती है।",
        ],
        highlight: {
          title: "मेधाशाइन की गारंटी",
          points: [
            "हम आपकी व्यक्तिगत जानकारी या पठन रिकॉर्ड किसी तीसरे पक्ष को कभी नहीं बेचते।",
            "हम छात्रों या शिक्षकों को कोई लक्षित विज्ञापन (targeted ads) नहीं दिखाते।",
            "हम नाबालिगों की डिजिटल निगरानी या प्रोफाइलिंग में कभी भाग नहीं लेते।",
          ],
        },
      },
      {
        id: "collection",
        num: "खंड 2",
        title: "एकत्रित की जाने वाली जानकारी",
        content: [
          "डेटा न्यूनीकरण (Data Minimization) के सिद्धांत के अनुसार, हम केवल वही जानकारी एकत्र करते हैं जो उच्च गुणवत्ता वाली शिक्षा प्रदान करने के लिए अनिवार्य है।",
          "खाता पंजीकरण: नाम, ईमेल पता, पासवर्ड हैश (bcrypt 12-rounds द्वारा सुरक्षित), और शैक्षणिक कक्षा वरीयताएं।",
          "शिक्षक सत्यापन: शिक्षकों की शैक्षणिक डिग्री, अनुभव और 10-अंकीय अनिवार्य मोबाइल नंबर (केवल प्रमाणीकरण और प्रशासनिक सुरक्षा के लिए)।",
          "सुरक्षा टेलीमेट्री: ब्रूट-फोर्स हमलों और DDoS से बचाव के लिए आईपी एड्रेस और ब्राउज़र एजेंट।",
        ],
      },
      {
        id: "usage",
        num: "खंड 3",
        title: "शैक्षणिक डेटा का उपयोग",
        content: [
          "हम आपके डेटा का उपयोग केवल कानूनी आधारों (अनुबंध निष्पादन, वैध हित, और सहमति) के तहत करते हैं।",
          "प्लेटफॉर्म संचालन: उपयोगकर्ताओं का प्रमाणीकरण, पाठ्यक्रम वर्गीकरण (कक्षा, विषय, अध्याय), और शिक्षक लेख प्रदर्शित करना।",
          "चर्चा एवं सहकर्मी संवाद: निबंधों पर शिक्षकों द्वारा संचालित छात्र टिप्पणियों और शैक्षणिक संवाद की सुविधा।",
          "नेटवर्क सुरक्षा: बॉट्स को रोकना, CSRF हमलों को निष्फल करना, और सुरक्षा दर सीमाएं (Rate Limits) लागू करना।",
          "महत्वपूर्ण सूचनाएं: केवल आवश्यक प्रशासनिक संदेश (पासवर्ड रीसेट, आवेदन स्थिति)। हम कोई स्पैम नहीं भेजते।",
        ],
      },
      {
        id: "minors",
        num: "खंड 4",
        title: "छात्र एवं बाल गोपनीयता (18 वर्ष से कम आयु)",
        content: [
          "मेधाशाइन मुख्य रूप से युवा शिक्षार्थियों के लिए बनाया गया है। भारतीय डिजिटल व्यक्तिगत डेटा संरक्षण अधिनियम (DPDP Act, 2023) और अमेरिकी COPPA के तहत बच्चों की सुरक्षा हमारा सर्वोच्च कानूनी दायित्व है।",
          "DPDP अधिनियम की धारा 9: 18 वर्ष से कम उम्र के व्यक्तियों पर कोई व्यवहारिक निगरानी या लक्षित विज्ञापन पूरी तरह प्रतिबंधित है।",
          "अभिभावक अधिकार: माता-पिता किसी भी समय privacy@medhashine.in पर संपर्क करके अपने बच्चे का खाता देखने या स्थायी रूप से नष्ट कराने का अधिकार रखते हैं।",
        ],
      },
      {
        id: "security",
        num: "खंड 5",
        title: "तकनीकी संरचना एवं सुरक्षा उपाय",
        content: [
          "सत्र एन्क्रिप्शन: उपयोगकर्ता सत्रों को HttpOnly और Secure फ्लैग्स वाली एन्क्रिप्टेड कुकीज़ के माध्यम से सुरक्षित रखा जाता है, जिससे जावास्क्रिप्ट द्वारा क्रेडेंशियल चोरी नहीं हो सकते।",
          "इनपुट सैनिटाइजेशन: हर सबमिशन बहु-स्तरीय सैनिटाइज़र से गुजरता है जो दुर्भावनापूर्ण स्क्रिप्ट (XSS) और डेटाबेस इंजेक्शन हमलों को पूरी तरह बेअसर कर देता है।",
          "CSRF सुरक्षा: एपीआई अनधिकृत वेबसाइटों से आने वाले दुर्भावनापूर्ण क्रॉस-साइट अनुरोधों को 403 Forbidden के साथ अस्वीकार करता है।",
          "दर सीमा (Rate Limiting): अत्यधिक अनुरोधों और स्पैम हमलों को रोकने के लिए आईपी आधारित सख्त सीमाएं सक्रिय हैं।",
        ],
      },
      {
        id: "sharing",
        num: "खंड 6",
        title: "शून्य डेटा बिक्री एवं अधिकृत सेवा प्रदाता",
        content: [
          "हम आपके डेटा का कभी मुद्रीकरण नहीं करते। वैश्विक सेवा प्रदान करने के लिए हम केवल कड़े कानूनी डेटा प्रोसेसिंग समझौतों (DPA) के तहत एंटरप्राइज इन्फ्रास्ट्रक्चर प्रदाताओं के साथ काम करते हैं।",
          "सेवा प्रदाता श्रेणियां: क्लाउड कंप्यूटिंग एवं होस्टिंग प्रदाता, एन्क्रिप्टेड डेटाबेस प्रदाता, मीडिया सीडीएन (CDN), और सिस्टम ईमेल प्रदाता।",
          "सभी प्रदाता SOC 2, ISO 27001 और TLS 1.3 एन्क्रिप्शन मानकों से बंधे हैं और डेटा का स्वतंत्र उपयोग नहीं कर सकते।",
        ],
      },
      {
        id: "retention",
        num: "खंड 7",
        title: "डेटा प्रतिधारण एवं मिटाने का अधिकार",
        content: [
          "सक्रिय खाते: आपका डेटा तब तक सुरक्षित रखा जाता है जब तक आपका खाता सक्रिय रहता है।",
          "शिक्षक सामग्री: हटाए गए लेख 30 दिनों तक रीसायकल बिन में रहते हैं, जिसके बाद वे डेटाबेस से स्थायी रूप से मिटा दिए जाते हैं।",
          "स्थायी खाता समाप्ति: आपको खाता पूरी तरह बंद करने का अधिकार है। अनुरोध मिलने पर 30 दिनों के भीतर सभी व्यक्तिगत पहचानकर्ता स्थायी रूप से नष्ट कर दिए जाते हैं।",
        ],
      },
      {
        id: "rights",
        num: "खंड 8",
        title: "एक डेटा स्वामी के रूप में आपके कानूनी अधिकार",
        content: [
          "DPDP अधिनियम 2023 और जीडीपीआर के तहत आपके पास स्पष्ट कानूनी अधिकार हैं:",
          "पहुंच का अधिकार: अपने व्यक्तिगत डेटा का पूरा सारांश प्राप्त करने का अधिकार।",
          "सुधार का अधिकार: अपूर्ण या गलत शैक्षणिक जानकारी को सुधारने का अधिकार।",
          "मिटाने का अधिकार ('Right to Be Forgotten'): अपने प्रोफाइल और खाते को स्थायी रूप से नष्ट कराने का अधिकार।",
          "शिकायत निवारण का अधिकार: हमारे नामित शिकायत अधिकारी से निर्धारित समय-सीमा में सहायता प्राप्त करने का अधिकार।",
        ],
      },
      {
        id: "cookies",
        num: "खंड 9",
        title: "कुकीज़ एवं सत्र नीतियां",
        content: [
          "हम कुकीज़ का उपयोग केवल सुरक्षित प्रमाणीकरण और सत्र निरंतरता के लिए करते हैं।",
          "प्रमाणीकरण कुकीज़: सुरक्षित सत्र कुकीज़ जो आपको प्लेटफॉर्म पर सीखते समय सुरक्षित रूप से लॉग इन रखती हैं।",
          "सुरक्षा एवं CSRF टोकन: सुरक्षा जांच टोकन जो यह सत्यापित करते हैं कि अनुरोध आपके द्वारा ही किया गया है।",
          "शैक्षणिक प्राथमिकताएं: आपकी चुनी हुई कक्षा या पठन शैली को याद रखने वाली सेटिंग्स।",
          "हम किसी भी विज्ञापन ट्रैकिंग कुकीज़ या व्यवहारिक प्रोफाइलिंग का उपयोग नहीं करते हैं।",
        ],
      },
      {
        id: "grievance",
        num: "खंड 10",
        title: "शिकायत अधिकारी एवं आधिकारिक संपर्क",
        content: [
          "सूचना प्रौद्योगिकी नियम 2021 के नियम 5(9) और DPDP अधिनियम 2023 के तहत हमारे नामित शिकायत निवारण अधिकारी का विवरण:",
          "नामित अधिकारी: डेटा संरक्षण एवं विधिक शिकायत अधिकारी | मेधाशाइन एजुकेशनल टेक्नोलॉजीज",
          "गोपनीयता ईमेल: privacy@medhashine.in | शिकायत ईमेल: grievance@medhashine.in",
          "प्रतिक्रिया समय: 24-48 घंटों के भीतर पावती | वैधानिक समाधान: अधिकतम 15 कार्य दिवस।",
        ],
      },
    ],
    bottomCta: {
      title: "हमारी नीतियों के संबंध में कोई प्रश्न हैं?",
      desc: "हम छात्रों, शिक्षकों, शैक्षणिक संस्थानों और अभिभावकों के संवाद का स्वागत करते हैं।",
      btn: "विधिक टीम से संपर्क करें",
    },
  },

  es: {
    heroBadge: "Marco de Confianza y Gobernanza de Datos",
    heroTitle: "Política de Privacidad y Carta de Datos Estudiantiles",
    heroSubtitle:
      "En Medhashine, creemos que la curiosidad educativa prospera solo en un entorno de total seguridad digital. No vendemos datos de estudiantes, no ejecutamos redes publicitarias y cumplimos con los más altos estándares globales de protección de datos.",
    effectiveDateLabel: "Fecha de Entrada en Vigor: 19 de septiembre de 2026",
    policyVersionLabel: "Versión de la Política: 2.4 (Edición Empresarial)",
    statutoryCompliance: "Conforme con DPDP Act (India) 2023 y COPPA (EE. UU.)",
    selectLanguageLabel: "Seleccionar Idioma / Language",
    pillars: [
      {
        title: "Cero Venta de Datos",
        desc: "Nunca monetizamos, alquilamos ni vendemos datos de estudiantes o educadores a anunciantes.",
      },
      {
        title: "Seguridad para Menores",
        desc: "Protección total para menores según la ley DPDP 2023 y COPPA. Sin rastreo publicitario de niños.",
      },
      {
        title: "Seguridad Empresarial",
        desc: "Cifrado AES-256 en reposo, TLS 1.3 en tránsito y aislamiento seguro de cookies HttpOnly.",
      },
      {
        title: "Soberanía Total",
        desc: "Usted es el único dueño de su información. Derecho absoluto a descargar o eliminar su cuenta.",
      },
    ],
    tocTitle: "Índice de Contenidos",
    needHelpTitle: "¿Necesita Ayuda con su Privacidad?",
    needHelpDesc: "¿Preguntas sobre sus datos personales o protección de menores? Comuníquese con nuestro Oficial de Protección de Datos.",
    sections: [
      {
        id: "charter",
        num: "Sección 1",
        title: "Nuestra Carta de Privacidad y Compromiso",
        content: [
          "Medhashine opera una plataforma educativa digital dedicada a fomentar el pensamiento crítico e intelectual libre de vigilancia digital o extracción de datos engañosa.",
          "Esta Política de Privacidad describe nuestras prácticas sobre la recopilación, almacenamiento y protección de datos.",
        ],
        highlight: {
          title: "La Garantía Medhashine",
          points: [
            "Nunca vendemos su información personal a terceros.",
            "Nunca mostramos anuncios dirigidos a estudiantes ni docentes.",
            "Nunca realizamos seguimiento conductual ni perfilado de menores de edad.",
          ],
        },
      },
      {
        id: "collection",
        num: "Sección 2",
        title: "Información que Recopilamos",
        content: [
          "Bajo el principio de minimización de datos, solo recopilamos lo estrictamente necesario para brindar servicios educativos de calidad.",
          "Datos de Cuenta: Nombre, correo electrónico, contraseñas cifradas y nivel académico preferido.",
          "Verificación Docente: Títulos académicos y número móvil obligatorio utilizado únicamente para verificación de identidad en dos pasos.",
          "Telemetría de Seguridad: Direcciones IP y agentes de navegador para mitigar ataques cibernéticos y proteger cuentas.",
        ],
      },
      {
        id: "usage",
        num: "Sección 3",
        title: "Uso de los Datos Educativos",
        content: [
          "Procesamos datos exclusivamente bajo bases legales: ejecución contractual, interés legítimo y consentimiento explícito.",
          "Entrega de la Plataforma: Autenticación, taxonomía de contenidos y entrega de lecciones pedagógicas.",
          "Discusiones entre Pares: Comentarios moderados por docentes en ensayos y guías de estudio.",
          "Seguridad Cibernética: Bloqueo de bots automatizados y protección contra ataques CSRF.",
        ],
      },
      {
        id: "minors",
        num: "Sección 4",
        title: "Privacidad de Menores de Edad",
        content: [
          "La protección infantil es nuestra máxima obligación legal bajo la ley DPDP de India y COPPA de EE. UU.",
          "Prohibición estricta de seguimiento publicitario a menores de 18 años.",
          "Los padres o tutores pueden solicitar la revisión o eliminación de los datos de sus hijos escribiendo a privacy@medhashine.in.",
        ],
      },
      {
        id: "security",
        num: "Sección 5",
        title: "Arquitectura Técnica y Medidas de Seguridad",
        content: [
          "Cifrado de Sesiones: Cookies seguras HttpOnly que impiden la interceptación de credenciales por scripts maliciosos.",
          "Sanitización de Contenido: Protección contra ataques de inyección XSS y NoSQL en todos los envíos.",
          "Validación CSRF: Validación estricta de origen para bloquear peticiones maliciosas entre sitios.",
          "Límites de Peticiones: Reglas de limitación para evitar ataques de denegación de servicio.",
        ],
      },
      {
        id: "sharing",
        num: "Sección 6",
        title: "Proveedores de Infraestructura Autorizados",
        content: [
          "Solo colaboramos con proveedores de infraestructura en la nube bajo estrictos acuerdos de procesamiento de datos (DPA).",
          "Categorías: Proveedores de cómputo en la nube, almacenamiento de bases de datos cifradas, redes CDN y correo transaccional.",
          "Todos cumplen con estándares SOC 2, ISO 27001 y cifrado TLS 1.3.",
        ],
      },
      {
        id: "retention",
        num: "Sección 7",
        title: "Retención de Datos y Derecho al Olvido",
        content: [
          "Conservamos los datos únicamente mientras la cuenta esté activa.",
          "Al solicitar la eliminación, todos los identificadores personales se purgan de forma irreversible dentro de 30 días.",
        ],
      },
      {
        id: "rights",
        num: "Sección 8",
        title: "Sus Derechos Legales",
        content: [
          "Derecho de Acceso: Solicitar copia de los datos personales almacenados.",
          "Derecho de Rectificación: Modificar información inexacta o desactualizada.",
          "Derecho de Supresión: Exigir la eliminación definitiva de su cuenta.",
        ],
      },
      {
        id: "cookies",
        num: "Sección 9",
        title: "Política de Cookies de Sesión",
        content: [
          "Utilizamos cookies exclusivamente para autenticación segura y funcionalidad del sistema.",
          "No utilizamos cookies publicitarias invasivas ni píxeles de seguimiento de terceros.",
        ],
      },
      {
        id: "grievance",
        num: "Sección 10",
        title: "Oficial de Quejas y Contacto Regulatorio",
        content: [
          "Oficial Designado: Responsable de Gobernanza y Privacidad de Datos | Medhashine",
          "Contacto: privacy@medhashine.in | grievance@medhashine.in",
          "Tiempo de respuesta: 24 a 48 horas.",
        ],
      },
    ],
    bottomCta: {
      title: "¿Preguntas sobre nuestras políticas de privacidad?",
      desc: "Agradecemos el diálogo con estudiantes, educadores y familias.",
      btn: "Contactar al Equipo Legal",
    },
  },

  bn: {
    heroBadge: "আস্থা ও ডেটা সুরক্ষা রূপরেখা",
    heroTitle: "গোপনীয়তা নীতি ও শিক্ষার্থী ডেটা সনদ",
    heroSubtitle:
      "মেধাশাইন (Medhashine)-এ আমরা বিশ্বাস করি যে ডিজিটাল নিরাপত্তা নিশ্চিত হলেই শিক্ষার স্বাধীনতা সম্ভব। আমরা কোনো শিক্ষার্থীর তথ্য বিক্রি করি না এবং সর্বোচ্চ বৈশ্বিক নিরাপত্তা মান বজায় রাখি।",
    effectiveDateLabel: "কার্যকর তারিখ: ১৯ সেপ্টেম্বর ২০২৬",
    policyVersionLabel: "নীতি সংস্করণ: ২.৪ (এন্টারপ্রাইজ)",
    statutoryCompliance: "DPDP আইন ২০২৩ এবং COPPA অনুগত",
    selectLanguageLabel: "ভাষা নির্বাচন করুন",
    pillars: [
      { title: "শূন্য তথ্য বিক্রয়", desc: "আমরা কখনোই শিক্ষার্থী বা শিক্ষকদের ব্যক্তিগত তথ্য বিজ্ঞাপনদাতা বা দালালদের কাছে বিক্রি বা ভাড়া দিই না।" },
      { title: "শিক্ষার্থীদের সুরক্ষা", desc: "১৮ বছরের কম বয়সীদের জন্য সম্পূর্ণ সুরক্ষা। কোনো বিজ্ঞাপন ট্র্যাকিং বা নজরদারি নিষিদ্ধ।" },
      { title: "উচ্চমানের নিরাপত্তা", desc: "AES-256 এনক্রিপশন, TLS 1.3 এবং সুরক্ষিত HttpOnly কুকিজের মাধ্যমে ডেটা সম্পূর্ণ নিরাপদ।" },
      { title: "ডেটার সার্বভৌমত্ব", desc: "আপনার ডেটা আপনারই। যেকোনো সময় অ্যাকাউন্ট মুছে ফেলার পূর্ণ অধিকার রয়েছে।" },
    ],
    tocTitle: "সুচিপত্র",
    needHelpTitle: "সহায়তা প্রয়োজন?",
    needHelpDesc: "আপনার ব্যক্তিগত তথ্যের নিরাপত্তা নিয়ে যেকোনো প্রশ্নে আমাদের ডেটা সুরক্ষা কর্মকর্তার সাথে যোগাযোগ করুন।",
    sections: [
      {
        id: "charter",
        num: "অনুচ্ছেদ ১",
        title: "আমাদের গোপনীয়তা অঙ্গীকার",
        content: [
          "মেধাশাইন একটি নির্ভরযোগ্য শিক্ষামূলক পাঠশালা। শিক্ষার্থীদের চিন্তাভাবনার স্বাধীনতা ও তথ্যের নিরাপত্তা নিশ্চিত করাই আমাদের লক্ষ্য।",
          "আমরা কখনোই শিক্ষার্থীদের ব্যক্তিগত তথ্য বা পড়ার অভ্যাস কোনো তৃতীয় পক্ষের কাছে হস্তান্তর করি না।",
        ],
        highlight: {
          title: "মেধাশাইনের নিশ্চয়তা",
          points: [
            "আমরা কোনো তৃতীয় পক্ষের কাছে তথ্য বিক্রি করি না।",
            "শিক্ষার্থীদের কোনো লক্ষ্যযুক্ত বিজ্ঞাপন দেখানো হয় না।",
            "অপ্রাপ্তবয়স্কদের ওপর কোনো নজরদারি চালানো হয় না।",
          ],
        },
      },
      {
        id: "collection",
        num: "অনুচ্ছেদ ২",
        title: "আমরা কী তথ্য সংগ্রহ করি",
        content: [
          "অ্যাকাউন্ট ডেটা: নাম, ইমেইল, এনক্রিপ্ট করা পাসওয়ার্ড এবং পছন্দের বিষয়শ্রেণী।",
          "শিক্ষক তথ্য: যাচাইকৃত ডিগ্রি এবং পরিচয় নিশ্চিতকরণে ব্যবহৃত মোবাইল নম্বর।",
          "সুরক্ষা ডেটা: সাইবার আক্রমণ প্রতিহত করার জন্য আইপি ঠিকানা এবং ব্রাউজার সংস্করণ।",
        ],
      },
      {
        id: "usage",
        num: "অনুচ্ছেদ ৩",
        title: "তথ্যের সঠিক ব্যবহার",
        content: [
          "ব্যবহারকারী প্রমাণীকরণ এবং শিক্ষামূলক প্রবন্ধ প্রদর্শনে তথ্য ব্যবহার করা হয়।",
          "নিরাপত্তা যাচাই এবং সিস্টেমের অননুমোদিত অ্যাক্সেস রোধে সহায়তা করে।",
        ],
      },
      {
        id: "minors",
        num: "অনুচ্ছেদ ৪",
        title: "শিশু ও অপ্রাপ্তবয়স্কদের সুরক্ষা",
        content: [
          "১৮ বছরের কম বয়সীদের যেকোনো ধরনের ট্র্যাকিং কঠোরভাবে নিষিদ্ধ।",
          "অভিভাবকগণ যেকোনো সময় সন্তানের ডেটা দেখতে বা মুছে ফেলতে privacy@medhashine.in-এ যোগাযোগ করতে পারেন।",
        ],
      },
      {
        id: "security",
        num: "অনুচ্ছেদ ৫",
        title: "কারিগরি নিরাপত্তা ব্যবস্থা",
        content: [
          "এনক্রিপ্টেড সেশন কুকিজ এবং উন্নত ইনপুট স্যানিটাইজেশন সব ধরনের সাইবার হামলা থেকে অ্যাকাউন্ট সুরক্ষিত রাখে।",
        ],
      },
      {
        id: "sharing",
        num: "অনুচ্ছেদ ৬",
        title: "অনুমোদিত পরিষেবা অংশীদার",
        content: [
          "আমরা কেবলমাত্র বিশ্বস্ত ক্লাউড হোস্ট ও ডেটাবেস অবকাঠামোর সাথে কাজ করি যারা কঠোর আইনি নীতি মেনে চলে।",
        ],
      },
      {
        id: "retention",
        num: "অনুচ্ছেদ ৭",
        title: "ডেটা ধারণ ও মুছে ফেলার অধিকার",
        content: [
          "অ্যাকাউন্ট মুছে ফেলার অনুরোধের ৩০ দিনের মধ্যে সমস্ত ব্যক্তিগত তথ্য স্থায়ীভাবে মুছে ফেলা হয়।",
        ],
      },
      {
        id: "rights",
        num: "অনুচ্ছেদ ৮",
        title: "ব্যবহারকারীর আইনি অধিকার",
        content: [
          "তথ্য সংশোধন, দেখার এবং স্থায়ীভাবে অপসারণের পূর্ণ অধিকার রয়েছে।",
        ],
      },
      {
        id: "cookies",
        num: "অনুচ্ছেদ ৯",
        title: "কুকিজ ও সেশন নীতি",
        content: [
          "আমরা শুধুমাত্র লগইন ও নিরাপত্তার জন্য কুকিজ ব্যবহার করি। কোনো ট্র্যাকিং কুকি নেই।",
        ],
      },
      {
        id: "grievance",
        num: "অনুচ্ছেদ ১০",
        title: "অভিযোগ কর্মকর্তা ও যোগাযোগ",
        content: [
          "ডেটা সুরক্ষা ও অভিযোগ কর্মকর্তা: privacy@medhashine.in | grievance@medhashine.in",
        ],
      },
    ],
    bottomCta: {
      title: "আমাদের নীতি সম্পর্কে প্রশ্ন আছে?",
      desc: "আমরা শিক্ষার্থী ও অভিভাবকদের যেকোনো মতামতের জন্য উন্মুক্ত।",
      btn: "যোগাযোগ করুন",
    },
  },

  mr: {
    heroBadge: "विश्वास आणि डेटा संरक्षण चौकट",
    heroTitle: "गोपनीयता धोरण आणि विद्यार्थी डेटा सनद",
    heroSubtitle:
      "मेधाशाइन (Medhashine) मध्ये आमचा विश्वास आहे की डिजिटल सुरक्षिततेमध्येच शैक्षणिक प्रगती शक्य आहे. आम्ही विद्यार्थ्यांचा डेटा विकत नाही आणि जागतिक मानकांचे पालन करतो.",
    effectiveDateLabel: "अंमलबजावणी तारीख: १९ सप्टेंबर २०२६",
    policyVersionLabel: "आवृत्ती: २.४ (एंटरप्राइज)",
    statutoryCompliance: "DPDP कायदा २०२३ आणि COPPA चे पालन",
    selectLanguageLabel: "भाषा निवडा / Select Language",
    pillars: [
      { title: "शून्य डेटा विक्री", desc: "आम्ही कधीही विद्यार्थ्यांचा किंवा शिक्षकांचा डेटा जाहिरातदारांना विकत नाही किंवा भाड्याने देत नाही." },
      { title: "विद्यार्थी सुरक्षा", desc: "१८ वर्षांखालील मुलांचे पूर्ण संरक्षण. कोणतीही वर्तणूक ट्रॅकिंग किंवा जाहिरात बंदी." },
      { title: "सर्वोच्च सुरक्षा", desc: "AES-256 एन्क्रिप्शन, TLS 1.3 आणि सुरक्षित HttpOnly कुकीज." },
      { title: "डेटा मालकी हक्क", desc: "तुमचा डेटा तुमचाच आहे. कधीही खाते काढून टाकण्याचा पूर्ण अधिकार." },
    ],
    tocTitle: "धोरण अनुक्रमणिका",
    needHelpTitle: "मदत हवी आहे?",
    needHelpDesc: "आपल्या वैयक्तिक डेटाविषयी कोणत्याही प्रश्नासाठी आमच्या डेटा संरक्षण अधिकाऱ्याशी संपर्क साधा.",
    sections: [
      {
        id: "charter",
        num: "भाग १",
        title: "आमची गोपनीयता वचनबद्धता",
        content: [
          "मेधाशाइन हे डिजिटल शिक्षणाचे व्यासपीठ आहे. डिजिटल पाळत न ठेवता मुक्त विचार आणि शिक्षणाला प्रोत्साहन देणे हे आमचे ध्येय आहे.",
          "आम्ही विद्यार्थ्यांची किंवा शिक्षकांची माहिती कोणत्याही त्रयस्थ पक्षाला कधीही विकत नाही.",
        ],
        highlight: {
          title: "मेधाशाइन हमी",
          points: [
            "आम्ही कधीही डेटा विकत नाही.",
            "कोणत्याही लक्ष्यित जाहिराती दाखवल्या जात नाहीत.",
            "अल्पवयीन मुलांवर कोणतीही डिजिटल पाळत ठेवली जात नाही.",
          ],
        },
      },
      {
        id: "collection",
        num: "भाग २",
        title: "आम्ही गोळा करत असलेली माहिती",
        content: [
          "खाते माहिती: नाव, ईमेल, एन्क्रिप्ट केलेले पासवर्ड आणि शैक्षणिक पसंती.",
          "शिक्षक पडताळणी: शैक्षणिक पदव्या आणि ओळखीसाठी आवश्यक १० अंकी मोबाईल नंबर.",
          "सुरक्षा माहिती: सायबर हल्ले रोखण्यासाठी आयपी ॲड्रेस आणि ब्राउझर तपशील.",
        ],
      },
      {
        id: "usage",
        num: "भाग ३",
        title: "माहितीचा योग्य वापर",
        content: [
          "वापरकर्ता प्रमाणीकरण, निबंध व धडे योग्य रीतीने दाखवणे आणि सुरक्षा राखण्यासाठी डेटा वापरला जातो.",
        ],
      },
      {
        id: "minors",
        num: "भाग ४",
        title: "अल्पवयीन मुलांची गोपनीयता (१८ वर्षांखालील)",
        content: [
          "DPDP कायद्याच्या कलम ९ अंतर्गत मुलांचे ट्रॅकिंग पूर्णपणे प्रतिबंधित आहे.",
          "पालक privacy@medhashine.in वर संपर्क करून आपल्या मुलाचा डेटा पाहू किंवा नष्ट करू शकतात.",
        ],
      },
      {
        id: "security",
        num: "भाग ५",
        title: "तांत्रिक सुरक्षा व्यवस्था",
        content: [
          "सत्र एन्क्रिप्शन, XSS आणि CSRF सुरक्षा उपाय सर्व प्रकारच्या सायबर हल्ल्यांपासून खाते सुरक्षित ठेवतात.",
        ],
      },
      {
        id: "sharing",
        num: "भाग ६",
        title: "अधिकृत सेवा भागीदार",
        content: [
          "आम्ही केवळ विश्वासू क्लाउड होस्टिंग आणि डेटाबेस भागीदारांसोबत काम करतो जे कठोर नियमांचे पालन करतात.",
        ],
      },
      {
        id: "retention",
        num: "भाग ७",
        title: "डेटा साठवणे आणि नष्ट करणे",
        content: [
          "खाते बंद करण्याची विनंती केल्यास ३० दिवसांत सर्व वैयक्तिक माहिती कायमस्वरूपी नष्ट केली जाते.",
        ],
      },
      {
        id: "rights",
        num: "भाग ८",
        title: "आपले कायदेशीर हक्क",
        content: [
          "माहिती पाहणे, दुरुस्त करणे आणि कायमची काढून टाकण्याचा पूर्ण अधिकार.",
        ],
      },
      {
        id: "cookies",
        num: "भाग ९",
        title: "कुकीज आणि सत्र धोरण",
        content: [
          "आम्ही केवळ लॉगिन आणि सुरक्षेसाठी कुकीज वापरतो. कोणत्याही जाहिरात कुकीज वापरल्या जात नाहीत.",
        ],
      },
      {
        id: "grievance",
        num: "भाग १०",
        title: "तक्रार निवारण अधिकारी",
        content: [
          "संपर्क: privacy@medhashine.in | grievance@medhashine.in",
        ],
      },
    ],
    bottomCta: {
      title: "आपल्या काही शंका आहेत का?",
      desc: "आम्ही विद्यार्थी, पालक आणि शिक्षकांच्या सूचनांचे स्वागत करतो.",
      btn: "विधी विभागाशी संपर्क साधा",
    },
  },

  fr: {
    heroBadge: "Cadre de Confiance et Gouvernance des Données",
    heroTitle: "Politique de Confidentialité et Charte des Données Étudiantes",
    heroSubtitle:
      "Chez Medhashine, nous croyons que la curiosité éducative ne s'épanouit que dans un environnement numérique sécurisé. Nous ne vendons pas les données des élèves, n'affichons aucune publicité ciblée et respectons les normes mondiales les plus strictes.",
    effectiveDateLabel: "Date d'effet : 19 septembre 2026",
    policyVersionLabel: "Version : 2.4 (Édition Entreprise)",
    statutoryCompliance: "Conforme à la loi DPDP 2023 et au COPPA / RGPD",
    selectLanguageLabel: "Choisir la langue / Select Language",
    pillars: [
      { title: "Zéro Vente de Données", desc: "Nous ne commercialisons ni ne louons jamais les données d'apprentissage à des annonceurs." },
      { title: "Priorité aux Élèves", desc: "Protection totale des mineurs de moins de 18 ans. Aucun profilage comportemental." },
      { title: "Sécurité Entreprise", desc: "Chiffrement AES-256 au repos, TLS 1.3 et isolation stricte des cookies HttpOnly." },
      { title: "Souveraineté des Données", desc: "Vos données vous appartiennent. Droit d'accès, de rectification et d'effacement complet." },
    ],
    tocTitle: "Table des Matières",
    needHelpTitle: "Besoin d'aide ?",
    needHelpDesc: "Pour toute question relative à vos données personnelles, contactez notre Délégué à la Protection des Données.",
    sections: [
      {
        id: "charter",
        num: "Section 1",
        title: "Notre Charte de Confidentialité",
        content: [
          "Medhashine est une plateforme dédiée au développement de la pensée critique sans surveillance numérique intrusive.",
          "Nous garantissons la confidentialité la plus stricte pour chaque étudiant et enseignant.",
        ],
        highlight: {
          title: "La Garantie Medhashine",
          points: [
            "Aucune vente de données personnelles.",
            "Aucune publicité ciblée.",
            "Aucun profilage des élèves et des mineurs.",
          ],
        },
      },
      {
        id: "collection",
        num: "Section 2",
        title: "Données Collectées",
        content: [
          "Données de compte : Nom, courriel, mots de passe chiffrés et préférences scolaires.",
          "Données enseignants : Diplômes académiques et numéro mobile utilisé uniquement pour la vérification à deux facteurs.",
          "Télémétrie : Adresses IP pour prévenir les attaques DDoS et le piratage de comptes.",
        ],
      },
      {
        id: "usage",
        num: "Section 3",
        title: "Utilisation des Données",
        content: [
          "Authentification des utilisateurs, diffusion des cours et protection de l'infrastructure.",
        ],
      },
      {
        id: "minors",
        num: "Section 4",
        title: "Protection des Mineurs",
        content: [
          "Conformité absolue avec les réglementations sur la protection de l'enfance.",
          "Les parents peuvent demander l'accès ou la suppression des données de leur enfant via privacy@medhashine.in.",
        ],
      },
      {
        id: "security",
        num: "Section 5",
        title: "Architecture Technique et Sécurité",
        content: [
          "Chiffrement robuste, protection contre les injections XSS/NoSQL et validation CSRF.",
        ],
      },
      {
        id: "sharing",
        num: "Section 6",
        title: "Sous-traitants et Fournisseurs Agréés",
        content: [
          "Partenariats exclusifs avec des hébergeurs cloud certifiés SOC 2 et ISO 27001.",
        ],
      },
      {
        id: "retention",
        num: "Section 7",
        title: "Conservation et Droit à l'Effacement",
        content: [
          "Suppression définitive et irréversible des données dans les 30 jours suivant la clôture du compte.",
        ],
      },
      {
        id: "rights",
        num: "Section 8",
        title: "Vos Droits Légaux",
        content: [
          "Droit d'accès, de rectification, d'effacement ('droit à l'oubli') et de réclamation.",
        ],
      },
      {
        id: "cookies",
        num: "Section 9",
        title: "Politique relative aux Cookies",
        content: [
          "Uniquement des cookies de session strictement nécessaires. Aucun cookie publicitaire.",
        ],
      },
      {
        id: "grievance",
        num: "Section 10",
        title: "Délégué à la Protection des Données",
        content: [
          "Contact officiel : privacy@medhashine.in | grievance@medhashine.in",
        ],
      },
    ],
    bottomCta: {
      title: "Des questions sur notre politique ?",
      desc: "Nous sommes à l'écoute des élèves, professeurs et parents.",
      btn: "Contacter l'équipe juridique",
    },
  },

  de: {
    heroBadge: "Rahmenwerk für Vertrauen & Datensicherheit",
    heroTitle: "Datenschutzerklärung & Charta für Schülerdaten",
    heroSubtitle:
      "Bei Medhashine sind wir überzeugt, dass Bildungsneugier nur in einer Umgebung absoluter digitaler Sicherheit gedeihen kann. Wir verkaufen keine Schülerdaten, betreiben keine verhaltensbasierten Werbenetzwerke und halten uns an höchste globale Datenschutzstandards.",
    effectiveDateLabel: "Gültig ab: 19. September 2026",
    policyVersionLabel: "Richtlinienversion: 2.4 (Enterprise-Edition)",
    statutoryCompliance: "Konform mit DPDP Act (Indien) 2023 & COPPA / DSGVO",
    selectLanguageLabel: "Sprache wählen / Select Language",
    pillars: [
      {
        title: "Kein Datenverkauf",
        desc: "Wir monetarisieren, vermieten oder verkaufen niemals Daten von Schülern oder Lehrern an Werbetreibende.",
      },
      {
        title: "Schutz für Minderjährige",
        desc: "Vollständiger Schutz für Minderjährige gemäß DPDP Act 2023 und COPPA. Kein Werbetracking bei Kindern.",
      },
      {
        title: "Enterprise-Sicherheit",
        desc: "AES-256-Verschlüsselung im Ruhezustand, TLS 1.3 bei der Übertragung und sichere HttpOnly-Cookies.",
      },
      {
        title: "Volle Datensouveränität",
        desc: "Ihre Daten gehören Ihnen. Sie haben das uneingeschränkte Recht, Ihr Konto jederzeit herunterzuladen oder zu löschen.",
      },
    ],
    tocTitle: "Inhaltsverzeichnis",
    needHelpTitle: "Datenschutz-Support benötigt?",
    needHelpDesc: "Haben Sie Fragen zu Ihren personenbezogenen Daten oder zum Jugendschutz? Kontaktieren Sie unseren Datenschutzbeauftragten.",
    sections: [
      {
        id: "charter",
        num: "Abschnitt 1",
        title: "Unsere Datenschutzerklärung & Kernversprechen",
        content: [
          "Medhashine betreibt eine führende digitale Bildungsplattform, die kritisches Denken und akademische Neugier frei von digitaler Überwachung fördert.",
          "Diese Richtlinie beschreibt unsere Grundsätze für die Erhebung, Verarbeitung und den Schutz von Informationen auf der Medhashine-Plattform.",
        ],
        highlight: {
          title: "Die Medhashine-Garantie",
          points: [
            "Wir verkaufen Ihre personenbezogenen Daten niemals an Dritte.",
            "Wir schalten keine zielgerichtete Werbung für Schüler oder Lehrkräfte.",
            "Wir betreiben kein Verhaltens-Profiling oder digitale Überwachung von Minderjährigen.",
          ],
        },
      },
      {
        id: "collection",
        num: "Abschnitt 2",
        title: "Kategorien der erhobenen Daten",
        content: [
          "Nach dem Prinzip der Datenminimierung erheben wir nur Daten, die für hochwertige Bildungsangebote zwingend erforderlich sind.",
          "Kontodaten: Name, E-Mail-Adresse, kryptografisch gehashte Passwörter und Klassenstufen-Präferenzen.",
          "Lehrkräfte-Verifizierung: Akademische Abschlüsse und eine obligatorische 10-stellige Telefonnummer, die ausschließlich zur Zwei-Faktor-Identitätsprüfung und Administration dient.",
          "Sicherheits-Telemetrie: IP-Adressen und Browser-Informationen, um die Plattform vor Brute-Force-Angriffen und DDoS zu schützen.",
        ],
      },
      {
        id: "usage",
        num: "Abschnitt 3",
        title: "Nutzung der Bildungsdaten",
        content: [
          "Wir verarbeiten Daten ausschließlich auf rechtmäßigen Grundlagen: Vertragserfüllung, berechtigtes Interesse und Einwilligung.",
          "Bereitstellung des Dienstes: Authentifizierung, Organisation des Lehrplans und Auslieferung von Fachbeiträgen.",
          "Austausch & Diskussion: Von Lehrkräften moderierte Kommentare zu Aufsätzen und Lernleitfäden.",
          "Cybersicherheit: Abwehr von Bots, Blockierung von Cross-Site-Request-Forgery (CSRF) und Durchsetzung von Rate-Limits.",
          "Wichtige Mitteilungen: Ausschließlich essentielle administrative Nachrichten (z.B. Passwort-Rücksetzungen). Wir versenden keinen Spam.",
        ],
      },
      {
        id: "minors",
        num: "Abschnitt 4",
        title: "Schutz von Schülern und Minderjährigen (unter 18 Jahren)",
        content: [
          "Der Schutz von Kindern ist unsere oberste rechtliche und ethische Pflicht gemäß dem indischen DPDP Act 2023 und US-amerikanischem COPPA.",
          "Abschnitt 9 DPDP Act: Vollständiges Verbot von Tracking, Verhaltensüberwachung oder zielgerichteter Werbung bei Minderjährigen.",
          "Elternrechte: Eltern und Erziehungsberechtigte können die Daten ihres Kindes jederzeit über privacy@medhashine.in einsehen oder vollständig löschen lassen.",
        ],
      },
      {
        id: "security",
        num: "Abschnitt 5",
        title: "Technische Architektur & Sicherheitsmaßnahmen",
        content: [
          "Sitzungsverschlüsselung: Benutzersitzungen werden durch isolierte HttpOnly- und Secure-Cookies geschützt, um Credential-Theft zu verhindern.",
          "Eingabebereinigung: Schutz vor XSS- und NoSQL-Injection-Angriffen in allen Datenfeldern.",
          "CSRF-Validierung: Strenge Origin- und Referer-Prüfungen blockieren unbefugte Cross-Site-Anfragen.",
          "Intelligente Ratenbegrenzung: Schutz vor Brute-Force- und Denial-of-Service-Spamming.",
        ],
      },
      {
        id: "sharing",
        num: "Abschnitt 6",
        title: "Autorisierte Dienstleister & Subunternehmer",
        content: [
          "Wir monetarisieren oder verkaufen niemals Ihre Daten. Wir arbeiten ausschließlich mit vertraglich geprüften Cloud-Infrastruktur- und Hosting-Partnern unter strikten Auftragsverarbeitungsverträgen (AVV).",
          "Kategorien: Cloud-Compute- und Hosting-Infrastruktur, verschlüsselte Datenbankanbieter, Content Delivery Networks (CDNs) und E-Mail-Dienste.",
          "Alle Partner erfüllen Zertifizierungsstandards nach SOC 2, ISO 27001 und TLS 1.3.",
        ],
      },
      {
        id: "retention",
        num: "Abschnitt 7",
        title: "Datenspeicherung & Recht auf Löschung",
        content: [
          "Wir speichern personenbezogene Daten nur so lange, wie das Konto aktiv ist.",
          "Bei einer Löschanfrage werden alle personenbezogenen Identifikatoren innerhalb von 30 Tagen unwiderruflich gelöscht.",
        ],
      },
      {
        id: "rights",
        num: "Abschnitt 8",
        title: "Ihre gesetzlichen Rechte",
        content: [
          "Auskunftsrecht: Vollständige Übersicht über die verarbeiteten personenbezogenen Daten anfordern.",
          "Recht auf Berichtigung: Unzutreffende oder unvollständige Angaben korrigieren.",
          "Recht auf Löschung ('Recht auf Vergessenwerden'): Vollständige Löschung des Kontos veranlassen.",
          "Beschwerderecht: Anliegen direkt an unseren Datenschutzbeauftragten richten.",
        ],
      },
      {
        id: "cookies",
        num: "Abschnitt 9",
        title: "Cookie- und Sitzungsrichtlinie",
        content: [
          "Wir verwenden ausschließlich technisch notwendige Sitzungscookies für Anmeldung und Schutz vor CSRF.",
          "Wir verwenden keinerlei Werbe-Tracking-Cookies oder verhaltensbasierte Werbepixel von Drittanbietern.",
        ],
      },
      {
        id: "grievance",
        num: "Abschnitt 10",
        title: "Datenschutzbeauftragter & Kontakt",
        content: [
          "Zuständiger Datenschutz- und Beschwerdebeauftragter | Medhashine Educational Technologies",
          "Direktkontakt: privacy@medhashine.in | Beschwerden: grievance@medhashine.in",
          "Rückmeldezeit: Innerhalb von 24–48 Stunden.",
        ],
      },
    ],
    bottomCta: {
      title: "Haben Sie Fragen zu unseren Datenschutzrichtlinien?",
      desc: "Wir freuen uns über den Dialog mit Schülern, Lehrkräften, Schulen und Eltern.",
      btn: "Rechtsteam kontaktieren",
    },
  },

  ta: {
    heroBadge: "நம்பகத்தன்மை மற்றும் தரவு மேலாண்மை",
    heroTitle: "தனியுரிமைக் கொள்கை & மாணவர் தரவு பாதுகாப்பு சாசனம்",
    heroSubtitle:
      "மேதாஷைன் (Medhashine) தளத்தில் மாணவர்களின் கல்விசார் பாதுகாப்புக்கு முதலிடம் அளிக்கிறோம். நாங்கள் மாணவர் தரவை விற்க மாட்டோம், விளம்பர நெட்வொர்க்குகளை இயக்குவதில்லை.",
    effectiveDateLabel: "நடைமுறைக்கு வரும் நாள்: 19 செப்டம்பர் 2026",
    policyVersionLabel: "கொள்கை பதிப்பு: 2.4 (Enterprise)",
    statutoryCompliance: "இந்திய DPDP சட்டம் 2023 மற்றும் COPPA இணக்கமானது",
    selectLanguageLabel: "மொழியைத் தேர்வுசெய்க / Select Language",
    pillars: [
      { title: "தரவு விற்பனை இல்லை", desc: "மாணவர்கள் அல்லது ஆசிரியர்களின் தரவை நாங்கள் ஒருபோதும் விற்பனை செய்வதில்லை." },
      { title: "மாணவர் பாதுகாப்பு", desc: "18 வயதுக்குட்பட்ட மைனர்களுக்கு முழுமையான பாதுகாப்பு. விளம்பர கண்காணிப்பு இல்லை." },
      { title: "வலுவான பாதுகாப்பு", desc: "AES-256 குறியாக்கம் மற்றும் பாதுகாப்பான குக்கீ கட்டமைப்பு." },
      { title: "முழு தரவு இறையாண்மை", desc: "உங்கள் தரவை எப்போது வேண்டுமானாலும் நீக்கும் முழு உரிமை உங்களுக்கு உண்டு." },
    ],
    tocTitle: "பொருளடக்கம்",
    needHelpTitle: "உதவி தேவையா?",
    needHelpDesc: "தனியுரிமை தொடர்பான கேள்விகளுக்கு எங்கள் அதிகாரியைத் தொடர்பு கொள்ளவும்.",
    sections: [
      {
        id: "charter",
        num: "பிரிவு 1",
        title: "எங்கள் தனியுரிமை உறுதிமொழி",
        content: [
          "டிஜிட்டல் கண்காணிப்பு இல்லாத பாதுகாப்பான கல்விச் சூழலை உருவாக்குவதே எங்கள் நோக்கம்.",
          "நாங்கள் தனிப்பட்ட தகவல்களை யாருக்கும் விற்க மாட்டோம்.",
        ],
        highlight: {
          title: "மேதாஷைன் உத்தரவாதம்",
          points: [
            "தகவல் விற்பனை இல்லை.",
            "இலக்கு வைக்கப்பட்ட விளம்பரங்கள் இல்லை.",
            "சிறுவர்கள் மீது எந்தக் கண்காணிப்பும் இல்லை.",
          ],
        },
      },
      {
        id: "collection",
        num: "பிரிவு 2",
        title: "நாங்கள் சேகரிக்கும் தகவல்கள்",
        content: [
          "கணக்கு விவரங்கள்: பெயர், மின்னஞ்சல் மற்றும் குறியாக்கப்பட்ட கடவுச்சொற்கள்.",
          "ஆசிரியர் சரிபார்ப்பு: கல்வித் தகுதிகள் மற்றும் 10 இலக்க மொபைல் எண்.",
          "பாதுகாப்புத் தரவு: இணைய தாக்குதல்களைத் தடுப்பதற்கான ஐபி முகவரி.",
        ],
      },
      {
        id: "usage",
        num: "பிரிவு 3",
        title: "கல்வித் தரவு பயன்பாடு",
        content: ["தளத்தின் செயல்பாடு மற்றும் கல்வி உள்ளடக்கங்களை பாதுகாப்பாக வழங்குதல்."],
      },
      {
        id: "minors",
        num: "பிரிவு 4",
        title: "சிறுவர் தனியுரிமை பாதுகாப்பு",
        content: ["18 வயதுக்குட்பட்டவர்களின் தரவு கண்காணிப்பு முற்றிலும் தடைசெய்யப்பட்டுள்ளது."],
      },
      {
        id: "security",
        num: "பிரிவு 5",
        title: "தொழில்நுட்ப பாதுகாப்பு",
        content: ["HttpOnly குக்கீகள் மற்றும் உட்செலுத்துதல் தடுப்பு பாதுகாப்பு."],
      },
      {
        id: "sharing",
        num: "பிரிவு 6",
        title: "அங்கீகரிக்கப்பட்ட சேவை வழங்குநர்கள்",
        content: ["நம்பகமான கிளவுட் உள்கட்டமைப்புடன் மட்டுமே நாங்கள் பணியாற்றுகிறோம்."],
      },
      {
        id: "retention",
        num: "பிரிவு 7",
        title: "தரவு தக்கவைப்பு & நீக்கம்",
        content: ["கோரிக்கையின் 30 நாட்களுக்குள் அனைத்து தனிப்பட்ட தரவுகளும் நீக்கப்படும்."],
      },
      {
        id: "rights",
        num: "பிரிவு 8",
        title: "உங்கள் சட்டப்பூர்வ உரிமைகள்",
        content: ["தரவை அணுகுதல், திருத்துதல் மற்றும் நீக்குவதற்கான முழு உரிமை."],
      },
      {
        id: "cookies",
        num: "பிரிவு 9",
        title: "குக்கீ கொள்கை",
        content: ["பாதுகாப்பான உள்நுழைவுக்கு மட்டுமே குக்கீகள் பயன்படுத்தப்படுகின்றன."],
      },
      {
        id: "grievance",
        num: "பிரிவு 10",
        title: "குறைதீர்ப்பு அதிகாரி தொடர்பு",
        content: ["மின்னஞ்சல்: privacy@medhashine.in | grievance@medhashine.in"],
      },
    ],
    bottomCta: {
      title: "தனியுரிமை பற்றி கேள்விகள் உள்ளதா?",
      desc: "மாணவர்கள் மற்றும் பெற்றோரின் கருத்துக்களை நாங்கள் வரவேற்கிறோம்.",
      btn: "சட்டக் குழுவைத் தொடர்பு கொள்ளவும்",
    },
  },
  te: {
  "heroBadge": "నమ్మకం & డేటా గవర్నెన్స్ ఫ్రేమ్‌వర్క్",
  "heroTitle": "గోప్యతా విధానం & విద్యార్థి డేటా చార్టర్",
  "heroSubtitle": "మేధాషైన్‌లో, సంపూర్ణ డిజిటల్ భద్రత ఉన్న వాతావరణంలోనే విద్యా జిజ్ఞాస వికసిస్తుందని మేము నమ్ముతున్నాము. మేము విద్యార్థుల డేటాను విక్రయించము మరియు ప్రపంచ డేటా రక్షణ ప్రమాణాలను ఖచ్చితంగా పాటిస్తాము.",
  "effectiveDateLabel": "అమలు తేదీ: సెప్టెంబర్ 19, 2026",
  "policyVersionLabel": "విధానం: వెర్షన్ 2.4 (ఎంటర్‌ప్రైజ్ ఎడిషన్)",
  "statutoryCompliance": "DPDP చట్టం (భారతదేశం) 2023 & COPPA కంప్లైంట్",
  "selectLanguageLabel": "భాష ఎంచుకోండి",
  "pillars": [
    {
      "title": "శూన్య డేటా విక్రయం",
      "desc": "మేము అభ్యాసకుల లేదా ఉపాధ్యాయుల డేటాను బ్రోకర్లకు లేదా ప్రకటనదారులకు ఎప్పుడూ విక్రయించము లేదా వేలం వేయము."
    },
    {
      "title": "విద్యార్థి భద్రతకు ప్రాధాన్యత",
      "desc": "DPDP చట్టం 2023 సెక్షన్ 9 మరియు COPPA ప్రకారం మైనర్లకు సంపూర్ణ రక్షణ. పిల్లల ప్రవర్తనా ట్రాకింగ్ ఉండదు."
    },
    {
      "title": "ఎంటర్‌ప్రైజ్ సెక్యూరిటీ",
      "desc": "AES-256 ఎన్‌క్రిప్షన్, TLS 1.3 డేటా ప్రసారం, HttpOnly కుకీ రక్షణ మరియు బలమైన CSRF సైబర్ భద్రత."
    },
    {
      "title": "పూర్తి డేటా సార్వభౌమాధికారం",
      "desc": "మీ సమాచారానికి మీరే సంపూర్ణ యజమానులు. మీ డేటాను ఎప్పుడైనా డౌన్‌లోడ్ చేయడానికి లేదా తొలగించడానికి పూర్తి హక్కులు."
    }
  ],
  "tocTitle": "విధాన విషయ సూచిక",
  "needHelpTitle": "గోప్యతా సహాయం కావాలా?",
  "needHelpDesc": "మీ వ్యక్తిగత డేటా లేదా మైనర్ రక్షణ గురించి సందేహాలు ఉన్నాయా? మా ప్రత్యేక డేటా ప్రొటెక్షన్ ఆఫీసర్‌ను సంప్రదించండి.",
  "sections": [
    {
      "id": "charter",
      "num": "విభాగం 1",
      "title": "మా గోప్యతా చార్టర్ & ప్రధాన వాగ్దానం",
      "content": [
        "మేధాషైన్ ఒక ప్రముఖ డిజిటల్ విద్యా పఠన వేదిక మరియు బోధనా ప్రచురణ నెట్‌వర్క్‌ను నిర్వహిస్తుంది. డిజిటల్ నిఘా మరియు మోసపూరిత డేటా వెలికితీత నుండి వ్యక్తులు విముక్తి పొందినప్పుడే నిజమైన విద్యా జిజ్ఞాస, మేధోపరమైన లోతు మరియు స్వతంత్ర ఆలోచన అభివృద్ధి చెందుతాయని మేము విశ్వసిస్తున్నాము.",
        "ఈ గోప్యతా విధానం మేధాషైన్ పోర్టల్, ఉపాధ్యాయ సాధనాలు మరియు సంబంధిత సేవల అంతటా సమాచార సేకరణ, నిర్వహణ, నిల్వ మరియు రక్షణకు సంబంధించిన మా పద్ధతులను వివరిస్తుంది."
      ],
      "highlight": {
        "title": "మేధాషైన్ గ్యారెంటీ",
        "points": [
          "మేము మీ వ్యక్తిగత సమాచారాన్ని లేదా పాఠశాల పఠన లాగ్‌లను మూడవ పక్షాలకు ఎప్పుడూ విక్రయించము.",
          "మేము విద్యార్థులకు లేదా అధ్యాపకులకు ఎలాంటి లక్ష్యిత వాణిజ్య ప్రకటనలను ప్రదర్శించము.",
          "మేము మైనర్ల బిహేవియరల్ ప్రొఫైలింగ్ లేదా స్వయంచాలక నిఘాలో ఎప్పుడూ పాల్గొనము."
        ]
      }
    },
    {
      "id": "collection",
      "num": "విభాగం 2",
      "title": "మేము సేకరించే సమాచార వర్గాలు",
      "content": [
        "ఆధునిక గోప్యతా చట్టాల కింద డేటా కనిష్టీకరణ సూత్రానికి ఖచ్చితంగా కట్టుబడి, అధిక-నాణ్యత గల విద్యా అనుభవాలను అందించడానికి ఖచ్చితంగా అవసరమైన డేటాను మాత్రమే మేము సేకరిస్తాము.",
        "ఖాతా నమోదు & ప్రొఫైల్ డేటా: విద్యార్థి లేదా అధ్యాపకుడిగా ఖాతాను సృష్టించినప్పుడు మీ పేరు, ఇమెయిల్, bcrypt హాష్ చేసిన పాస్‌వర్డ్‌లు మరియు తరగతి ప్రాధాన్యతలు.",
        "అధ్యాపకుల ధృవీకరణ డేటా: విద్యా డిగ్రీలు, అనుభవం మరియు గుర్తింపు ధృవీకరణ కోసం తప్పనిసరి 10-అంకెల మొబైల్ నంబర్.",
        "సాంకేతిక & భద్రతా టెలిమెట్రీ: బ్రూట్-ఫోర్స్ దాడులు మరియు DDoS నుండి వేదికను రక్షించడానికి IP చిరునామా మరియు బ్రౌజర్ వివరాలు."
      ]
    },
    {
      "id": "usage",
      "num": "విభాగం 3",
      "title": "విద్యా డేటాను మేము ఎలా ఉపయోగిస్తాము",
      "content": [
        "మేము చట్టబద్ధమైన ప్రాతిపదికన మాత్రమే మీ సమాచారాన్ని ప్రాసెస్ చేస్తాము: ఒప్పంద పనితీరు, చట్టబద్ధమైన ఆసక్తి మరియు సమ్మతి.",
        "ప్రధాన ప్లాట్‌ఫారమ్ డెలివరీ: వినియోగదారు ప్రమాణీకరణ, పాఠ్యాంశాల నిర్వహణ మరియు ఉపాధ్యాయుల విద్యా కథనాల ప్రదర్శన.",
        "చర్చలు & పీర్ ఫీడ్‌బ్యాక్: వ్యాసాలపై ఉపాధ్యాయుల పర్యవేక్షణలో విద్యార్థుల వ్యాఖ్యలు మరియు మేధోపరమైన చర్చలను సులభతరం చేయడం.",
        "నెట్‌వర్క్ రక్షణ: ఆటోమేటెడ్ బాట్‌లను గుర్తించడం, CSRF దాడులను నిరోధించడం మరియు ప్లాట్‌ఫారమ్ సమగ్రతను రక్షించడం.",
        "ప్రత్యక్ష నోటిఫికేషన్‌లు: పాస్‌వర్డ్ రీసెట్‌లు, అప్లికేషన్ సమీక్షలు వంటి ముఖ్యమైన పరిపాలనా ఇమెయిల్‌లను పంపడం. మేము స్పామ్ చేయము."
      ]
    },
    {
      "id": "minors",
      "num": "విభాగం 4",
      "title": "విద్యార్థి & మైనర్ల గోప్యత (18 ఏళ్ల లోపు రక్షణ)",
      "content": [
        "మేధాషైన్ ప్రాథమికంగా అభ్యాసకుల కోసం నిర్మించబడింది, వీరిలో ఎక్కువమంది చిన్న వయస్సు విద్యార్థులు. డిజిటల్ పర్సనల్ డేటా ప్రొటెక్షన్ యాక్ట్, 2023 (భారతదేశం) మరియు COPPA కింద పిల్లలను రక్షించడం మా అత్యున్నత చట్టపరమైన విధి.",
        "సెక్షన్ 9 DPDP చట్టం: 18 ఏళ్ల లోపు వ్యక్తులను లక్ష్యంగా చేసుకుని ఎలాంటి ట్రాకింగ్, ప్రవర్తనా పర్యవేక్షణ లేదా ప్రకటనలు ఉండవు.",
        "తల్లిదండ్రుల హక్కులు: తల్లిదండ్రులు లేదా సంరక్షకులు privacy@medhashine.inను సంప్రదించడం ద్వారా తమ పిల్లల ఖాతాను ఎప్పుడైనా సమీక్షించవచ్చు లేదా శాశ్వతంగా తొలగించవచ్చు."
      ]
    },
    {
      "id": "security",
      "num": "విభాగం 5",
      "title": "సాంకేతిక నిర్మాణం & భద్రతా రక్షణలు",
      "content": [
        "సెషన్ ఎన్‌క్రిప్షన్: వినియోగదారు సెషన్‌లు HttpOnly మరియు Secure ఫ్లాగ్‌లతో కూడిన ఎన్‌క్రిప్టెడ్ కుకీల ద్వారా భద్రపరచబడతాయి.",
        "ఇన్‌పుట్ శానిటైజేషన్: వచ్చే ప్రతి డేటా క్రాస్-సైట్ స్క్రిప్టింగ్ (XSS) మరియు నోఎస్‌క్యూఎల్ ఇంజెక్షన్ దాడులను పూర్తిగా అడ్డుకునే మల్టీ-స్టేజ్ శానిటైజర్ల గుండా వెళుతుంది.",
        "CSRF ఆరిజిన్ ధృవీకరణ: అనధికార మూడవ పక్ష సైట్ల నుండి వచ్చే హానికరమైన అభ్యర్థనలను మా API ఖచ్చితంగా 403 Forbiddenతో తిరస్కరిస్తుంది.",
        "ఇంటెలిజెంట్ రేట్ లిమిటింగ్: పాస్‌వర్డ్ హ్యాకింగ్ మరియు DDoS దాడులను నిరోధించడానికి IP ఆధారిత కఠినమైన రేట్ పరిమితులు అమలులో ఉన్నాయి."
      ]
    },
    {
      "id": "sharing",
      "num": "విభాగం 6",
      "title": "శూన్య డేటా విక్రయం & అధీకృత సేవా ప్రదాతలు",
      "content": [
        "మేము మీ వ్యక్తిగత డేటాను ఎప్పుడూ విక్రయించము లేదా వ్యాపారం చేయము. విశ్వసనీయ గ్లోబల్ సేవల కోసం మేము కఠినమైన డేటా ప్రాసెసింగ్ ఒప్పందాల (DPA) కింద ఎంటర్‌ప్రైజ్ ప్రొవైడర్‌లతో మాత్రమే భాగస్వామ్యం కలిగి ఉన్నాము.",
        "సేవా ప్రదాత వర్గాలు: క్లౌడ్ కంప్యూట్ హోస్టింగ్, ఎన్‌క్రిప్టెడ్ డేటాబేస్ నిల్వ, మీడియా డెలివరీ నెట్‌వర్క్‌లు (CDN), మరియు నోటిఫికేషన్ ఇమెయిల్ మౌలిక సదుపాయాలు.",
        "అన్ని సేవా ప్రదాతలు SOC 2, ISO 27001 మరియు TLS 1.3 ఎన్‌క్రిప్షన్ ప్రమాణాలకు కట్టుబడి ఉంటాయి మరియు డేటాను స్వతంత్రంగా ఉపయోగించలేరు."
      ]
    },
    {
      "id": "retention",
      "num": "విభాగం 7",
      "title": "డేటా నిలుపుదల & తొలగింపు హక్కు",
      "content": [
        "మీ ఖాతా సక్రియంగా ఉన్నంత కాలం మాత్రమే మేము డేటాను భద్రపరుస్తాము.",
        "క్రియాశీల ఖాతాలు: మీ బుక్‌మార్క్‌లు మరియు విద్యా రచనలను భద్రపరచడానికి మీ ప్రొఫైల్ ఉన్నంత వరకు డేటా ఉంటుంది.",
        "శాశ్వత ఖాతా తొలగింపు: ఖాతాను మూసివేయడానికి మీకు సంపూర్ణ హక్కు ఉంది. అభ్యర్థించిన 30 రోజుల్లోగా అన్ని వ్యక్తిగత గుర్తింపు వివరాలు శాశ్వతంగా తొలగించబడతాయి."
      ]
    },
    {
      "id": "rights",
      "num": "విభాగం 8",
      "title": "డేటా ప్రిన్సిపాల్‌గా మీ చట్టపరమైన హక్కులు",
      "content": [
        "భారతీయ DPDP చట్టం 2023 మరియు అంతర్జాతీయ నిబంధనల ప్రకారం మీకు స్పష్టమైన హక్కులు ఉన్నాయి:",
        "ప్రాప్యత హక్కు: మీ గురించి మేము కలిగి ఉన్న వ్యక్తిగత డేటా సారాంశాన్ని అభ్యర్థించే హక్కు.",
        "దిద్దుబాటు హక్కు: సరికాని లేదా అసంపూర్ణ విద్యా సమాచారాన్ని నవీకరించే హక్కు.",
        "తొలగింపు హక్కు ('Right to Be Forgotten'): మీ ఖాతా మరియు ఆధారాలను శాశ్వతంగా తొలగించమని ఆదేశించే హక్కు.",
        "ఫిర్యాదు పరిష్కార హక్కు: చట్టబద్ధమైన గడువులో మా నియమిత గ్రీవెన్స్ ఆఫీసర్ నుండి పరిష్కారం పొందే హక్కు."
      ]
    },
    {
      "id": "cookies",
      "num": "విభాగం 9",
      "title": "కుకీలు & సెషన్ సాంకేతికతల విధానం",
      "content": [
        "మేము కార్యాచరణ ప్రామాణీకరణ, ప్లాట్‌ఫారమ్ భద్రత మరియు సెషన్ కొనసాగింపు కోసం మాత్రమే కుకీలను ఉపయోగిస్తాము.",
        "ప్రామాణీకరణ కుకీలు: మీరు సురక్షితంగా లాగిన్ అయి ఉండటానికి అవసరమైన అత్యంత సురక్షితమైన సెషన్ కుకీలు.",
        "భద్రత మరియు CSRF గుర్తులు: అభ్యర్థనలు మీ నుండే చట్టబద్ధంగా వస్తున్నాయని నిర్ధారించే తాత్కాలిక భద్రతా టోకెన్లు.",
        "విద్యా ప్రాధాన్యతలు: మీ సబ్జెక్ట్ లేదా ఫిల్టర్ ప్రాధాన్యతలను గుర్తుంచుకునే తాత్కాలిక సెట్టింగ్‌లు.",
        "మేము ప్రకటనల ట్రాకింగ్ కుకీలు, మార్కెటింగ్ పిక్సెల్‌లు లేదా బిహేవియరల్ ప్రొఫైలింగ్‌ను ఉపయోగించము."
      ]
    },
    {
      "id": "grievance",
      "num": "విభాగం 10",
      "title": "ఫిర్యాదుల అధికారి & అధికారిక సంప్రదింపులు",
      "content": [
        "డిజిటల్ పర్సనల్ డేటా ప్రొటెక్షన్ యాక్ట్, 2023 మరియు ఇన్ఫర్మేషన్ టెక్నాలజీ నిబంధనల ప్రకారం మా నియమిత ఫిర్యాదుల పరిష్కార అధికారి వివరాలు ఇక్కడ ప్రచురించబడ్డాయి:",
        "నియమిత అధికారి: డేటా ప్రొటెక్షన్ & లీగల్ గవర్నెన్స్ ఆఫీసర్ | మేధాషైన్ ఎడ్యుకేషనల్ టెక్నాలజీస్",
        "ప్రత్యక్ష గోప్యతా ఇమెయిల్: privacy@medhashine.in | ఫిర్యాదులు: grievance@medhashine.in",
        "ప్రామాణిక ప్రతిస్పందన విండో: 24–48 గంటల్లోగా రసీదు | చట్టబద్ధమైన వివాద పరిష్కారం: గరిష్టంగా 15 క్యాలెండర్ రోజులు."
      ]
    }
  ],
  "bottomCta": {
    "title": "మీ విద్యా గోప్యత గురించి ప్రశ్నలు ఉన్నాయా?",
    "desc": "మీ సమాచారం ఎలా రక్షించబడుతుందో అర్థం చేసుకోవడంలో మీకు సహాయపడటానికి మా గోప్యతా ఇంజనీరింగ్ బృందం సిద్ధంగా ఉంది.",
    "btn": "గోప్యతా అధికారిని సంప్రదించండి"
  }
},
  gu: {
  "heroBadge": "વિશ્વાસ અને ડેટા ગવર્નન્સ ફ્રેમવર્ક",
  "heroTitle": "ગોપનીયતા નીતિ અને વિદ્યાર્થી ડેટા ચાર્ટર",
  "heroSubtitle": "મેધાશાઇનમાં, અમે માનીએ છીએ કે શૈક્ષણિક જિજ્ઞાસા માત્ર સંપૂર્ણ ડિજિટલ સુરક્ષાના વાતાવરણમાં જ ખીલે છે. અમે વિદ્યાર્થીઓનો ડેટા વેચતા નથી અને વૈશ્વિક ડેટા સુરક્ષા ધોરણોનું ચુસ્તપણે પાલન કરીએ છીએ.",
  "effectiveDateLabel": "અમલી તારીખ: સપ્ટેમ્બર 19, 2026",
  "policyVersionLabel": "નીતિ: સંસ્કરણ 2.4 (એન્ટરપ્રાઇઝ એડિશન)",
  "statutoryCompliance": "DPDP એક્ટ (ભારત) 2023 અને COPPA સુસંગત",
  "selectLanguageLabel": "ભાષા પસંદ કરો",
  "pillars": [
    {
      "title": "શૂન્ય ડેટા વેચાણ (Zero Selling)",
      "desc": "અમે વિદ્યાર્થીઓ અથવા શિક્ષકોનો ડેટા ક્યારેય ડેટા બ્રોકર્સ અથવા જાહેરાતકર્તાઓને વેચતા નથી અથવા હરાજી કરતા નથી."
    },
    {
      "title": "વિદ્યાર્થી સુરક્ષા સર્વોપરી",
      "desc": "DPDP એક્ટ 2023 ની કલમ 9 અને COPPA હેઠળ સગીરોને સંપૂર્ણ સુરક્ષા. બાળકોનું કોઈ બિહેવિયરલ ટ્રેકિંગ નહીં."
    },
    {
      "title": "એન્ટરપ્રાઇઝ-ગ્રેડ સુરક્ષા",
      "desc": "AES-256 એન્ક્રિપ્શન, TLS 1.3 ટ્રાન્સમિશન, HttpOnly કૂકી સુરક્ષા અને મજબૂત CSRF સાયબર સંરક્ષણ."
    },
    {
      "title": "સંપૂર્ણ ડેટા સાર્વભૌમત્વ",
      "desc": "તમે તમારા ડેટાના સંપૂર્ણ માલિક છો. તમારો ડેટા ડાઉનલોડ કરવા, સુધારવા અથવા કાયમ માટે કાઢી નાખવાનો સંપૂર્ણ અધિકાર."
    }
  ],
  "tocTitle": "નીતિ અનુક્રમણિકા",
  "needHelpTitle": "ગોપનીયતા સહાયની જરૂર છે?",
  "needHelpDesc": "તમારા વ્યક્તિગત ડેટા અથવા સગીર સુરક્ષા વિશે પ્રશ્નો છે? અમારા સમર્પિત ડેટા પ્રોટેક્શન ઓફિસરનો સંપર્ક કરો.",
  "sections": [
    {
      "id": "charter",
      "num": "વિભાગ 1",
      "title": "અમારું ગોપનીયતા ચાર્ટર અને મૂળ વચન",
      "content": [
        "મેધાશાઇન એક અગ્રણી ડિજિટલ શૈક્ષણિક વાંચન પ્લેટફોર્મ અને પ્રકાશન નેટવર્કનું સંચાલન કરે છે. અમે માનીએ છીએ કે વાસ્તવિક શૈક્ષણિક જિજ્ઞાસા અને સ્વતંત્ર વિચારસરણી ત્યારે જ ખીલી શકે છે જ્યારે વ્યક્તિઓ ડિજિટલ સર્વેલન્સ અને કપટી ડેટા નિષ્કર્ષણથી મુક્ત હોય.",
        "આ ગોપનીયતા નીતિ મેધાશાઇન પોર્ટલ, શિક્ષક સાધનો અને સંબંધિત સેવાઓ પર માહિતીના સંગ્રહ, સંચાલન અને સુરક્ષા અંગેની અમારી પદ્ધતિઓનું વર્ણન કરે છે."
      ],
      "highlight": {
        "title": "મેધાશાઇન ગેરંટી",
        "points": [
          "અમે તમારી વ્યક્તિગત માહિતી અથવા વાંચન લૉગ્સ ક્યારેય તૃતીય પક્ષોને વેચતા નથી.",
          "અમે વિદ્યાર્થીઓ અથવા શિક્ષકોને લક્ષિત વ્યાપારી જાહેરાતો ક્યારેય દર્શાવતા નથી.",
          "અમે સગીરોની વર્તણૂકલક્ષી પ્રોફાઇલિંગ અથવા સ્વચાલિત સર્વેલન્સમાં ક્યારેય સામેલ થતા નથી."
        ]
      }
    },
    {
      "id": "collection",
      "num": "વિભાગ 2",
      "title": "અમે એકત્રિત કરીએ છીએ તે માહિતીની શ્રેણીઓ",
      "content": [
        "ડેટા મિનિમાઇઝેશનના સિદ્ધાંત મુજબ, અમે ફક્ત તે જ માહિતી એકત્રિત કરીએ છીએ જે ઉચ્ચ ગુણવત્તાવાળા શૈક્ષણિક અનુભવો પહોંચાડવા માટે સખત રીતે જરૂરી છે.",
        "ખાતા નોંધણી: નામ, ઇમેઇલ, bcrypt હેશ કરેલા પાસવર્ડ્સ અને શૈક્ષણિક ગ્રેડ પસંદગીઓ.",
        "શિક્ષક ચકાસણી: શૈક્ષણિક ડિગ્રી, અનુભવ અને પ્રમાણીકરણ માટે ફરજિયાત 10-અંકનો મોબાઇલ નંબર.",
        "સુરક્ષા ટેલિમેટ્રી: બ્રુટ-ફોર્સ હુમલા અને DDoS થી બચાવવા માટે IP સરનામું અને બ્રાઉઝર એજન્ટ વિગતો."
      ]
    },
    {
      "id": "usage",
      "num": "વિભાગ 3",
      "title": "અમે શૈક્ષણિક ડેટાનો ઉપયોગ કેવી રીતે કરીએ છીએ",
      "content": [
        "અમે તમારી માહિતીને માત્ર કાયદેસરના આધારો હેઠળ પ્રક્રિયા કરીએ છીએ: કરારની પરિપૂર્ણતા, કાયદેસર હિત અને સ્પષ્ટ સંમતિ.",
        "કોર પ્લેટફોર્મ ડિલિવરી: વપરાશકર્તા પ્રમાણીકરણ, અભ્યાસક્રમ વર્ગીકરણ અને શિક્ષક લેખોનું પ્રદર્શન.",
        "ચર્ચાઓ: નિબંધો અને માર્ગદર્શિકાઓ પર શિક્ષક-નિયંત્રિત વિદ્યાર્થી ટિપ્પણીઓ અને બૌદ્ધિક ચર્ચાઓની સુવિધા.",
        "નેટવર્ક સુરક્ષા: સ્વચાલિત બૉટોને ઓળખવા, CSRF હુમલા રોકવા અને પ્લેટફોર્મ અખંડિતતાનું રક્ષણ કરવું.",
        "સીધી સૂચનાઓ: પાસવર્ડ રીસેટ, એપ્લિકેશન સમીક્ષાઓ જેવા મહત્વપૂર્ણ ઇમેઇલ્સ મોકલવા. અમે સ્પામ કરતા નથી."
      ]
    },
    {
      "id": "minors",
      "num": "વિભાગ 4",
      "title": "વિદ્યાર્થી અને સગીર ગોપનીયતા (18 વર્ષથી ઓછી ઉંમરનું રક્ષણ)",
      "content": [
        "મેધાશાઇન મૂળભૂત રીતે શીખનારાઓ માટે બનાવવામાં આવ્યું છે. ડિજિટલ પર્સનલ ડેટા પ્રોટેક્શન એક્ટ, 2023 (ભારત) અને COPPA હેઠળ બાળકોનું રક્ષણ કરવું એ અમારી સર્વોચ્ચ કાનૂની ફરજ છે.",
        "કલમ 9 DPDP એક્ટ: 18 વર્ષથી ઓછી ઉંમરની વ્યક્તિઓ પર કોઈ ટ્રેકિંગ, વર્તણૂક મોનિટરિંગ અથવા લક્ષિત જાહેરાતો નહીં.",
        "માતાપિતાના અધિકારો: માતાપિતા અથવા વાલીઓ privacy@medhashine.in નો સંપર્ક કરીને તેમના બાળકના ખાતાની સમીક્ષા કરી શકે છે અથવા કાયમ માટે કાઢી નાખી શકે છે."
      ]
    },
    {
      "id": "security",
      "num": "વિભાગ 5",
      "title": "તકનીકી સ્થાપત્ય અને સુરક્ષા સલામતી",
      "content": [
        "સત્ર એન્ક્રિપ્શન: વપરાશકર્તા સત્રો HttpOnly અને Secure ફ્લેગ્સવાળી એન્ક્રિપ્ટેડ કૂકીઝ દ્વારા સુરક્ષિત રાખવામાં આવે છે.",
        "ઇનપુટ સેનિટાઇઝેશન: દરેક સબમિશન બહુ-સ્તરીય સેનિટાઇઝર્સમાંથી પસાર થાય છે જે XSS અને NoSQL ઇન્જેક્શન હુમલાઓને નિષ્ફળ બનાવે છે.",
        "CSRF ઓરિજિન માન્યતા: અમારું API અનધિકૃત વેબસાઇટ્સ પરથી આવતી વિનંતીઓને 403 Forbidden સાથે નકારી કાઢે છે.",
        "બુદ્ધિશાળી દર મર્યાદા (Rate Limiting): પાસવર્ડ હેકિંગ અને સ્પામ અટકાવવા માટે IP આધારિત મર્યાદાઓ સક્રિય છે."
      ]
    },
    {
      "id": "sharing",
      "num": "વિભાગ 6",
      "title": "શૂન્ય ડેટા વેચાણ અને અધિકૃત સેવા પ્રદાતાઓ",
      "content": [
        "અમે તમારો ડેટા ક્યારેય વેચતા નથી. વૈશ્વિક શૈક્ષણિક સેવા પૂરી પાડવા માટે અમે કડક ડેટા પ્રોસેસિંગ કરારો (DPA) હેઠળ માત્ર એન્ટરપ્રાઇઝ પ્રદાતાઓ સાથે ભાગીદારી કરીએ છીએ.",
        "સેવા પ્રદાતા શ્રેણીઓ: ક્લાઉડ કમ્પ્યુટ હોસ્ટિંગ, એન્ક્રિપ્ટેડ ડેટાબેઝ સંગ્રહ, મીડિયા ડિલિવરી નેટવર્ક્સ (CDN), અને સિસ્ટમ ઇમેઇલ સેવાઓ.",
        "તમામ પ્રદાતાઓ SOC 2, ISO 27001 અને TLS 1.3 એન્ક્રિપ્શન ધોરણોથી બંધાયેલા છે અને ડેટાનો સ્વતંત્ર ઉપયોગ કરી શકતા નથી."
      ]
    },
    {
      "id": "retention",
      "num": "વિભાગ 7",
      "title": "ડેટા જાળવણી અને સંપૂર્ણ ભૂંસી નાખવાનો અધિકાર",
      "content": [
        "જ્યાં સુધી તમારું એકાઉન્ટ સક્રિય રહે ત્યાં સુધી જ અમે વ્યક્તિગત ડેટા જાળવી રાખીએ છીએ.",
        "સક્રિય એકાઉન્ટ્સ: તમારા બુકમાર્ક્સ અને શૈક્ષણિક યોગદાનને સાચવવા માટે એકાઉન્ટ ચાલુ રહે ત્યાં સુધી ડેટા રહે છે.",
        "કાયમી ખાતું કાઢી નાખવું: એકાઉન્ટ બંધ કરવાની વિનંતી પર, 30 દિવસની અંદર તમામ ઓળખ વિગતો કાયમ માટે કાઢી નાખવામાં આવે છે."
      ]
    },
    {
      "id": "rights",
      "num": "વિભાગ 8",
      "title": "ડેટા પ્રિન્સિપાલ તરીકે તમારા કાનૂની અધિકારો",
      "content": [
        "ભારતીય DPDP એક્ટ 2023 અને GDPR હેઠળ તમારી પાસે સ્પષ્ટ કાનૂની અધિકારો છે:",
        "એક્સેસનો અધિકાર: તમારી વ્યક્તિગત માહિતીનો સંપૂર્ણ સારાંશ મેળવવાનો અધિકાર.",
        "સુધારણાનો અધિકાર: અચોક્કસ અથવા અપૂર્ણ શૈક્ષણિક માહિતીને અપડેટ કરવાનો અધિકાર.",
        "ભૂંસી નાખવાનો અધિકાર ('Right to Be Forgotten'): તમારા એકાઉન્ટ અને ઓળખને કાયમ માટે કાઢી નાખવાની સૂચના આપવાનો અધિકાર.",
        "ફરિયાદ નિવારણનો અધિકાર: અમારા નિયુક્ત ફરિયાદ અધિકારી પાસેથી સમયસર ઉકેલ મેળવવાનો અધિકાર."
      ]
    },
    {
      "id": "cookies",
      "num": "વિભાગ 9",
      "title": "કૂકીઝ અને સત્ર ટેકનોલોજી નીતિ",
      "content": [
        "અમે કૂકીઝનો ઉપયોગ ફક્ત કાર્યાત્મક પ્રમાણીકરણ, પ્લેટફોર્મ સુરક્ષા અને સત્ર ચાલુ રાખવા માટે કરીએ છીએ.",
        "પ્રમાણીકરણ કૂકીઝ: સુરક્ષિત રીતે લૉગિન રહેવા માટે સખત રીતે જરૂરી એન્ક્રિપ્ટેડ સત્ર કૂકીઝ.",
        "સુરક્ષા અને CSRF માર્કર્સ: વિનંતીઓ તમારી પાસેથી આવી રહી છે તે ચકાસવા માટે કામચલાઉ સુરક્ષા ટોકન્સ.",
        "શૈક્ષણિક પસંદગીઓ: તમારી પસંદગીના વિષયો અથવા લેઆઉટને યાદ રાખવા માટે અસ્થાયી સેટિંગ્સ.",
        "અમે જાહેરાત ટ્રેકિંગ કૂકીઝ, માર્કેટિંગ પિક્સેલ્સ અથવા બિહેવિયરલ પ્રોફાઇલિંગનો ઉપયોગ કરતા નથી."
      ]
    },
    {
      "id": "grievance",
      "num": "વિભાગ 10",
      "title": "ફરિયાદ અધિકારી અને સત્તાવાર સંપર્ક",
      "content": [
        "DPDP એક્ટ 2023 અને માહિતી ટેકનોલોજી નિયમો અનુસાર અમારા નિયુક્ત ફરિયાદ નિવારણ અધિકારીની વિગતો:",
        "નિયુક્ત અધિકારી: ડેટા પ્રોટેક્શન અને લીગલ ગવર્નન્સ ઓફિસર | મેધાશાઇન એજ્યુકેશનલ ટેકનોલોજીસ",
        "સીધો ગોપનીયતા સંપર્ક: privacy@medhashine.in | ફરિયાદો: grievance@medhashine.in",
        "પ્રમાણભૂત પ્રતિસાદ સમય: 24–48 કલાકમાં સ્વીકૃતિ | વૈધાનિક વિવાદ નિવારણ: વધુમાં વધુ 15 કેલેન્ડર દિવસ."
      ]
    }
  ],
  "bottomCta": {
    "title": "તમારી શૈક્ષણિક ગોપનીયતા વિશે પ્રશ્નો છે?",
    "desc": "તમારો ડેટા કેવી રીતે સુરક્ષિત છે તે સમજવામાં તમારી સહાય માટે અમારી ટીમ ઉપલબ્ધ છે.",
    "btn": "ગોપનીયતા અધિકારીનો સંપર્ક કરો"
  }
},
  ja: {
  "heroBadge": "信頼とデータガバナンスの枠組み",
  "heroTitle": "プライバシーポリシーおよび学生データ憲章",
  "heroSubtitle": "Medhashineでは、完全なデジタル安全環境においてのみ真の学習意欲が育まれると信じています。私たちは生徒や教師のデータを販売せず、世界最高水準のデータ保護基準を遵守します。",
  "effectiveDateLabel": "発効日: 2026年9月19日",
  "policyVersionLabel": "ポリシー: バージョン2.4（エンタープライズ版）",
  "statutoryCompliance": "インドDPDP法2023および米COPPA完全準拠",
  "selectLanguageLabel": "言語を選択",
  "pillars": [
    {
      "title": "データ販売ゼロ",
      "desc": "学生や教育者のデータをブローカーや広告主に販売、貸与、またはオークションにかけることは一切ありません。"
    },
    {
      "title": "生徒優先の安全設計",
      "desc": "DPDP法第9条および米国COPPAに基づく未成年者の完全保護。児童に対する行動追跡は一切行いません。"
    },
    {
      "title": "エンタープライズセキュリティ",
      "desc": "保管時のAES-256暗号化、伝送時のTLS 1.3、HttpOnly Cookieによる隔離、堅牢なCSRF防御を完備。"
    },
    {
      "title": "完全なデータ主権",
      "desc": "お客様はご自身のデータの所有者です。いつでもアカウント情報のダウンロード、修正、永久削除を要求できます。"
    }
  ],
  "tocTitle": "ポリシー目次",
  "needHelpTitle": "サポートが必要ですか？",
  "needHelpDesc": "個人情報や未成年者の保護についてご質問がある場合は、専任のデータ保護責任者までお問い合わせください。",
  "sections": [
    {
      "id": "charter",
      "num": "第1条",
      "title": "プライバシー憲章と基本理念",
      "content": [
        "Medhashineは、最高水準のデジタル教育読書プラットフォームおよび出版ネットワークを運営しています。私たちは、デジタル監視やデータ抽出から解放されて初めて、真の知的好奇心と批判的思考が育まれると確信しています。",
        "本プライバシーポリシーは、当ポータル、教育ツール、および関連サービスにおける情報の収集、取り扱い、保管、保護に関する方針を説明するものです。"
      ],
      "highlight": {
        "title": "Medhashineの約束",
        "points": [
          "個人情報や学習読書履歴を第三者に販売することは決してありません。",
          "学生や教育者に対して第三者のターゲティング広告を表示することはありません。",
          "未成年者に対する行動プロファイリングや自動監視は一切行いません。"
        ]
      }
    },
    {
      "id": "collection",
      "num": "第2条",
      "title": "収集する情報のカテゴリー",
      "content": [
        "現代のデータ最小化の原則に厳格に従い、高品質な教育体験の提供に必要な最低限のデータのみを収集します。",
        "アカウント登録情報: 学生または教育者として登録する際の氏名、メールアドレス、暗号化パスワード、学年設定。",
        "教育者確認情報: 学位、教育機関での経歴、および本人確認のための10桁の電話番号（管理認証目的のみ）。",
        "技術・セキュリティ情報: 不正アクセスやDDoS攻撃からシステムを守るためのIPアドレスおよびブラウザ情報。"
      ]
    },
    {
      "id": "usage",
      "num": "第3条",
      "title": "教育データの利用目的",
      "content": [
        "収集したデータは、契約の履行、正当な利益、および明示的な同意という法的根拠に基づいてのみ処理されます。",
        "コア機能の提供: ユーザー認証、カリキュラムの整理、および教育記事の配信。",
        "ディスカッション機能: 教師がモデレートするディスカッションやコメント機能の運営。",
        "ネットワーク防御: 不正ボットの検出、CSRF攻撃の遮断、およびシステム整合性の保護。",
        "重要なお知らせ: パスワード再設定などの重要な連絡の送信（宣伝スパムは送信しません）。"
      ]
    },
    {
      "id": "minors",
      "num": "第4条",
      "title": "学生および未成年者のプライバシー保護（18歳未満）",
      "content": [
        "子どもたちを守ることは、インドDPDP法第9条および米国COPPAに基づく当社の最優先の義務です。",
        "DPDP法第9条: 18歳未満の者に対する行動追跡、監視、またはターゲティング広告の完全禁止。",
        "保護者の権利: 保護者は、privacy@medhashine.inに連絡することで、子どものアカウントの確認や完全削除をいつでも指示できます。"
      ]
    },
    {
      "id": "security",
      "num": "第5条",
      "title": "技術アーキテクチャと安全管理措置",
      "content": [
        "セッション暗号化: ユーザーセッションは、HttpOnlyおよびSecureフラグを備えたCookieで厳格に分離保護されます。",
        "入力サニタイズ: 全ての送信データは多段階サニタイザーを通過し、XSSやデータベースインジェクション攻撃を無力化します。",
        "CSRFオリジン検証: APIは不正な外部サイトからのリクエストを403 Forbiddenで自動的に拒否します。",
        "レートリミット保護: ブルートフォース攻撃や不正アクセスを防ぐため、IPごとの厳格な通信制限を実施しています。"
      ]
    },
    {
      "id": "sharing",
      "num": "第6条",
      "title": "データ販売の禁止と認定サービスプロバイダー",
      "content": [
        "データの販売や取引は行いません。高品質なインフラ維持のため、厳格なデータ処理契約（DPA）を締結した企業のみと連携しています。",
        "サービスプロバイダーのカテゴリー: クラウドホスティング、暗号化データベース、CDN配信、トランザクションメール配信。",
        "すべてのプロバイダーはSOC 2、ISO 27001、TLS 1.3基準に準拠し、データを独自に利用する権利を持ちません。"
      ]
    },
    {
      "id": "retention",
      "num": "第7条",
      "title": "データ保持期間と消去の権利",
      "content": [
        "個人データは、アカウントが有効な期間、またはサービス提供に必要な期間のみ保持されます。",
        "アクティブアカウント: ブックマークや記事を維持するため、アカウント存続中に限り保持されます。",
        "アカウント削除: 削除要求を受け取った場合、30日以内にすべての個人識別情報が永久に消去されます。"
      ]
    },
    {
      "id": "rights",
      "num": "第8条",
      "title": "データ主体の法的権利",
      "content": [
        "DPDP法およびGDPRに基づき、お客様は以下の権利を有します：",
        "アクセス権: 保有する個人データの概要を確認する権利。",
        "訂正権: 不正確な登録情報を修正・更新する権利。",
        "消去権（忘れられる権利）: アカウントおよび個人データの永久削除を要求する権利。",
        "苦情申し立て権: 苦情処理責任者から法定期間内に正式な回答を受け取る権利。"
      ]
    },
    {
      "id": "cookies",
      "num": "第9条",
      "title": "Cookieおよびセッション技術方針",
      "content": [
        "Cookieは機能認証とプラットフォームセキュリティの目的のみに使用されます。",
        "認証Cookie: 安全なサインイン状態を維持するための必須セッションCookie。",
        "セキュリティCookie: CSRF攻撃を防ぎ、正当な通信であることを確認する検証トークン。",
        "設定Cookie: 選択したフィルターや表示レイアウトを一時的に記憶する機能。",
        "広告追跡Cookieや行動ターゲティング技術は一切使用していません。"
      ]
    },
    {
      "id": "grievance",
      "num": "第10条",
      "title": "苦情処理責任者および公式連絡窓口",
      "content": [
        "IT規則およびDPDP法に基づき、指定苦情処理責任者の連絡先を公開しています：",
        "担当責任者: データ保護および法的ガバナンス責任者 | Medhashine Educational Technologies",
        "連絡先メール: privacy@medhashine.in | 苦情申し立て: grievance@medhashine.in",
        "対応期間: 24〜48時間以内に受付確認、最長15日以内に正式解決。"
      ]
    }
  ],
  "bottomCta": {
    "title": "教育プライバシーに関するご質問ですか？",
    "desc": "データがどのように保護されているかについて、専門チームが丁寧にご案内いたします。",
    "btn": "プライバシー責任者に連絡"
  }
},
  ar: {
  "heroBadge": "إطار الثقة وحوكمة البيانات",
  "heroTitle": "سياسة الخصوصية وميثاق بيانات الطلاب",
  "heroSubtitle": "في ميدهاشاين، نؤمن بأن الفضول التعليمي يزدهر فقط في بيئة من الأمان الرقمي الشامل. نحن لا نبيع بيانات الطلاب، ولا ندير شبكات إعلانية، ونلتزم بأعلى معايير حماية البيانات العالمية.",
  "effectiveDateLabel": "تاريخ السريان: 19 سبتمبر 2026",
  "policyVersionLabel": "السياسة: الإصدار 2.4 (نسخة المؤسسات)",
  "statutoryCompliance": "متوافق مع قانون DPDP الهندي 2023 وCOPPA",
  "selectLanguageLabel": "اختر اللغة",
  "pillars": [
    {
      "title": "عدم بيع البيانات نهائياً",
      "desc": "نحن لا نبيع أو نؤجر أو نتاجر ببيانات الطلاب أو المعلمين مع سماسرة البيانات أو المعلنين على الإطلاق."
    },
    {
      "title": "سلامة الطالب أولاً",
      "desc": "حماية شاملة للقاصرين بموجب المادة 9 من قانون DPDP وقانون COPPA الأمريكي. لا يوجد تتبع سلوكي للأطفال."
    },
    {
      "title": "أمان على مستوى المؤسسات",
      "desc": "تشفير AES-256 للبيانات المخزنة، وTLS 1.3 أثناء النقل، وعزل ملفات تعريف الارتباط عبر HttpOnly، وحماية صارمة ضد هجمات CSRF."
    },
    {
      "title": "سيادة كاملة على البيانات",
      "desc": "أنت المالك الحصري لمعلوماتك. لك كامل الحق في تنزيل حسابك أو تعديله أو حذفه نهائياً في أي وقت."
    }
  ],
  "tocTitle": "فهرس بنود السياسة",
  "needHelpTitle": "هل تحتاج إلى مساعدة بخصوص الخصوصية؟",
  "needHelpDesc": "هل لديك استفسارات حول بياناتك الشخصية أو حماية القاصرين؟ تواصل مع مسؤول حماية البيانات المخصص لدينا.",
  "sections": [
    {
      "id": "charter",
      "num": "القسم 1",
      "title": "ميثاق الخصوصية ووعدنا الأساسي",
      "content": [
        "تدير ميدهاشاين منصة قراءة تعليمية رقمية رائدة وشبكة نشر تربوية. نحن نؤمن بأن الفضول الأكاديمي والعمق الفكري يزدهران فقط عندما يكون الأفراد متحررين من المراقبة الرقمية واستخراج البيانات المخادع.",
        "توضح سياسة الخصوصية هذه ممارساتنا المتعلقة بجمع المعلومات والتعامل معها وتخزينها وحمايتها عبر بوابة ميدهاشاين وأدوات المعلمين والخدمات ذات الصلة."
      ],
      "highlight": {
        "title": "ضمانة ميدهاشاين",
        "points": [
          "نحن لا نبيع معلوماتك الشخصية أو سجلات قراءتك المدرسية لأي طرف ثالث أبداً.",
          "نحن لا نعرض إعلانات تجارية موجهة للطلاب أو المعلمين على الإطلاق.",
          "نحن لا نشارك في التوصيف السلوكي أو المراقبة الآلية للقاصرين بأي شكل."
        ]
      }
    },
    {
      "id": "collection",
      "num": "القسم 2",
      "title": "فئات المعلومات التي نجمعها",
      "content": [
        "التزاماً صارماً بمبدأ الحد الأدنى من البيانات، نحن نجمع فقط البيانات الضرورية لتقديم تجارب تعليمية عالية الجودة.",
        "بيانات الحساب والملف الشخصي: الاسم الكامل، وعنوان البريد الإلكتروني، وتجزئات كلمات المرور المشفرة عبر bcrypt، والتفضيلات الأكاديمية.",
        "بيانات التحقق من المعلمين: المؤهلات الأكاديمية والخبرة ورقم الهاتف المحمول الإلزامي المكون من 10 أرقام (للمصادقة الثنائية والحوكمة).",
        "القياس الأمني عن بُعد: عناوين IP ومعلومات المتصفح حصرياً للحماية ضد هجمات القوة الغاشمة وحجب الخدمة."
      ]
    },
    {
      "id": "usage",
      "num": "القسم 3",
      "title": "كيفية استخدام البيانات التعليمية",
      "content": [
        "نحن نعالج معلوماتك بموجب الأسس القانونية المعتمدة: تنفيذ العقد، والمصلحة المشروعة، والموافقة الصريحة.",
        "تقديم المنصة الأساسية: مصادقة المستخدمين، وتنظيم المناهج، وعرض المقالات التربوية.",
        "النقاشات التعليمية: تسهيل تعليقات الطلاب الموجهة من قِبل المعلمين والحوارات الأكاديمية.",
        "حماية الشبكة: اكتشاف الروبوتات الآلية ومنع هجمات CSRF وتطبيق حدود الطلبات للحفاظ على استقرار المنصة.",
        "الإشعارات المباشرة: إرسال الرسائل الإدارية الهامة مثل استعادة كلمة المرور، دون أي رسائل دعائية غير مرغوب فيها."
      ]
    },
    {
      "id": "minors",
      "num": "القسم 4",
      "title": "خصوصية الطلاب والقاصرين (حماية دون سن 18)",
      "content": [
        "تم بناء ميدهاشاين خصيصاً للمتعلمين. إن حماية الأطفال هي أسمى واجباتنا بموجب قانون حماية البيانات الرقمية 2023 وقانون COPPA الأمريكي.",
        "المادة 9 من قانون DPDP: حظر تام لأي تتبع أو مراقبة سلوكية أو إعلانات موجهة للأشخاص دون 18 عاماً.",
        "حقوق أولياء الأمور: يحق للوالدين أو الأوصياء مراجعة حساب طفلهم أو طلب حذفه نهائياً عبر privacy@medhashine.in."
      ]
    },
    {
      "id": "security",
      "num": "القسم 5",
      "title": "البنية الهندسية وتدابير الأمان",
      "content": [
        "تشفير الجلسات: تتم إدارة جلسات المستخدم عبر ملفات تعريف ارتباط مشفرة ومعزولة بأعلام HttpOnly وSecure.",
        "تنقية المدخلات: تخضع جميع المدخلات لمنظومة تنقية متعددة المراحل تعطل برمجيات XSS وهجمات حقن قواعد البيانات.",
        "التحقق من أصل CSRF: تفرض واجهة برمجة التطبيقات التحقق الصارم من المصدر لرفض الطلبات المشبوهة برمز 403 Forbidden.",
        "تحديد معدل الطلبات الذكي: حواجز حماية قائمة على عناوين IP لمنع هجمات تخمين كلمات المرور وإغراق الخوادم."
      ]
    },
    {
      "id": "sharing",
      "num": "القسم 6",
      "title": "عدم بيع البيانات ومزودو الخدمات المعتمدون",
      "content": [
        "نحن لا نبيع أو نتاجر ببياناتك مطلقاً. لضمان تشغيل خدماتنا عالمياً، نتعامل حصرياً مع مزودي بنية تحتية مؤسسية بموجب اتفاقيات معالجة بيانات صارمة (DPA).",
        "فئات مزودي الخدمات: الحوسبة السحابية والاستضافة، وقواعد البيانات المشفرة، وشبكات توصيل المحتوى (CDN)، والبريد الإلكتروني للإشعارات.",
        "يلتزم جميع المزودين بمعايير SOC 2 وISO 27001 وتشفير TLS 1.3 دون أي حق في استغلال البيانات لحسابهم الخاص."
      ]
    },
    {
      "id": "retention",
      "num": "القسم 7",
      "title": "الاحتفاظ بالبيانات وحق المحو النهائي",
      "content": [
        "نحتفظ بالبيانات فقط طالما كان حسابك نشطاً أو بالقدر اللازم لتقديم الخدمة التعليمية.",
        "الحسابات النشطة: يتم الاحتفاظ بالبيانات طالما كان الحساب مفتوحاً لحفظ إشاراتك المرجعية ومشاركاتك.",
        "الحذف النهائي للحساب: لك حق مطلق في إغلاق حسابك. عند طلب الحذف، تُمحى جميع البيانات الشخصية نهائياً خلال 30 يوماً."
      ]
    },
    {
      "id": "rights",
      "num": "القسم 8",
      "title": "حقوقك القانونية كصاحب بيانات",
      "content": [
        "بموجب قانون DPDP الهندي ولائحة GDPR الأوروبية، تتمتع بحقوق واضحة:",
        "حق الوصول: طلب ملخص شامل للبيانات الشخصية التي نحتفظ بها عنك.",
        "حق التصحيح: تحديث وتعديل أي بيانات غير دقيقة في ملفك الشخصي.",
        "حق المحو ('الحق في النسيان'): إلزامنا بحذف حسابك وبياناتك الشخصية نهائياً.",
        "حق معالجة المظالم: الحصول على حل لمخاوف الخصوصية من قِبل مسؤول الشكاوى ضمن المهل القانونية."
      ]
    },
    {
      "id": "cookies",
      "num": "القسم 9",
      "title": "سياسة ملفات تعريف الارتباط وتقنيات الجلسات",
      "content": [
        "نستخدم ملفات تعريف الارتباط حصرياً للمصادقة الوظيفية وأمان المنصة واستمرارية الجلسة.",
        "ملفات تعريف الارتباط للمصادقة: ملفات مشفرة وضرورية جداً لإبقائك مسجلاً بأمان أثناء التنقل في المنصة.",
        "علامات الحماية من CSRF: رموز أمان مؤقتة للتحقق من شرعية الطلبات الصادرة من جهازك.",
        "التفضيلات التعليمية: إعدادات مؤقتة لتذكر خيارات التصفية وتنسيق القراءة أثناء جلستك.",
        "نحن لا نستخدم أي ملفات تعريف ارتباط إعلانية أو بكسلات تتبع للتسويق على الإطلاق."
      ]
    },
    {
      "id": "grievance",
      "num": "القسم 10",
      "title": "مسؤول الشكاوى وقنوات الاتصال الرسمية",
      "content": [
        "امتثالاً لأحكام قانون تكنولوجيا المعلومات وقانون حماية البيانات الرقمية 2023، نعلن عن بيانات مسؤول الشكاوى:",
        "المسؤول المعتمد: مسؤول حماية البيانات والحوكمة القانونية | ميدهاشاين للتكنولوجيا التعليمية",
        "البريد الإلكتروني المباشر: privacy@medhashine.in | الشكاوى: grievance@medhashine.in",
        "فترة الاستجابة القياسية: إشعار استلام خلال 24–48 ساعة | التسوية القانونية: 15 يوماً كحد أقصى."
      ]
    }
  ],
  "bottomCta": {
    "title": "هل لديك استفسارات حول خصوصيتك التعليمية؟",
    "desc": "فريق هندسة الخصوصية لدينا متواجد لمساعدتك في فهم كيفية حماية بياناتك.",
    "btn": "اتصل بمسؤول الخصوصية"
  }
}
};
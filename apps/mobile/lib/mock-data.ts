export type OfficeStaff = {
  id: string;
  name: string;
  role: string;
  email: string;
  phone?: string;
  image: any;
};

export type OfficeLink = {
  title: string;
  url: string;
  icon: string;
};

export type DocumentResource = {
  title: string;
  url: any;
  size?: string;
  type: string;
};

export type FAQ = {
  question: string;
  answer: string;
};

export type ContactChannels = {
  phone?: string;
  email?: string;
  whatsapp?: string;
};

export type Office = {
  id: string;
  name: string;
  shortName: string;
  description: string;
  location: string;
  hours: string;
  icon: string;
  heroImage: any;
  staff: OfficeStaff[];
  links: OfficeLink[];
  documents?: DocumentResource[];
  faqs?: FAQ[];
  contacts?: ContactChannels;
  mapId?: string;
};

export const MOCK_OFFICES: Record<string, Office> = {
  oipcc: {
    id: "oipcc",
    name: "Office of International Programs and Campus Cohesion",
    shortName: "OIPCC",
    description:
      "The Office promotes a campus culture that values diversity, equity, and inclusion while supporting international students and global learning opportunities. The office provides immigration assistance, cultural immersion programs, and study abroad partnerships, ensuring a seamless transition for international students. The Cohesion Office also leads sexual misconduct prevention initiatives to maintain a safe and respectful learning environment.",
    location: "Radichel Hall Rooms 207 & 210",
    hours: "Mon - Fri, 8:00 AM - 5:00 PM",
    icon: "earth.americas.fill",
    heroImage: require('../assets/images/help/hero_odip.webp'),
    contacts: {
      phone: "+233 50 126 0277",
      email: "cohesion@ashesi.edu.gh",
      whatsapp: "+233 50 126 0277",
    },
    staff: [
      {
        id: "s1",
        name: "Millicent Adjei",
        role: "Director of International Programs and Campus Cohesion",
        email: "madjei@ashesi.edu.gh",
        phone: "ext.1062",
        image: require('../assets/images/staff/oipcc/millicent.webp'),
      },
      {
        id: "s2",
        name: "Rosemary Kotei",
        role: "Assistant Director, International Programs",
        email: "rkotei@ashesi.edu.gh",
        phone: "ext.1034",
        image: require('../assets/images/staff/oipcc/rosemary.webp'),
      },
    ],
    links: [
      {
        title: "Campus Cohesion Info",
        url: "https://ashesi.edu.gh/campus-cohesion/",
        icon: "person.3.fill",
      },
      {
        title: "Disability & Accessibility",
        url: "http://ashesi.edu.gh/student-life/disability-and-accessibility-support/",
        icon: "figure.roll",
      },
      {
        title: "ISA Website",
        url: "https://isashesi.vercel.app/",
        icon: "globe.americas.fill",
      },
    ],
    documents: [
      {
        title: "Ghana Card Payment Process Flow",
        url: require("../assets/documents/oipcc/Ghana Card Payment Process Flow.pdf"),
        type: "pdf",
      },
      {
        title: "Ghana Non-Citizenship App Form",
        url: require("../assets/documents/oipcc/Ghana Non Citizenship App Form.pdf"),
        type: "pdf",
      },
      {
        title: "Immigration Regularization FAQ",
        url: require("../assets/documents/oipcc/Immigration Regularization FAG.pdf.pdf"),
        type: "pdf",
      },
    ],
    faqs: [
      {
        question: "What support does OIPCC offer for international students?",
        answer: "OIPCC arranges airport pick-up, guarantees on-campus housing, and helps students regularize their Ghana Non-Citizenship Cards and Residence Permits.",
      },
      {
        question: "How do I regularize my immigration status?",
        answer: "Fill the Immigration Regularization (IR) form, prepare required documents, present them to NIA officers to receive your Ghana card, and submit your residence permit form.",
      },
      {
        question: "What is the Host Family Program?",
        answer: "It pairs international students with Ghanaian families to expand their network and learn about Ghanaian culture, while host families learn about the student's culture.",
      },
      {
        question: "What is the First-Year Buddy Up Program?",
        answer: "It pairs first-year students with continuing student coaches who guide them in transitioning to the university culture both socially and academically.",
      },
    ],
  },
  career: {
    id: "career",
    name: "Career Services Center",
    shortName: "Career Services",
    description:
      "The Office plays a pivotal role in shaping students’ professional journeys by offering a range of resources designed to enhance career readiness. Working closely with employers and recruiters, we facilitate networking sessions, internships, and job placements that allow students to pursue their aspirations.",
    location: "Norton Motulsky Building, Ground Floor",
    hours: "Mon - Fri, 9:00 AM - 4:00 PM",
    icon: "briefcase.fill",
    heroImage: require('../assets/images/help/hero_career.webp'),
    contacts: {
      email: "careers@ashesi.edu.gh",
      phone: "+233 30 000 0000",
    },
    staff: [
      {
        id: "c1",
        name: "Abigail Welbeck",
        role: "Director",
        email: "awelbeck@ashesi.edu.gh",
        image: require('../assets/images/staff/career_services/Abigail-Welbeck-1.webp'),
      },
      {
        id: "c2",
        name: "Selasi Nukpe",
        role: "Assistant Director",
        email: "snukpe@ashesi.edu.gh",
        image: require('../assets/images/staff/career_services/Selasi-Nukpe.webp'),
      },
      {
        id: "c3",
        name: "Najeeb Ibrahim",
        role: "Assistant Director",
        email: "nibrahim@ashesi.edu.gh",
        image: require('../assets/images/staff/career_services/Najeeb-Ibrahim.webp'),
      },
      {
        id: "c4",
        name: "Ngozi Dickson",
        role: "Assistant Director",
        email: "ndickson@ashesi.edu.gh",
        image: require('../assets/images/staff/career_services/Ngozi-Dickson.webp'),
      },
      {
        id: "c5",
        name: "Nana Afua Anoff",
        role: "Senior Career Development Officer",
        email: "nanoff@ashesi.edu.gh",
        image: require('../assets/images/staff/career_services/Nana-Afua-Anoff.webp'),
      },
      {
        id: "c6",
        name: "Alberta Asiamah",
        role: "Senior Career Development Officer",
        email: "aasiamah@ashesi.edu.gh",
        image: require('../assets/images/staff/career_services/Alberta.webp'),
      },
    ],
    links: [
      {
        title: "Career Portal",
        url: "https://app.thecareeros.com/with-university",
        icon: "briefcase.fill",
      },
      {
        title: "Focus2Career",
        url: "https://www.focus2career.com/Portal/Login.cfm?SID=1992",
        icon: "target",
      },
      {
        title: "Big Interview",
        url: "https://ashesi.biginterview.com/login",
        icon: "video.fill",
      },
      {
        title: "Global Mentorship",
        url: "https://globalmentorship.org/schools/ashesi/",
        icon: "globe.americas.fill",
      },
      {
        title: "Job Shadowing Form",
        url: "https://forms.office.com/r/MEMgdvWKv2",
        icon: "person.2.fill",
      },
    ],
    documents: [
      {
        title: "Ashesi CV Writing Guide",
        url: require("../assets/documents/career_services/Ashesi CV Writing Guide.pdf"),
        size: "1 MB",
        type: "pdf",
      },
      {
        title: "CV Template with guidelines",
        url: require("../assets/documents/career_services/CV Template_ with guidelines.docx"),
        size: "24 KB",
        type: "docx",
      },
    ],
    faqs: [
      {
        question: "What is the Ashesi Career Mentorship Program?",
        answer: "It connects students with experienced professionals who provide guidance, advice, and access to real-world learning opportunities over three months.",
      },
      {
        question: "What is the Job Shadowing Program?",
        answer: "An experiential learning initiative designed to help first-year students make informed decisions about the careers they want to explore while in university.",
      },
      {
        question: "How does the Internship Program work?",
        answer: "It provides students with opportunities to apply their classroom knowledge in real-world settings. All students are encouraged to complete at least one internship before graduation.",
      },
      {
        question: "What services do you offer for interview preparation?",
        answer: "We offer Mock Interviews, Job Search Strategies, Resume and Cover Letter Reviews, and access to Big Interview, an AI-powered practice tool.",
      },
      {
        question: "When should I start looking for internships?",
        answer: "As early as your sophomore year! We recommend attending our Fall Career Fair to start networking.",
      },
      {
        question: "Does the Career Services office help with graduate school applications?",
        answer: "Yes, we guide students in exploring graduate study opportunities, providing support with applications, preparation, and decision-making.",
      },
      {
        question: "When should I start visiting Career Services?",
        answer: "It is recommended to start engaging with Career Services in your first year through the Job Shadowing Program and early career coaching sessions.",
      },
    ],
  },
  it: {
    id: "it",
    name: "Support Centre",
    shortName: "Support Centre",
    description:
      "The Center serves as the primary hub for assistance, guidance, and problem resolution for students, staff, and faculty throughout their time at Ashesi University. Designed to ensure a smooth and supportive experience within the Ashesi community, the Centre provides quick and effective solutions by connecting individuals to the right resources and departments. Whether it’s facility or hostel concerns, IT issues, logistics queries, or general feedback, the Support Centre is committed to addressing your needs promptly and professionally.",
    location: "King Engineering Building Room 105 (opposite Design Lab)",
    hours: "Mon - Fri, 8:00 AM - 5:00 PM",
    icon: "questionmark.circle.fill",
    heroImage: require('../assets/images/help/hero_it.webp'),
    contacts: {
      phone: "Ext: 1111 | +233 50 167 3669",
      email: "supportcentre@ashesi.edu.gh",
    },
    staff: [],
    links: [
      {
        title: "Support Center Docs",
        url: "https://ashesi.helpscoutdocs.com/#",
        icon: "newspaper.fill",
      },
      {
        title: "Bamboo HR",
        url: "https://ashesi.helpscoutdocs.com/category/68-bamboo-hr",
        icon: "person.3.fill",
      },
      {
        title: "Ashesi Online Teaching FAQs",
        url: "https://ashesi.helpscoutdocs.com/category/47-ashesi-online-teaching-faqs",
        icon: "laptopcomputer",
      },
      {
        title: "Microsoft Stream",
        url: "https://ashesi.helpscoutdocs.com/category/55-microsoft-stream",
        icon: "play.tv.fill",
      },
      {
        title: "Zoom",
        url: "https://ashesi.helpscoutdocs.com/category/50-zoom",
        icon: "video.fill",
      },
      {
        title: "Canvas LMS",
        url: "https://ashesi.helpscoutdocs.com/category/39-canvas-lms",
        icon: "book.fill",
      },
      {
        title: "CAMU",
        url: "https://ashesi.helpscoutdocs.com/category/20-camu",
        icon: "graduationcap.fill",
      },
      {
        title: "CAMU FAQs",
        url: "https://ashesi.helpscoutdocs.com/category/31-camu-faqs",
        icon: "questionmark.circle.fill",
      },
      {
        title: "Grammarly",
        url: "https://ashesi.helpscoutdocs.com/category/29-grammarly",
        icon: "pencil",
      },
      {
        title: "Meal Plan",
        url: "https://ashesi.helpscoutdocs.com/category/4-meal-plan",
        icon: "fork.knife",
      },
    ],
    faqs: [
      {
        question: "How do I submit a ticket?",
        answer: "Visit our Support Center Docs at https://ashesi.helpscoutdocs.com or email supportcentre@ashesi.edu.gh",
      },
      {
        question: "What services does the Support Centre provide?",
        answer: "We help with facility and hostel concerns, IT issues, logistics queries, and general feedback.",
      },
    ],
  },
  health: {
    id: "health",
    name: "Natembea Health Center",
    shortName: "Health Center",
    description:
      "A HEFRA-accredited clinic providing 24-hour general outpatient care, inpatient observation, and laboratory services. We also offer comprehensive counseling and wellness coaching for body and mind.",
    location: "Behind the Student Hostels",
    hours: "Mon - Sun, 24 Hours",
    icon: "cross.case.fill",
    heroImage: require('../assets/images/help/hero_health.webp'),
    contacts: {
      phone: "+233 501 331 668",
      whatsapp: "+233 501 331 668",
      email: "healthcenter@ashesi.edu.gh",
    },
    staff: [
      {
        id: "h1",
        name: "Bridgette Addo Asiedu",
        role: "Director, Health Services",
        email: "baddoasiedu@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/Bridgitte.webp'),
      },
      {
        id: "h2",
        name: "Dr. Paul Kumi",
        role: "Director of Counseling, Coaching, and Advising",
        email: "pkumi@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/PaulKumi.webp'),
      },
      {
        id: "h3",
        name: "Selase Tsiagbe",
        role: "Assistant Director, Health Services",
        email: "stsiagbe@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/Selasie.webp'),
      },
      {
        id: "h4",
        name: "Sylvester Amponsah",
        role: "Nursing Officer",
        email: "samponsah@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/Samuel.webp'),
      },
      {
        id: "h5",
        name: "Nana Adu Asante",
        role: "Nursing Officer",
        email: "nasante@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/Nana-Adu.webp'),
      },
      {
        id: "h6",
        name: "Maame Ama Ackah",
        role: "Counselor",
        email: "mackah@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/MaameAckah.webp'),
      },
      {
        id: "h7",
        name: "Richard Tumawu",
        role: "Health Services Coordinator",
        email: "rtumawu@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/Richard.webp'),
      },
      {
        id: "h8",
        name: "Evonne Sauda",
        role: "Assistant Director of Wellness & Wellness Coach",
        email: "esauda@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/EBS.webp'),
      },
      {
        id: "h9",
        name: "Emmanuel Ntow",
        role: "Senior Academic Advisor",
        email: "entow@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/EmmaNtow.webp'),
      },
      {
        id: "h10",
        name: "Iehowa-Nhyirah Gaisie",
        role: "Counselor",
        email: "igaisie@ashesi.edu.gh",
        image: require('../assets/images/staff/health_center/Nhyira.webp'),
      },
    ],
    links: [
      {
        title: "Book Counseling Session",
        url: "https://ashesicounseling.simplybook.me/v2/",
        icon: "heart.text.square.fill",
      },
      {
        title: "Book Coaching & Wellness",
        url: "https://ashesicounsellingandcoachingcentercoach.simplybook.it/v2/",
        icon: "calendar",
      },
      {
        title: "Book Academic Advising",
        url: "https://calendly.com/emmanuel-ntow-ashesi/academicbooking-meeting",
        icon: "graduationcap.fill",
      },
    ],
    documents: [
      {
        title: "Health Insurance Policy Details",
        url: "https://ashesi.edu.gh/health-and-wellbeing/",
        size: "Link",
        type: "link",
      },
      {
        title: "Required Vaccinations List",
        url: "https://ashesi.edu.gh/health-and-wellbeing/",
        size: "Link",
        type: "link",
      },
    ],
    faqs: [
      {
        question: "What should I do in a medical emergency?",
        answer: "Call the Health Center immediately on +233 501 331 668 or report in person. The Natembea Health Center is always open 24/7.",
      },
      {
        question: "What vaccinations are required?",
        answer: "Measles/Mumps/Rubella (MMR), Varicella, and Yellow Fever are required. Hepatitis A, Typhoid, Tetanus, and COVID-19 are strongly recommended.",
      },
      {
        question: "Is health insurance required?",
        answer: "Yes, students without an insurance policy are required to sign up for the Natembea Health Center’s recommended provider. It's renewed annually and included in fees.",
      },
    ],
  },
};
// Map Categories Spec
export const CATEGORIES = [
  { id: "academic", name: "Academic", icon: "building.2.fill", color: "#3B82F6", essential: true },
  { id: "dining", name: "Dining", icon: "fork.knife", color: "#EC4899", essential: true },
  { id: "health", name: "Health Center", icon: "cross.case.fill", color: "#EF4444", essential: true },
  { id: "hostel", name: "Hostels", icon: "bed.double.fill", color: "#F59E0B", essential: false },
  { id: "lab", name: "Labs", icon: "hammer.fill", color: "#10B981", essential: false },
  { id: "sports", name: "Sports", icon: "figure.2.arms.open", color: "#6366F1", essential: false },
  { id: "cafeteria", name: "Cafeterias", icon: "fork.knife", color: "#F472B6", essential: false },
  { id: "shop", name: "Shops", icon: "briefcase.fill", color: "#8B5CF6", essential: false },
  { id: "office", name: "Offices", icon: "briefcase.fill", color: "#14B8A6", essential: false },
];

export const DIRECTORY = [
  // Buildings (Outdoor coordinates)
  {
    id: "b1",
    name: "Norton Motulsky Hall",
    shortName: "Norton",
    category: "academic",
    coordinate: { latitude: 5.7600, longitude: -0.2195 },
    icon: "building.2.fill",
    emoji: "🏢",
    description: "Main academic building housing classrooms, faculty offices, and lecture halls.",
    hours: "Mon - Sat, 7:00 AM - 10:00 PM",
  },
  {
    id: "b2",
    name: "Radichel Hall",
    shortName: "Radichel",
    category: "academic",
    coordinate: { latitude: 5.7595, longitude: -0.2199 },
    icon: "building.2.fill",
    emoji: "🏢",
    description: "Multi-purpose building featuring student lounges, administrative offices, and cafeterias.",
    hours: "Mon - Sun, 6:00 AM - 11:00 PM",
  },
  {
    id: "b3",
    name: "Warren Library",
    shortName: "Library",
    category: "academic",
    coordinate: { latitude: 5.7598, longitude: -0.2202 },
    icon: "book.fill",
    emoji: "📚",
    description: "The main campus library equipped with learning spaces, research resources, and the IT helpdesk.",
    hours: "Mon - Fri, 8:00 AM - 12:00 AM • Sat - Sun, 10:00 AM - 10:00 PM",
  },
  {
    id: "b4",
    name: "King Engineering Building",
    shortName: "King Eng",
    category: "academic",
    coordinate: { latitude: 5.7602, longitude: -0.2192 },
    icon: "building.2.fill",
    emoji: "💻",
    description: "Engineering hub with state-of-the-art labs, design workspaces, and maker spaces.",
    hours: "Mon - Sat, 7:00 AM - 10:00 PM",
  },
  {
    id: "b5",
    name: "Wangari Maathai Hall",
    shortName: "Wangari",
    category: "hostel",
    coordinate: { latitude: 5.7590, longitude: -0.2190 },
    icon: "bed.double.fill",
    emoji: "🛏️",
    description: "Student residential facility named in honor of environmentalist Wangari Maathai.",
    hours: "24/7",
  },
  {
    id: "b6",
    name: "Akayet Hostel",
    shortName: "Akayet",
    category: "hostel",
    coordinate: { latitude: 5.7585, longitude: -0.2185 },
    icon: "bed.double.fill",
    emoji: "🛏️",
    description: "On-campus student residential housing block.",
    hours: "24/7",
  },
  {
    id: "b7",
    name: "Natembea Health Center",
    shortName: "Health Ctr",
    category: "health",
    coordinate: { latitude: 5.7610, longitude: -0.2205 },
    icon: "cross.case.fill",
    emoji: "🏥",
    description: "HEFRA-accredited clinic providing 24/7 medical services, counseling, and wellness coaching.",
    hours: "Mon - Sun, 24 Hours",
    linked_office_id: "health",
  },
  {
    id: "b8",
    name: "Ashesi Sports Pitch",
    shortName: "Pitch",
    category: "sports",
    coordinate: { latitude: 5.7615, longitude: -0.2180 },
    icon: "figure.2.arms.open",
    emoji: "⚽",
    description: "Football field and athletic track for recreation, sports events, and physical education.",
    hours: "Daily, 6:00 AM - 7:00 PM",
  },
  {
    id: "b9",
    name: "Campus Gymnasium",
    shortName: "Gym",
    category: "sports",
    coordinate: { latitude: 5.7608, longitude: -0.2178 },
    icon: "figure.2.arms.open",
    emoji: "🏋️",
    description: "Equipped fitness center and gym for workouts, weight training, and cardio.",
    hours: "Mon - Sat, 5:30 AM - 9:30 PM",
  },
  {
    id: "b10",
    name: "Hive Dining Hall",
    shortName: "Hive",
    category: "dining",
    coordinate: { latitude: 5.7593, longitude: -0.2201 },
    icon: "fork.knife",
    emoji: "🍽️",
    description: "The primary dining facility offering breakfast, lunch, dinner, and snack options.",
    hours: "Daily, 7:00 AM - 9:00 PM",
  },
  
  // Indoor Locations (Classrooms, Offices, Labs - resolve coordinate from parentId)
  {
    id: "c1",
    name: "Room 214",
    category: "academic",
    parentId: "b1",
    building: "Norton Motulsky Hall",
    floor: "2nd Floor",
    icon: "graduationcap.fill",
    description: "Large lecture hall equipped with audiovisual systems, used for classes and seminars.",
  },
  {
    id: "c2",
    name: "Room 218",
    category: "academic",
    parentId: "b1",
    building: "Norton Motulsky Hall",
    floor: "2nd Floor",
    icon: "graduationcap.fill",
    description: "Standard classroom hosting lectures and tutorials.",
  },
  {
    id: "c3",
    name: "Design Lab",
    category: "lab",
    parentId: "b4",
    building: "King Engineering Building",
    floor: "Ground Floor",
    icon: "hammer.fill",
    description: "Engineering design laboratory for rapid prototyping and mechanical testing.",
  },
  {
    id: "o1",
    name: "OIPCC Office",
    category: "office",
    parentId: "b2",
    building: "Radichel Hall",
    floor: "2nd Floor",
    icon: "earth.americas.fill",
    description: "Office of International Programs and Campus Cohesion. Assisting with visas, buddy up programs, and cultural exchange.",
    linked_office_id: "oipcc",
  },
  {
    id: "o2",
    name: "Career Services Center",
    category: "office",
    parentId: "b1",
    building: "Norton Motulsky Hall",
    floor: "Ground Floor",
    icon: "briefcase.fill",
    description: "Career advice, CV reviews, internships, and recruiter network placements.",
    linked_office_id: "career",
  },
  {
    id: "o3",
    name: "IT Support Desk",
    category: "office",
    parentId: "b3",
    building: "Warren Library",
    floor: "Ground Floor",
    icon: "heart.text.square.fill",
    description: "Technical assistance for student laptops, printing accounts, and Wi-Fi networks.",
    linked_office_id: "it",
  },
];

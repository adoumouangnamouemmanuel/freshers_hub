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
  url: string;
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
};

export const MOCK_OFFICES: Record<string, Office> = {
  odip: {
    id: "odip",
    name: "Office of Diversity and International Programs",
    shortName: "ODIP",
    description:
      "ODIP is dedicated to supporting international students, fostering cultural exchange, and promoting an inclusive campus environment. We assist with visas, buddy matching, and settling into life in Ghana.",
    location: "Radcliffe Building, Room 204",
    hours: "Mon - Fri, 8:00 AM - 5:00 PM",
    icon: "earth.americas.fill",
    heroImage: require("../assets/images/help/hero_odip.png"),
    contacts: {
      phone: "+233 20 000 0000",
      email: "odip@ashesi.edu.gh",
      whatsapp: "+233 20 000 0000",
    },
    staff: [
      {
        id: "s1",
        name: "Millicent Adjei",
        role: "Director, ODIP",
        email: "madjei@ashesi.edu.gh",
        phone: "+233 24 123 4567",
        image: require("../assets/images/staff/avatar_female_1.png"),
      },
      {
        id: "s2",
        name: "Kweku Boateng",
        role: "International Student Advisor",
        email: "kboateng@ashesi.edu.gh",
        image: require("../assets/images/staff/avatar_male_1.png"),
      },
    ],
    links: [
      {
        title: "International Student Guide",
        url: "https://ashesi.edu.gh",
        icon: "earth.americas.fill",
      },
    ],
    documents: [
      {
        title: "Non-Citizen ID Application Form",
        url: "https://ashesi.edu.gh/form.pdf",
        size: "1.2 MB",
        type: "pdf",
      },
      {
        title: "Visa Renewal Checklist",
        url: "https://ashesi.edu.gh/checklist.pdf",
        size: "800 KB",
        type: "pdf",
      },
    ],
    faqs: [
      {
        question: "How do I renew my student visa?",
        answer: "Visit our office at least one month before your current visa expires. Bring your passport and non-citizen ID.",
      },
      {
        question: "Is airport pickup provided?",
        answer: "Yes, for first-year international students. Check your email for the arrival form.",
      },
    ],
  },
  career: {
    id: "career",
    name: "Career Services Center",
    shortName: "Career Services",
    description:
      "Your bridge between academic life and the professional world. We offer resume reviews, interview prep, internship placements, and networking events with top employers.",
    location: "Norton Motulsky Building, Ground Floor",
    hours: "Mon - Fri, 9:00 AM - 4:00 PM",
    icon: "briefcase.fill",
    heroImage: require("../assets/images/help/hero_career.png"),
    contacts: {
      email: "careers@ashesi.edu.gh",
      phone: "+233 30 000 0000",
    },
    staff: [
      {
        id: "c1",
        name: "Abena Mensah",
        role: "Head of Career Services",
        email: "amensah@ashesi.edu.gh",
        image: require("../assets/images/staff/avatar_female_2.png"),
      },
      {
        id: "c2",
        name: "David Osei",
        role: "Employer Relations Manager",
        email: "dosei@ashesi.edu.gh",
        phone: "+233 20 987 6543",
        image: require("../assets/images/staff/avatar_male_1.png"),
      },
    ],
    links: [
      {
        title: "Handshake Portal",
        url: "https://ashesi.joinhandshake.com",
        icon: "briefcase.fill",
      },
      {
        title: "Book an Advising Session",
        url: "https://ashesi.edu.gh",
        icon: "calendar",
      },
    ],
    documents: [
      {
        title: "Resume Template (Standard)",
        url: "https://ashesi.edu.gh/resume.docx",
        size: "45 KB",
        type: "doc",
      },
      {
        title: "Cover Letter Guidelines",
        url: "https://ashesi.edu.gh/cover.pdf",
        size: "1.5 MB",
        type: "pdf",
      },
    ],
    faqs: [
      {
        question: "When should I start looking for internships?",
        answer: "As early as your sophomore year! We recommend attending our Fall Career Fair to start networking.",
      },
    ],
  },
  it: {
    id: "it",
    name: "IT Support Center",
    shortName: "Support Center",
    description:
      "Your first point of contact for all technology needs. We help with campus Wi-Fi, printer setup, software installations, and account access issues.",
    location: "Radcliffe Building, Ground Floor",
    hours: "Mon - Fri, 8:00 AM - 6:00 PM",
    icon: "heart.text.square.fill",
    heroImage: require("../assets/images/help/hero_it.png"),
    contacts: {
      phone: "+233 30 261 0330",
      email: "support@ashesi.edu.gh",
    },
    staff: [
      {
        id: "it1",
        name: "Emmanuel Yeboah",
        role: "Senior IT Support Engineer",
        email: "eyeboah@ashesi.edu.gh",
        phone: "+233 24 000 0000",
        image: require("../assets/images/staff/avatar_male_1.png"),
      },
      {
        id: "it2",
        name: "Sarah Appiah",
        role: "Network Administrator",
        email: "sappiah@ashesi.edu.gh",
        image: require("../assets/images/staff/avatar_female_1.png"),
      },
    ],
    links: [
      {
        title: "Submit a Ticket",
        url: "https://support.ashesi.edu.gh",
        icon: "paperplane.fill",
      },
      {
        title: "Reset Password",
        url: "https://ashesi.edu.gh",
        icon: "chevron.right",
      },
    ],
  },
  health: {
    id: "health",
    name: "Natembea Health Center",
    shortName: "Health Center",
    description:
      "Providing comprehensive medical and psychological support to the Ashesi community. We offer first aid, basic consultations, counselling sessions, and referrals. Your well-being is our utmost priority.",
    location: "Behind the Student Hostels",
    hours: "24/7 for Emergencies\nClinic: 8:00 AM - 6:00 PM",
    icon: "cross.case.fill",
    heroImage: require("../assets/images/help/hero_health.png"),
    contacts: {
      phone: "+233 24 431 3866", // Emergency
      whatsapp: "+233 24 431 3866",
      email: "health@ashesi.edu.gh",
    },
    staff: [
      {
        id: "h1",
        name: "Dr. William Akoto",
        role: "Chief Medical Officer",
        email: "wakoto@ashesi.edu.gh",
        phone: "+233 24 431 3866",
        image: require("../assets/images/staff/avatar_doctor.png"),
      },
      {
        id: "h2",
        name: "Dr. Grace Nartey",
        role: "Lead Psychological Counselor",
        email: "gnartey@ashesi.edu.gh",
        image: require("../assets/images/staff/avatar_female_2.png"),
      },
    ],
    links: [
      {
        title: "Book Therapy Session",
        url: "https://ashesi.edu.gh",
        icon: "calendar",
      },
      {
        title: "List of Accredited Hospitals",
        url: "https://ashesi.edu.gh",
        icon: "earth.americas.fill",
      },
    ],
    documents: [
      {
        title: "Excuse Duty Request Form",
        url: "https://ashesi.edu.gh/excuse.pdf",
        size: "200 KB",
        type: "pdf",
      },
      {
        title: "Student Health Insurance Claim Form",
        url: "https://ashesi.edu.gh/insurance.pdf",
        size: "1.8 MB",
        type: "pdf",
      },
      {
        title: "Medical History Update Form",
        url: "https://ashesi.edu.gh/medical-history.pdf",
        size: "450 KB",
        type: "pdf",
      },
    ],
    faqs: [
      {
        question: "What should I do in a medical emergency?",
        answer: "Immediately call our emergency line or WhatsApp us. We have an ambulance on standby 24/7.",
      },
      {
        question: "How do I get an Excuse Duty?",
        answer: "You must be assessed by the Medical Officer. If deemed unfit for classes, an Excuse Duty will be issued directly to the Registry.",
      },
      {
        question: "Is counseling confidential?",
        answer: "Absolutely. All sessions with our psychologists are 100% strictly confidential and not shared with faculty.",
      },
    ],
  },
  registry: {
    id: "registry",
    name: "Academic Registry",
    shortName: "Registrar",
    description:
      "Managing academic records, course registrations, transcripts, and graduation requirements. The backbone of your academic journey at Ashesi.",
    location: "Radcliffe Building, Ground Floor",
    hours: "Mon - Fri, 8:00 AM - 5:00 PM",
    icon: "graduationcap.fill",
    heroImage: require("../assets/images/help/hero_registry.png"),
    contacts: {
      email: "registry@ashesi.edu.gh",
    },
    staff: [
      {
        id: "r1",
        name: "Samuel Osei-Mensah",
        role: "University Registrar",
        email: "sosei@ashesi.edu.gh",
        image: require("../assets/images/staff/avatar_male_1.png"),
      },
      {
        id: "r2",
        name: "Janet Addo",
        role: "Records Officer",
        email: "jaddo@ashesi.edu.gh",
        phone: "+233 20 111 2222",
        image: require("../assets/images/staff/avatar_female_1.png"),
      },
    ],
    links: [
      {
        title: "Student Information System (SIS)",
        url: "https://sis.ashesi.edu.gh",
        icon: "graduationcap.fill",
      },
      {
        title: "Canvas LMS",
        url: "https://canvas.ashesi.edu.gh",
        icon: "newspaper.fill",
      },
    ],
    documents: [
      {
        title: "Academic Calendar 2026-2027",
        url: "https://ashesi.edu.gh/calendar.pdf",
        size: "2.1 MB",
        type: "pdf",
      },
    ],
    faqs: [
      {
        question: "How do I request an official transcript?",
        answer: "Transcript requests can be made via SIS. Processing takes 3-5 business days.",
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
    description: "Natembea Health Clinic providing medical services, counseling, and 24/7 emergency support.",
    hours: "24/7 for Emergencies • Clinic: 8:00 AM - 6:00 PM",
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
    name: "ODIP Office",
    category: "office",
    parentId: "b2",
    building: "Radichel Hall",
    floor: "2nd Floor",
    icon: "earth.americas.fill",
    description: "Office of Diversity and International Programs. Assisting with visas, buddy up programs, and cultural exchange.",
    linked_office_id: "odip",
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

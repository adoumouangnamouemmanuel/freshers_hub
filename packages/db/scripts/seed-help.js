const { Client } = require("pg");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../../.env") });

const databaseUrl = process.env.DATABASE_URL || "postgres://postgres:postgres@localhost:5432/fresher_hub";

// Converting mock-data to seed data
const offices = [
  {
    id: "oipcc",
    name: "Office of International Programs and Campus Cohesion",
    shortName: "OIPCC",
    description: "The Office promotes a campus culture that values diversity, equity, and inclusion while supporting international students and global learning opportunities.",
    location: "Radichel Hall Rooms 207 & 210",
    hours: "Mon - Fri, 8:00 AM - 5:00 PM",
    icon: "earth.americas.fill",
    heroImage: "/assets/images/help/hero_odip.png",
    contactEmail: "cohesion@ashesi.edu.gh",
    contactPhone: "+233 50 126 0277",
    contactWhatsapp: "+233 50 126 0277",
    staff: [
      { name: "Millicent Adjei", role: "Director of International Programs and Campus Cohesion", email: "madjei@ashesi.edu.gh", phone: "ext.1062", imageUrl: "/assets/images/staff/oipcc/millicent.jpg" },
      { name: "Rosemary Kotei", role: "Assistant Director, International Programs", email: "rkotei@ashesi.edu.gh", phone: "ext.1034", imageUrl: "/assets/images/staff/oipcc/rosemary.jpg" }
    ],
    links: [
      { title: "Campus Cohesion Info", url: "https://ashesi.edu.gh/campus-cohesion/", icon: "person.3.fill" },
      { title: "Disability & Accessibility", url: "http://ashesi.edu.gh/student-life/disability-and-accessibility-support/", icon: "figure.roll" },
      { title: "ISA Website", url: "https://isashesi.vercel.app/", icon: "globe.americas.fill" }
    ],
    documents: [
      { title: "Ghana Card Payment Process Flow", url: "/assets/documents/oipcc/Ghana Card Payment Process Flow.pdf", type: "pdf", size: "Unknown" },
      { title: "Ghana Non-Citizenship App Form", url: "/assets/documents/oipcc/Ghana Non Citizenship App Form.pdf", type: "pdf", size: "Unknown" },
      { title: "Immigration Regularization FAQ", url: "/assets/documents/oipcc/Immigration Regularization FAQ.pdf", type: "pdf", size: "Unknown" }
    ],
    faqs: [
      { question: "What support does OIPCC offer for international students?", answer: "OIPCC arranges airport pick-up, guarantees on-campus housing, and helps students regularize their Ghana Non-Citizenship Cards and Residence Permits." },
      { question: "How do I regularize my immigration status?", answer: "Fill the Immigration Regularization (IR) form, prepare required documents, present them to NIA officers to receive your Ghana card, and submit your residence permit form." },
      { question: "What is the Host Family Program?", answer: "It pairs international students with Ghanaian families to expand their network and learn about Ghanaian culture, while host families learn about the student's culture." },
      { question: "What is the First-Year Buddy Up Program?", answer: "It pairs first-year students with continuing student coaches who guide them in transitioning to the university culture both socially and academically." }
    ]
  },
  {
    id: "career",
    name: "Career Services Center",
    shortName: "Career Services",
    description: "The Office plays a pivotal role in shaping students’ professional journeys by offering a range of resources designed to enhance career readiness.",
    location: "Norton Motulsky Building, Ground Floor",
    hours: "Mon - Fri, 9:00 AM - 4:00 PM",
    icon: "briefcase.fill",
    heroImage: "/assets/images/help/hero_career.png",
    contactEmail: "careers@ashesi.edu.gh",
    contactPhone: "+233 30 000 0000",
    contactWhatsapp: null,
    staff: [
      { name: "Abigail Welbeck", role: "Director", email: "awelbeck@ashesi.edu.gh", imageUrl: "/assets/images/staff/career_services/Abigail-Welbeck-1.png", phone: null },
      { name: "Selasi Nukpe", role: "Assistant Director", email: "snukpe@ashesi.edu.gh", imageUrl: "/assets/images/staff/career_services/Selasi-Nukpe.png", phone: null },
      { name: "Najeeb Ibrahim", role: "Assistant Director", email: "nibrahim@ashesi.edu.gh", imageUrl: "/assets/images/staff/career_services/Najeeb-Ibrahim.png", phone: null },
      { name: "Ngozi Dickson", role: "Assistant Director", email: "ndickson@ashesi.edu.gh", imageUrl: "/assets/images/staff/career_services/Ngozi-Dickson.png", phone: null },
      { name: "Nana Afua Anoff", role: "Senior Career Development Officer", email: "nanoff@ashesi.edu.gh", imageUrl: "/assets/images/staff/career_services/Nana-Afua-Anoff.png", phone: null },
      { name: "Alberta Asiamah", role: "Senior Career Development Officer", email: "aasiamah@ashesi.edu.gh", imageUrl: "/assets/images/staff/career_services/Alberta.png", phone: null }
    ],
    links: [
      { title: "Career Portal", url: "https://app.thecareeros.com/with-university", icon: "briefcase.fill" },
      { title: "Focus2Career", url: "https://www.focus2career.com/Portal/Login.cfm?SID=1992", icon: "target" },
      { title: "Big Interview", url: "https://ashesi.biginterview.com/login", icon: "video.fill" },
      { title: "Global Mentorship", url: "https://globalmentorship.org/schools/ashesi/", icon: "globe.americas.fill" },
      { title: "Job Shadowing Form", url: "https://forms.office.com/r/MEMgdvWKv2", icon: "person.2.fill" }
    ],
    documents: [
      { title: "Ashesi CV Writing Guide", url: "/assets/documents/career_services/Ashesi CV Writing Guide.pdf", size: "1 MB", type: "pdf" },
      { title: "CV Template with guidelines", url: "/assets/documents/career_services/CV Template_ with guidelines.docx", size: "24 KB", type: "docx" }
    ],
    faqs: [
      { question: "What is the Ashesi Career Mentorship Program?", answer: "It connects students with experienced professionals who provide guidance, advice, and access to real-world learning opportunities over three months." },
      { question: "What is the Job Shadowing Program?", answer: "An experiential learning initiative designed to help first-year students make informed decisions about the careers they want to explore while in university." },
      { question: "How does the Internship Program work?", answer: "It provides students with opportunities to apply their classroom knowledge in real-world settings. All students are encouraged to complete at least one internship before graduation." },
      { question: "What services do you offer for interview preparation?", answer: "We offer Mock Interviews, Job Search Strategies, Resume and Cover Letter Reviews, and access to Big Interview, an AI-powered practice tool." },
      { question: "When should I start looking for internships?", answer: "As early as your sophomore year! We recommend attending our Fall Career Fair to start networking." },
      { question: "Does the Career Services office help with graduate school applications?", answer: "Yes, we guide students in exploring graduate study opportunities, providing support with applications, preparation, and decision-making." },
      { question: "When should I start visiting Career Services?", answer: "It is recommended to start engaging with Career Services in your first year through the Job Shadowing Program and early career coaching sessions." }
    ]
  },
  {
    id: "it",
    name: "Support Centre",
    shortName: "Support Centre",
    description: "The Center serves as the primary hub for assistance, guidance, and problem resolution for students, staff, and faculty throughout their time at Ashesi University.",
    location: "King Engineering Building Room 105 (opposite Design Lab)",
    hours: "Mon - Fri, 8:00 AM - 5:00 PM",
    icon: "questionmark.circle.fill",
    heroImage: "/assets/images/help/hero_it.png",
    contactEmail: "supportcentre@ashesi.edu.gh",
    contactPhone: "Ext: 1111 | +233 50 167 3669",
    contactWhatsapp: null,
    staff: [],
    links: [
      { title: "Support Center Docs", url: "https://ashesi.helpscoutdocs.com/#", icon: "newspaper.fill" },
      { title: "Bamboo HR", url: "https://ashesi.helpscoutdocs.com/category/68-bamboo-hr", icon: "person.3.fill" },
      { title: "Ashesi Online Teaching FAQs", url: "https://ashesi.helpscoutdocs.com/category/47-ashesi-online-teaching-faqs", icon: "laptopcomputer" },
      { title: "Microsoft Stream", url: "https://ashesi.helpscoutdocs.com/category/55-microsoft-stream", icon: "play.tv.fill" },
      { title: "Zoom", url: "https://ashesi.helpscoutdocs.com/category/50-zoom", icon: "video.fill" },
      { title: "Canvas LMS", url: "https://ashesi.helpscoutdocs.com/category/39-canvas-lms", icon: "book.fill" },
      { title: "CAMU", url: "https://ashesi.helpscoutdocs.com/category/20-camu", icon: "graduationcap.fill" },
      { title: "CAMU FAQs", url: "https://ashesi.helpscoutdocs.com/category/31-camu-faqs", icon: "questionmark.circle.fill" },
      { title: "Grammarly", url: "https://ashesi.helpscoutdocs.com/category/29-grammarly", icon: "pencil" },
      { title: "Meal Plan", url: "https://ashesi.helpscoutdocs.com/category/4-meal-plan", icon: "fork.knife" }
    ],
    documents: [],
    faqs: [
      { question: "How do I submit a ticket?", answer: "Visit our Support Center Docs at https://ashesi.helpscoutdocs.com or email supportcentre@ashesi.edu.gh" },
      { question: "What services does the Support Centre provide?", answer: "We help with facility and hostel concerns, IT issues, logistics queries, and general feedback." }
    ]
  },
  {
    id: "health",
    name: "Natembea Health Center",
    shortName: "Health Center",
    description: "A HEFRA-accredited clinic providing 24-hour general outpatient care, inpatient observation, and laboratory services.",
    location: "Behind the Student Hostels",
    hours: "Mon - Sun, 24 Hours",
    icon: "cross.case.fill",
    heroImage: "/assets/images/help/hero_health.png",
    contactEmail: "healthcenter@ashesi.edu.gh",
    contactPhone: "+233 501 331 668",
    contactWhatsapp: "+233 501 331 668",
    staff: [
      { name: "Bridgette Addo Asiedu", role: "Director, Health Services", email: "baddoasiedu@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/Bridgitte.jpg", phone: null },
      { name: "Dr. Paul Kumi", role: "Director of Counseling, Coaching, and Advising", email: "pkumi@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/PaulKumi.jpg", phone: null },
      { name: "Selase Tsiagbe", role: "Assistant Director, Health Services", email: "stsiagbe@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/Selasie.jpg", phone: null },
      { name: "Sylvester Amponsah", role: "Nursing Officer", email: "samponsah@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/Samuel.jpg", phone: null },
      { name: "Nana Adu Asante", role: "Nursing Officer", email: "nasante@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/Nana-Adu.jpg", phone: null },
      { name: "Maame Ama Ackah", role: "Counselor", email: "mackah@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/MaameAckah.jpg", phone: null },
      { name: "Richard Tumawu", role: "Health Services Coordinator", email: "rtumawu@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/Richard.jpg", phone: null },
      { name: "Evonne Sauda", role: "Assistant Director of Wellness & Wellness Coach", email: "esauda@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/EBS.jpg", phone: null },
      { name: "Emmanuel Ntow", role: "Senior Academic Advisor", email: "entow@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/EmmaNtow.jpg", phone: null },
      { name: "Iehowa-Nhyirah Gaisie", role: "Counselor", email: "igaisie@ashesi.edu.gh", imageUrl: "/assets/images/staff/health_center/Nhyira.jpg", phone: null }
    ],
    links: [
      { title: "Book Counseling Session", url: "https://ashesicounseling.simplybook.me/v2/", icon: "heart.text.square.fill" },
      { title: "Book Coaching & Wellness", url: "https://ashesicounsellingandcoachingcentercoach.simplybook.it/v2/", icon: "calendar" },
      { title: "Book Academic Advising", url: "https://calendly.com/emmanuel-ntow-ashesi/academicbooking-meeting", icon: "graduationcap.fill" }
    ],
    documents: [
      { title: "Health Insurance Policy Details", url: "https://ashesi.edu.gh/health-and-wellbeing/", size: "Link", type: "link" },
      { title: "Required Vaccinations List", url: "https://ashesi.edu.gh/health-and-wellbeing/", size: "Link", type: "link" }
    ],
    faqs: [
      { question: "What should I do in a medical emergency?", answer: "Call the Health Center immediately on +233 501 331 668 or report in person. The Natembea Health Center is always open 24/7." },
      { question: "What vaccinations are required?", answer: "Measles/Mumps/Rubella (MMR), Varicella, and Yellow Fever are required. Hepatitis A, Typhoid, Tetanus, and COVID-19 are strongly recommended." },
      { question: "Is health insurance required?", answer: "Yes, students without an insurance policy are required to sign up for the Natembea Health Center’s recommended provider. It's renewed annually and included in fees." }
    ]
  }
];

async function seedHelpCenter() {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();
  
  try {
    await client.query("BEGIN");
    
    // Clear existing data
    await client.query("DELETE FROM faq_items");
    await client.query("DELETE FROM offices");
    
    for (const office of offices) {
      // Insert office
      const { rows } = await client.query(`
        INSERT INTO offices (name, short_name, description, location, hours, icon, hero_image, contact_email, contact_phone, contact_whatsapp)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
      `, [
        office.name, office.shortName, office.description, office.location, office.hours, office.icon, office.heroImage, office.contactEmail, office.contactPhone, office.contactWhatsapp
      ]);
      const officeId = rows[0].id;

      for (const staff of office.staff) {
        await client.query(`
          INSERT INTO office_staff (office_id, name, role, email, phone, image_url)
          VALUES ($1, $2, $3, $4, $5, $6)
        `, [officeId, staff.name, staff.role, staff.email, staff.phone, staff.imageUrl]);
      }

      for (const link of office.links) {
        await client.query(`
          INSERT INTO office_links (office_id, title, url, icon)
          VALUES ($1, $2, $3, $4)
        `, [officeId, link.title, link.url, link.icon]);
      }

      for (const doc of office.documents) {
        await client.query(`
          INSERT INTO office_documents (office_id, title, url, type, size)
          VALUES ($1, $2, $3, $4, $5)
        `, [officeId, doc.title, doc.url, doc.type, doc.size]);
      }

      for (const faq of office.faqs) {
        await client.query(`
          INSERT INTO faq_items (category, question, answer)
          VALUES ($1, $2, $3)
        `, [office.shortName, faq.question, faq.answer]); // Use shortName as category
      }
    }
    
    await client.query("COMMIT");
    console.log("Help Center seeding completed.");
  } catch(error) {
    await client.query("ROLLBACK");
    console.error(error);
  } finally {
    await client.end();
  }
}

seedHelpCenter();

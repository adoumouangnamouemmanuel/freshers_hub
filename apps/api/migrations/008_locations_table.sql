-- Migration to add locations table and seed it with basic campus data

CREATE TABLE IF NOT EXISTS locations (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    short_name VARCHAR(100),
    category VARCHAR(50) NOT NULL,
    building VARCHAR(100),
    description TEXT,
    icon VARCHAR(50),
    emoji VARCHAR(10),
    hours VARCHAR(255),
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Seed with initial data
INSERT INTO locations (id, name, short_name, category, latitude, longitude, icon, emoji, description, hours) VALUES
('b1', 'Norton Motulsky Hall', 'Norton', 'academic', 5.7600, -0.2195, 'building.2.fill', '🏢', 'Main academic building housing classrooms, faculty offices, and lecture halls.', 'Mon - Sat, 7:00 AM - 10:00 PM'),
('b2', 'Radichel Hall', 'Radichel', 'academic', 5.7595, -0.2199, 'building.2.fill', '🏢', 'Academic building for engineering and computer science labs.', 'Mon - Sat, 7:00 AM - 10:00 PM'),
('b3', 'King Engineering Building', 'King', 'academic', 5.7590, -0.2205, 'gearshape.fill', '⚙️', 'State-of-the-art engineering and design workshops.', 'Mon - Fri, 8:00 AM - 8:00 PM'),
('c1', 'Aba Sam Cafeteria', 'Cafeteria', 'dining', 5.7605, -0.2190, 'fork.knife', '🍽️', 'Main campus dining facility offering various local and international meals.', 'Daily, 7:00 AM - 9:00 PM'),
('c2', 'Akornor Cafe', 'Akornor', 'dining', 5.7602, -0.2185, 'cup.and.saucer.fill', '☕', 'Quick snacks, pastries, and premium coffee.', 'Mon - Sat, 8:00 AM - 8:00 PM'),
('c3', 'BigBen', 'BigBen', 'dining', 5.7598, -0.2180, 'takeoutbag.and.cup.and.straw.fill', '🍔', 'Popular spot for burgers, fries, and casual hangouts.', 'Daily, 10:00 AM - 10:00 PM'),
('h1', 'Dufie Hostel', 'Dufie', 'hostel', 5.7620, -0.2190, 'bed.double.fill', '🛏️', 'Student accommodation for continuing students.', '24/7 Access'),
('h2', 'Kofi Tawiah Hostel', 'Kofi Tawiah', 'hostel', 5.7625, -0.2185, 'bed.double.fill', '🛏️', 'Premium student housing facility.', '24/7 Access'),
('h3', 'Oteng Aboagye Hostel', 'Oteng', 'hostel', 5.7630, -0.2180, 'bed.double.fill', '🛏️', 'Student housing known for its vibrant community.', '24/7 Access'),
('h4', 'Walter Sisulu Hostel', 'Walter Sisulu', 'hostel', 5.7615, -0.2195, 'bed.double.fill', '🛏️', 'Student housing facility.', '24/7 Access'),
('h5', 'Amani Hostel', 'Amani', 'hostel', 5.7610, -0.2200, 'bed.double.fill', '🛏️', 'Quiet residential student hostel.', '24/7 Access'),
('h6', 'Makola Hostel', 'Makola', 'hostel', 5.7605, -0.2205, 'bed.double.fill', '🛏️', 'Student hostel with great community spaces.', '24/7 Access'),
('r1', 'Courtyard', 'Courtyard', 'recreation', 5.7605, -0.2198, 'leaf.fill', '🌳', 'Open green space for relaxation and outdoor study.', 'Open 24/7'),
('r2', 'Sports Field', 'Field', 'recreation', 5.7635, -0.2210, 'sportscourt.fill', '⚽', 'Main campus field for soccer, track, and other sports.', 'Daily, 6:00 AM - 6:00 PM'),
('s1', 'Natembea Health Center', 'Clinic', 'services', 5.7610, -0.2185, 'cross.case.fill', '🏥', 'Campus medical center providing primary care and emergency services.', 'Mon - Fri, 8:00 AM - 5:00 PM. Emergencies 24/7'),
('s2', 'OIC', 'OIC', 'services', 5.7615, -0.2180, 'globe.americas.fill', '🌍', 'Office of International Programs and Career Counseling.', 'Mon - Fri, 9:00 AM - 5:00 PM')
ON CONFLICT (id) DO NOTHING;

// App Constants
export const APP_NAME = 'BartaOne';
export const APP_VERSION = '1.0.0';
export const APP_DESCRIPTION = 'Hyperlocal Multilingual News Broadcasting Platform';

// API Constants
export const API_TIMEOUT = 30000; // 30 seconds
export const MAX_RETRY_ATTEMPTS = 3;
export const RETRY_DELAY = 1000; // 1 second

// User Roles
export const USER_ROLES = {
  VIEWER: 'viewer',
  OWNER: 'owner',
  ADMIN: 'admin',
};

// Content Types
export const CONTENT_TYPES = {
  ARTICLE: 'article',
  VIDEO: 'video',
  LIVE: 'live',
};

// Categories
export const CATEGORIES = [
  { id: 'news', label: 'News', icon: 'newspaper-outline', color: '#FF6B6B' },
  { id: 'entertainment', label: 'Entertainment', icon: 'film-outline', color: '#4ECDC4' },
  { id: 'sports', label: 'Sports', icon: 'basketball-outline', color: '#45B7D1' },
  { id: 'business', label: 'Business', icon: 'business-outline', color: '#96CEB4' },
  { id: 'technology', label: 'Technology', icon: 'hardware-chip-outline', color: '#FFD93D' },
  { id: 'lifestyle', label: 'Lifestyle', icon: 'leaf-outline', color: '#6C5CE7' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline', color: '#A29BFE' },
];

// Languages
// All 22 languages of the Eighth Schedule of the Constitution of India,
// plus English (official) and a few widely-used international languages.
export const LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', nativeName: 'বাংলা', flag: '🇮🇳' },
  { code: 'as', name: 'Assamese', nativeName: 'অসমীয়া', flag: '🇮🇳' },
  { code: 'brx', name: 'Bodo', nativeName: 'बड़ो', flag: '🇮🇳' },
  { code: 'doi', name: 'Dogri', nativeName: 'डोगरी', flag: '🇮🇳' },
  { code: 'gu', name: 'Gujarati', nativeName: 'ગુજરાતી', flag: '🇮🇳' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ', flag: '🇮🇳' },
  { code: 'ks', name: 'Kashmiri', nativeName: 'کٲشُر', flag: '🇮🇳' },
  { code: 'kok', name: 'Konkani', nativeName: 'कोंकणी', flag: '🇮🇳' },
  { code: 'mai', name: 'Maithili', nativeName: 'मैथिली', flag: '🇮🇳' },
  { code: 'ml', name: 'Malayalam', nativeName: 'മലയാളം', flag: '🇮🇳' },
  { code: 'mni', name: 'Manipuri (Meitei)', nativeName: 'ꯃꯤꯇꯩꯂꯣꯟ', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', nativeName: 'मराठी', flag: '🇮🇳' },
  { code: 'ne', name: 'Nepali', nativeName: 'नेपाली', flag: '🇮🇳' },
  { code: 'or', name: 'Odia', nativeName: 'ଓଡ଼ିଆ', flag: '🇮🇳' },
  { code: 'pa', name: 'Punjabi', nativeName: 'ਪੰਜਾਬੀ', flag: '🇮🇳' },
  { code: 'sa', name: 'Sanskrit', nativeName: 'संस्कृतम्', flag: '🇮🇳' },
  { code: 'sat', name: 'Santali', nativeName: 'ᱥᱟᱱᱛᱟᱲᱤ', flag: '🇮🇳' },
  { code: 'sd', name: 'Sindhi', nativeName: 'سنڌي', flag: '🇮🇳' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்', flag: '🇮🇳' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు', flag: '🇮🇳' },
  { code: 'ur', name: 'Urdu', nativeName: 'اردو', flag: '🇮🇳' },
  // Additional international languages
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
];

// Indian States & Union Territories with Districts and Major Cities
// NOTE: District boundaries in India change periodically (states occasionally
// create, merge, or rename districts). This list reflects the standard/stable
// administrative division and is a strong reference baseline, but treat very
// recently created districts (e.g. post-2023 splits in some states) as subject
// to change. "cities" is populated for the largest district(s) in each state/UT
// following the same pattern as the original file — extend as needed.
export const LOCATIONS = {
  states: [
    { id: 'andhra_pradesh', name: 'Andhra Pradesh', code: 'AP', capital: 'Amaravati' },
    { id: 'arunachal_pradesh', name: 'Arunachal Pradesh', code: 'AR', capital: 'Itanagar' },
    { id: 'assam', name: 'Assam', code: 'AS', capital: 'Dispur' },
    { id: 'bihar', name: 'Bihar', code: 'BR', capital: 'Patna' },
    { id: 'chhattisgarh', name: 'Chhattisgarh', code: 'CG', capital: 'Raipur' },
    { id: 'goa', name: 'Goa', code: 'GA', capital: 'Panaji' },
    { id: 'gujarat', name: 'Gujarat', code: 'GJ', capital: 'Gandhinagar' },
    { id: 'haryana', name: 'Haryana', code: 'HR', capital: 'Chandigarh' },
    { id: 'himachal_pradesh', name: 'Himachal Pradesh', code: 'HP', capital: 'Shimla' },
    { id: 'jharkhand', name: 'Jharkhand', code: 'JH', capital: 'Ranchi' },
    { id: 'karnataka', name: 'Karnataka', code: 'KA', capital: 'Bengaluru' },
    { id: 'kerala', name: 'Kerala', code: 'KL', capital: 'Thiruvananthapuram' },
    { id: 'madhya_pradesh', name: 'Madhya Pradesh', code: 'MP', capital: 'Bhopal' },
    { id: 'maharashtra', name: 'Maharashtra', code: 'MH', capital: 'Mumbai' },
    { id: 'manipur', name: 'Manipur', code: 'MN', capital: 'Imphal' },
    { id: 'meghalaya', name: 'Meghalaya', code: 'ML', capital: 'Shillong' },
    { id: 'mizoram', name: 'Mizoram', code: 'MZ', capital: 'Aizawl' },
    { id: 'nagaland', name: 'Nagaland', code: 'NL', capital: 'Kohima' },
    { id: 'odisha', name: 'Odisha', code: 'OD', capital: 'Bhubaneswar' },
    { id: 'punjab', name: 'Punjab', code: 'PB', capital: 'Chandigarh' },
    { id: 'rajasthan', name: 'Rajasthan', code: 'RJ', capital: 'Jaipur' },
    { id: 'sikkim', name: 'Sikkim', code: 'SK', capital: 'Gangtok' },
    { id: 'tamil_nadu', name: 'Tamil Nadu', code: 'TN', capital: 'Chennai' },
    { id: 'telangana', name: 'Telangana', code: 'TG', capital: 'Hyderabad' },
    { id: 'tripura', name: 'Tripura', code: 'TR', capital: 'Agartala' },
    { id: 'uttar_pradesh', name: 'Uttar Pradesh', code: 'UP', capital: 'Lucknow' },
    { id: 'uttarakhand', name: 'Uttarakhand', code: 'UK', capital: 'Dehradun' },
    { id: 'west_bengal', name: 'West Bengal', code: 'WB', capital: 'Kolkata' },
    // Union Territories
    { id: 'andaman_nicobar', name: 'Andaman and Nicobar Islands', code: 'AN', capital: 'Port Blair' },
    { id: 'chandigarh_ut', name: 'Chandigarh', code: 'CH', capital: 'Chandigarh' },
    { id: 'dnh_dd', name: 'Dadra and Nagar Haveli and Daman and Diu', code: 'DH', capital: 'Daman' },
    { id: 'delhi', name: 'Delhi (NCT)', code: 'DL', capital: 'New Delhi' },
    { id: 'jammu_kashmir', name: 'Jammu and Kashmir', code: 'JK', capital: 'Srinagar / Jammu' },
    { id: 'ladakh', name: 'Ladakh', code: 'LA', capital: 'Leh' },
    { id: 'lakshadweep', name: 'Lakshadweep', code: 'LD', capital: 'Kavaratti' },
    { id: 'puducherry', name: 'Puducherry', code: 'PY', capital: 'Puducherry' },
  ],

  districts: {
    andhra_pradesh: [
      'Srikakulam', 'Parvathipuram Manyam', 'Vizianagaram', 'Visakhapatnam', 'Alluri Sitharama Raju',
      'Anakapalli', 'Kakinada', 'East Godavari', 'Konaseema', 'West Godavari', 'Eluru', 'Krishna',
      'NTR', 'Guntur', 'Palnadu', 'Bapatla', 'Prakasam', 'Nellore', 'Kurnool', 'Nandyal',
      'Anantapur', 'Sri Sathya Sai', 'YSR Kadapa', 'Annamayya', 'Chittoor', 'Tirupati',
    ].map(toDistrict),
    arunachal_pradesh: [
      'Tawang', 'West Kameng', 'East Kameng', 'Pakke-Kessang', 'Papum Pare', 'Kurung Kumey',
      'Kra Daadi', 'Lower Subansiri', 'Upper Subansiri', 'Kamle', 'Leparada', 'West Siang',
      'Shi Yomi', 'East Siang', 'Siang', 'Upper Siang', 'Lower Siang', 'Dibang Valley',
      'Lower Dibang Valley', 'Anjaw', 'Lohit', 'Namsai', 'Changlang', 'Tirap', 'Longding',
    ].map(toDistrict),
    assam: [
      'Baksa', 'Barpeta', 'Biswanath', 'Bongaigaon', 'Cachar', 'Charaideo', 'Chirang', 'Darrang',
      'Dhemaji', 'Dhubri', 'Dibrugarh', 'Goalpara', 'Golaghat', 'Hailakandi', 'Hojai', 'Jorhat',
      'Kamrup', 'Kamrup Metropolitan', 'Karbi Anglong', 'West Karbi Anglong', 'Karimganj',
      'Kokrajhar', 'Lakhimpur', 'Majuli', 'Morigaon', 'Nagaon', 'Nalbari', 'Dima Hasao',
      'Sivasagar', 'Sonitpur', 'South Salmara-Mankachar', 'Tinsukia', 'Udalguri', 'Tamulpur', 'Bajali',
    ].map(toDistrict),
    bihar: [
      'Araria', 'Arwal', 'Aurangabad', 'Banka', 'Begusarai', 'Bhagalpur', 'Bhojpur', 'Buxar',
      'Darbhanga', 'East Champaran', 'Gaya', 'Gopalganj', 'Jamui', 'Jehanabad', 'Kaimur', 'Katihar',
      'Khagaria', 'Kishanganj', 'Lakhisarai', 'Madhepura', 'Madhubani', 'Munger', 'Muzaffarpur',
      'Nalanda', 'Nawada', 'Patna', 'Purnia', 'Rohtas', 'Saharsa', 'Samastipur', 'Saran',
      'Sheikhpura', 'Sheohar', 'Sitamarhi', 'Siwan', 'Supaul', 'Vaishali', 'West Champaran',
    ].map(toDistrict),
    chhattisgarh: [
      'Balod', 'Baloda Bazar', 'Balrampur', 'Bastar', 'Bemetara', 'Bijapur', 'Bilaspur', 'Dantewada',
      'Dhamtari', 'Durg', 'Gariaband', 'Janjgir-Champa', 'Jashpur', 'Kabirdham', 'Kanker', 'Kondagaon',
      'Korba', 'Koriya', 'Mahasamund', 'Mungeli', 'Narayanpur', 'Raigarh', 'Raipur', 'Rajnandgaon',
      'Sukma', 'Surajpur', 'Surguja', 'Gaurela-Pendra-Marwahi', 'Manendragarh-Chirmiri-Bharatpur',
      'Mohla-Manpur-Ambagarh Chowki', 'Sarangarh-Bilaigarh', 'Khairagarh-Chhuikhadan-Gandai', 'Sakti',
    ].map(toDistrict),
    goa: ['North Goa', 'South Goa'].map(toDistrict),
    gujarat: [
      'Ahmedabad', 'Amreli', 'Anand', 'Aravalli', 'Banaskantha', 'Bharuch', 'Bhavnagar', 'Botad',
      'Chhota Udaipur', 'Dahod', 'Dang', 'Devbhoomi Dwarka', 'Gandhinagar', 'Gir Somnath', 'Jamnagar',
      'Junagadh', 'Kheda', 'Kutch', 'Mahisagar', 'Mehsana', 'Morbi', 'Narmada', 'Navsari',
      'Panchmahal', 'Patan', 'Porbandar', 'Rajkot', 'Sabarkantha', 'Surat', 'Surendranagar', 'Tapi', 'Vadodara', 'Valsad',
    ].map(toDistrict),
    haryana: [
      'Ambala', 'Bhiwani', 'Charkhi Dadri', 'Faridabad', 'Fatehabad', 'Gurugram', 'Hisar', 'Jhajjar',
      'Jind', 'Kaithal', 'Karnal', 'Kurukshetra', 'Mahendragarh', 'Nuh', 'Palwal', 'Panchkula',
      'Panipat', 'Rewari', 'Rohtak', 'Sirsa', 'Sonipat', 'Yamunanagar',
    ].map(toDistrict),
    himachal_pradesh: [
      'Bilaspur', 'Chamba', 'Hamirpur', 'Kangra', 'Kinnaur', 'Kullu', 'Lahaul and Spiti', 'Mandi',
      'Shimla', 'Sirmaur', 'Solan', 'Una',
    ].map(toDistrict),
    jharkhand: [
      'Bokaro', 'Chatra', 'Deoghar', 'Dhanbad', 'Dumka', 'East Singhbhum', 'Garhwa', 'Giridih',
      'Godda', 'Gumla', 'Hazaribagh', 'Jamtara', 'Khunti', 'Koderma', 'Latehar', 'Lohardaga',
      'Pakur', 'Palamu', 'Ramgarh', 'Ranchi', 'Sahibganj', 'Seraikela-Kharsawan', 'Simdega', 'West Singhbhum',
    ].map(toDistrict),
    karnataka: [
      'Bagalkot', 'Ballari', 'Belagavi', 'Bengaluru Rural', 'Bengaluru Urban', 'Bidar', 'Chamarajanagar',
      'Chikkaballapur', 'Chikkamagaluru', 'Chitradurga', 'Dakshina Kannada', 'Davanagere', 'Dharwad',
      'Gadag', 'Hassan', 'Haveri', 'Kalaburagi', 'Kodagu', 'Kolar', 'Koppal', 'Mandya', 'Mysuru',
      'Raichur', 'Ramanagara', 'Shivamogga', 'Tumakuru', 'Udupi', 'Uttara Kannada', 'Vijayapura', 'Yadgir', 'Vijayanagara',
    ].map(toDistrict),
    kerala: [
      'Alappuzha', 'Ernakulam', 'Idukki', 'Kannur', 'Kasaragod', 'Kollam', 'Kottayam', 'Kozhikode',
      'Malappuram', 'Palakkad', 'Pathanamthitta', 'Thiruvananthapuram', 'Thrissur', 'Wayanad',
    ].map(toDistrict),
    madhya_pradesh: [
      'Agar Malwa', 'Alirajpur', 'Anuppur', 'Ashoknagar', 'Balaghat', 'Barwani', 'Betul', 'Bhind',
      'Bhopal', 'Burhanpur', 'Chhatarpur', 'Chhindwara', 'Damoh', 'Datia', 'Dewas', 'Dhar', 'Dindori',
      'Guna', 'Gwalior', 'Harda', 'Narmadapuram', 'Indore', 'Jabalpur', 'Jhabua', 'Katni', 'Khandwa',
      'Khargone', 'Mandla', 'Mandsaur', 'Morena', 'Narsinghpur', 'Neemuch', 'Niwari', 'Panna',
      'Raisen', 'Rajgarh', 'Ratlam', 'Rewa', 'Sagar', 'Satna', 'Sehore', 'Seoni', 'Shahdol',
      'Shajapur', 'Sheopur', 'Shivpuri', 'Sidhi', 'Singrauli', 'Tikamgarh', 'Ujjain', 'Umaria',
      'Vidisha', 'Maihar', 'Pandhurna',
    ].map(toDistrict),
    maharashtra: [
      'Ahmednagar', 'Akola', 'Amravati', 'Chhatrapati Sambhajinagar', 'Beed', 'Bhandara', 'Buldhana',
      'Chandrapur', 'Dhule', 'Gadchiroli', 'Gondia', 'Hingoli', 'Jalgaon', 'Jalna', 'Kolhapur',
      'Latur', 'Mumbai City', 'Mumbai Suburban', 'Nagpur', 'Nanded', 'Nandurbar', 'Nashik',
      'Dharashiv', 'Palghar', 'Parbhani', 'Pune', 'Raigad', 'Ratnagiri', 'Sangli', 'Satara',
      'Sindhudurg', 'Solapur', 'Thane', 'Wardha', 'Washim', 'Yavatmal',
    ].map(toDistrict),
    manipur: [
      'Bishnupur', 'Chandel', 'Churachandpur', 'Imphal East', 'Imphal West', 'Jiribam', 'Kakching',
      'Kamjong', 'Kangpokpi', 'Noney', 'Pherzawl', 'Senapati', 'Tamenglong', 'Tengnoupal', 'Thoubal', 'Ukhrul',
    ].map(toDistrict),
    meghalaya: [
      'East Garo Hills', 'East Jaintia Hills', 'East Khasi Hills', 'Eastern West Khasi Hills',
      'North Garo Hills', 'Ri Bhoi', 'South Garo Hills', 'South West Garo Hills', 'South West Khasi Hills',
      'West Garo Hills', 'West Jaintia Hills', 'West Khasi Hills',
    ].map(toDistrict),
    mizoram: [
      'Aizawl', 'Champhai', 'Hnahthial', 'Khawzawl', 'Kolasib', 'Lawngtlai', 'Lunglei', 'Mamit',
      'Saitual', 'Serchhip', 'Siaha',
    ].map(toDistrict),
    nagaland: [
      'Chümoukedima', 'Dimapur', 'Kiphire', 'Kohima', 'Longleng', 'Mokokchung', 'Mon', 'Niuland',
      'Noklak', 'Peren', 'Phek', 'Shamator', 'Tseminyu', 'Tuensang', 'Wokha', 'Zunheboto',
    ].map(toDistrict),
    odisha: [
      'Angul', 'Balangir', 'Balasore', 'Bargarh', 'Bhadrak', 'Boudh', 'Cuttack', 'Deogarh',
      'Dhenkanal', 'Gajapati', 'Ganjam', 'Jagatsinghpur', 'Jajpur', 'Jharsuguda', 'Kalahandi',
      'Kandhamal', 'Kendrapara', 'Kendujhar', 'Khordha', 'Koraput', 'Malkangiri', 'Mayurbhanj',
      'Nabarangpur', 'Nayagarh', 'Nuapada', 'Puri', 'Rayagada', 'Sambalpur', 'Subarnapur', 'Sundargarh',
    ].map(toDistrict),
    punjab: [
      'Amritsar', 'Barnala', 'Bathinda', 'Faridkot', 'Fatehgarh Sahib', 'Fazilka', 'Ferozepur',
      'Gurdaspur', 'Hoshiarpur', 'Jalandhar', 'Kapurthala', 'Ludhiana', 'Malerkotla', 'Mansa',
      'Moga', 'Muktsar', 'Pathankot', 'Patiala', 'Rupnagar', 'S.A.S. Nagar (Mohali)', 'Sangrur',
      'Shaheed Bhagat Singh Nagar', 'Tarn Taran',
    ].map(toDistrict),
    rajasthan: [
      'Ajmer', 'Alwar', 'Banswara', 'Baran', 'Barmer', 'Bharatpur', 'Bhilwara', 'Bikaner', 'Bundi',
      'Chittorgarh', 'Churu', 'Dausa', 'Dholpur', 'Dungarpur', 'Hanumangarh', 'Jaipur', 'Jaisalmer',
      'Jalore', 'Jhalawar', 'Jhunjhunu', 'Jodhpur', 'Karauli', 'Kota', 'Nagaur', 'Pali', 'Pratapgarh',
      'Rajsamand', 'Sawai Madhopur', 'Sikar', 'Sirohi', 'Sri Ganganagar', 'Tonk', 'Udaipur',
    ].map(toDistrict),
    sikkim: ['Gangtok', 'Gyalshing', 'Mangan', 'Namchi', 'Pakyong', 'Soreng'].map(toDistrict),
    tamil_nadu: [
      'Ariyalur', 'Chengalpattu', 'Chennai', 'Coimbatore', 'Cuddalore', 'Dharmapuri', 'Dindigul',
      'Erode', 'Kallakurichi', 'Kanchipuram', 'Kanyakumari', 'Karur', 'Krishnagiri', 'Madurai',
      'Mayiladuthurai', 'Nagapattinam', 'Namakkal', 'Nilgiris', 'Perambalur', 'Pudukkottai',
      'Ramanathapuram', 'Ranipet', 'Salem', 'Sivaganga', 'Tenkasi', 'Thanjavur', 'Theni',
      'Thoothukudi', 'Tiruchirappalli', 'Tirunelveli', 'Tirupathur', 'Tiruppur', 'Tiruvallur',
      'Tiruvannamalai', 'Tiruvarur', 'Vellore', 'Viluppuram', 'Virudhunagar',
    ].map(toDistrict),
    telangana: [
      'Adilabad', 'Bhadradri Kothagudem', 'Hyderabad', 'Jagtial', 'Jangaon', 'Jayashankar Bhupalpally',
      'Jogulamba Gadwal', 'Kamareddy', 'Karimnagar', 'Khammam', 'Komaram Bheem', 'Mahabubabad',
      'Mahabubnagar', 'Mancherial', 'Medak', 'Medchal-Malkajgiri', 'Mulugu', 'Nagarkurnool',
      'Nalgonda', 'Narayanpet', 'Nirmal', 'Nizamabad', 'Peddapalli', 'Rajanna Sircilla', 'Rangareddy',
      'Sangareddy', 'Siddipet', 'Suryapet', 'Vikarabad', 'Wanaparthy', 'Warangal', 'Hanamkonda', 'Yadadri Bhuvanagiri',
    ].map(toDistrict),
    tripura: [
      'Dhalai', 'Gomati', 'Khowai', 'North Tripura', 'Sepahijala', 'South Tripura', 'Unakoti', 'West Tripura',
    ].map(toDistrict),
    uttar_pradesh: [
      'Agra', 'Aligarh', 'Ambedkar Nagar', 'Amethi', 'Amroha', 'Auraiya', 'Ayodhya', 'Azamgarh',
      'Baghpat', 'Bahraich', 'Ballia', 'Balrampur', 'Banda', 'Barabanki', 'Bareilly', 'Basti',
      'Bhadohi', 'Bijnor', 'Budaun', 'Bulandshahr', 'Chandauli', 'Chitrakoot', 'Deoria', 'Etah',
      'Etawah', 'Farrukhabad', 'Fatehpur', 'Firozabad', 'Gautam Buddha Nagar', 'Ghaziabad', 'Ghazipur',
      'Gonda', 'Gorakhpur', 'Hamirpur', 'Hapur', 'Hardoi', 'Hathras', 'Jalaun', 'Jaunpur', 'Jhansi',
      'Kannauj', 'Kanpur Dehat', 'Kanpur Nagar', 'Kasganj', 'Kaushambi', 'Kheri', 'Kushinagar',
      'Lalitpur', 'Lucknow', 'Maharajganj', 'Mahoba', 'Mainpuri', 'Mathura', 'Mau', 'Meerut',
      'Mirzapur', 'Moradabad', 'Muzaffarnagar', 'Pilibhit', 'Pratapgarh', 'Prayagraj', 'Raebareli',
      'Rampur', 'Saharanpur', 'Sambhal', 'Sant Kabir Nagar', 'Shahjahanpur', 'Shamli', 'Shravasti',
      'Siddharthnagar', 'Sitapur', 'Sonbhadra', 'Sultanpur', 'Unnao', 'Varanasi',
    ].map(toDistrict),
    uttarakhand: [
      'Almora', 'Bageshwar', 'Chamoli', 'Champawat', 'Dehradun', 'Haridwar', 'Nainital',
      'Pauri Garhwal', 'Pithoragarh', 'Rudraprayag', 'Tehri Garhwal', 'Udham Singh Nagar', 'Uttarkashi',
    ].map(toDistrict),
    west_bengal: [
      'Kolkata', 'North 24 Parganas', 'South 24 Parganas', 'Howrah', 'Hooghly', 'Nadia', 'Murshidabad',
      'Purba Bardhaman', 'Paschim Bardhaman', 'Birbhum', 'Bankura', 'Purba Medinipur', 'Paschim Medinipur',
      'Jalpaiguri', 'Darjeeling', 'Kalimpong', 'Cooch Behar', 'Uttar Dinajpur', 'Dakshin Dinajpur',
      'Malda', 'Alipurduar', 'Jhargram', 'Purulia',
    ].map(toDistrict),
    // Union Territories
    andaman_nicobar: ['Nicobar', 'North and Middle Andaman', 'South Andaman'].map(toDistrict),
    chandigarh_ut: ['Chandigarh'].map(toDistrict),
    dnh_dd: ['Dadra and Nagar Haveli', 'Daman', 'Diu'].map(toDistrict),
    delhi: [
      'Central Delhi', 'East Delhi', 'New Delhi', 'North Delhi', 'North East Delhi', 'North West Delhi',
      'Shahdara', 'South Delhi', 'South East Delhi', 'South West Delhi', 'West Delhi',
    ].map(toDistrict),
    jammu_kashmir: [
      'Anantnag', 'Bandipora', 'Baramulla', 'Budgam', 'Doda', 'Ganderbal', 'Jammu', 'Kathua',
      'Kishtwar', 'Kulgam', 'Kupwara', 'Poonch', 'Pulwama', 'Rajouri', 'Ramban', 'Reasi', 'Samba',
      'Shopian', 'Srinagar', 'Udhampur',
    ].map(toDistrict),
    ladakh: ['Kargil', 'Leh'].map(toDistrict),
    lakshadweep: ['Lakshadweep'].map(toDistrict),
    puducherry: ['Karaikal', 'Mahe', 'Puducherry', 'Yanam'].map(toDistrict),
  },

  // Major cities/localities for the largest district(s) in each state/UT.
  // Extend with more district keys as your app needs finer granularity.
  cities: {
    visakhapatnam: cityList(['Visakhapatnam City', 'Gajuwaka', 'Madhurawada', 'Bheemunipatnam']),
    ntr: cityList(['Vijayawada', 'Gannavaram', 'Nandigama']),
    kolkata: cityList(['Kolkata City', 'South Kolkata', 'North Kolkata', 'Central Kolkata', 'East Kolkata', 'West Kolkata', 'New Town', 'Rajarhat']),
    north_24_parganas: cityList(['Barasat', 'Basirhat', 'Bangaon', 'Habra', 'Barrackpore', 'Kamarhati', 'Madhyamgram']),
    south_24_parganas: cityList(['Alipore', 'Diamond Harbour', 'Kakdwip', 'Canning', 'Baruipur']),
    howrah: cityList(['Howrah City', 'Bally', 'Uluberia', 'Shibpur']),
    hooghly: cityList(['Chinsurah', 'Serampore', 'Chandannagar', 'Bhadreswar', 'Bansberia']),
    mumbai_city: cityList(['Mumbai City Center', 'South Mumbai', 'Central Mumbai', 'West Mumbai']),
    mumbai_suburban: cityList(['Andheri', 'Bandra', 'Juhu', 'Vile Parle', 'Malad', 'Borivali']),
    pune: cityList(['Pune City', 'Pimpri', 'Chinchwad', 'Kothrud', 'Hinjewadi', 'Magarpatta']),
    nagpur: cityList(['Nagpur City', 'Dharampeth', 'Ramdaspeth', 'Sitabuldi']),
    nashik: cityList(['Nashik City', 'Panchavati', 'Satpur', 'Ambad']),
    bengaluru_urban: cityList(['Bengaluru City', 'Whitefield', 'Electronic City', 'Koramangala', 'Indiranagar', 'Jayanagar']),
    chennai: cityList(['Chennai City', 'T Nagar', 'Adyar', 'Anna Nagar', 'Velachery']),
    coimbatore: cityList(['Coimbatore City', 'Peelamedu', 'RS Puram', 'Saravanampatti']),
    hyderabad: cityList(['Hyderabad City', 'Secunderabad', 'Gachibowli', 'Banjara Hills', 'Kukatpally']),
    ahmedabad: cityList(['Ahmedabad City', 'Navrangpura', 'Bopal', 'Satellite', 'Vastrapur']),
    surat: cityList(['Surat City', 'Vesu', 'Adajan', 'Katargam']),
    thiruvananthapuram: cityList(['Thiruvananthapuram City', 'Kazhakkoottam', 'Neyyattinkara']),
    ernakulam: cityList(['Kochi', 'Aluva', 'Perumbavoor', 'Muvattupuzha']),
    lucknow: cityList(['Lucknow City', 'Gomti Nagar', 'Hazratganj', 'Alambagh']),
    kanpur_nagar: cityList(['Kanpur City', 'Kalyanpur', 'Panki']),
    agra: cityList(['Agra City', 'Sikandra', 'Kheragarh']),
    gautam_buddha_nagar: cityList(['Noida', 'Greater Noida']),
    jaipur: cityList(['Jaipur City', 'Malviya Nagar', 'Vaishali Nagar', 'Mansarovar']),
    patna: cityList(['Patna City', 'Boring Road', 'Kankarbagh', 'Danapur']),
    bhopal: cityList(['Bhopal City', 'Arera Colony', 'Kolar Road']),
    indore: cityList(['Indore City', 'Vijay Nagar', 'Rau']),
    raipur: cityList(['Raipur City', 'Shankar Nagar', 'Telibandha']),
    ranchi: cityList(['Ranchi City', 'Doranda', 'Harmu']),
    gurugram: cityList(['Gurugram City', 'Sohna Road', 'Sector 29', 'DLF Phase 1-5']),
    faridabad: cityList(['Faridabad City', 'Sector 15', 'Ballabgarh']),
    ludhiana: cityList(['Ludhiana City', 'Model Town', 'Sarabha Nagar']),
    amritsar: cityList(['Amritsar City', 'Ranjit Avenue']),
    dehradun: cityList(['Dehradun City', 'Rajpur Road', 'Clement Town']),
    guwahati_prefix_kamrup_metropolitan: cityList(['Guwahati City', 'Dispur', 'Paltan Bazaar']),
    bhubaneswar_prefix_khordha: cityList(['Bhubaneswar City', 'Patia', 'Chandrasekharpur']),
    panaji_prefix_north_goa: cityList(['Panaji', 'Mapusa']),
    shimla: cityList(['Shimla City', 'Mashobra']),
    srinagar: cityList(['Srinagar City', 'Rajbagh']),
    jammu: cityList(['Jammu City', 'Gandhi Nagar']),
    delhi_new_delhi: cityList(['New Delhi', 'Connaught Place', 'Chanakyapuri']),
    delhi_south_delhi: cityList(['South Delhi', 'Saket', 'Hauz Khas', 'Vasant Kunj']),
    delhi_west_delhi: cityList(['West Delhi', 'Rajouri Garden', 'Janakpuri']),
    puducherry: cityList(['Puducherry City', 'Ozhukarai']),
  },
};

// Helper utilities used only during construction of the objects above.
function toDistrict(name) {
  return { id: slugify(name), name };
}
function cityList(names) {
  return names.map((name) => ({ id: slugify(name), name }));
}
function slugify(name) {
  return name
    .toLowerCase()
    .replace(/[().]/g, '')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

// Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'authToken',
  USER_DATA: 'userData',
  USER_ROLE: 'userRole',
  USER_PREFERENCES: 'userPreferences',
  THEME: 'userTheme',
  LANGUAGE: 'userLanguage',
  LOCATION: 'userLocation',
  SAVED_ARTICLES: 'savedArticles',
  READING_HISTORY: 'readingHistory',
  SEARCH_HISTORY: 'searchHistory',
  NOTIFICATIONS: 'notifications',
  ONBOARDING_COMPLETED: 'onboardingCompleted',
};

// Firebase Collections
export const FIREBASE_COLLECTIONS = {
  USERS: 'users',
  CHANNELS: 'channels',
  ARTICLES: 'articles',
  VIDEOS: 'videos',
  LIVE: 'live',
  COMMENTS: 'comments',
  LIKES: 'likes',
  SUBSCRIPTIONS: 'subscriptions',
  NOTIFICATIONS: 'notifications',
};

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  ACCEPTED: 202,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
};

// Error Messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your internet connection.',
  SERVER_ERROR: 'Something went wrong on the server. Please try again later.',
  UNAUTHORIZED: 'You are not authorized to perform this action.',
  NOT_FOUND: 'The requested resource was not found.',
  VALIDATION_ERROR: 'Please check your input and try again.',
  EMAIL_IN_USE: 'This email is already registered.',
  INVALID_CREDENTIALS: 'Invalid email or password.',
  WEAK_PASSWORD: 'Password should be at least 6 characters.',
  EMAIL_NOT_VERIFIED: 'Please verify your email address first.',
  CHANNEL_NOT_FOUND: 'Channel not found.',
  ARTICLE_NOT_FOUND: 'Article not found.',
  VIDEO_NOT_FOUND: 'Video not found.',
  USER_NOT_FOUND: 'User not found.',
};

// Success Messages
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: 'Welcome back! You have successfully logged in.',
  REGISTER_SUCCESS: 'Account created successfully! Please verify your email.',
  LOGOUT_SUCCESS: 'You have been logged out successfully.',
  PASSWORD_RESET_SENT: 'Password reset link has been sent to your email.',
  EMAIL_VERIFIED: 'Email verified successfully!',
  CHANNEL_CREATED: 'Your channel has been created successfully!',
  ARTICLE_PUBLISHED: 'Your article has been published successfully!',
  VIDEO_UPLOADED: 'Your video has been uploaded successfully!',
  LIVE_STARTED: 'Your live stream has started!',
  SUBSCRIBED: 'You have subscribed to this channel.',
  UNSUBSCRIBED: 'You have unsubscribed from this channel.',
  LIKED: 'You liked this content.',
  UNLIKED: 'You unliked this content.',
  COMMENT_ADDED: 'Your comment has been added.',
  SAVED: 'Content saved successfully.',
  UNSAVED: 'Content unsaved.',
};

// Validation Patterns
export const VALIDATION_PATTERNS = {
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  PHONE: /^(\+?91)?[6-9]\d{9}$/,
  URL: /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/,
  PASSWORD: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{6,}$/,
  USERNAME: /^[a-zA-Z0-9_]{3,20}$/,
  PINCODE: /^[1-9][0-9]{5}$/,
};

// Image Constants
export const IMAGE_CONFIG = {
  MAX_WIDTH: 1920,
  MAX_HEIGHT: 1080,
  QUALITY: 0.8,
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  MAX_SIZE: 5 * 1024 * 1024, // 5MB
};

// Video Constants
export const VIDEO_CONFIG = {
  MAX_SIZE: 100 * 1024 * 1024, // 100MB
  ALLOWED_TYPES: ['video/mp4', 'video/mov', 'video/avi', 'video/mkv'],
  MAX_DURATION: 600, // 10 minutes in seconds
};

// Pagination Constants
export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
};

// Sort Options
export const SORT_OPTIONS = {
  LATEST: 'latest',
  OLDEST: 'oldest',
  POPULAR: 'popular',
  TRENDING: 'trending',
  TOP_RATED: 'top-rated',
};

// Notification Types
export const NOTIFICATION_TYPES = {
  NEW_ARTICLE: 'new_article',
  NEW_VIDEO: 'new_video',
  LIVE_STARTED: 'live_started',
  COMMENT: 'comment',
  LIKE: 'like',
  SUBSCRIPTION: 'subscription',
  FOLLOW: 'follow',
  MENTION: 'mention',
  SYSTEM: 'system',
};

// Permission Types
export const PERMISSIONS = {
  CAMERA: 'camera',
  PHOTOS: 'photos',
  VIDEOS: 'videos',
  LOCATION: 'location',
  NOTIFICATIONS: 'notifications',
  STORAGE: 'storage',
};

export default {
  APP_NAME,
  APP_VERSION,
  APP_DESCRIPTION,
  API_TIMEOUT,
  MAX_RETRY_ATTEMPTS,
  RETRY_DELAY,
  USER_ROLES,
  CONTENT_TYPES,
  CATEGORIES,
  LANGUAGES,
  LOCATIONS,
  STORAGE_KEYS,
  FIREBASE_COLLECTIONS,
  HTTP_STATUS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  VALIDATION_PATTERNS,
  IMAGE_CONFIG,
  VIDEO_CONFIG,
  PAGINATION,
  SORT_OPTIONS,
  NOTIFICATION_TYPES,
  PERMISSIONS,
};
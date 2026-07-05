import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, writeBatch, serverTimestamp } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB2cakCcL_jpyy2u5eG_fLXeW95zJ2PkpA",
  authDomain: "saravda-website.firebaseapp.com",
  projectId: "saravda-website",
  storageBucket: "saravda-website.firebasestorage.app",
  messagingSenderId: "145419407220",
  appId: "1:145419407220:web:2e1e399cb70b1c6d0da621",
  measurementId: "G-XR2LECN1D5"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const CAL_MONTHS = ['April','May','June','July','August','September','October','November','December','January','February','March'];

const CALENDAR_DEFAULT_DATA = {
  '2024-25': {
    Nursery:[
      {month:'April',name:'Orientation Day',type:'Nursery'},{month:'April',name:'Welcome Activity',type:'Nursery'},{month:'April',name:'Dance Activity',type:'Nursery'},
      {month:'May',name:'Pool Party',type:'Nursery'},{month:'May',name:'Yoga Activity',type:'Nursery'},
      {month:'July',name:'Plantation Programme',type:'Nursery'},{month:'July',name:'Paper Bag Making',type:'Nursery'},
      {month:'August',name:'Patriotic Theme Programme',type:'Nursery'},
      {month:'September',name:'Clay Activity',type:'Nursery'},
      {month:'October',name:'Poster Making Activity',type:'Nursery'},{month:'October',name:'Fireless Cooking Activity',type:'Nursery'},{month:'October',name:'Diya / Candle Decoration',type:'Nursery'},
      {month:'November',name:'Colouring / Drawing Competition',type:'Nursery'},{month:'November',name:'Fun Games',type:'Nursery'},
      {month:'December',name:'English Writing Competition',type:'Nursery'},{month:'December',name:'Nature Walk',type:'Nursery'},
      {month:'January',name:'Hindi Writing Competition',type:'Nursery'},
      {month:'February',name:'Show & Tell Competition',type:'Nursery'},
    ],
    Primary:[
      {month:'April',name:'Earth Day – Card Making',type:'Primary'},{month:'May',name:"Mother's Day – Card Making",type:'Primary'},
      {month:'May',name:'Writing Competition (I,II)',type:'Primary'},{month:'May',name:'Essay Writing (III-V)',type:'Primary'},
      {month:'June',name:'Environmental Day / Yoga Day / Fathers Day',type:'Primary'},
      {month:'July',name:'Van Mahotsava – Plantation',type:'Primary'},{month:'July',name:'Clay Modelling (I,II)',type:'Primary'},{month:'July',name:'Air Dry Clay (III-V)',type:'Primary'},{month:'July',name:'Science Exhibition (IV,V)',type:'Primary'},
      {month:'August',name:'Fancy Dress – Independence Day (I,II)',type:'Primary'},{month:'August',name:'Presentation (III-V)',type:'Primary'},
      {month:'September',name:"Teachers' Day – Poster Making",type:'Primary'},{month:'September',name:'Kavita Vachan (I,II)',type:'Primary'},{month:'September',name:'Hindi Diwas (III-V)',type:'Primary'},
      {month:'October',name:'Swachh Bharat – Gandhi Jayanti',type:'Primary'},{month:'October',name:'Puppet Making (I-III)',type:'Primary'},{month:'October',name:'Rangoli (IV,V)',type:'Primary'},{month:'October',name:'G.K. Quiz (III-V)',type:'Primary'},
      {month:'November',name:"Children's Day",type:'Primary'},{month:'November',name:'Maths Activity (I,II)',type:'Primary'},{month:'November',name:'Maths Exhibition (III-V)',type:'Primary'},
      {month:'December',name:'Sports Day (I-V)',type:'Primary'},{month:'December',name:'Christmas',type:'Primary'},
      {month:'January',name:'Flag / Kite Making – Republic Day',type:'Primary'},{month:'January',name:'Story Telling (I,II)',type:'Primary'},{month:'January',name:'Road Safety / Debate (III-V)',type:'Primary'},
      {month:'February',name:'Basant Panchmi',type:'Primary'},
    ],
    Secondary:[
      {month:'April',name:'Hindi Class Activity Quiz (VI,VII)',type:'Secondary'},{month:'April',name:'Hindi Slogan Writing (VIII-X)',type:'Secondary'},
      {month:'May',name:'Drawing Activity',type:'Secondary'},
      {month:'July',name:'Maths 3D Shapes',type:'Secondary'},{month:'July',name:'I.T. Activity',type:'Secondary'},
      {month:'August',name:'English Role-play / Poem / Debate',type:'Secondary'},
      {month:'September',name:'Hindi Diwas',type:'Secondary'},
      {month:'October',name:'Social Study – Working in Parliament (VI-VIII)',type:'Secondary'},
      {month:'November',name:'Maths / Science Exhibition (VI-X)',type:'Secondary'},
      {month:'December',name:'G-20 Summit (IX-X)',type:'Secondary'},{month:'December',name:'Kala Utsav – Music Activity',type:'Secondary'},{month:'December',name:'Sports Day',type:'Secondary'},
      {month:'January',name:'Career Counselling / Interview Session (IX-X)',type:'Secondary'},
      {month:'February',name:'Sanskrit Activity (VI-VIII)',type:'Secondary'},
    ],
    PTM:[
      {month:'May',name:'PTM',type:'PTM'},{month:'August',name:'PTM',type:'PTM'},{month:'October',name:'PTM',type:'PTM'},{month:'December',name:'PTM',type:'PTM'},{month:'January',name:'PTM',type:'PTM'},
    ],
    Exam:[
      {month:'July',name:'FA-1 (Nursery)',type:'Exam'},{month:'July',name:'PT-1 (Primary/Secondary)',type:'Exam'},
      {month:'September',name:'SA-1 (Nursery) / Term-1 (Secondary)',type:'Exam'},
      {month:'December',name:'FA-2 (Nursery) / PT-2 (Primary/Secondary)',type:'Exam'},
      {month:'February',name:'SA-2 (Nursery) / Term-2 (Secondary)',type:'Exam'},
    ],
    Festival:[
      {month:'August',name:'Rakhi Celebration / Janmashtami',type:'Festival'},
      {month:'October',name:'Dussehra / Diwali',type:'Festival'},
      {month:'December',name:'Christmas',type:'Festival'},
      {month:'February',name:'Basant Panchami',type:'Festival'},
    ]
  },
  '2025-26': {
    Nursery:[
      {month:'April',name:'Orientation – New Beginnings',type:'Nursery'},{month:'April',name:'Welcome Activity (Games & Intro)',type:'Nursery'},{month:'April',name:'Handprint Art',type:'Nursery'},{month:'April',name:'Earth Day – Planting Seeds',type:'Nursery'},
      {month:'May',name:'Water Play Day – Summer Fun',type:'Nursery'},{month:'May',name:'Hand Wash Activity',type:'Nursery'},{month:'May',name:'Fruit Salad Making',type:'Nursery'},
      {month:'July',name:'Animal Mask Making',type:'Nursery'},{month:'July',name:'Story Time – Animal Tales',type:'Nursery'},
      {month:'August',name:'Independence Day – Flag Making',type:'Nursery'},{month:'August',name:'Fancy Dress – National Heroes',type:'Nursery'},{month:'August',name:'Cultural Dance',type:'Nursery'},
      {month:'September',name:'Rainy Day Fun – Umbrella Act',type:'Nursery'},{month:'September',name:'Leaf Collection / Leaf Printing',type:'Nursery'},{month:'September',name:'Singing – Rain, Rain Go Away',type:'Nursery'},
      {month:'October',name:'Dussehra – Puppet Making',type:'Nursery'},{month:'October',name:'Diwali – Diya Decoration',type:'Nursery'},{month:'October',name:'Class Party with Cultural Performances',type:'Nursery'},
      {month:'November',name:'Role Play – Dress as Community Helper',type:'Nursery'},{month:'November',name:"Children's Day Fun",type:'Nursery'},
      {month:'December',name:'Winter Themed Craft',type:'Nursery'},{month:'December',name:'Annual Sports Day',type:'Nursery'},{month:'December',name:'Christmas Tree Decoration',type:'Nursery'},{month:'December',name:'Class Christmas Party',type:'Nursery'},
      {month:'January',name:'Republic Day – Tricolour Badge Making',type:'Nursery'},{month:'January',name:"Collage on 'My Country'",type:'Nursery'},{month:'January',name:'Cultural Dance / Parade',type:'Nursery'},
      {month:'February',name:'Card Making for Friends',type:'Nursery'},{month:'February',name:'Thanking Teachers',type:'Nursery'},
      {month:'March',name:'Holi Celebration – Safe Colour Play',type:'Nursery'},{month:'March',name:'End of Year Party',type:'Nursery'},
    ],
    Primary:[
      {month:'April',name:'Earth Day – Card & Poster Making',type:'Primary'},
      {month:'May',name:"Mother's Day – Card Making",type:'Primary'},{month:'May',name:'Poem Recitation – Mother\'s Day (I,II)',type:'Primary'},{month:'May',name:'Essay Writing (III-V)',type:'Primary'},
      {month:'June',name:'Environmental Day / Yoga Day / Fathers Day',type:'Primary'},
      {month:'July',name:'Van Mahotsava – Plantation',type:'Primary'},{month:'July',name:'Clay Modelling (I,II)',type:'Primary'},{month:'July',name:'Air Dry Clay (III-V)',type:'Primary'},
      {month:'August',name:'Independence Day – Fancy Dress (I,II)',type:'Primary'},{month:'August',name:'Poem Recitation (III-V)',type:'Primary'},{month:'August',name:'Science Exhibition (III-V)',type:'Primary'},
      {month:'September',name:"Teacher's Day – Card Making",type:'Primary'},{month:'September',name:'Writing – English (I,II)',type:'Primary'},{month:'September',name:'Hindi Diwas – Doha, Chaupai (III-V)',type:'Primary'},
      {month:'October',name:'Swachh Bharat – Gandhi Jayanti',type:'Primary'},{month:'October',name:'Puppet Making / Paper Bag / Mask (I,II)',type:'Primary'},{month:'October',name:'Rangoli / Swachh Bharat Poster (III-V)',type:'Primary'},{month:'October',name:'G.K. Quiz (III-V)',type:'Primary'},
      {month:'November',name:"Children's Day",type:'Primary'},{month:'November',name:'Maths Exhibition (III-V)',type:'Primary'},
      {month:'December',name:'Sports Day + Drawing Comp (I-V)',type:'Primary'},{month:'December',name:'Christmas',type:'Primary'},{month:'December',name:'Flag Day – Card Making',type:'Primary'},
      {month:'January',name:'Flag / Kite Making – Republic Day',type:'Primary'},{month:'January',name:'New Year',type:'Primary'},{month:'January',name:'Story Telling / Role Play (I,II)',type:'Primary'},{month:'January',name:'Road Safety, Debate (III-V)',type:'Primary'},
      {month:'February',name:'Basant Panchami',type:'Primary'},
    ],
    Secondary:[
      {month:'April',name:'Hindi Class Activity Quiz (VI,VII)',type:'Secondary'},{month:'April',name:'Hindi Slogan – 15 Aug Writing (VIII-X)',type:'Secondary'},
      {month:'May',name:'Paper Craft (VI)',type:'Secondary'},{month:'May',name:'Tissue Paper / Straw Painting (VII)',type:'Secondary'},{month:'May',name:'Toothpaste Batik (VIII)',type:'Secondary'},
      {month:'July',name:'English Role Play (VI)',type:'Secondary'},{month:'August',name:'English Poem Recitation (VII)',type:'Secondary'},{month:'August',name:'English Declamation (VIII)',type:'Secondary'},{month:'August',name:'English Debate (IX-X)',type:'Secondary'},
      {month:'September',name:'Hindi Diwas – Speech, Nukkad Natak (VI-X)',type:'Secondary'},
      {month:'October',name:'I.T. Role Play – Computer Security (VI-VIII)',type:'Secondary'},{month:'October',name:'I.T. Debate or Quiz (VI)',type:'Secondary'},{month:'October',name:'I.T. Play (IX-X)',type:'Secondary'},
      {month:'November',name:'Science Exhibition (VI-X)',type:'Secondary'},{month:'November',name:'Social Studies – No Smoking Role Play (VI-VIII)',type:'Secondary'},{month:'November',name:'S.St Poverty/Women Empowerment Debate (IX-X)',type:'Secondary'},
      {month:'December',name:'Music – Dance Drama, Mahabharat (VII-VIII)',type:'Secondary'},{month:'December',name:'Sports Day',type:'Secondary'},
      {month:'January',name:'Maths – Solid Shapes / Quiz (VI-VIII)',type:'Secondary'},{month:'January',name:'Maths – Percentage & Interest Play (IX-X)',type:'Secondary'},
      {month:'February',name:'Sanskrit – Shlok, Samvad, Geet-Nritya (VI-VIII)',type:'Secondary'},
    ],
    PTM:[
      {month:'May',name:'PTM',type:'PTM'},{month:'August',name:'PTM',type:'PTM'},{month:'October',name:'PTM',type:'PTM'},{month:'December',name:'PTM',type:'PTM'},{month:'February',name:'PTM',type:'PTM'},
    ],
    Exam:[
      {month:'July',name:'PT-1',type:'Exam'},{month:'September',name:'Term-1 / SA-1',type:'Exam'},{month:'December',name:'PT-2',type:'Exam'},{month:'February',name:'Term-2 / SA-2 (Feb–Mar)',type:'Exam'},
    ],
    Festival:[
      {month:'August',name:'Rakhi Celebration / Janmashtami',type:'Festival'},
      {month:'October',name:'Dussehra / Diwali',type:'Festival'},
      {month:'December',name:'Christmas',type:'Festival'},
      {month:'February',name:'Basant Panchami',type:'Festival'},
    ]
  },
  '2026-27': {
    Nursery:[
      {month:'April',name:'Welcome Week – My Name, My Family',type:'Nursery'},{month:'April',name:'Finger Painting',type:'Nursery'},{month:'April',name:'Free Play & Classroom Rules',type:'Nursery'},
      {month:'May',name:'Colour Week Celebration',type:'Nursery'},{month:'May',name:'Ice-cream Craft',type:'Nursery'},{month:'May',name:'Waterplay Activity',type:'Nursery'},{month:'May',name:'Poem & Rhyme Recitation',type:'Nursery'},
      {month:'June',name:'Holiday Homework – Art & Craft',type:'Nursery'},{month:'June',name:'Show & Tell (Online)',type:'Nursery'},
      {month:'July',name:'Rainy Season Craft – Umbrella',type:'Nursery'},{month:'July',name:'Paper Tearing & Pasting',type:'Nursery'},{month:'July',name:'Plantation / Seed Sowing',type:'Nursery'},{month:'July',name:'Van Mahotsav',type:'Nursery'},
      {month:'August',name:'Independence Day Celebration',type:'Nursery'},{month:'August',name:'Tricolour Activity',type:'Nursery'},{month:'August',name:'Community Helpers Roleplay',type:'Nursery'},{month:'August',name:'Rakshabandhan Activity',type:'Nursery'},
      {month:'September',name:'Nutrition Day Activity',type:'Nursery'},{month:'September',name:'Healthy Food Collage',type:'Nursery'},{month:'September',name:'Cleanliness Drive',type:'Nursery'},{month:'September',name:"Grandparents' Day Celebration",type:'Nursery'},
      {month:'October',name:'Gandhi Jayanti Activity',type:'Nursery'},{month:'October',name:'Dussehra Craft',type:'Nursery'},{month:'October',name:'Diwali Decoration & Diya Making',type:'Nursery'},{month:'October',name:'Fire Safety Awareness',type:'Nursery'},
      {month:'November',name:"Children's Day Celebration",type:'Nursery'},{month:'November',name:'Fancy Dress Competition',type:'Nursery'},{month:'November',name:'Air Pollution Awareness',type:'Nursery'},{month:'November',name:'Christmas Celebration',type:'Nursery'},
      {month:'December',name:'Fun Activity',type:'Nursery'},{month:'December',name:'Colouring Competition',type:'Nursery'},{month:'December',name:'New Year Card Making',type:'Nursery'},
      {month:'January',name:'New Year Celebration',type:'Nursery'},{month:'January',name:'Lohri / Makar Sankranti Activity',type:'Nursery'},{month:'January',name:'Sports Day / Fun Races',type:'Nursery'},{month:'January',name:'Republic Day Celebration',type:'Nursery'},
      {month:'February',name:'Story Telling Activity',type:'Nursery'},{month:'February',name:'Rhyme & Recitation Competition',type:'Nursery'},{month:'February',name:'Art & Craft Exhibition',type:'Nursery'},
      {month:'March',name:'Recap & Reinforcement Activities',type:'Nursery'},{month:'March',name:'Annual Day Celebration',type:'Nursery'},{month:'March',name:'Graduation Ceremony (UKG)',type:'Nursery'},
    ],
    Primary:[
      {month:'April',name:'Hindi + English Writing Competition (I-V)',type:'Primary'},
      {month:'July',name:'Clay Modelling (I,II)',type:'Primary'},{month:'July',name:'Van Mahotsav – Poster Making (III-V)',type:'Primary'},
      {month:'August',name:'Fancy Dress (I,II)',type:'Primary'},{month:'August',name:'Poem Recitation / Presentation (III-V)',type:'Primary'},
      {month:'October',name:'Puppet Making (I,II)',type:'Primary'},{month:'October',name:'Role Play – Ramayan (III-V)',type:'Primary'},
      {month:'November',name:'Story Telling Competition (I,II)',type:'Primary'},{month:'November',name:'Debate Competition (III-V)',type:'Primary'},
      {month:'December',name:'Craft Competition (I,II)',type:'Primary'},{month:'December',name:'Waste Material Craft (III-V)',type:'Primary'},{month:'December',name:'G.K. Quiz (I-V)',type:'Primary'},
      {month:'January',name:'Road Safety Competition (I-III)',type:'Primary'},{month:'January',name:'Road Safety Rangoli (IV,V)',type:'Primary'},
    ],
    Secondary:[
      {month:'April',name:'Hindi Class Activity Quiz (VI,VII)',type:'Secondary'},{month:'April',name:'Hindi Slogan – 15 Aug (VIII-X)',type:'Secondary'},
      {month:'May',name:'Paper Craft (VI)',type:'Secondary'},{month:'May',name:'Tissue Paper / Straw Painting (VII)',type:'Secondary'},{month:'May',name:'Toothpaste Batik (VIII)',type:'Secondary'},
      {month:'July',name:'English Role Play (VI)',type:'Secondary'},{month:'August',name:'English Poem (VII)',type:'Secondary'},{month:'August',name:'English Declamation (VIII)',type:'Secondary'},{month:'August',name:'English Debate (IX-X)',type:'Secondary'},
      {month:'September',name:'Hindi Diwas – Speech, Nukkad Natak (VI-X)',type:'Secondary'},
    ],
    PTM:[
      {month:'May',name:'PTM',type:'PTM'},{month:'August',name:'PTM',type:'PTM'},{month:'October',name:'PTM',type:'PTM'},{month:'December',name:'PTM',type:'PTM'},{month:'February',name:'PTM',type:'PTM'},
    ],
    Exam:[
      {month:'July',name:'PT-1',type:'Exam'},{month:'September',name:'Term-1 / SA-1',type:'Exam'},{month:'December',name:'PT-2',type:'Exam'},{month:'February',name:'Term-2 / SA-2 (Feb–Mar)',type:'Exam'},
    ],
    Festival:[
      {month:'August',name:'Rakhi Celebration / Janmashtami',type:'Festival'},
      {month:'October',name:'Dussehra / Diwali',type:'Festival'},
      {month:'December',name:'Christmas',type:'Festival'},
      {month:'February',name:'Basant Panchami',type:'Festival'},
    ]
  }
};

function getMockDate(yearStr, monthStr, index) {
  const startYear = parseInt(yearStr.split('-')[0]);
  const monthIndex = CAL_MONTHS.indexOf(monthStr);
  if (monthIndex === -1) return `${startYear}-04-15`;
  
  const eventYear = monthIndex >= 9 ? startYear + 1 : startYear;
  let actualMonth;
  switch (monthStr) {
    case 'January': actualMonth = 1; break;
    case 'February': actualMonth = 2; break;
    case 'March': actualMonth = 3; break;
    case 'April': actualMonth = 4; break;
    case 'May': actualMonth = 5; break;
    case 'June': actualMonth = 6; break;
    case 'July': actualMonth = 7; break;
    case 'August': actualMonth = 8; break;
    case 'September': actualMonth = 9; break;
    case 'October': actualMonth = 10; break;
    case 'November': actualMonth = 11; break;
    case 'December': actualMonth = 12; break;
    default: actualMonth = 4;
  }
  
  const day = 5 + (index * 6) % 23;
  return `${eventYear}-${String(actualMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

function getMockNotes(name) {
  const n = name.toLowerCase();
  if (n.includes('orientation')) {
    return '1. Book primary school auditorium.\n2. Prepare print booklets for parents.\n3. Arrange catering/refreshments.\n4. Draft speech and slides.';
  }
  if (n.includes('exam') || n.includes('fa-') || n.includes('pt-') || n.includes('sa-') || n.includes('term-')) {
    return '1. Finalise syllabus with HODs.\n2. Print question papers securely.\n3. Assign invigilation duties to staff.\n4. Set up seating arrangements in rooms.';
  }
  if (n.includes('ptm')) {
    return '1. Send circular notifications to parents.\n2. Set up waiting areas with seating.\n3. Prepare student progress cards.\n4. Allocate classrooms to teachers.';
  }
  if (n.includes('sports')) {
    return '1. Inspect sports equipment & ground markings.\n2. Hire external sound systems & tents.\n3. Print participation certificates & buy trophies.\n4. Draft schedule of track events.';
  }
  if (n.includes('exhibition') || n.includes('maths') || n.includes('science')) {
    return '1. Arrange display tables & electrical outlets.\n2. Invite external judges.\n3. Draft project submission guidelines.\n4. Set up parent visitor routes.';
  }
  if (n.includes('independence') || n.includes('republic') || n.includes('celebration') || n.includes('festival') || n.includes('diwali') || n.includes('christmas')) {
    return '1. Standardise decorations & arrange materials.\n2. Schedule student practice for stage performances.\n3. Verify microphones & speakers with IT support.\n4. Order sweets/gifts for students.';
  }
  return '1. Coordinate scheduling with respective teachers.\n2. Put up details on the school notice board.\n3. Draft student circular.';
}

const CATEGORY_MAP = {
  Nursery: "Activity",
  Primary: "Activity",
  Secondary: "Activity",
  PTM: "PTM",
  Exam: "Exam",
  Festival: "Cultural"
};

const CLASS_MAP = {
  Nursery: "Nursery-KG",
  Primary: "Grade 1-5",
  Secondary: "Grade 6-10",
  PTM: "All",
  Exam: "All",
  Festival: "All"
};

async function run() {
  console.log("Starting Calendar Events Firestore Import...");
  console.log("Signing in anonymously...");
  await signInAnonymously(auth);
  console.log("Successfully authenticated.");

  // 1. Clear existing calendar entries to avoid duplicates
  console.log("Fetching existing events to clear...");
  const snap = await getDocs(collection(db, "calendar"));
  console.log(`Found ${snap.size} existing entries. Deleting...`);
  
  const deletePromises = snap.docs.map(d => deleteDoc(doc(db, "calendar", d.id)));
  await Promise.all(deletePromises);
  console.log("Firestore calendar collection successfully cleared.");

  // 2. Insert new flattened entries
  console.log("Formatting and importing new events...");
  let count = 0;
  for (const yearStr in CALENDAR_DEFAULT_DATA) {
    for (const wingStr in CALENDAR_DEFAULT_DATA[yearStr]) {
      const list = CALENDAR_DEFAULT_DATA[yearStr][wingStr];
      for (let idx = 0; idx < list.length; idx++) {
        const evt = list[idx];
        const dateVal = getMockDate(yearStr, evt.month, idx);
        const notesVal = getMockNotes(evt.name);
        const catVal = CATEGORY_MAP[evt.type] || "Event";
        const classVal = CLASS_MAP[evt.type] || "All";

        const payload = {
          title: evt.name,
          date: dateVal,
          endDate: dateVal,
          month: evt.month,
          category: catVal,
          description: notesVal,
          applicableClasses: classVal,
          coordinator: "Academic Coordinator",
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        };

        await addDoc(collection(db, "calendar"), payload);
        count++;
      }
    }
  }

  console.log(`Success! Successfully imported ${count} events into Firestore.`);
  process.exit(0);
}

run().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

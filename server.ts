import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

const db = new Database("barakah.db");

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS sections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    layout_type TEXT DEFAULT 'grid', -- 'grid' or 'list'
    display_order INTEGER DEFAULT 0,
    active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS section_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    section_id INTEGER,
    title TEXT,
    description TEXT,
    image_url TEXT,
    display_order INTEGER DEFAULT 0,
    FOREIGN KEY(section_id) REFERENCES sections(id) ON DELETE CASCADE
  );

  CREATE TABLE IF NOT EXISTS names_of_allah (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name_arabic TEXT,
    name_transliteration TEXT,
    meaning TEXT,
    benefit TEXT
  );

  CREATE TABLE IF NOT EXISTS qa (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    question TEXT,
    answer TEXT,
    status TEXT DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS resources (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    category TEXT,
    url TEXT
  );

  CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    date TEXT,
    location TEXT,
    description TEXT,
    image_url TEXT
  );

  CREATE TABLE IF NOT EXISTS daily_content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'ayah' or 'hadith'
    content TEXT,
    reference TEXT,
    active INTEGER DEFAULT 0
  );

  CREATE TABLE IF NOT EXISTS tasbih_presets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    target INTEGER DEFAULT 33
  );
`);

// Seed initial daily content if empty
const dailyContentCount = db.prepare("SELECT COUNT(*) as count FROM daily_content").get() as { count: number };
if (dailyContentCount.count === 0) {
  db.prepare("INSERT INTO daily_content (type, content, reference, active) VALUES (?, ?, ?, ?)").run('ayah', 'নিশ্চয় কষ্টের সাথেই স্বস্তি রয়েছে।', 'আল-কুরআন ৯৪:৬', 1);
  db.prepare("INSERT INTO daily_content (type, content, reference, active) VALUES (?, ?, ?, ?)").run('hadith', 'তোমাদের মধ্যে সেই ব্যক্তিই সর্বোত্তম যে কুরআন শেখে এবং অন্যকে শেখায়।', 'সহীহ বুখারী', 0);
}

// Seed initial tasbih presets if empty
const tasbihCount = db.prepare("SELECT COUNT(*) as count FROM tasbih_presets").get() as { count: number };
if (tasbihCount.count === 0) {
  db.prepare("INSERT INTO tasbih_presets (name, target) VALUES (?, ?)").run('সুবহানাল্লাহ', 33);
  db.prepare("INSERT INTO tasbih_presets (name, target) VALUES (?, ?)").run('আলহামদুলিল্লাহ', 33);
  db.prepare("INSERT INTO tasbih_presets (name, target) VALUES (?, ?)").run('আল্লাহু আকবার', 34);
}

// Seed Resources if empty
const resourcesCount = db.prepare("SELECT COUNT(*) as count FROM resources").get() as { count: number };
if (resourcesCount.count === 0) {
  const seedResources = [
    { title: 'রমজান প্রস্তুতি গাইড', category: 'রমজান', url: 'https://example.com/ramadan-guide.pdf' },
    { title: 'দৈনিক সকালের জিকির', category: 'দোয়া', url: 'https://example.com/adhkar.pdf' },
    { title: 'যাকাত সম্পর্কে ধারণা', category: 'ফিকহ', url: 'https://example.com/zakat.pdf' },
    { title: 'রাসূলুল্লাহ (সা.)-এর চরিত্র', category: 'নিবন্ধ', url: 'https://example.com/akhlaq.pdf' },
  ];
  const insertResource = db.prepare("INSERT INTO resources (title, category, url) VALUES (?, ?, ?)");
  seedResources.forEach(r => insertResource.run(r.title, r.category, r.url));
}

// Seed 99 Names if empty or incomplete
const namesCount = db.prepare("SELECT COUNT(*) as count FROM names_of_allah").get() as { count: number };
if (namesCount.count < 99) {
  // Clear existing to avoid duplicates if re-seeding
  db.prepare("DELETE FROM names_of_allah").run();
  const seedNames = [
    { arabic: "اللَّهُ", transliteration: "আল্লাহ", meaning: "একমাত্র উপাস্য", benefit: "আল্লাহর জিকির অন্তরে প্রশান্তি আনে।" },
    { arabic: "الرَّحْمَنُ", transliteration: "আর-রহমান", meaning: "পরম দয়ালু", benefit: "স্মরণশক্তি ও সচেতনতা বৃদ্ধি পায়।" },
    { arabic: "الرَّحِيمُ", transliteration: "আর-রাহীম", meaning: "অতিশয় দয়ালু", benefit: "শান্তি ও নিরাপত্তা লাভ হয়।" },
    { arabic: "الْمَلِكُ", transliteration: "আল-মালিক", meaning: "সর্বভৌম অধিপতি", benefit: "সম্মান ও মর্যাদা বৃদ্ধি পায়।" },
    { arabic: "الْقُدُّوسُ", transliteration: "আল-কুদুছ", meaning: "অতি পবিত্র", benefit: "অন্তর দুশ্চিন্তা থেকে মুক্ত হয়।" },
    { arabic: "السَّلَامُ", transliteration: "আস-সালাম", meaning: "শান্তি দাতা", benefit: "অসুস্থ ব্যক্তির আরোগ্য লাভে সাহায্য করে।" },
    { arabic: "الْمُؤْمِنُ", transliteration: "আল-মু'মিন", meaning: "নিরাপত্তা দানকারী", benefit: "শত্রুর অনিষ্ট থেকে রক্ষা করে।" },
    { arabic: "الْمُهَيْمِنُ", transliteration: "আল-মুহাইমিন", meaning: "রক্ষণাবেক্ষণকারী", benefit: "অন্তর ও বাহিরের নিরাপত্তা দান করে।" },
    { arabic: "الْعَزِيزُ", transliteration: "আল-আজিজ", meaning: "মহা পরাক্রমশালী", benefit: "অন্যের মুখাপেক্ষী হতে হয় না।" },
    { arabic: "الْجَبَّارُ", transliteration: "আল-জাব্বার", meaning: "মহাপ্রতাপশালী", benefit: "অত্যাচারীর হাত থেকে রক্ষা করে।" },
    { arabic: "الْمُتَكَبِّرُ", transliteration: "আল-মুতাকাব্বির", meaning: "সর্বশ্রেষ্ঠ", benefit: "সাফল্য ও বরকত দান করে।" },
    { arabic: "الْخَالِقُ", transliteration: "আল-খালিক", meaning: "সৃষ্টিকর্তা", benefit: "কঠিন কাজ সহজ করে দেয়।" },
    { arabic: "الْبَارِئُ", transliteration: "আল-বারী", meaning: "উদ্ভাবনকারী", benefit: "রোগ থেকে মুক্তি দান করে।" },
    { arabic: "الْمُصَوِّرُ", transliteration: "আল-মুছউয়্যির", meaning: "আকৃতি দানকারী", benefit: "সন্তান লাভের জন্য দোয়া কবুল হয়।" },
    { arabic: "الْغَفَّارُ", transliteration: "আল-গাফফার", meaning: "মহা ক্ষমাশীল", benefit: "গুনাহ মাফ হয়।" },
    { arabic: "الْقَهَّارُ", transliteration: "আল-কাহহার", meaning: "মহা দমনকারী", benefit: "দুনিয়ার মোহ থেকে মুক্তি দেয়।" },
    { arabic: "الْوَهَّابُ", transliteration: "আল-ওয়াহহাব", meaning: "মহা দাতা", benefit: "দারিদ্র্য দূর করে।" },
    { arabic: "الرَّزَّاقُ", transliteration: "আর-রাজ্জাক", meaning: "রিজিক দাতা", benefit: "রিজিকে বরকত দান করে।" },
    { arabic: "الْفَتَّاحُ", transliteration: "আল-ফাত্তাহ", meaning: "বিজয় দানকারী", benefit: "সাফল্যের পথ খুলে দেয়।" },
    { arabic: "الْعَلِيمُ", transliteration: "আল-আলীম", meaning: "সর্বজ্ঞ", benefit: "জ্ঞান ও প্রজ্ঞা বৃদ্ধি করে।" },
    { arabic: "الْقَابِضُ", transliteration: "আল-কাবিদ", meaning: "সংকোচনকারী", benefit: "ভয়-ভীতি থেকে রক্ষা করে।" },
    { arabic: "الْبَاسِطُ", transliteration: "আল-বাসিত", meaning: "সম্প্রসারণকারী", benefit: "রিজিক ও সুখ বৃদ্ধি করে।" },
    { arabic: "الْخَافِضُ", transliteration: "আল-খাফিদ", meaning: "অবনতকারী", benefit: "শত্রুর অনিষ্ট থেকে রক্ষা করে।" },
    { arabic: "الرَّافِعُ", transliteration: "আর-রাফি", meaning: "উন্নতকারী", benefit: "মর্যাদা ও সম্মান বৃদ্ধি করে।" },
    { arabic: "الْمُعِزُّ", transliteration: "আল-মুইজ্জ", meaning: "সম্মান দানকারী", benefit: "মানুষের চোখে সম্মান বৃদ্ধি পায়।" },
    { arabic: "الْمُذِلُّ", transliteration: "আল-মুজিল্ল", meaning: "অপমানকারী", benefit: "অহংকার থেকে রক্ষা করে।" },
    { arabic: "السَّمِيعُ", transliteration: "আস-সামি", meaning: "সর্বশ্রোতা", benefit: "দোয়া কবুল হওয়ার পথ প্রশস্ত করে।" },
    { arabic: "الْبَصِيرُ", transliteration: "আল-বাছীর", meaning: "সর্বদ্রষ্টা", benefit: "দৃষ্টিশক্তি ও অন্তর্দৃষ্টি বৃদ্ধি পায়।" },
    { arabic: "الْحَكَمُ", transliteration: "আল-হাকাম", meaning: "মহা বিচারক", benefit: "ন্যায়ের পথে অবিচল রাখে।" },
    { arabic: "الْعَدْلُ", transliteration: "আল-আদল", meaning: "মহা ন্যায়পরায়ণ", benefit: "বিচারের সময় সাহায্য করে।" },
    { arabic: "اللَّطِيفُ", transliteration: "আল-লাতীফ", meaning: "পরম সূক্ষ্মদর্শী", benefit: "কঠিন বিপদ থেকে উদ্ধার করে।" },
    { arabic: "الْخَبِيرُ", transliteration: "আল-খাবীর", meaning: "মহা সম্যক অবগত", benefit: "গোপন রহস্য উন্মোচিত হয়।" },
    { arabic: "الْحَلِيمُ", transliteration: "আল-হালীম", meaning: "মহা ধৈর্যশীল", benefit: "রাগ নিয়ন্ত্রণ করতে সাহায্য করে।" },
    { arabic: "الْعَظِيمُ", transliteration: "আল-আযীম", meaning: "মহা মহিমান্বিত", benefit: "ভয় ও আতঙ্ক দূর করে।" },
    { arabic: "الْغَفُورُ", transliteration: "আল-গাফুর", meaning: "মহা ক্ষমাশীল", benefit: "মানসিক প্রশান্তি দান করে।" },
    { arabic: "الشَّكُورُ", transliteration: "আশ-শাকুর", meaning: "মহা গুণগ্রাহী", benefit: "নেয়ামত বৃদ্ধি পায়।" },
    { arabic: "الْعَلِيُّ", transliteration: "আল-আলী", meaning: "মহা উন্নত", benefit: "উচ্চ মর্যাদা দান করে।" },
    { arabic: "الْكَبِيرُ", transliteration: "আল-কাবীর", meaning: "মহা বড়", benefit: "কাজে বরকত দান করে।" },
    { arabic: "الْحَفِيظُ", transliteration: "আল-হাফীয", meaning: "মহা রক্ষক", benefit: "বিপদ-আপদ থেকে রক্ষা করে।" },
    { arabic: "الْمُقِيتُ", transliteration: "আল-মুকীত", meaning: "মহা শক্তিদাতা", benefit: "ক্ষুধা ও অভাব থেকে মুক্তি দেয়।" },
    { arabic: "الْحَسِيبُ", transliteration: "আল-হাসীব", meaning: "মহা হিসাব গ্রহণকারী", benefit: "শত্রুর ভয় থেকে মুক্তি দেয়।" },
    { arabic: "الْجَلِيلُ", transliteration: "আল-জালীল", meaning: "মহা প্রতাপশালী", benefit: "ব্যক্তিত্ব ও গাম্ভীর্য বৃদ্ধি করে।" },
    { arabic: "الْكَرِيمُ", transliteration: "আল-কারীম", meaning: "মহা দয়ালু", benefit: "দুনিয়া ও আখেরাতে সম্মান দান করে।" },
    { arabic: "الرَّقِيبُ", transliteration: "আর-রাকীব", meaning: "মহা তত্ত্বাবধায়ক", benefit: "পরিবার ও সম্পদের নিরাপত্তা দেয়।" },
    { arabic: "الْمُجِيبُ", transliteration: "আল-মজীব", meaning: "মহা দোয়া কবুলকারী", benefit: "দোয়া দ্রুত কবুল হয়।" },
    { arabic: "الْوَاسِعُ", transliteration: "আল-ওয়াসি", meaning: "মহা অসীম", benefit: "রিজিকের অভাব দূর করে।" },
    { arabic: "الْحَكِيمُ", transliteration: "আল-হাকীম", meaning: "মহা প্রজ্ঞাময়", benefit: "কাজে প্রজ্ঞা ও কৌশল দান করে।" },
    { arabic: "الْوَدُودُ", transliteration: "আল-ওয়াদুদ", meaning: "মহা প্রেমময়", benefit: "মানুষের মধ্যে ভালোবাসা সৃষ্টি করে।" },
    { arabic: "الْمَجِيدُ", transliteration: "আল-মাজীদ", meaning: "মহা গৌরবময়", benefit: "যশ ও খ্যাতি বৃদ্ধি করে।" },
    { arabic: "الْبَاعِثُ", transliteration: "আল-বাইস", meaning: "মহা পুনরুত্থানকারী", benefit: "পরকালের ভয় অন্তরে জাগ্রত করে।" },
    { arabic: "الشَّهِيدُ", transliteration: "আশ-শাহীদ", meaning: "মহা সাক্ষী", benefit: "সন্তানকে অনুগত করে।" },
    { arabic: "الْحَقُّ", transliteration: "আল-হাক্ক", meaning: "মহা সত্য", benefit: "হারানো জিনিস ফিরে পেতে সাহায্য করে।" },
    { arabic: "الْوَكِيلُ", transliteration: "আল-ওয়াকীল", meaning: "মহা কর্মবিধায়ক", benefit: "বিপদে আল্লাহর ওপর ভরসা বাড়ায়।" },
    { arabic: "الْقَوِيُّ", transliteration: "আল-কাউয়্যি", meaning: "মহা শক্তিশালী", benefit: "শারীরিক ও মানসিক শক্তি দান করে।" },
    { arabic: "الْمَتِينُ", transliteration: "আল-মতীন", meaning: "মহা দৃঢ়", benefit: "কঠিন কাজে দৃঢ়তা দান করে।" },
    { arabic: "الْوَلِيُّ", transliteration: "আল-ওয়ালীয়", meaning: "মহা বন্ধু", benefit: "আল্লাহর নৈকট্য দান করে।" },
    { arabic: "الْحَمِيدُ", transliteration: "আল-হামীদ", meaning: "মহা প্রশংসিত", benefit: "চরিত্র সুন্দর করে।" },
    { arabic: "الْمُحْصِي", transliteration: "আল-মুহছী", meaning: "মহা হিসাব রক্ষক", benefit: "হিসাব নিকাশ সহজ করে।" },
    { arabic: "الْمُبْدِئُ", transliteration: "আল-মুবদী", meaning: "মহা আদি স্রষ্টা", benefit: "কাজে সফলতা দান করে।" },
    { arabic: "الْمُعِيدُ", transliteration: "আল-মুঈদ", meaning: "মহা প্রত্যাবর্তনকারী", benefit: "ভুলে যাওয়া জিনিস মনে করিয়ে দেয়।" },
    { arabic: "الْمُحْيِي", transliteration: "আল-মুহয়ী", meaning: "মহা জীবনদাতা", benefit: "কঠিন রোগ থেকে মুক্তি দেয়।" },
    { arabic: "الْمُمِيتُ", transliteration: "আল-মুমীত", meaning: "মহা মৃত্যু দাতা", benefit: "শত্রুর অনিষ্ট থেকে রক্ষা করে।" },
    { arabic: "الْحَيُّ", transliteration: "আল-হাইয়্য", meaning: "মহা চিরঞ্জীব", benefit: "দীর্ঘায়ু ও সুস্বাস্থ্য দান করে।" },
    { arabic: "الْقَيُّومُ", transliteration: "আল-কাইয়্যুম", meaning: "মহা স্বয়ংসম্পূর্ণ", benefit: "অলসতা দূর করে।" },
    { arabic: "الْوَاجِدُ", transliteration: "আল-ওয়াজিদ", meaning: "মহা প্রাপক", benefit: "মনের আশা পূরণ করে।" },
    { arabic: "الْمَاجِدُ", transliteration: "আল-মাজিদ", meaning: "মহা মহিমান্বিত", benefit: "অন্তর আলোকিত করে।" },
    { arabic: "الْوَاحِدُ", transliteration: "আল-ওয়াহিদ", meaning: "মহা এক", benefit: "একাকীত্বের ভয় দূর করে।" },
    { arabic: "الْأَحَدُ", transliteration: "আল-আহাদ", meaning: "মহা অদ্বিতীয়", benefit: "ইমান মজবুত করে।" },
    { arabic: "الصَّمَدُ", transliteration: "আছ-ছামাদ", meaning: "মহা অমুখাপেক্ষী", benefit: "কারো মুখাপেক্ষী হতে হয় না।" },
    { arabic: "الْقَادِرُ", transliteration: "আল-কাদির", meaning: "মহা ক্ষমতাধর", benefit: "অসাধ্য সাধন করতে সাহায্য করে।" },
    { arabic: "الْمُقْتَدِرُ", transliteration: "আল-মুকতাদির", meaning: "মহা প্রবল শক্তিশালী", benefit: "বিপদে ধৈর্য ধারণ করতে সাহায্য করে।" },
    { arabic: "الْمُقَدِّمُ", transliteration: "আল-মুকাদ্দিম", meaning: "মহা অগ্রগামীকারী", benefit: "বিপদে সাহস দান করে।" },
    { arabic: "الْمُؤَخِّرُ", transliteration: "আল-মুয়াখখির", meaning: "মহা বিলম্বকারী", benefit: "তওবা কবুল হতে সাহায্য করে।" },
    { arabic: "الْأَوَّلُ", transliteration: "আল-আউয়াল", meaning: "মহা আদি", benefit: "কাজে বরকত দান করে।" },
    { arabic: "الْآخِرُ", transliteration: "আল-আখির", meaning: "মহা অন্ত", benefit: "শেষ পরিণাম ভালো করে।" },
    { arabic: "الظَّاهِرُ", transliteration: "আজ-জাহির", meaning: "মহা প্রকাশ্য", benefit: "দৃষ্টিশক্তি প্রখর করে।" },
    { arabic: "الْبَاطِنُ", transliteration: "আল-বাতিন", meaning: "মহা গোপন", benefit: "অন্তরের নূর বৃদ্ধি করে।" },
    { arabic: "الْوَالِي", transliteration: "আল-ওয়ালী", meaning: "মহা অভিভাবক", benefit: "বিপদ থেকে রক্ষা করে।" },
    { arabic: "الْمُتَعَالِي", transliteration: "আল-মুতালী", meaning: "মহা সর্বোচ্চ", benefit: "মর্যাদা বৃদ্ধি করে।" },
    { arabic: "الْبَرُّ", transliteration: "আল-বারর", meaning: "মহা কল্যাণদাতা", benefit: "সন্তানকে নেককার করে।" },
    { arabic: "التَّوَّابُ", transliteration: "আত-তাওয়াব", meaning: "মহা তওবা কবুলকারী", benefit: "তওবা কবুল হয়।" },
    { arabic: "الْمُنْتَقِمُ", transliteration: "আল-মুনতাকিম", meaning: "মহা প্রতিশোধ গ্রহণকারী", benefit: "অত্যাচারীর হাত থেকে রক্ষা করে।" },
    { arabic: "الْعَفُوُّ", transliteration: "আল-আফুউ", meaning: "মহা ক্ষমাশীল", benefit: "গুনাহ মাফ হয়।" },
    { arabic: "الرَّؤُوفُ", transliteration: "আর-রউফ", meaning: "মহা দয়ালু", benefit: "সবার ভালোবাসা পাওয়া যায়।" },
    { arabic: "مَالِكُ الْمُلْكِ", transliteration: "মালিকুল মুলক", meaning: "মহা সার্বভৌম অধিপতি", benefit: "রিজিক ও সম্মানে বরকত হয়।" },
    { arabic: "ذُو الْجَلَالِ وَالْإِكْرَامِ", transliteration: "যুল জালালি ওয়াল ইকরম", meaning: "মহা মহিমাময় ও মহানুভব", benefit: "দোয়া কবুল হয়।" },
    { arabic: "الْمُقْسِطُ", transliteration: "আল-মুকসিত", meaning: "মহা ন্যায়পরায়ণ", benefit: "শয়তানের ওয়াসওয়াসা থেকে রক্ষা করে।" },
    { arabic: "الْجَامِعُ", transliteration: "আল-জামি", meaning: "মহা একত্রকারী", benefit: "হারানো জিনিস ফিরে পাওয়া যায়।" },
    { arabic: "الْغَنِيُّ", transliteration: "আল-গানিই", meaning: "মহা ধনী", benefit: "অভাব দূর হয়।" },
    { arabic: "الْمُغْنِي", transliteration: "আল-মুগনিই", meaning: "মহা অভাবমোচনকারী", benefit: "স্বাবলম্বী হওয়া যায়।" },
    { arabic: "الْمَانِعُ", transliteration: "আল-মানি", meaning: "মহা প্রতিরোধকারী", benefit: "বিপদ থেকে রক্ষা করে।" },
    { arabic: "الضَّارُّ", transliteration: "আদ-দারর", meaning: "মহা অনিষ্টকারী", benefit: "বিপদ থেকে শিক্ষা দেয়।" },
    { arabic: "النَّافِعُ", transliteration: "আন-নাফি", meaning: "মহা কল্যাণকারী", benefit: "কাজে সফলতা আসে।" },
    { arabic: "النُّورُ", transliteration: "আন-নূর", meaning: "মহা জ্যোতি", benefit: "অন্তর আলোকিত হয়।" },
    { arabic: "الْهَادِي", transliteration: "আল-হাদী", meaning: "মহা পথপ্রদর্শক", benefit: "সঠিক পথ দেখায়।" },
    { arabic: "الْبَدِيعُ", transliteration: "আল-বাদী", meaning: "মহা অপূর্ব স্রষ্টা", benefit: "দুশ্চিন্তা দূর হয়।" },
    { arabic: "الْبَاقِي", transliteration: "আল-বাকী", meaning: "মহা চিরস্থায়ী", benefit: "নেক আমল কবুল হয়।" },
    { arabic: "الْوَارِثُ", transliteration: "আল-ওয়ারিস", meaning: "মহা উত্তরাধিকারী", benefit: "দীর্ঘায়ু লাভ হয়।" },
    { arabic: "الرَّشِيدُ", transliteration: "আর-রাশীদ", meaning: "মহা সত্যপথ প্রদর্শক", benefit: "কাজে সঠিক সিদ্ধান্ত নেওয়া যায়।" },
    { arabic: "الصَّبُورُ", transliteration: "আছ-ছাবুর", meaning: "মহা ধৈর্যশীল", benefit: "বিপদে ধৈর্য ধরার শক্তি পায়।" },
  ];
  const insert = db.prepare("INSERT INTO names_of_allah (name_arabic, name_transliteration, meaning, benefit) VALUES (?, ?, ?, ?)");
  seedNames.forEach(n => insert.run(n.arabic, n.transliteration, n.meaning, n.benefit));
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/names", (req, res) => {
    const names = db.prepare("SELECT * FROM names_of_allah").all();
    res.json(names);
  });

  app.get("/api/sections", (req, res) => {
    const sections = db.prepare("SELECT * FROM sections WHERE active = 1 ORDER BY display_order ASC").all() as any[];
    const sectionsWithItems = sections.map(section => {
      const items = db.prepare("SELECT * FROM section_items WHERE section_id = ? ORDER BY display_order ASC").all(section.id);
      return { ...section, items };
    });
    res.json(sectionsWithItems);
  });

  app.post("/api/qa", (req, res) => {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Question is required" });
    db.prepare("INSERT INTO qa (question) VALUES (?)").run(question);
    res.json({ success: true });
  });

  app.get("/api/qa", (req, res) => {
    const questions = db.prepare("SELECT * FROM qa WHERE status = 'published'").all();
    res.json(questions);
  });

  app.get("/api/resources", (req, res) => {
    const resources = db.prepare("SELECT * FROM resources").all();
    res.json(resources);
  });

  // Events
  app.get("/api/events", (req, res) => {
    const events = db.prepare("SELECT * FROM events ORDER BY date ASC").all();
    res.json(events);
  });

  app.post("/api/admin/events", (req, res) => {
    const { title, date, location, description, image_url } = req.body;
    db.prepare("INSERT INTO events (title, date, location, description, image_url) VALUES (?, ?, ?, ?, ?)").run(title, date, location, description, image_url);
    res.json({ success: true });
  });

  app.delete("/api/admin/events/:id", (req, res) => {
    db.prepare("DELETE FROM events WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Daily Content
  app.get("/api/daily-content", (req, res) => {
    const content = db.prepare("SELECT * FROM daily_content WHERE active = 1 LIMIT 1").get();
    res.json(content || { type: 'ayah', content: 'নিশ্চয় কষ্টের সাথেই স্বস্তি রয়েছে।', reference: 'আল-কুরআন ৯৪:৬' });
  });

  app.get("/api/admin/daily-content", (req, res) => {
    const content = db.prepare("SELECT * FROM daily_content").all();
    res.json(content);
  });

  app.post("/api/admin/daily-content", (req, res) => {
    const { type, content, reference } = req.body;
    db.prepare("INSERT INTO daily_content (type, content, reference) VALUES (?, ?, ?)").run(type, content, reference);
    res.json({ success: true });
  });

  app.post("/api/admin/daily-content/activate", (req, res) => {
    const { id } = req.body;
    db.prepare("UPDATE daily_content SET active = 0").run();
    db.prepare("UPDATE daily_content SET active = 1 WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.delete("/api/admin/daily-content/:id", (req, res) => {
    db.prepare("DELETE FROM daily_content WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Tasbih Presets
  app.get("/api/tasbih-presets", (req, res) => {
    const presets = db.prepare("SELECT * FROM tasbih_presets").all();
    res.json(presets);
  });

  app.post("/api/admin/tasbih-presets", (req, res) => {
    const { name, target } = req.body;
    db.prepare("INSERT INTO tasbih_presets (name, target) VALUES (?, ?)").run(name, target);
    res.json({ success: true });
  });

  app.delete("/api/admin/tasbih-presets/:id", (req, res) => {
    db.prepare("DELETE FROM tasbih_presets WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Names of Allah Admin
  app.get("/api/admin/names", (req, res) => {
    const names = db.prepare("SELECT * FROM names_of_allah").all();
    res.json(names);
  });

  app.post("/api/admin/names", (req, res) => {
    const { name_arabic, name_transliteration, meaning, benefit } = req.body;
    db.prepare("INSERT INTO names_of_allah (name_arabic, name_transliteration, meaning, benefit) VALUES (?, ?, ?, ?)").run(name_arabic, name_transliteration, meaning, benefit);
    res.json({ success: true });
  });

  app.delete("/api/admin/names/:id", (req, res) => {
    db.prepare("DELETE FROM names_of_allah WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Admin Stats
  app.get("/api/admin/stats", (req, res) => {
    const stats = {
      questions: (db.prepare("SELECT COUNT(*) as count FROM qa").get() as any).count,
      pendingQuestions: (db.prepare("SELECT COUNT(*) as count FROM qa WHERE status = 'pending'").get() as any).count,
      resources: (db.prepare("SELECT COUNT(*) as count FROM resources").get() as any).count,
      sections: (db.prepare("SELECT COUNT(*) as count FROM sections").get() as any).count,
      events: (db.prepare("SELECT COUNT(*) as count FROM events").get() as any).count,
      names: (db.prepare("SELECT COUNT(*) as count FROM names_of_allah").get() as any).count,
    };
    res.json(stats);
  });

  app.get("/api/search", (req, res) => {
    const { q } = req.query;
    if (!q) return res.json({ names: [], resources: [], sections: [], qa: [] });

    const query = `%${q}%`;

    const names = db.prepare(`
      SELECT * FROM names_of_allah 
      WHERE name_arabic LIKE ? OR name_transliteration LIKE ? OR meaning LIKE ?
    `).all(query, query, query);

    const resources = db.prepare(`
      SELECT * FROM resources 
      WHERE title LIKE ? OR category LIKE ?
    `).all(query, query);

    const sectionItems = db.prepare(`
      SELECT si.*, s.title as section_title 
      FROM section_items si
      JOIN sections s ON si.section_id = s.id
      WHERE si.title LIKE ? OR si.description LIKE ?
    `).all(query, query);

    const qa = db.prepare(`
      SELECT * FROM qa 
      WHERE (question LIKE ? OR answer LIKE ?) AND status = 'published'
    `).all(query, query);

    res.json({ names, resources, sectionItems, qa });
  });

  // Admin Routes
  app.get("/api/admin/sections", (req, res) => {
    const sections = db.prepare("SELECT * FROM sections ORDER BY display_order ASC").all() as any[];
    const sectionsWithItems = sections.map(section => {
      const items = db.prepare("SELECT * FROM section_items WHERE section_id = ? ORDER BY display_order ASC").all(section.id);
      return { ...section, items };
    });
    res.json(sectionsWithItems);
  });

  app.post("/api/admin/sections", (req, res) => {
    const { title, layout_type, display_order } = req.body;
    const result = db.prepare("INSERT INTO sections (title, layout_type, display_order) VALUES (?, ?, ?)").run(title, layout_type || 'grid', display_order || 0);
    res.json({ success: true, id: result.lastInsertRowid });
  });

  app.post("/api/admin/sections/items", (req, res) => {
    const { section_id, title, description, image_url, display_order } = req.body;
    db.prepare("INSERT INTO section_items (section_id, title, description, image_url, display_order) VALUES (?, ?, ?, ?, ?)").run(section_id, title, description, image_url, display_order || 0);
    res.json({ success: true });
  });

  app.delete("/api/admin/sections/items/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM section_items WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.delete("/api/admin/sections/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM sections WHERE id = ?").run(id);
    res.json({ success: true });
  });

  app.post("/api/admin/resources", (req, res) => {
    const { title, category, url } = req.body;
    db.prepare("INSERT INTO resources (title, category, url) VALUES (?, ?, ?)").run(title, category, url);
    res.json({ success: true });
  });

  app.delete("/api/admin/resources/:id", (req, res) => {
    const { id } = req.params;
    db.prepare("DELETE FROM resources WHERE id = ?").run(id);
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(process.cwd(), "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(process.cwd(), "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Moon, 
  Sun, 
  Clock, 
  BookOpen, 
  CheckCircle2, 
  HelpCircle, 
  Download, 
  ChevronRight, 
  Menu, 
  X,
  Heart,
  Calendar,
  Settings,
  Compass,
  Activity,
  Video,
  List as ListIcon,
  LayoutGrid,
  Plus,
  Trash2,
  Search,
  User,
  Music,
  FileText,
  Play,
  Volume2,
  ChevronLeft,
  Library,
  Sparkles,
  Send,
  Bot,
  Shield,
  Zap,
  Home,
  Droplets,
  Sunrise,
  Sunset,
  Bed,
  Plane,
  Users,
  Baby,
  Stethoscope,
  AlertTriangle,
  Ghost,
  CloudRain,
  Book,
  Hand,
  Mic2,
  MapPin,
  Utensils,
  LogOut,
  Moon as MoonIcon
} from 'lucide-react';
import { GoogleGenAI } from "@google/genai";
import Markdown from 'react-markdown';
import { db } from './lib/db';

// --- Types ---
interface SectionItem {
  id: number;
  section_id: number;
  title: string;
  description: string;
  image_url: string;
  display_order: number;
}

interface DynamicSection {
  id: number;
  title: string;
  layout_type: 'grid' | 'list';
  display_order: number;
  items: SectionItem[];
}

interface NameOfAllah {
  id: number;
  name_arabic: string;
  name_transliteration: string;
  meaning: string;
  benefit: string;
}

interface QA {
  id: number;
  question: string;
  answer: string;
  status: string;
  created_at: string;
}

interface Resource {
  id: number;
  title: string;
  category: string;
  url: string;
}

interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  image_url: string;
}

interface DailyContent {
  id: number;
  type: 'ayah' | 'hadith';
  content: string;
  reference: string;
  active: number;
}

interface TasbihPreset {
  id: number;
  name: string;
  target: number;
}

interface Dua {
  id: number;
  category_id: number;
  title: string;
  arabic: string;
  transliteration: string;
  translation: string;
  reference?: string;
}

interface DuaCategory {
  id: number;
  title: string;
  icon: any;
  color: string;
}

interface AdminStats {
  questions: number;
  pendingQuestions: number;
  resources: number;
  sections: number;
  events: number;
  names: number;
}

// --- Components ---

const getTabularHijriDate = (date: Date) => {
  const calDate = new Date('2026-07-14');
  const calHijriDay = 29;
  const calHijriMonth = 1; // Muharram
  const calHijriYear = 1448;
  
  const diffTime = date.getTime() - calDate.getTime();
  let diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
  
  const monthLengths = [30, 29, 30, 29, 30, 29, 30, 29, 30, 29, 30, 29];
  const monthNames = [
    "মুহররম", "সফর", "রবিউল আউয়াল", "রবিউস সানি", "জুমাদাল উলা", "জুমাদাল আখিরাহ",
    "রজব", "শাবান", "রমজান", "শাওয়াল", "জিলকদ", "জিলহজ"
  ];
  
  let hDay = calHijriDay;
  let hMonth = calHijriMonth;
  let hYear = calHijriYear;
  
  if (diffDays > 0) {
    while (diffDays > 0) {
      const cycleYear = hYear % 30;
      const isLeap = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(cycleYear);
      let monthLength = monthLengths[hMonth - 1];
      if (hMonth === 12 && isLeap) {
        monthLength = 30;
      }
      
      hDay++;
      if (hDay > monthLength) {
        hDay = 1;
        hMonth++;
        if (hMonth > 12) {
          hMonth = 1;
          hYear++;
        }
      }
      diffDays--;
    }
  } else if (diffDays < 0) {
    while (diffDays < 0) {
      hDay--;
      if (hDay < 1) {
        hMonth--;
        if (hMonth < 1) {
          hMonth = 12;
          hYear--;
        }
        const cycleYear = hYear % 30;
        const isLeap = [2, 5, 7, 10, 13, 16, 18, 21, 24, 26, 29].includes(cycleYear);
        let monthLength = monthLengths[hMonth - 1];
        if (hMonth === 12 && isLeap) {
          monthLength = 30;
        }
        hDay = monthLength;
      }
      diffDays++;
    }
  }
  
  const toBnNum = (num: number) => {
    return num.toString().replace(/\d/g, d => "০১২৩৪৫৬৭৮৯"[parseInt(d)]);
  };
  
  return `${toBnNum(hDay)} ${monthNames[hMonth - 1]}, ${toBnNum(hYear)} হিজরী`;
};

const DateBar = () => {
  const [dates, setDates] = useState({
    gregorian: '',
    bengali: '',
    hijri: ''
  });

  useEffect(() => {
    const updateDates = () => {
      const now = new Date();
      
      // Gregorian in Bengali
      const greg = now.toLocaleDateString('bn-BD', { 
        weekday: 'long', 
        month: 'long', 
        day: 'numeric'
      });
      
      // Bengali Date using native Intl.DateTimeFormat
      let bngStr = '';
      try {
        const bnFormatter = new Intl.DateTimeFormat('bn-BD-u-ca-bengali', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        bngStr = bnFormatter.format(now);
      } catch (e) {
        const refDate = new Date('2026-03-09');
        const diffDays = Math.floor((now.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
        bngStr = `${24 + diffDays} ফাল্গুন, ১৪৩২`;
      }
      
      // Hijri Date using native Intl.DateTimeFormat or fallback
      let hijriStr = '';
      try {
        const hjFormatter = new Intl.DateTimeFormat('bn-BD-u-ca-islamic-umalqura', {
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
        hijriStr = hjFormatter.format(now);
        hijriStr = hijriStr.replace('যুগ', '').trim();
        if (!hijriStr.includes('হিজরী') && !hijriStr.includes('হিজরি')) {
          hijriStr += ' হিজরী';
        }
      } catch (e) {
        hijriStr = getTabularHijriDate(now);
      }

      setDates({
        gregorian: greg,
        bengali: bngStr,
        hijri: hijriStr
      });
    };

    updateDates();
    const timer = setInterval(updateDates, 3600000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="max-w-7xl mx-auto px-4 mt-24 -mb-16 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white/80 backdrop-blur-md rounded-2xl p-5 shadow-sm border border-emerald-900/5 flex justify-between items-center"
      >
        <div className="space-y-1">
          <div className="text-xs text-emerald-900/50 font-medium flex items-center gap-2">
            <span>{dates.gregorian}</span>
            <span className="w-1 h-1 bg-emerald-900/20 rounded-full"></span>
            <span>{dates.bengali}</span>
          </div>
          <div className="text-xl md:text-2xl font-serif text-emerald-900 font-bold">
            {dates.hijri}
          </div>
        </div>
        <div className="text-gold animate-pulse">
          <Sun className="w-8 h-8 md:w-10 md:h-10 fill-current opacity-80" />
        </div>
      </motion.div>
    </div>
  );
};

const Navbar = ({ onAdminClick, onHomeClick, onSearchClick, isAdmin }: { onAdminClick: () => void, onHomeClick: () => void, onSearchClick: () => void, isAdmin: boolean }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <nav className="fixed top-0 w-full z-50 glass border-b border-emerald-900/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={onHomeClick}>
            <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center">
              <span className="text-gold font-serif text-2xl">B</span>
            </div>
            <span className="text-2xl font-serif font-bold tracking-tight text-emerald-900">Barakah Islamic</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            {!isAdmin && ['হোম', 'প্ল্যানার', 'দোয়া', '৯৯ নাম', 'রিসোর্স', 'প্রশ্নোত্তর'].map((item, idx) => {
              const links = ['home', 'planner', 'duas', '99-names', 'resources', 'q&a'];
              return (
                <a key={item} href={`#${links[idx]}`} className="text-emerald-900/70 hover:text-emerald-900 font-medium transition-colors">
                  {item}
                </a>
              );
            })}
            <div className="flex items-center gap-4">
              <button 
                onClick={onSearchClick}
                className="text-emerald-900/50 hover:text-emerald-900 transition-colors p-2 hover:bg-emerald-900/5 rounded-full"
              >
                <Search className="w-5 h-5" />
              </button>
              <button className="text-emerald-900/50 hover:text-emerald-900 transition-colors p-2 hover:bg-emerald-900/5 rounded-full">
                <User className="w-5 h-5" />
              </button>
              <button 
                onClick={isAdmin ? onHomeClick : onAdminClick}
                className="bg-emerald-900 text-cream px-6 py-2 rounded-full font-medium hover:bg-emerald-800 transition-all flex items-center gap-2"
              >
                {isAdmin ? 'Exit Admin' : 'Admin'} <Settings className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="md:hidden flex items-center gap-2">
            <button onClick={onSearchClick} className="text-emerald-900 p-2"><Search className="w-5 h-5" /></button>
            <button onClick={() => setIsOpen(!isOpen)} className="text-emerald-900 p-2">
              {isOpen ? <X /> : <Menu />}
            </button>
          </div>
        </div>
      </div>
      
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden bg-cream border-b border-emerald-900/10 p-4 space-y-4"
          >
            {!isAdmin && ['হোম', 'প্ল্যানার', 'দোয়া', '৯৯ নাম', 'রিসোর্স', 'প্রশ্নোত্তর'].map((item, idx) => {
              const links = ['home', 'planner', 'duas', '99-names', 'resources', 'q&a'];
              return (
                <a key={item} href={`#${links[idx]}`} className="block text-emerald-900/70 hover:text-emerald-900 font-medium">
                  {item}
                </a>
              );
            })}
            <button 
              onClick={() => { onAdminClick(); setIsOpen(false); }}
              className="w-full text-left text-emerald-900 font-medium"
            >
              {isAdmin ? 'এডমিন থেকে বের হন' : 'এডমিন প্যানেল'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const ServiceGrid = ({ onTasbihClick, onQuranClick, onHadithClick, onQiblaClick, onMakkahClick }: { onTasbihClick: () => void, onQuranClick: () => void, onHadithClick: () => void, onQiblaClick: () => void, onMakkahClick: () => void }) => {
  const services = [
    { title: 'কুরআন', icon: BookOpen, color: 'bg-emerald-900/10 text-emerald-900', onClick: onQuranClick },
    { title: 'হাদিস', icon: Library, color: 'bg-gold/10 text-gold', onClick: onHadithClick },
    { title: 'তাসবিহ', icon: Activity, color: 'bg-emerald-900/10 text-emerald-900', onClick: onTasbihClick },
    { title: 'কিবলা', icon: Compass, color: 'bg-gold/10 text-gold', onClick: onQiblaClick },
    { title: 'লাইভ মক্কা', icon: Video, color: 'bg-emerald-900/10 text-emerald-900', onClick: onMakkahClick },
  ];

  return (
    <section className="pt-6 pb-12 px-4 bg-cream">
      <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-5 gap-6">
        {services.map((service) => (
          <motion.div 
            key={service.title}
            whileHover={{ y: -5 }}
            onClick={service.onClick}
            className="bg-white p-8 rounded-3xl border border-emerald-900/5 shadow-sm hover:shadow-md transition-all text-center cursor-pointer group"
          >
            <div className={`w-16 h-16 ${service.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
              <service.icon className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-serif text-emerald-900">{service.title}</h3>
          </motion.div>
        ))}
      </div>
    </section>
  );
};

const DynamicSections = () => {
  const [sections, setSections] = useState<DynamicSection[]>([]);

  useEffect(() => {
    db.getSections().then(setSections);
  }, []);

  return (
    <>
      {sections.map(section => (
        <section key={section.id} className="py-20 px-4">
          <div className="max-w-7xl mx-auto">
            <h2 className="text-4xl font-serif text-emerald-900 mb-12">{section.title}</h2>
            <div className={section.layout_type === 'grid' ? "grid md:grid-cols-3 gap-8" : "space-y-6"}>
              {section.items.map(item => (
                <div key={item.id} className={`bg-white rounded-3xl border border-emerald-900/5 shadow-sm overflow-hidden group hover:shadow-lg transition-all ${section.layout_type === 'list' ? 'flex items-center gap-8 p-4' : ''}`}>
                  {item.image_url && (
                    <div className={section.layout_type === 'grid' ? "aspect-video overflow-hidden" : "w-32 h-32 rounded-2xl overflow-hidden shrink-0"}>
                      <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" referrerPolicy="no-referrer" />
                    </div>
                  )}
                  <div className={section.layout_type === 'grid' ? "p-8" : "flex-1"}>
                    <h3 className="text-2xl font-serif text-emerald-900 mb-2">{item.title}</h3>
                    <p className="text-emerald-900/60 leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ))}
    </>
  );
};

const EventsSection = () => {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    db.getEvents().then(setEvents);
  }, []);

  if (events.length === 0) return null;

  return (
    <section id="events" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <span className="text-gold font-medium tracking-widest uppercase text-sm mb-4 block">কার্যক্রম</span>
            <h2 className="text-5xl font-serif text-emerald-900">আসন্ন ইভেন্টসমূহ</h2>
          </div>
        </div>
        <div className="grid md:grid-cols-3 gap-8">
          {events.map(event => (
            <div key={event.id} className="group cursor-pointer">
              <div className="aspect-[16/9] rounded-3xl overflow-hidden mb-6 relative">
                <img 
                  src={event.image_url || "https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&q=80&w=800"} 
                  alt={event.title} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute top-4 left-4 glass px-4 py-2 rounded-xl text-emerald-900 font-bold">
                  {event.date}
                </div>
              </div>
              <h3 className="text-2xl font-serif text-emerald-900 mb-2 group-hover:text-gold transition-colors">{event.title}</h3>
              <div className="flex items-center gap-2 text-emerald-900/50 text-sm mb-4">
                <Compass className="w-4 h-4" /> {event.location}
              </div>
              <p className="text-emerald-900/60 line-clamp-2">{event.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

const BarakahPlanner = () => {
  const [tasks, setTasks] = useState([
    { id: 1, text: 'ফজর নামাজ', completed: false },
    { id: 2, text: 'সকালের জিকির ও দোয়া', completed: false },
    { id: 3, text: '১ পৃষ্ঠা কুরআন তিলাওয়াত', completed: false },
    { id: 4, text: 'যোহর নামাজ', completed: false },
    { id: 5, text: 'আসর নামাজ', completed: false },
    { id: 6, text: 'মাগরিব নামাজ', completed: false },
    { id: 7, text: 'এশা নামাজ', completed: false },
    { id: 8, text: 'বিতর নামাজ', completed: false },
    { id: 9, text: 'সাদাকাহ (দান)', completed: false },
    { id: 10, text: 'তাহাজ্জুদ নামাজ (ঐচ্ছিক)', completed: false },
    { id: 11, text: 'ঘুমানোর আগের জিকির', completed: false },
  ]);

  const toggleTask = (id: number) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
  };

  return (
    <section id="planner" className="py-20 bg-emerald-950 text-cream overflow-hidden relative">
      <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-900/20 blur-3xl rounded-full -mr-48 -mt-48"></div>
      <div className="max-w-7xl mx-auto px-4 grid md:grid-cols-2 gap-16 items-center">
        <div className="order-2 md:order-1">
          <div className="glass p-8 rounded-3xl border-emerald-800">
            <h3 className="text-2xl font-serif mb-6 flex items-center gap-2">
              <Calendar className="text-gold" /> দৈনিক বারাকাহ চেকলিস্ট
            </h3>
            <div className="space-y-4">
              {tasks.map(task => (
                <div 
                  key={task.id} 
                  onClick={() => toggleTask(task.id)}
                  className={`flex items-center gap-4 p-4 rounded-xl cursor-pointer transition-all ${task.completed ? 'bg-emerald-900/50 opacity-60' : 'bg-white/5 hover:bg-white/10'}`}
                >
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${task.completed ? 'bg-gold border-gold' : 'border-white/20'}`}>
                    {task.completed && <CheckCircle2 className="w-4 h-4 text-emerald-950" />}
                  </div>
                  <span className={`text-lg ${task.completed ? 'line-through' : ''}`}>{task.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="order-1 md:order-2">
          <span className="text-gold font-medium tracking-widest uppercase text-sm mb-4 block">উৎপাদনশীলতা</span>
          <h2 className="text-5xl font-serif mb-6">বারাকাহ প্ল্যানার</h2>
          <p className="text-lg text-cream/70 mb-8">
            আপনার দৈনন্দিন আধ্যাত্মিক লক্ষ্যগুলো ট্র্যাক করুন এবং নিয়মিত অভ্যাস গড়ে তুলুন। আমাদের প্ল্যানার আপনাকে সারাদিন নামাজ, জিকির এবং ভালো কাজের প্রতি মনোযোগী হতে সাহায্য করবে।
          </p>
          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-white/5 rounded-2xl">
              <div className="text-3xl font-serif text-gold mb-1">৮৫%</div>
              <div className="text-sm text-cream/50 uppercase tracking-wider">ধারাবাহিকতার হার</div>
            </div>
            <div className="p-6 bg-white/5 rounded-2xl">
              <div className="text-3xl font-serif text-gold mb-1">১২</div>
              <div className="text-sm text-cream/50 uppercase tracking-wider">দিনের ধারাবাহিকতা</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const NamesOfAllahSection = () => {
  const [names, setNames] = useState<NameOfAllah[]>([]);
  const [selectedName, setSelectedName] = useState<NameOfAllah | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    db.getNames().then(setNames);
  }, []);

  const displayedNames = showAll ? names : names.slice(0, 12);

  return (
    <section id="99-names" className="py-24 px-4 bg-cream relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-900/5 rounded-full -translate-x-1/2 -translate-y-1/2 blur-3xl" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-gold/5 rounded-full translate-x-1/3 translate-y-1/3 blur-3xl" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-gold font-bold tracking-widest uppercase text-sm mb-4 block"
          >
            আসমাউল হুসনা
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-serif text-emerald-900 mb-6"
          >
            আল্লাহর ৯৯টি নাম
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-emerald-900/60 max-w-2xl mx-auto text-lg"
          >
            মহান আল্লাহর সুন্দর নাম ও গুণাবলী অন্বেষণ করুন। প্রতিটি নামের গভীরে রয়েছে অসীম জ্ঞান ও আধ্যাত্মিক প্রশান্তি।
          </motion.p>
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          <AnimatePresence mode="popLayout">
            {displayedNames.map((name, index) => (
              <motion.div 
                key={name.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.03 }}
                whileHover={{ y: -8, boxShadow: "0 20px 25px -5px rgb(0 0 0 / 0.1)" }}
                onClick={() => setSelectedName(name)}
                className="bg-white p-8 rounded-3xl border border-emerald-900/5 shadow-sm hover:border-gold/30 transition-all cursor-pointer text-center group relative overflow-hidden"
              >
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-gold/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="text-4xl font-serif text-emerald-900 mb-4 group-hover:text-gold transition-colors duration-300">{name.name_arabic}</div>
                <div className="text-sm font-bold text-emerald-900/80 mb-1 tracking-wide">{name.name_transliteration}</div>
                <div className="text-xs text-emerald-900/40 italic line-clamp-1">{name.meaning}</div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {names.length > 12 && (
          <div className="mt-16 text-center">
            <button 
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 bg-emerald-900 text-cream px-10 py-4 rounded-full font-bold shadow-xl shadow-emerald-900/20 hover:bg-emerald-800 transition-all hover:scale-105 active:scale-95"
            >
              {showAll ? 'কম দেখুন' : 'সবগুলো নাম দেখুন'}
              <ChevronRight className={`w-5 h-5 transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedName && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedName(null)}
              className="absolute inset-0 bg-emerald-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ y: 100, opacity: 0, scale: 0.9 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 100, opacity: 0, scale: 0.9 }}
              className="relative bg-cream w-full max-w-xl rounded-[2.5rem] p-10 shadow-2xl overflow-hidden border border-white/20"
            >
              <div className="absolute top-0 right-0 p-6">
                <button 
                  onClick={() => setSelectedName(null)} 
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-emerald-900/5 text-emerald-900 hover:bg-emerald-900 hover:text-white transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="text-center">
                <motion.div 
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, type: "spring" }}
                  className="text-8xl font-serif text-emerald-900 mb-6 drop-shadow-sm"
                >
                  {selectedName.name_arabic}
                </motion.div>
                <h3 className="text-3xl font-serif text-gold mb-3">{selectedName.name_transliteration}</h3>
                <div className="text-xl text-emerald-900/60 italic mb-8 font-serif">
                  "{selectedName.meaning}"
                </div>
                
                <div className="space-y-6">
                  <div className="bg-emerald-900/5 p-8 rounded-[2rem] text-left border border-emerald-900/10 relative group">
                    <div className="absolute -top-3 left-8 bg-gold text-emerald-950 text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1 rounded-full">
                      আধ্যাত্মিক উপকারিতা
                    </div>
                    <p className="text-emerald-900/80 leading-relaxed text-lg">
                      {selectedName.benefit}
                    </p>
                  </div>
                  
                  <button 
                    onClick={() => setSelectedName(null)}
                    className="w-full py-4 rounded-2xl bg-emerald-900 text-cream font-bold hover:bg-emerald-800 transition-colors"
                  >
                    বন্ধ করুন
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </section>
  );
};

const ResourceLibrary = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filter, setFilter] = useState('সব');

  useEffect(() => {
    db.getResources().then(setResources);
  }, []);

  const filteredResources = filter === 'সব' 
    ? resources 
    : resources.filter(r => r.category === filter);

  return (
    <section id="resources" className="py-20 px-4 bg-emerald-900/5">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-6">
          <div>
            <h2 className="text-5xl font-serif text-emerald-900 mb-4">রিসোর্স লাইব্রেরি</h2>
            <p className="text-emerald-900/60">নির্ভরযোগ্য গাইড, নিবন্ধ এবং শিক্ষামূলক উপকরণ ডাউনলোড করুন।</p>
          </div>
          <div className="flex gap-2">
            {['সব', 'রমজান', 'দোয়া', 'ফিকহ', 'নিবন্ধ'].map(cat => (
              <button 
                key={cat} 
                onClick={() => setFilter(cat)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${filter === cat ? 'bg-emerald-900 text-cream' : 'bg-white text-emerald-900 hover:bg-emerald-900/10'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {filteredResources.map(res => (
            <div key={res.id} className="bg-white p-6 rounded-2xl shadow-sm border border-emerald-900/5 hover:shadow-md transition-all group">
              <div className="w-12 h-12 bg-emerald-900/5 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-900 group-hover:text-cream transition-all">
                <BookOpen className="w-6 h-6" />
              </div>
              <div className="text-xs font-bold text-gold uppercase tracking-wider mb-2">{res.category}</div>
              <h3 className="text-xl font-serif text-emerald-900 mb-4">{res.title}</h3>
              <div className="flex justify-between items-center">
                <span className="text-xs text-emerald-900/40">পিডিএফ / লিঙ্ক</span>
                <a 
                  href={res.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-emerald-900 font-bold text-sm hover:text-gold transition-colors"
                >
                  প্রবেশ করুন <Download className="w-4 h-4" />
                </a>
              </div>
            </div>
          ))}
          {filteredResources.length === 0 && (
            <div className="col-span-full text-center py-20 text-emerald-900/40">
              এই ক্যাটাগরিতে কোনো রিসোর্স পাওয়া যায়নি।
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

const AskScholar = () => {
  const [question, setQuestion] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!question) return;
    db.addQuestion(question).then(() => {
      setSubmitted(true);
      setQuestion('');
    });
  };

  return (
    <section id="q&a" className="py-20 px-4">
      <div className="max-w-3xl mx-auto text-center">
        <div className="inline-flex p-3 bg-gold/10 rounded-2xl mb-6">
          <HelpCircle className="text-gold w-8 h-8" />
        </div>
        <h2 className="text-5xl font-serif text-emerald-900 mb-6">আলেমকে জিজ্ঞাসা করুন</h2>
        <p className="text-emerald-900/60 mb-10">বিশ্বাস, আমল বা দৈনন্দিন জীবন সম্পর্কে কোনো প্রশ্ন আছে? আপনার প্রশ্নটি বেনামে জমা দিন এবং আমাদের আলেমগণ নির্ভরযোগ্য উত্তর প্রদান করবেন।</p>
        
        {submitted ? (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-emerald-900/5 p-8 rounded-3xl border border-emerald-900/10"
          >
            <CheckCircle2 className="w-12 h-12 text-emerald-900 mx-auto mb-4" />
            <h3 className="text-2xl font-serif text-emerald-900 mb-2">প্রশ্ন জমা দেওয়া হয়েছে</h3>
            <p className="text-emerald-900/60">আপনার প্রশ্নের জন্য ধন্যবাদ। এটি পর্যালোচনার জন্য আমাদের আলেমদের কাছে পাঠানো হয়েছে। উত্তরের জন্য শীঘ্রই আবার চেক করুন।</p>
            <button onClick={() => setSubmitted(false)} className="mt-6 text-emerald-900 font-bold underline">আরেকটি প্রশ্ন জমা দিন</button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="relative">
            <textarea 
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="আপনার প্রশ্ন এখানে লিখুন..."
              className="w-full h-48 p-8 rounded-3xl bg-emerald-900/5 border border-emerald-900/10 focus:outline-none focus:ring-2 focus:ring-emerald-900/20 text-lg resize-none"
            />
            <button 
              type="submit"
              className="absolute bottom-6 right-6 bg-emerald-900 text-cream px-8 py-3 rounded-full font-medium flex items-center gap-2 hover:bg-emerald-800 transition-all"
            >
              প্রশ্ন জমা দিন <ChevronRight className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>
    </section>
  );
};

const Footer = () => (
  <footer className="bg-emerald-950 text-cream pt-20 pb-10 px-4">
    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
      <div className="col-span-2">
        <div className="flex items-center gap-2 mb-6">
          <div className="w-10 h-10 bg-emerald-900 rounded-lg flex items-center justify-center">
            <span className="text-gold font-serif text-2xl">B</span>
          </div>
          <span className="text-2xl font-serif font-bold tracking-tight">বারাকাহ ইসলামিক</span>
        </div>
        <p className="text-cream/50 max-w-sm leading-relaxed">
          আধুনিক প্রযুক্তি এবং নির্ভরযোগ্য ইসলামিক জ্ঞানের মাধ্যমে আধ্যাত্মিক বৃদ্ধি এবং সচেতনতা প্রচার করা। আমাদের জ্ঞান অন্বেষণকারীদের সম্প্রদায়ে যোগ দিন।
        </p>
      </div>
      <div>
        <h4 className="font-serif text-xl mb-6">দ্রুত লিঙ্ক</h4>
        <ul className="space-y-4 text-cream/60">
          <li><a href="#" className="hover:text-gold transition-colors">হোম</a></li>
          <li><a href="#planner" className="hover:text-gold transition-colors">প্ল্যানার</a></li>
          <li><a href="#99-names" className="hover:text-gold transition-colors">৯৯ নাম</a></li>
          <li><a href="#resources" className="hover:text-gold transition-colors">রিসোর্স</a></li>
        </ul>
      </div>
      <div>
        <h4 className="font-serif text-xl mb-6">যোগাযোগ</h4>
        <ul className="space-y-4 text-cream/60">
          <li>barakahislamic623@gmail.com</li>
          <li>ঢাকা, বাংলাদেশ</li>
        </ul>
      </div>
    </div>
    <div className="max-w-7xl mx-auto pt-10 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 text-cream/40 text-sm">
      <p>© ২০২৬ বারাকাহ ইসলামিক। সর্বস্বত্ব সংরক্ষিত।</p>
      <div className="flex gap-8">
        <a href="#" className="hover:text-cream transition-colors">গোপনীয়তা নীতি</a>
        <a href="#" className="hover:text-cream transition-colors">পরিষেবার শর্তাবলী</a>
      </div>
    </div>
  </footer>
);

const AdminPanel = () => {
  const [activeTab, setActiveTab] = useState<'dashboard' | 'qa' | 'resources' | 'sections' | 'events' | 'daily' | 'tasbih' | 'names'>('dashboard');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [questions, setQuestions] = useState<QA[]>([]);
  const [resources, setResources] = useState<Resource[]>([]);
  const [sections, setSections] = useState<DynamicSection[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [dailyItems, setDailyItems] = useState<DailyContent[]>([]);
  const [tasbihPresets, setTasbihPresets] = useState<TasbihPreset[]>([]);
  const [namesOfAllah, setNamesOfAllah] = useState<NameOfAllah[]>([]);
  
  const [newResource, setNewResource] = useState({ title: '', category: 'নিবন্ধ', url: '' });
  const [newSection, setNewSection] = useState({ title: '', layout_type: 'grid' as 'grid' | 'list' });
  const [newItem, setNewItem] = useState({ section_id: 0, title: '', description: '', image_url: '' });
  const [newEvent, setNewEvent] = useState({ title: '', date: '', location: '', description: '', image_url: '' });
  const [newDaily, setNewDaily] = useState({ type: 'ayah' as 'ayah' | 'hadith', content: '', reference: '' });
  const [newTasbih, setNewTasbih] = useState({ name: '', target: 33 });
  const [newName, setNewName] = useState({ name_arabic: '', name_transliteration: '', meaning: '', benefit: '' });
  const [answers, setAnswers] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchAdminData();
  }, [activeTab]);

  const fetchAdminData = async () => {
    if (activeTab === 'dashboard') {
      const data = await db.getStats();
      setStats(data);
    } else if (activeTab === 'qa') {
      const data = await db.getQA(false);
      setQuestions(data);
    } else if (activeTab === 'resources') {
      const data = await db.getResources();
      setResources(data);
    } else if (activeTab === 'sections') {
      const data = await db.getSections();
      setSections(data);
    } else if (activeTab === 'events') {
      const data = await db.getEvents();
      setEvents(data);
    } else if (activeTab === 'daily') {
      const data = await db.getDailyContent();
      setDailyItems(data);
    } else if (activeTab === 'tasbih') {
      const data = await db.getTasbihPresets();
      setTasbihPresets(data);
    } else if (activeTab === 'names') {
      const data = await db.getNames();
      setNamesOfAllah(data);
    }
  };

  const handleAnswer = async (id: number) => {
    const answer = answers[id];
    if (!answer) return;
    await db.answerQuestion(id, answer);
    fetchAdminData();
  };

  const handleDeleteQA = async (id: number) => {
    await db.deleteQA(id);
    fetchAdminData();
  };

  const handleAddResource = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.addResource(newResource);
    setNewResource({ title: '', category: 'নিবন্ধ', url: '' });
    fetchAdminData();
  };

  const handleDeleteResource = async (id: number) => {
    await db.deleteResource(id);
    fetchAdminData();
  };

  const handleAddSection = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.addSection(newSection);
    setNewSection({ title: '', layout_type: 'grid' });
    fetchAdminData();
  };

  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.addSectionItem(newItem);
    setNewItem({ section_id: 0, title: '', description: '', image_url: '' });
    fetchAdminData();
  };

  const handleDeleteItem = async (id: number) => {
    await db.deleteSectionItem(id);
    fetchAdminData();
  };

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.addEvent(newEvent);
    setNewEvent({ title: '', date: '', location: '', description: '', image_url: '' });
    fetchAdminData();
  };

  const handleDeleteEvent = async (id: number) => {
    await db.deleteEvent(id);
    fetchAdminData();
  };

  const handleAddDaily = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.addDailyContent(newDaily);
    setNewDaily({ type: 'ayah', content: '', reference: '' });
    fetchAdminData();
  };

  const handleActivateDaily = async (id: number) => {
    await db.activateDailyContent(id);
    fetchAdminData();
  };

  const handleDeleteDaily = async (id: number) => {
    await db.deleteDailyContent(id);
    fetchAdminData();
  };

  const handleAddTasbih = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.addTasbihPreset(newTasbih);
    setNewTasbih({ name: '', target: 33 });
    fetchAdminData();
  };

  const handleDeleteTasbih = async (id: number) => {
    await db.deleteTasbihPreset(id);
    fetchAdminData();
  };

  const handleAddName = async (e: React.FormEvent) => {
    e.preventDefault();
    await db.addName(newName);
    setNewName({ name_arabic: '', name_transliteration: '', meaning: '', benefit: '' });
    fetchAdminData();
  };

  const handleDeleteName = async (id: number) => {
    await db.deleteName(id);
    fetchAdminData();
  };

  return (
    <div className="pt-32 pb-20 px-4 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h1 className="text-4xl font-serif text-emerald-900">এডমিন কন্ট্রোল সেন্টার</h1>
          <p className="text-emerald-900/50">আপনার প্ল্যাটফর্মের সমস্ত বিষয়বস্তু এখান থেকে পরিচালনা করুন।</p>
        </div>
        <div className="flex bg-emerald-900/5 p-1 rounded-2xl overflow-x-auto no-scrollbar">
          {[
            { id: 'dashboard', label: 'ড্যাশবোর্ড', icon: Activity },
            { id: 'qa', label: 'প্রশ্নোত্তর', icon: HelpCircle },
            { id: 'resources', label: 'রিসোর্স', icon: Download },
            { id: 'sections', label: 'সেকশন', icon: LayoutGrid },
            { id: 'events', label: 'ইভেন্ট', icon: Calendar },
            { id: 'daily', label: 'দৈনিক', icon: BookOpen },
            { id: 'tasbih', label: 'তাসবিহ', icon: Settings },
            { id: 'names', label: 'নামসমূহ', icon: Heart }
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? 'bg-emerald-900 text-cream shadow-lg' : 'text-emerald-900/60 hover:text-emerald-900'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'dashboard' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm">
            <div className="text-emerald-900/40 text-sm font-bold uppercase tracking-widest mb-2">মোট প্রশ্ন</div>
            <div className="text-5xl font-serif text-emerald-900">{stats.questions}</div>
            <div className="mt-4 text-gold font-medium flex items-center gap-1">
              <HelpCircle className="w-4 h-4" /> {stats.pendingQuestions}টি উত্তর বাকি
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm">
            <div className="text-emerald-900/40 text-sm font-bold uppercase tracking-widest mb-2">রিসোর্স</div>
            <div className="text-5xl font-serif text-emerald-900">{stats.resources}</div>
            <div className="mt-4 text-emerald-900/50 flex items-center gap-1">
              <Download className="w-4 h-4" /> ডাউনলোডযোগ্য ফাইল
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm">
            <div className="text-emerald-900/40 text-sm font-bold uppercase tracking-widest mb-2">আসন্ন ইভেন্ট</div>
            <div className="text-5xl font-serif text-emerald-900">{stats.events}</div>
            <div className="mt-4 text-emerald-900/50 flex items-center gap-1">
              <Calendar className="w-4 h-4" /> লাইভ কার্যক্রম
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm">
            <div className="text-emerald-900/40 text-sm font-bold uppercase tracking-widest mb-2">ডাইনামিক সেকশন</div>
            <div className="text-5xl font-serif text-emerald-900">{stats.sections}</div>
            <div className="mt-4 text-emerald-900/50 flex items-center gap-1">
              <LayoutGrid className="w-4 h-4" /> কাস্টম মডিউল
            </div>
          </div>
          <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm">
            <div className="text-emerald-900/40 text-sm font-bold uppercase tracking-widest mb-2">আল্লাহর নাম</div>
            <div className="text-5xl font-serif text-emerald-900">{stats.names}</div>
            <div className="mt-4 text-emerald-900/50 flex items-center gap-1">
              <Heart className="w-4 h-4" /> আসমাউল হুসনা
            </div>
          </div>
        </div>
      )}

      {activeTab === 'events' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm sticky top-32">
              <h3 className="text-2xl font-serif text-emerald-900 mb-6">নতুন ইভেন্ট যোগ করুন</h3>
              <form onSubmit={handleAddEvent} className="space-y-4">
                <input 
                  type="text" placeholder="ইভেন্ট শিরোনাম" required
                  value={newEvent.title}
                  onChange={(e) => setNewEvent({ ...newEvent, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <input 
                  type="text" placeholder="তারিখ (উদা: ১৫ মার্চ)" required
                  value={newEvent.date}
                  onChange={(e) => setNewEvent({ ...newEvent, date: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <input 
                  type="text" placeholder="স্থান" required
                  value={newEvent.location}
                  onChange={(e) => setNewEvent({ ...newEvent, location: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <textarea 
                  placeholder="বর্ণনা" required
                  value={newEvent.description}
                  onChange={(e) => setNewEvent({ ...newEvent, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10 h-24"
                />
                <button type="submit" className="w-full bg-emerald-900 text-cream py-3 rounded-xl font-medium hover:bg-emerald-800 transition-all">
                  ইভেন্ট যোগ করুন
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {events.map(event => (
              <div key={event.id} className="bg-white p-6 rounded-2xl border border-emerald-900/10 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-4">
                  <div>
                    <div className="text-xs font-bold text-gold uppercase tracking-wider mb-1">{event.date}</div>
                    <h4 className="text-lg font-serif text-emerald-900">{event.title}</h4>
                    <div className="text-sm text-emerald-900/50">{event.location}</div>
                  </div>
                </div>
                <button onClick={() => handleDeleteEvent(event.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'daily' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm sticky top-32">
              <h3 className="text-2xl font-serif text-emerald-900 mb-6">নতুন আয়াত/হাদিস</h3>
              <form onSubmit={handleAddDaily} className="space-y-4">
                <select 
                  value={newDaily.type}
                  onChange={(e) => setNewDaily({ ...newDaily, type: e.target.value as any })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                >
                  <option value="ayah">আয়াত</option>
                  <option value="hadith">হাদিস</option>
                </select>
                <textarea 
                  placeholder="মূল বক্তব্য" required
                  value={newDaily.content}
                  onChange={(e) => setNewDaily({ ...newDaily, content: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10 h-32"
                />
                <input 
                  type="text" placeholder="রেফারেন্স" required
                  value={newDaily.reference}
                  onChange={(e) => setNewDaily({ ...newDaily, reference: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <button type="submit" className="w-full bg-emerald-900 text-cream py-3 rounded-xl font-medium hover:bg-emerald-800 transition-all">
                  সংরক্ষণ করুন
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {dailyItems.map(item => (
              <div key={item.id} className={`bg-white p-6 rounded-2xl border transition-all shadow-sm ${item.active ? 'border-emerald-900 ring-1 ring-emerald-900' : 'border-emerald-900/10'}`}>
                <div className="flex justify-between items-start mb-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${item.type === 'hadith' ? 'bg-gold/10 text-gold' : 'bg-emerald-100 text-emerald-700'}`}>
                    {item.type === 'hadith' ? 'হাদিস' : 'আয়াত'}
                  </span>
                  <div className="flex gap-2">
                    {!item.active && (
                      <button 
                        onClick={() => handleActivateDaily(item.id)}
                        className="text-emerald-900 hover:text-gold font-bold text-sm"
                      >
                        সক্রিয় করুন
                      </button>
                    )}
                    <button onClick={() => handleDeleteDaily(item.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
                <p className="text-lg font-serif text-emerald-900 mb-2 italic">"{item.content}"</p>
                <div className="text-sm text-emerald-900/50">— {item.reference}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'tasbih' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm sticky top-32">
              <h3 className="text-2xl font-serif text-emerald-900 mb-6">তাসবিহ প্রিসেট</h3>
              <form onSubmit={handleAddTasbih} className="space-y-4">
                <input 
                  type="text" placeholder="জিকিরের নাম" required
                  value={newTasbih.name}
                  onChange={(e) => setNewTasbih({ ...newTasbih, name: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <input 
                  type="number" placeholder="লক্ষ্য (উদা: ৩৩)" required
                  value={newTasbih.target}
                  onChange={(e) => setNewTasbih({ ...newTasbih, target: parseInt(e.target.value) })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <button type="submit" className="w-full bg-emerald-900 text-cream py-3 rounded-xl font-medium hover:bg-emerald-800 transition-all">
                  প্রিসেট যোগ করুন
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tasbihPresets.map(preset => (
              <div key={preset.id} className="bg-white p-6 rounded-2xl border border-emerald-900/10 flex justify-between items-center shadow-sm">
                <div>
                  <h4 className="text-xl font-serif text-emerald-900">{preset.name}</h4>
                  <div className="text-sm text-gold font-bold uppercase tracking-widest">লক্ষ্য: {preset.target}</div>
                </div>
                <button onClick={() => handleDeleteTasbih(preset.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'qa' && (
        <div className="space-y-6">
          {questions.map(q => (
            <div key={q.id} className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${q.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-gold/10 text-gold'}`}>
                  {q.status === 'published' ? 'প্রকাশিত' : 'অপেক্ষমান'}
                </span>
                <button onClick={() => handleDeleteQA(q.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
              </div>
              <h3 className="text-xl font-serif text-emerald-900 mb-4">প্রশ্ন: {q.question}</h3>
              {q.status === 'pending' ? (
                <div className="space-y-4">
                  <textarea 
                    placeholder="উত্তর লিখুন..."
                    className="w-full p-4 rounded-xl bg-emerald-900/5 border border-emerald-900/10 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                  <button 
                    onClick={() => handleAnswer(q.id)}
                    className="bg-emerald-900 text-cream px-6 py-2 rounded-full font-medium hover:bg-emerald-800 transition-all"
                  >
                    উত্তর প্রকাশ করুন
                  </button>
                </div>
              ) : (
                <div className="bg-emerald-900/5 p-4 rounded-xl">
                  <p className="text-emerald-900/80"><span className="font-bold">উত্তর:</span> {q.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {activeTab === 'resources' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm sticky top-32">
              <h3 className="text-2xl font-serif text-emerald-900 mb-6">রিসোর্স যোগ করুন</h3>
              <form onSubmit={handleAddResource} className="space-y-4">
                <input 
                  type="text" placeholder="শিরোনাম" required
                  value={newResource.title}
                  onChange={(e) => setNewResource({ ...newResource, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <select 
                  value={newResource.category}
                  onChange={(e) => setNewResource({ ...newResource, category: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                >
                  <option>নিবন্ধ</option><option>রমজান</option><option>দোয়া</option><option>ফিকহ</option>
                </select>
                <input 
                  type="text" placeholder="ইউআরএল (URL)" required
                  value={newResource.url}
                  onChange={(e) => setNewResource({ ...newResource, url: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <button type="submit" className="w-full bg-emerald-900 text-cream py-3 rounded-xl font-medium hover:bg-emerald-800 transition-all">
                  রিসোর্স যোগ করুন
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            {resources.map(res => (
              <div key={res.id} className="bg-white p-6 rounded-2xl border border-emerald-900/10 flex justify-between items-center shadow-sm">
                <div>
                  <div className="text-xs font-bold text-gold uppercase tracking-wider mb-1">{res.category}</div>
                  <h4 className="text-lg font-serif text-emerald-900">{res.title}</h4>
                </div>
                <button onClick={() => handleDeleteResource(res.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'sections' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-8">
            <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm">
              <h3 className="text-2xl font-serif text-emerald-900 mb-6">সেকশন তৈরি করুন</h3>
              <form onSubmit={handleAddSection} className="space-y-4">
                <input 
                  type="text" placeholder="সেকশন শিরোনাম" required
                  value={newSection.title}
                  onChange={(e) => setNewSection({ ...newSection, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <div className="flex gap-2">
                  <button 
                    type="button"
                    onClick={() => setNewSection({ ...newSection, layout_type: 'grid' })}
                    className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 ${newSection.layout_type === 'grid' ? 'bg-emerald-900 text-cream border-emerald-900' : 'border-emerald-900/10 text-emerald-900'}`}
                  >
                    <LayoutGrid className="w-4 h-4" /> গ্রিড
                  </button>
                  <button 
                    type="button"
                    onClick={() => setNewSection({ ...newSection, layout_type: 'list' })}
                    className={`flex-1 py-2 rounded-lg border flex items-center justify-center gap-2 ${newSection.layout_type === 'list' ? 'bg-emerald-900 text-cream border-emerald-900' : 'border-emerald-900/10 text-emerald-900'}`}
                  >
                    <ListIcon className="w-4 h-4" /> লিস্ট
                  </button>
                </div>
                <button type="submit" className="w-full bg-emerald-900 text-cream py-3 rounded-xl font-medium hover:bg-emerald-800 transition-all">
                  সেকশন তৈরি করুন
                </button>
              </form>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm">
              <h3 className="text-2xl font-serif text-emerald-900 mb-6">সেকশনে আইটেম যোগ করুন</h3>
              <form onSubmit={handleAddItem} className="space-y-4">
                <select 
                  required
                  value={newItem.section_id}
                  onChange={(e) => setNewItem({ ...newItem, section_id: parseInt(e.target.value) })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                >
                  <option value="">সেকশন নির্বাচন করুন</option>
                  {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                </select>
                <input 
                  type="text" placeholder="আইটেম শিরোনাম" required
                  value={newItem.title}
                  onChange={(e) => setNewItem({ ...newItem, title: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <textarea 
                  placeholder="বর্ণনা" required
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10 h-24"
                />
                <button type="submit" className="w-full bg-emerald-900 text-cream py-3 rounded-xl font-medium hover:bg-emerald-800 transition-all">
                  আইটেম যোগ করুন
                </button>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2 space-y-8">
            {sections.map(section => (
              <div key={section.id} className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm">
                <div className="flex justify-between items-center mb-6">
                  <h4 className="text-2xl font-serif text-emerald-900">{section.title} <span className="text-sm font-sans text-emerald-900/40 uppercase tracking-widest ml-2">({section.layout_type === 'grid' ? 'গ্রিড' : 'লিস্ট'})</span></h4>
                </div>
                <div className="space-y-4">
                  {section.items.map(item => (
                    <div key={item.id} className="flex items-center justify-between p-4 bg-emerald-900/5 rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div>
                          <div className="font-bold text-emerald-900">{item.title}</div>
                          <div className="text-sm text-emerald-900/60 line-clamp-1">{item.description}</div>
                        </div>
                      </div>
                      <button onClick={() => handleDeleteItem(item.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  ))}
                  {section.items.length === 0 && <div className="text-center py-8 text-emerald-900/20 italic">এই সেকশনে কোনো আইটেম নেই</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'names' && (
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white p-8 rounded-3xl border border-emerald-900/10 shadow-sm sticky top-32">
              <h3 className="text-2xl font-serif text-emerald-900 mb-6">নতুন নাম যোগ করুন</h3>
              <form onSubmit={handleAddName} className="space-y-4">
                <input 
                  type="text" placeholder="আরবি নাম" required
                  value={newName.name_arabic}
                  onChange={(e) => setNewName({ ...newName, name_arabic: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <input 
                  type="text" placeholder="উচ্চারণ" required
                  value={newName.name_transliteration}
                  onChange={(e) => setNewName({ ...newName, name_transliteration: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <input 
                  type="text" placeholder="অর্থ" required
                  value={newName.meaning}
                  onChange={(e) => setNewName({ ...newName, meaning: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10"
                />
                <textarea 
                  placeholder="ফজিলত/উপকারিতা" required
                  value={newName.benefit}
                  onChange={(e) => setNewName({ ...newName, benefit: e.target.value })}
                  className="w-full p-3 rounded-xl bg-emerald-900/5 border border-emerald-900/10 h-24"
                />
                <button type="submit" className="w-full bg-emerald-900 text-cream py-3 rounded-xl font-medium hover:bg-emerald-800 transition-all">
                  নাম যোগ করুন
                </button>
              </form>
            </div>
          </div>
          <div className="lg:col-span-2 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {namesOfAllah.map(name => (
                <div key={name.id} className="bg-white p-6 rounded-2xl border border-emerald-900/10 flex justify-between items-start shadow-sm">
                  <div>
                    <div className="text-2xl font-serif text-emerald-900 mb-1">{name.name_arabic}</div>
                    <div className="text-sm font-bold text-gold uppercase tracking-wider mb-1">{name.name_transliteration}</div>
                    <div className="text-xs text-emerald-900/50 line-clamp-1">{name.meaning}</div>
                  </div>
                  <button onClick={() => handleDeleteName(name.id)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="w-5 h-5" /></button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const HadithModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [view, setView] = useState<'menu' | 'hadith-list'>('menu');
  const [selectedEdition, setSelectedEdition] = useState<string | null>(null);
  const [hadiths, setHadiths] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const editions = [
    { id: 'ben-bukhari', name: 'সহীহ বুখারী', author: 'ইমাম বুখারী' },
    { id: 'ben-muslim', name: 'সহীহ মুসলিম', author: 'ইমাম মুসলিম' },
    { id: 'ben-tirmidhi', name: 'সুনান আত-তিরমিজি', author: 'ইমাম তিরমিজি' },
    { id: 'ben-abudawud', name: 'সুনান আবু দাউদ', author: 'ইমাম আবু দাউদ' },
    { id: 'ben-nasai', name: 'সুনান আন-নাসায়ী', author: 'ইমাম নাসায়ী' },
    { id: 'ben-ibnmajah', name: 'সুনান ইবনে মাজাহ', author: 'ইমাম ইবনে মাজাহ' },
  ];

  const fetchHadiths = async (editionId: string) => {
    setLoading(true);
    try {
      const res = await fetch(`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@1/editions/${editionId}.json`);
      const data = await res.json();
      setHadiths(data.hadiths);
    } catch (error) {
      console.error('Error fetching hadiths:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditionClick = (editionId: string) => {
    setSelectedEdition(editionId);
    setView('hadith-list');
    fetchHadiths(editionId);
  };

  const filteredHadiths = hadiths.filter(h => 
    h.text.toLowerCase().includes(searchTerm.toLowerCase()) || 
    h.hadithnumber.toString().includes(searchTerm)
  ).slice(0, 100); // Limit to 100 for performance

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-cream w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-emerald-900/10 flex justify-between items-center bg-white/50 backdrop-blur-md sticky top-0 z-10">
              <div className="flex items-center gap-4">
                {view !== 'menu' && (
                  <button onClick={() => setView('menu')} className="p-2 hover:bg-emerald-900/5 rounded-full text-emerald-900">
                    <ChevronLeft />
                  </button>
                )}
                <h3 className="text-2xl font-serif text-emerald-900">
                  {view === 'menu' ? 'আল-হাদিস' : editions.find(e => e.id === selectedEdition)?.name}
                </h3>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-emerald-900/5 rounded-full text-emerald-900/40 hover:text-emerald-900">
                <X />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6 no-scrollbar">
              {view === 'menu' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {editions.map((edition) => (
                    <motion.div 
                      key={edition.id}
                      whileHover={{ y: -5 }}
                      onClick={() => handleEditionClick(edition.id)}
                      className="bg-white p-8 rounded-3xl border border-emerald-900/5 shadow-sm hover:shadow-xl transition-all cursor-pointer group"
                    >
                      <div className="w-12 h-12 bg-emerald-900/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <Library className="w-6 h-6 text-emerald-900" />
                      </div>
                      <h4 className="text-xl font-serif text-emerald-900 mb-1">{edition.name}</h4>
                      <p className="text-sm text-emerald-900/50">{edition.author}</p>
                    </motion.div>
                  ))}
                </div>
              )}

              {view === 'hadith-list' && (
                <div className="space-y-6">
                  <div className="sticky top-0 z-10 bg-cream/80 backdrop-blur-sm pb-4">
                    <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-900/30" />
                      <input 
                        type="text" 
                        placeholder="হাদিস নম্বর বা শব্দ দিয়ে খুঁজুন..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl bg-white border border-emerald-900/10 focus:outline-none focus:ring-2 focus:ring-emerald-900/20"
                      />
                    </div>
                  </div>

                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20">
                      <div className="w-12 h-12 border-4 border-emerald-900/10 border-t-emerald-900 rounded-full animate-spin mb-4"></div>
                      <p className="text-emerald-900/50">হাদিস লোড হচ্ছে...</p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {filteredHadiths.map((hadith, idx) => (
                        <div key={idx} className="bg-white p-8 rounded-3xl border border-emerald-900/5 shadow-sm">
                          <div className="flex justify-between items-center mb-6">
                            <span className="px-4 py-1 bg-emerald-900/5 rounded-full text-xs font-bold text-emerald-900 uppercase tracking-widest">
                              হাদিস নম্বর: {hadith.hadithnumber}
                            </span>
                          </div>
                          <p className="text-emerald-900/80 leading-relaxed text-lg">
                            {hadith.text}
                          </p>
                        </div>
                      ))}
                      {filteredHadiths.length === 0 && (
                        <div className="text-center py-20 text-emerald-900/40">
                          কোনো হাদিস পাওয়া যায়নি
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const BarakahAIModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [messages, setMessages] = useState<{ role: 'user' | 'ai', content: string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: userMessage,
        config: {
          systemInstruction: "আপনি একজন ইসলামিক বিশেষজ্ঞ এআই সহকারী। আপনার নাম 'Barakah AI'। আপনি ব্যবহারকারীদের ইসলামিক জ্ঞান, কুরআন, হাদিস এবং দৈনন্দিন জীবনের ইসলামিক সমাধান প্রদান করেন। আপনার উত্তরগুলো হতে হবে মার্জিত, সঠিক এবং ইসলামিক রেফারেন্স সহ (যদি সম্ভব হয়)। বাংলা ভাষায় উত্তর দিন।",
        }
      });

      const aiResponse = response.text || "দুঃখিত, আমি এই মুহূর্তে উত্তর দিতে পারছি না।";
      setMessages(prev => [...prev, { role: 'ai', content: aiResponse }]);
    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, { role: 'ai', content: "দুঃখিত, একটি সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।" }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-cream w-full max-w-2xl h-[80vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="p-6 border-b border-emerald-900/5 flex justify-between items-center bg-white">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center">
                  <Sparkles className="text-gold w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-serif text-emerald-900">Barakah AI</h2>
                  <p className="text-xs text-emerald-900/40">ইসলামিক এআই সহকারী</p>
                </div>
              </div>
              <button onClick={onClose} className="text-emerald-900/50 hover:text-emerald-900"><X /></button>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-emerald-900/5">
              {messages.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center text-center space-y-4 opacity-40">
                  <Bot className="w-16 h-16 text-emerald-900" />
                  <p className="font-serif text-xl text-emerald-900">আসসালামু আলাইকুম!<br/>আমি Barakah AI, আপনাকে কিভাবে সাহায্য করতে পারি?</p>
                </div>
              )}
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[85%] p-4 rounded-2xl shadow-sm ${msg.role === 'user' ? 'bg-emerald-900 text-white rounded-tr-none' : 'bg-white text-emerald-900 rounded-tl-none'}`}>
                    <div className="markdown-body text-sm leading-relaxed">
                      <Markdown>{msg.content}</Markdown>
                    </div>
                  </div>
                </div>
              ))}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-tl-none shadow-sm flex gap-2">
                    <div className="w-2 h-2 bg-emerald-900/20 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-emerald-900/20 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <div className="w-2 h-2 bg-emerald-900/20 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-emerald-900/5">
              <div className="relative flex items-center">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                  placeholder="আপনার প্রশ্নটি এখানে লিখুন..."
                  className="w-full bg-emerald-900/5 border-none rounded-2xl py-4 pl-6 pr-14 text-emerald-900 placeholder:text-emerald-900/30 focus:ring-2 focus:ring-gold/20 transition-all"
                />
                <button 
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="absolute right-2 w-10 h-10 bg-emerald-900 text-gold rounded-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const BarakahAITrigger = ({ onClick }: { onClick: () => void }) => {
  return (
    <section className="px-4 pt-24 pb-4">
      <div className="max-w-7xl mx-auto">
        <motion.div 
          whileHover={{ scale: 1.005, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)" }}
          whileTap={{ scale: 0.995 }}
          onClick={onClick}
          className="bg-white/60 backdrop-blur-sm border border-emerald-900/5 rounded-2xl p-4 shadow-sm hover:shadow-md transition-all cursor-pointer flex items-center justify-between group"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-900 rounded-xl flex items-center justify-center group-hover:rotate-12 transition-transform">
              <Sparkles className="w-5 h-5 text-gold" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-serif text-xl text-emerald-900 font-bold">Barakah AI</span>
                <span className="w-1 h-1 bg-emerald-900/20 rounded-full"></span>
                <span className="text-emerald-900/40 text-sm font-medium">জিজ্ঞাসা করুন</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-900/5 rounded-lg text-[10px] font-bold text-emerald-900/30 uppercase tracking-widest">
              Gemini 3.1 Flash
            </div>
            <div className="w-10 h-10 bg-emerald-900/5 rounded-xl flex items-center justify-center group-hover:bg-emerald-900 transition-colors">
              <ChevronRight className="w-5 h-5 text-emerald-900 group-hover:text-white transition-colors" />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const QiblaModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-cream w-full max-w-md rounded-3xl p-8 shadow-2xl overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-4">
              <button onClick={onClose} className="text-emerald-900/50 hover:text-emerald-900"><X /></button>
            </div>
            <div className="text-center">
              <Compass className="w-16 h-16 text-gold mx-auto mb-6" />
              <h2 className="text-3xl font-serif text-emerald-900 mb-4">কিবলা কম্পাস</h2>
              <div className="relative w-48 h-48 mx-auto mb-8">
                <div className="absolute inset-0 border-4 border-emerald-900/10 rounded-full" />
                <motion.div 
                  animate={{ rotate: 262 }} // Qibla direction from Bangladesh roughly
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="w-1 h-24 bg-gold rounded-full relative">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-gold rotate-45 border-t-4 border-l-4 border-gold" />
                  </div>
                </motion.div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-4 h-4 bg-emerald-900 rounded-full border-2 border-cream" />
                </div>
              </div>
              <div className="bg-emerald-900/5 p-4 rounded-2xl">
                <p className="text-emerald-900/70 text-sm">
                  বাংলাদেশ থেকে কিবলার দিক সাধারণত পশ্চিম-দক্ষিণ দিকে (প্রায় ২৬২°)। আপনার ডিভাইসের সেন্সর ব্যবহার করে সঠিক দিক নির্ণয় করুন।
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const LiveMakkahModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [activeFeed, setActiveFeed] = useState<'makkah' | 'madinah'>('makkah');

  const feeds = {
    makkah: {
      title: "মক্কা লাইভ (ক্বাবা শরীফ)",
      channelId: "UCG75zE76_o3fALtD1Z30Pnw",
      youtubeUrl: "https://www.youtube.com/c/SaudiQuranTv/live"
    },
    madinah: {
      title: "মদিনা লাইভ (মসজিদে নববী)",
      channelId: "UCiNfT7_M1M-1wZ_7g-6M9_A",
      youtubeUrl: "https://www.youtube.com/c/SaudiSunnahTv/live"
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-zinc-950 w-full max-w-4xl h-[80vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-white/10"
          >
            {/* Header / Selector */}
            <div className="p-6 bg-zinc-950 border-b border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4 shrink-0">
              <div className="flex gap-2">
                <button 
                  onClick={() => setActiveFeed('makkah')}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeFeed === 'makkah' ? 'bg-emerald-900 text-cream' : 'bg-white/5 text-white/60 hover:text-white'}`}
                >
                  🕋 মক্কা লাইভ
                </button>
                <button 
                  onClick={() => setActiveFeed('madinah')}
                  className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all ${activeFeed === 'madinah' ? 'bg-gold text-white' : 'bg-white/5 text-white/60 hover:text-white'}`}
                >
                  🕌 মদিনা লাইভ
                </button>
              </div>

              <div className="flex items-center gap-2">
                <a 
                  href={feeds[activeFeed].youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all"
                >
                  ইউটিউবে দেখুন
                </a>
                <button onClick={onClose} className="w-10 h-10 bg-white/5 text-white/60 rounded-full flex items-center justify-center hover:bg-white/10 transition-all"><X className="w-5 h-5" /></button>
              </div>
            </div>

            {/* Video Player Frame */}
            <div className="flex-1 bg-black relative">
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/live_stream?channel=${feeds[activeFeed].channelId}&autoplay=1&mute=1`} 
                title={feeds[activeFeed].title}
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                className="w-full h-full"
              ></iframe>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const QuranModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [view, setView] = useState<'menu' | 'surah-list' | 'para-list' | 'surah-detail' | 'para-detail'>('menu');
  const [mode, setMode] = useState<'text' | 'voice'>('text');
  const [chapters, setChapters] = useState<any[]>([]);
  const [juzs, setJuzs] = useState<any[]>([]);
  const [selectedChapter, setSelectedChapter] = useState<any>(null);
  const [selectedJuz, setSelectedJuz] = useState<any>(null);
  const [verses, setVerses] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetch('https://api.quran.com/api/v4/chapters?language=bn')
        .then(res => res.json())
        .then(data => setChapters(data.chapters));
      
      fetch('https://api.quran.com/api/v4/juzs')
        .then(res => res.json())
        .then(data => setJuzs(data.juzs));
    } else {
      setView('menu');
      setAudioUrl(null);
    }
  }, [isOpen]);

  const fetchSurahDetail = async (chapterId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_chapter/${chapterId}?language=bn&words=true&translations=161&fields=text_uthmani&per_page=500`);
      const data = await res.json();
      setVerses(data.verses);
      
      if (mode === 'voice') {
        const audioRes = await fetch(`https://api.quran.com/api/v4/chapter_recitations/7/${chapterId}`);
        const audioData = await audioRes.json();
        setAudioUrl(audioData.audio_file.audio_url);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchParaDetail = async (juzId: number) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.quran.com/api/v4/verses/by_juz/${juzId}?language=bn&words=true&translations=161&fields=text_uthmani&per_page=500`);
      const data = await res.json();
      setVerses(data.verses);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-cream w-full max-w-4xl h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border border-emerald-900/10"
          >
            {/* Header */}
            <div className="p-8 border-b border-emerald-900/10 flex justify-between items-center bg-white shrink-0">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => {
                    if (view === 'surah-detail') setView('surah-list');
                    else if (view === 'para-detail') setView('para-list');
                    else if (view === 'surah-list' || view === 'para-list') setView('menu');
                    setAudioUrl(null);
                  }}
                  className={`p-2 bg-emerald-900/5 text-emerald-900 rounded-xl hover:bg-emerald-900 hover:text-cream transition-all ${view === 'menu' ? 'hidden' : ''}`}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <div>
                  <h2 className="text-3xl font-serif text-emerald-900 font-bold">আল-কুরআন</h2>
                  <p className="text-emerald-900/40 text-xs font-bold uppercase tracking-widest">
                    {view === 'menu' && 'তিলাওয়াত মাধ্যম নির্বাচন করুন'}
                    {view === 'surah-list' && 'সুরা নির্বাচন করুন'}
                    {view === 'para-list' && 'পারা নির্বাচন করুন'}
                    {view === 'surah-detail' && `${selectedChapter?.name_simple} (${selectedChapter?.translated_name?.name})`}
                    {view === 'para-detail' && `${selectedJuz?.juz_number} নং পারা`}
                  </p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 bg-emerald-900/5 text-emerald-900/40 rounded-full flex items-center justify-center hover:bg-emerald-900 hover:text-white transition-all"><X /></button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
              {view === 'menu' && (
                <div className="grid md:grid-cols-2 gap-8 max-w-2xl mx-auto py-12">
                  <motion.div 
                    whileHover={{ y: -5, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('surah-list')}
                    className="bg-white p-10 rounded-[2.5rem] border border-emerald-900/5 shadow-sm hover:border-gold/30 cursor-pointer text-center group"
                  >
                    <div className="w-20 h-20 bg-emerald-900/5 text-emerald-900 rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-emerald-900 group-hover:text-cream transition-all">
                      <BookOpen className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-serif text-emerald-900 font-bold mb-2">সুরা ভিত্তিক</h3>
                    <p className="text-emerald-900/60 text-sm">সুরা নির্বাচন করে তিলাওয়াত করুন বা অডিও শুনুন</p>
                  </motion.div>

                  <motion.div 
                    whileHover={{ y: -5, scale: 1.02, boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)" }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setView('para-list')}
                    className="bg-white p-10 rounded-[2.5rem] border border-emerald-900/5 shadow-sm hover:border-gold/30 cursor-pointer text-center group"
                  >
                    <div className="w-20 h-20 bg-gold/10 text-gold rounded-3xl flex items-center justify-center mx-auto mb-6 group-hover:bg-gold group-hover:text-white transition-all">
                      <Library className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-serif text-emerald-900 font-bold mb-2">পারা ভিত্তিক</h3>
                    <p className="text-emerald-900/60 text-sm">৩০ পারা ভিত্তিক তিলাওয়াত করুন</p>
                  </motion.div>
                </div>
              )}

              {view === 'surah-list' && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {chapters.map((chapter) => (
                    <div key={chapter.id} className="bg-white p-6 rounded-3xl border border-emerald-900/5 shadow-sm flex flex-col justify-between hover:shadow-md transition-all">
                      <div>
                        <div className="flex justify-between items-start mb-4">
                          <span className="w-8 h-8 bg-emerald-900/5 rounded-lg flex items-center justify-center text-xs font-bold text-emerald-900">
                            {chapter.id}
                          </span>
                          <span className="text-2xl font-serif text-emerald-900">{chapter.name_arabic}</span>
                        </div>
                        <h3 className="text-xl font-bold text-emerald-900 mb-1">{chapter.name_simple}</h3>
                        <p className="text-emerald-900/40 text-xs mb-4">{chapter.translated_name?.name} • {chapter.verses_count} আয়াত</p>
                      </div>
                      <div className="flex gap-2 border-t border-emerald-900/5 pt-4">
                        <button 
                          onClick={() => { setSelectedChapter(chapter); setMode('text'); setView('surah-detail'); fetchSurahDetail(chapter.id); }}
                          className="flex-1 py-2 bg-emerald-900/5 text-emerald-900 rounded-xl font-medium hover:bg-emerald-900 hover:text-cream transition-all flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" /> টেক্সট
                        </button>
                        <button 
                          onClick={() => { setSelectedChapter(chapter); setMode('voice'); setView('surah-detail'); fetchSurahDetail(chapter.id); }}
                          className="flex-1 py-2 bg-gold/10 text-gold rounded-xl font-medium hover:bg-gold hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Volume2 className="w-4 h-4" /> ভয়েস
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {view === 'para-list' && (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {juzs.map((juz) => (
                    <div key={juz.id} className="bg-white p-5 rounded-3xl border border-emerald-900/5 shadow-sm text-center flex flex-col justify-between hover:shadow-md transition-all">
                      <div className="mb-4">
                        <div className="text-xs font-bold text-emerald-900/30 uppercase tracking-widest mb-1">পারা</div>
                        <div className="text-4xl font-serif text-emerald-900 font-bold mb-1">{juz.juz_number}</div>
                        <div className="text-[10px] text-emerald-900/40 font-bold">সুরা {juz.verse_mapping ? Object.keys(juz.verse_mapping).length : 0}টি</div>
                      </div>
                      <div className="flex gap-2 border-t border-emerald-900/5 pt-3">
                        <button 
                          onClick={() => { setSelectedJuz(juz); setMode('text'); setView('para-detail'); fetchParaDetail(juz.juz_number); }}
                          className="flex-1 py-2 bg-emerald-900/5 text-emerald-900 rounded-xl font-medium hover:bg-emerald-900 hover:text-cream transition-all flex items-center justify-center gap-2"
                        >
                          <FileText className="w-4 h-4" /> টেক্সট
                        </button>
                        <button 
                          onClick={() => { setSelectedJuz(juz); setMode('voice'); setView('para-detail'); fetchParaDetail(juz.juz_number); }}
                          className="flex-1 py-2 bg-gold/10 text-gold rounded-xl font-medium hover:bg-gold hover:text-white transition-all flex items-center justify-center gap-2"
                        >
                          <Volume2 className="w-4 h-4" /> ভয়েস
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {(view === 'surah-detail' || view === 'para-detail') && (
                <div className="max-w-3xl mx-auto space-y-8">
                  {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                      <div className="w-12 h-12 border-4 border-emerald-900/10 border-t-emerald-900 rounded-full animate-spin"></div>
                      <p className="text-emerald-900/50 font-medium">লোড হচ্ছে...</p>
                    </div>
                  ) : (
                    <>
                      {audioUrl && (
                        <div className="sticky top-0 z-20 bg-white/90 backdrop-blur-md p-6 rounded-3xl border border-emerald-900/10 shadow-xl mb-10 flex flex-col items-center">
                          <div className="text-emerald-900/60 text-xs font-bold uppercase tracking-widest mb-4">তেলাওয়াত চলছে</div>
                          <audio controls src={audioUrl} className="w-full h-10" autoPlay />
                          <div className="mt-4 flex items-center gap-2 text-emerald-900/40 text-xs">
                            <Volume2 className="w-3 h-3" /> মিশারি রশিদ আল-আফাসি
                          </div>
                        </div>
                      )}
                      
                      {view === 'para-detail' && mode === 'voice' && !audioUrl && (
                        <div className="bg-gold/5 p-10 rounded-[2rem] text-gold text-center mb-10 border border-gold/10">
                          <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p className="font-serif text-xl">পারা ভিত্তিক অডিও বর্তমানে প্রক্রিয়াধীন।</p>
                          <p className="text-sm opacity-60 mt-2">অনুগ্রহ করে সুরা ভিত্তিক অডিও ব্যবহার করুন।</p>
                        </div>
                      )}

                      <div className="space-y-16">
                        {verses.map((verse, idx) => {
                          const isNewSurah = view === 'para-detail' && (idx === 0 || verses[idx-1].chapter_id !== verse.chapter_id);
                          const surahName = isNewSurah ? chapters.find(c => c.id === verse.chapter_id)?.name_simple : '';

                          return (
                            <div key={verse.id} className="relative">
                              {isNewSurah && (
                                <div className="bg-emerald-900/5 p-4 rounded-2xl mb-10 text-center font-serif text-emerald-900 border border-emerald-900/10">
                                  সুরা {surahName}
                                </div>
                              )}
                              <div className="absolute -left-12 top-2 w-8 h-8 bg-emerald-900/5 rounded-full flex items-center justify-center text-[10px] font-bold text-emerald-900/30">
                                {verse.verse_number || idx + 1}
                              </div>
                              <div className="text-4xl font-serif text-emerald-900 text-right leading-[2.2] mb-8" style={{ direction: 'rtl' }}>
                                {verse.text_uthmani}
                              </div>
                              <div className="space-y-4 pl-6 border-l-2 border-gold/20">
                                <div className="text-emerald-900/40 italic text-sm">
                                  {verse.words?.map((w: any) => w.transliteration?.text).join(' ')}
                                </div>
                                <div className="text-emerald-900/80 leading-relaxed text-lg font-medium">
                                  {verse.translations?.[0]?.text.replace(/<[^>]*>?/gm, '')}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const DUA_CATEGORIES: DuaCategory[] = [
  { id: 1, title: "অসুস্থতা", icon: Stethoscope, color: "bg-red-50 text-red-600" },
  { id: 2, title: "বিপদ আপদ", icon: AlertTriangle, color: "bg-orange-50 text-orange-600" },
  { id: 3, title: "ভয়ভীতি", icon: Ghost, color: "bg-purple-50 text-purple-600" },
  { id: 4, title: "ঝড় ও বৃষ্টি", icon: CloudRain, color: "bg-blue-50 text-blue-600" },
  { id: 5, title: "দরুদ শরীফ", icon: Book, color: "bg-emerald-50 text-emerald-600" },
  { id: 6, title: "ইস্তিগফার", icon: Hand, color: "bg-teal-50 text-teal-600" },
  { id: 7, title: "রব্বানা", icon: BookOpen, color: "bg-indigo-50 text-indigo-600" },
  { id: 8, title: "আল্লাহুম্মা", icon: Heart, color: "bg-pink-50 text-pink-600" },
  { id: 9, title: "আজান", icon: Mic2, color: "bg-amber-50 text-amber-600" },
  { id: 10, title: "ওজু", icon: Droplets, color: "bg-cyan-50 text-cyan-600" },
  { id: 11, title: "মসজিদ", icon: Home, color: "bg-emerald-50 text-emerald-600" },
  { id: 12, title: "নামাজ", icon: Zap, color: "bg-yellow-50 text-yellow-600" },
  { id: 13, title: "সকাল ও সন্ধ্যা", icon: Sunrise, color: "bg-orange-50 text-orange-600" },
  { id: 14, title: "রোজা", icon: MoonIcon, color: "bg-indigo-50 text-indigo-600" },
  { id: 15, title: "হজ ও ওমরাহ", icon: MapPin, color: "bg-slate-50 text-slate-600" },
];

const DUAS: Dua[] = [
  {
    id: 1,
    category_id: 1,
    title: "অসুস্থ ব্যক্তির জন্য দোয়া",
    arabic: "أَسْأَلُ اللَّهَ الْعَظِيمَ رَبَّ الْعَرْشِ الْعَظِيمِ أَنْ يَشْفِيَكَ",
    transliteration: "আসআলুল্লাহাল আযীমা রব্বাল আরশিল আযীমি আইঁ ইয়াশফিয়াকা।",
    translation: "আমি মহান আল্লাহর কাছে প্রার্থনা করছি, যিনি মহান আরশের অধিপতি, তিনি যেন তোমাকে আরোগ্য দান করেন।",
    reference: "আবু দাউদ ৩১০৬, তিরমিজি ২০৮৩"
  },
  {
    id: 2,
    category_id: 2,
    title: "বিপদের সময় দোয়া",
    arabic: "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ اللَّهُمَّ أْجُرْنِي فِي مُصِيبَتِي وَأَخْلِفْ لِي خَيْرًا مِنْهَا",
    transliteration: "ইন্না লিল্লাহি ওয়া ইন্না ইলাইহি রাজিউন। আল্লাহুম্মাজুরনী ফী মুসীবাতী ওয়া আখলিফলী খাইরাম মিনহা।",
    translation: "আমরা আল্লাহরই এবং তাঁর কাছেই ফিরে যাব। হে আল্লাহ! আমার এই বিপদে আমাকে সওয়াব দান করুন এবং এর বিনিময়ে আমাকে এর চেয়ে উত্তম কিছু দান করুন।",
    reference: "সহীহ মুসলিম ৯১৮"
  },
  {
    id: 3,
    category_id: 3,
    title: "ভয় পেলে পড়ার দোয়া",
    arabic: "أَعُوذُ بِكَلِمَاتِ اللَّهِ التَّامَّاتِ مِنْ غَضَبِهِ وَعِقَابِهِ وَشَرِّ عِبَادِهِ وَمِنْ هَمَزَاتِ الشَّيَاطِينِ وَأَنْ يَحْضُرُونِ",
    transliteration: "আউযু বিকালিমাতিলাহিত তাম্মাতি মিন গযবিহি ওয়া ইকাাবিহি ওয়া শাররি ইবাদিহি ওয়া মিন হামাযাতিশ শায়াতীনি ওয়া আইঁ ইয়াহযুরুন।",
    translation: "আমি আল্লাহর পরিপূর্ণ কালেমাসমূহের মাধ্যমে তাঁর ক্রোধ, তাঁর শাস্তি, তাঁর বান্দাদের অনিষ্ট এবং শয়তানদের কুমন্ত্রণা ও তাদের উপস্থিতি থেকে আশ্রয় চাচ্ছি।",
    reference: "আবু দাউদ ৩৮৯৩, তিরমিজি ৩৫২৮"
  },
  {
    id: 4,
    category_id: 4,
    title: "ঝড়-তুফানের দোয়া",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ خَيْرَهَا وَخَيْرَ مَا فِيهَا وَخَيْرَ مَا أُرْسِلَتْ بِهِ وَأَعُوذُ بِكَ مِنْ شَرِّهَا وَشَرِّ مَا فِيهَا وَشَرِّ مَا أُرْسِلَتْ بِهِ",
    transliteration: "আল্লাহুম্মা ইন্নী আসআলুকা খাইরাহা ওয়া খাইরা মা ফীহা ওয়া খাইরা মা উরসিলাত বিহি, ওয়া আউযু বিকা মিন শাররিহা ওয়া শাররি মা ফীহা ওয়া শাররি মা উরসিলাত বিহি।",
    translation: "হে আল্লাহ! আমি আপনার কাছে প্রার্থনা করি এই ঝড়ের কল্যাণ, এর মধ্যকার কল্যাণ এবং যে কল্যাণসহ তা প্রেরিত হয়েছে। আর আমি আপনার আশ্রয় চাচ্ছি এর অনিষ্ট থেকে, এর মধ্যকার অনিষ্ট থেকে এবং যে অনিষ্টসহ তা প্রেরিত হয়েছে।",
    reference: "সহীহ মুসলিম ৮৯৯"
  },
  {
    id: 5,
    category_id: 4,
    title: "বজ্রপাতের দোয়া",
    arabic: "اللَّهُمَّ لَا تَقْتُلْنَا بِغَضَبِكَ وَلَا تُهْلِكْنَا بِعَذَابِكَ وَعَافِنَا قَبْلَ ذَلِكَ",
    transliteration: "আল্লাহুম্মা লা তাক্বতুলনা বিগযবিকা ওয়া লা তুহলিকনা বিআযাবিকা ওয়া আ-ফিনা ক্ববলা যালিকা।",
    translation: "হে আল্লাহ! আপনি আপনার গজব দিয়ে আমাদের হত্যা করবেন না এবং আপনার শাস্তি দিয়ে আমাদের ধ্বংস করবেন না; বরং এর আগেই আমাদের নিরাপত্তা দিন।",
    reference: "তিরমিজি ৩৪৫০"
  },
  {
    id: 6,
    category_id: 4,
    title: "বৃষ্টির দোয়া",
    arabic: "اللَّهُمَّ صَيِّبًا نَافِعًا",
    transliteration: "আল্লাহুম্মা সয়্যিবান নাফিআন।",
    translation: "হে আল্লাহ! আমাদের ওপর কল্যাণকর ও উপকারী বৃষ্টি বর্ষণ করুন।",
    reference: "সহীহ বুখারী ১০৩২"
  },
  {
    id: 7,
    category_id: 5,
    title: "সংক্ষিপ্ত দরুদ",
    arabic: "صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ",
    transliteration: "সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম।",
    translation: "আল্লাহ তাঁর ওপর রহমত ও শান্তি বর্ষণ করুন।",
    reference: "সহীহ মুসলিম"
  },
  {
    id: 8,
    category_id: 5,
    title: "দরূদে ইব্রাহীম",
    arabic: "اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا صَلَّيْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَজِيدٌ اللَّهُمَّ بَارِكْ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ كَمَا بَارَكْتَ عَلَى إِبْرَاهِيمَ وَعَلَى آلِ إِبْرَاهِيمَ إِنَّكَ حَمِيدٌ مَجِيدٌ",
    transliteration: "আল্লাহুম্মা সাল্লি আলা মুহাম্মাদিওঁ ওয়া আলা আলি মুহাম্মাদিন কামা সাল্লাইতা আলা ইব্রাহীমা ওয়া আলা আলি ইব্রাহীমা ইন্নাকা হামীদুম মাজীদ। আল্লাহুম্মা বারিক আলা মুহাম্মাদিওঁ ওয়া আলা আলি মুহাম্মাদিন কামা বারাকতা আলা ইব্রাহীমা ওয়া আলা আলি ইব্রাহীমা ইন্নাকা হামীদুম মাজীদ।",
    translation: "হে আল্লাহ! মুহাম্মদ (সা.) ও তাঁর বংশধরদের ওপর রহমত বর্ষণ করুন, যেমন আপনি ইব্রাহীম (আ.) ও তাঁর বংশধরদের ওপর রহমত বর্ষণ করেছিলেন। নিশ্চয় আপনি প্রশংসিত ও সম্মানিত। হে আল্লাহ! মুহাম্মদ (সা.) ও তাঁর বংশধরদের ওপর বরকত নাজিল করুন, যেমন আপনি ইব্রাহীম (আ.) ও তাঁর বংশধরদের ওপর বরকত নাজিল করেছিলেন। নিশ্চয় আপনি প্রশংসিত ও সম্মানিত।",
    reference: "সহীহ বুখারী ৩৩৭০"
  },
  {
    id: 9,
    category_id: 6,
    title: "ছোট ইস্তিগফার",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "আস্তাগফিরুল্লাহ।",
    translation: "আমি আল্লাহর কাছে ক্ষমা প্রার্থনা করছি।",
    reference: "সহীহ মুসলিম ৫৯১"
  },
  {
    id: 10,
    category_id: 6,
    title: "সাইয়্যিদুল ইস্তিগফার (ক্ষমা প্রার্থনার শ্রেষ্ঠ দোয়া)",
    arabic: "اللَّهُمَّ أَنْتَ رَبِّي لَا إِلَهَ إِلَّا أَنْتَ خَلَقْتَنِي وَأَنَا عَبْدُكَ وَأَنَا عَلَى عَهْدِكَ وَوَعْدِكَ مَا اسْتَطَعْتُ أَعُوذُ بِكَ مِنْ شَرِّ مَا صَنَعْتُ أَبُوءُ لَكَ بِنِعْمَتِكَ عَلَيَّ وَأَبُوءُ لَكَ بِذَنْبِي فَاغْفِرْ لِي فَإِنَّهُ لَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ",
    transliteration: "আল্লাহুম্মা আনতা রব্বী লা ইলাহা ইল্লা আনতা খলাকতানী ওয়া আনা আবদুকা ওয়া আনা আলা আহদিকা ওয়া ওয়া’দিকা মাসতাত’তু, আউযু বিকা মিন শাররি মা সনা’তু আবুউ লকা বিনি’মাতিকা আলাইয়্যা ওয়া আবুউ লকা বিযান্বী ফাগফিরলী ফাইন্নাহু লা ইয়াগফিরুয যুনূবা ইল্লা আনতা।",
    translation: "হে আল্লাহ! আপনি আমার প্রতিপালক, আপনি ছাড়া কোনো সত্য মাবুদ নেই। আপনি আমাকে সৃষ্টি করেছেন এবং আমি আপনার গোলাম। আমি আমার সাধ্যানুযায়ী আপনার অঙ্গীকার ও প্রতিশ্রুতির ওপর অবিচল আছি। আমি আমার কৃতকর্মের অনিষ্ট থেকে আপনার কাছে আশ্রয় চাচ্ছি। আমার ওপর আপনার যে নেয়ামত রয়েছে তা আমি স্বীকার করছি এবং আমার গুনাহও স্বীকার করছি। অতএব আমাকে ক্ষমা করে দিন, কেননা আপনি ছাড়া আর কেউ গুনাহ ক্ষমা করতে পারে না।",
    reference: "সহীহ বুখারী ৬৩০৬"
  },
  {
    id: 11,
    category_id: 7,
    title: "দুনিয়া ও আখেরাতের কল্যাণের রব্বানা দোয়া",
    arabic: "رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً وَقِنَا عَذَابَ النَّارِ",
    transliteration: "রব্বানা আতিনা ফিদ দুনিয়া হাসানাতাওঁ ওয়া ফিল আখিরাতি হাসানাতাওঁ ওয়া কিনা আযাবান নার।",
    translation: "হে আমাদের পালনকর্তা! আমাদের দুনিয়াতে কল্যাণ দান করুন এবং আখেরাতেও কল্যাণ দান করুন এবং আমাদের দোজখের আগুন থেকে রক্ষা করুন।",
    reference: "সুরা বাকারা ২০১"
  },
  {
    id: 12,
    category_id: 7,
    title: "পিতা-মাতার জন্য রব্বানা দোয়া",
    arabic: "رَّبِّ ارْحَمْهُمَا كَمَا رَبَّيَانِي صَغِيرًا",
    transliteration: "রব্বির হামহুমা কামা রব্বায়ানি সগীরা।",
    translation: "হে আমার প্রতিপালক! তাঁদের (পিতা-মাতার) উভয়ের প্রতি দয়া করুন, যেভাবে তাঁরা শৈশবে আমাকে লালন-পালন করেছিলেন।",
    reference: "সুরা বনী ইসরাঈল ২৪"
  },
  {
    id: 13,
    category_id: 8,
    title: "হেদায়েত ও সুস্থতার দোয়া",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ الْهُدَى وَالتُّقَى وَالْعَفَافَ وَالْغِنَى",
    transliteration: "আল্লাহুম্মা ইন্নী আসআলুকাল হুদা ওয়াত তুক্বা ওয়াল আফাফা ওয়াল গিনা।",
    translation: "হে আল্লাহ! আমি আপনার কাছে হেদায়েত, তাকওয়া, চারিত্রিক পবিত্রতা এবং সচ্ছলতা প্রার্থনা করছি।",
    reference: "সহীহ মুসলিম ২৭২১"
  },
  {
    id: 14,
    category_id: 9,
    title: "আজানের পর পড়ার দোয়া",
    arabic: "اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ Тَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ وَابْعَثْهُ مَقَامًا مَحْمُودًا الَّذِي وَعَدْتَهُ",
    transliteration: "আল্লাহুম্মা রব্বা হাযিহিদ দাওয়াতিত তাম্মাতি ওয়াস সালাতিল ক্বায়িমাতি আতি মুহাম্মাদানিল ওয়াসীলাতা ওয়াল ফযীলাতা ওয়াব’আছহু মাক্বামাম মাহমূদাল্লাযী ওয়াআদতাহ।",
    translation: "হে আল্লাহ! এই পরিপূর্ণ আহ্বান এবং প্রতিষ্ঠিত সালাতের প্রতিপালক, মুহাম্মদ (সা.)-কে অসীলা (জান্নাতের সর্বোচ্চ স্থান) ও মর্যাদা দান করুন এবং তাঁকে সেই প্রশংসিত স্থানে পৌঁছান, যার প্রতিশ্রুতি আপনি তাঁকে দিয়েছেন।",
    reference: "সহীহ বুখারী ৪৭১"
  },
  {
    id: 15,
    category_id: 10,
    title: "ওজু শুরুর দোয়া",
    arabic: "بِسْمِ اللَّهِ",
    transliteration: "বিসমিল্লাহ।",
    translation: "আল্লাহর নামে (শুরু করছি)।",
    reference: "আবু দাউদ ১০১"
  },
  {
    id: 16,
    category_id: 10,
    title: "ওজু শেষের দোয়া",
    arabic: "أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ وَأَشْهَدُ أَنَّ مُحَمَّدًا عَبْدُهُ وَرَسُولُهُ اللَّهُمَّ اجْعَلْنِي مِنَ التَّوَّابِينَ وَاجْعَلْنِي مِنَ الْمُتَطَهِّرِينَ",
    transliteration: "আশহাদু আল্লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারীকা লাহু ওয়া আশহাদু আন্না মুহাম্মাদান আবদুহু ওয়া রাসূলুহু। আল্লাহুম্মাজ’আলনী মিনাত তাওয়াবীন ওয়াজ’আলনী মিনাল মুতাতহহিরীন।",
    translation: "আমি সাক্ষ্য দিচ্ছি যে, আল্লাহ ছাড়া কোনো সত্য মাবুদ নেই, তিনি একক, তাঁর কোনো অংশীদার নেই। আমি আরও সাক্ষ্য দিচ্ছি যে, মুহাম্মদ (সা.) তাঁর বান্দা ও রাসুল। হে আল্লাহ! আমাকে তওবাকারীদের অন্তর্ভুক্ত করুন এবং পবিত্রতা অর্জনকারীদের অন্তর্ভুক্ত করুন।",
    reference: "তিরমিজি ৫৫, সহীহ মুসলিম ২৩৪"
  },
  {
    id: 17,
    category_id: 11,
    title: "মসজিদে প্রবেশের দোয়া",
    arabic: "اللَّهُمَّ افْتَحْ لِي أَبْوَابَ رَحْمَتِكَ",
    transliteration: "আল্লাহুম্মাফ তাহলী আবওয়াবা রহমতিকা।",
    translation: "হে আল্লাহ! আমার জন্য আপনার রহমতের দরজাসমূহ খুলে দিন।",
    reference: "সহীহ মুসলিম ৭১৩"
  },
  {
    id: 18,
    category_id: 11,
    title: "মসজিদ থেকে বের হওয়ার দোয়া",
    arabic: "اللَّهُمَّ إِنِّي أَسْأَلُكَ مِنْ فَضْلِكَ",
    transliteration: "আল্লাহুম্মা ইন্নী আসআলুকা মিন ফাদ্বলিকা।",
    translation: "হে আল্লাহ! আমি আপনার অনুগ্রহ প্রার্থনা করছি।",
    reference: "সহীহ মুসলিম ৭১৩"
  },
  {
    id: 19,
    category_id: 12,
    title: "তাশাহহুদ (আত্তাহিয়্যাতু)",
    arabic: "التَّحِيَّاتُ لِلَّهِ وَالصَّلَوَاتُ وَالطَّيِّبَاتُ السَّلَامُ عَلَيْكَ أَيُّهَا النَّبِيُّ وَرَحْمَةُ اللَّهِ وَبَرَكَاتُهُ السَّلَامُ عَلَيْنَا وَعَلَى عِبَادِ اللَّهِ الصَّالِحِينَ أَشْهَدُ أَنْ لَا إِلَهَ إِلَّا اللَّهُ وَأَشْهَدُ أَنَّ مُحَمَّদًا عَبْدُهُ وَرَسُولُهُ",
    transliteration: "আত্তাহিয়্যাতু লিল্লাহি ওয়াছ ছালাওয়াতু ওয়াত ত্বাইয়্যিবাতু, আসসালামু আলাইকা আইয়্যুহান নাবিইয়্যু ওয়া রহমাতুল্লাহি ওয়া বারাকাতুহু, আসসালামু আলাইনা ওয়া আলা ইবাদিল্লাহিছ ছালিহীন, ashহাদু আল্লা ইলাহা ইল্লাল্লাহু ওয়া ashহাদু আন্না মুহাম্মাদান আবদুহু ওয়া রাসূলুহু।",
    translation: "যাবতীয় অভিবাদন, সালাত ও পবিত্র কাজ আল্লাহর জন্য। হে নবী! আপনার ওপর শান্তি, আল্লাহর রহমত ও বরকত বর্ষিত হোক। আমাদের ওপর এবং আল্লাহর নেক বান্দাদের ওপর শান্তি বর্ষিত হোক। আমি সাক্ষ্য দিচ্ছি যে, আল্লাহ ছাড়া কোনো সত্য মাবুদ নেই এবং আমি সাক্ষ্য দিচ্ছি যে, মুহাম্মদ (সা.) আল্লাহর বান্দা ও রাসুল।",
    reference: "সহীহ বুখারী ৮৩১, সহীহ মুসলিম ৪০২"
  },
  {
    id: 20,
    category_id: 12,
    title: "দোয়া মাসূরা (নামাজে সালাম ফেরানোর আগের দোয়া)",
    arabic: "اللَّهُمَّ إِنِّي ظَلَمْتُ نَفْسِي ظُلْمًا كَثِيرًا وَلَا يَغْفِرُ الذُّنُوبَ إِلَّا أَنْتَ فَاغْفِرْ لِي مَغْفِرَةً مِنْ عِنْدِكَ وَارْهَمْنِي إِنَّكَ أَنْتَ الْغَفُورُ الرَّحِيمُ",
    transliteration: "আল্লাহুম্মা ইন্নী জলামতু নাফসী জুলমান কাষীরাওঁ ওয়ালা ইয়াগফিরুয যুনূবা ইল্লা আনতা, ফাগফিরলী মাগফিরাতাম মিন ইনদিকা ওয়ারহামনী ইন্নাকা আনতাল গাফুরুর রাহীম।",
    translation: "হে আল্লাহ! আমি নিজের ওপর অনেক জুলুম করেছি, আর আপনি ছাড়া গুনাহ ক্ষমা করার কেউ নেই। অতএব আপনার পক্ষ থেকে আমাকে বিশেষ ক্ষমা দান করুন এবং আমার প্রতি দয়া করুন। নিশ্চয় আপনি পরম ক্ষমাশীল ও অতি দয়ালু।",
    reference: "সহীহ বুখারী ৮৩৪, সহীহ মুসলিম ২৭০৫"
  },
  {
    id: 21,
    category_id: 13,
    title: "সকালের দোয়া",
    arabic: "اللَّهُمَّ بِكَ أَصْبَحْنَا وَبِكَ أَمْسَيْنَا وَبِكَ نَحْيَا وَبِكَ نَمُوتُ وَإِليك النشوُر",
    transliteration: "আল্লাহুম্মা বিকা আসবাহনা ওয়া বিকা আমসাইনা ওয়া বিকা নাহইয়া ওয়া বিকা নামুতু ওয়া ইলাইকান নুশুর।",
    translation: "হে আল্লাহ! আপনার অনুগ্রহে আমরা সকালে উপনীত হয়েছি এবং আপনার অনুগ্রহেই আমরা সন্ধ্যায় উপনীত হই। আপনার অনুগ্রহেই আমরা জীবিত থাকি এবং আপনার হুকুমেই আমরা মৃত্যুবরণ করি। আর আপনার দিকেই আমাদের পুনরুত্থান।",
    reference: "তিরমিজি ৩৩৯১"
  },
  {
    id: 22,
    category_id: 13,
    title: "সন্ধ্যার দোয়া",
    arabic: "أَمْسَيْنَا وَأَمْسَى الْمُلْكُ لِلَّهِ وَالْحَمْدُ لِلَّهِ لَا إِلَهَ إِلَّا اللَّهُ وَحْدَهُ لَا شَرِيكَ لَهُ",
    transliteration: "আমসাইনা ওয়া আমসাল মুলকু লিল্লাহি ওয়াল হামদুলিল্লাহি লা ইলাহা ইল্লাল্লাহু ওয়াহদাহু লা শারীকা লাহু।",
    translation: "আমরা সন্ধ্যায় উপনীত হলাম এবং সন্ধ্যায় সমস্ত রাজত্ব ও প্রশংসা আল্লাহর জন্য। আল্লাহ ছাড়া কোনো সত্য মাবুদ নেই, তিনি একক, তাঁর কোনো অংশীদার নেই।",
    reference: "সহীহ মুসলিম ২৭২৩"
  },
  {
    id: 23,
    category_id: 14,
    title: "ইফতারের দোয়া",
    arabic: "ذَهَبَ الظَّمَأُ وَابْتَلَّتِ الْعُرُوقُ وَثَبَتَ الْأَجْرُ إِنْ شَاءَ اللَّهُ",
    transliteration: "যাহাবায জোমায়ু ওয়াবতাল্লাতিল উরূকু ওয়া ছাবাতাল আজরু ইনশাআল্লাহ।",
    translation: "পিপাসা দূর হয়েছে, শিরা-উপশিরা সিক্ত হয়েছে এবং আল্লাহ চাইলে পুরস্কার নির্ধারিত হয়েছে।",
    reference: "আবু দাউদ ২৩৫৭"
  },
  {
    id: 24,
    category_id: 14,
    title: "সেহরির নিয়ত",
    arabic: "وَبِصَوْمِ غَدٍ نَّوَيْتُ مِنْ شَهْرِ رَمَضَانَ",
    transliteration: "ওয়া বিসাওমি গাদিন নাওয়াইতু মিন শাহরি রামাদ্বান।",
    translation: "আমি আগামীকাল পবিত্র রমজান মাসের রোজা রাখার নিয়ত করছি। (দ্রষ্টব্য: মুখে উচ্চারণ করার চেয়ে অন্তরের সংকল্পই আসল নিয়ত)",
    reference: "প্রচলিত নিয়ম ও সংকল্প"
  },
  {
    id: 25,
    category_id: 15,
    title: "তালবিয়াহ (হজ ও ওমরার বিশেষ দোয়া)",
    arabic: "لَبَّيْكَ اللَّهُمَّ لَبَّيْكَ، لَبَّيْكَ لَا شَرِيكَ لَكَ لَبَّيْكَ، إِنَّ الْحَمْدَ وَالنِّعْمَةَ لَكَ وَالْمُلْكَ، لَا شَرِيكَ لَكَ",
    transliteration: "লাব্বায়িক আল্লাহুম্মা লাব্বায়িক, লাব্বায়িকা লা শারীকা লাকা লাব্বায়িক, ইন্নাল হামদা ওয়ান নি’মাতা লাকা ওয়াল মুলক, লা শারীকা লাক।",
    translation: "আমি হাজির হে আল্লাহ, আমি হাজির। আমি হাজির, আপনার কোনো অংশীদার নেই, আমি হাজির। নিশ্চয় সমস্ত প্রশংসা, নেয়ামত এবং রাজত্ব একমাত্র আপনারই, আপনার কোনো অংশীদার নেই।",
    reference: "সহীহ বুখারী ১৫৪৯, সহীহ মুসলিম ২৭১৮"
  }
];

const DuaSection = ({ onCategoryClick }: { onCategoryClick: (cat: DuaCategory) => void }) => {
  return (
    <section id="duas" className="py-20 px-4 bg-white">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="text-gold font-medium tracking-widest uppercase text-sm mb-4 block">প্রয়োজনীয় দোয়া</span>
          <h2 className="text-5xl font-serif text-emerald-900">দৈনন্দিন জীবনের দোয়া</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {DUA_CATEGORIES.map((cat) => (
            <motion.div 
              key={cat.id}
              whileHover={{ y: -5, scale: 1.02, boxShadow: "0 10px 30px -10px rgba(0,0,0,0.05)" }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCategoryClick(cat)}
              className="bg-white p-8 rounded-3xl border border-emerald-900/5 shadow-sm hover:shadow-md transition-all text-center cursor-pointer group"
            >
              <div className={`w-14 h-14 ${cat.color} rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform`}>
                <cat.icon className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-serif text-emerald-900 font-bold">{cat.title}</h3>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

const DuaModal = ({ isOpen, onClose, category }: { isOpen: boolean, onClose: () => void, category: DuaCategory | null }) => {
  const categoryDuas = category ? DUAS.filter(d => d.category_id === category.id) : [];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative bg-cream w-full max-w-2xl max-h-[85vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col"
          >
            <div className="p-8 border-b border-emerald-900/10 flex justify-between items-center bg-white">
              <div className="flex items-center gap-4">
                {category && (
                  <div className={`w-12 h-12 ${category.color} rounded-xl flex items-center justify-center`}>
                    <category.icon className="w-6 h-6" />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-serif text-emerald-900">{category?.title}</h2>
                  <p className="text-emerald-900/40 text-xs font-bold uppercase tracking-widest">{categoryDuas.length}টি দোয়া পাওয়া গেছে</p>
                </div>
              </div>
              <button onClick={onClose} className="w-10 h-10 bg-emerald-900/5 text-emerald-900/40 rounded-full flex items-center justify-center hover:bg-emerald-900 hover:text-white transition-all"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-8 no-scrollbar">
              {categoryDuas.length > 0 ? (
                categoryDuas.map((dua) => (
                  <div key={dua.id} className="bg-white p-8 rounded-3xl border border-emerald-900/5 shadow-sm space-y-6">
                    <h3 className="text-xl font-serif text-emerald-900 font-bold border-b border-emerald-900/5 pb-4">{dua.title}</h3>
                    <div className="text-3xl font-serif text-emerald-900 text-right leading-[1.8]" style={{ direction: 'rtl' }}>
                      {dua.arabic}
                    </div>
                    <div className="space-y-4">
                      <div className="bg-emerald-900/5 p-4 rounded-2xl">
                        <div className="text-xs font-bold text-emerald-900/30 uppercase tracking-widest mb-1">উচ্চারণ</div>
                        <div className="text-emerald-900/70 italic leading-relaxed">{dua.transliteration}</div>
                      </div>
                      <div className="bg-gold/5 p-4 rounded-2xl">
                        <div className="text-xs font-bold text-gold/40 uppercase tracking-widest mb-1">অর্থ</div>
                        <div className="text-emerald-900 leading-relaxed font-medium">{dua.translation}</div>
                      </div>
                    </div>
                    {dua.reference && (
                      <div className="text-xs text-emerald-900/30 font-bold uppercase tracking-widest text-center pt-2">
                        সূত্র: {dua.reference}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-20">
                  <Book className="w-16 h-16 text-emerald-900/10 mx-auto mb-4" />
                  <p className="text-emerald-900/40 font-serif text-xl">এই ক্যাটাগরিতে বর্তমানে কোনো দোয়া নেই।</p>
                  <p className="text-sm text-emerald-900/20 mt-2">আমরা শীঘ্রই আরও দোয়া যোগ করব ইনশাআল্লাহ।</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const TasbihModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [presets, setPresets] = useState<TasbihPreset[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<TasbihPreset | null>(null);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (isOpen) {
      db.getTasbihPresets().then(data => {
        setPresets(data);
        if (data.length > 0) setSelectedPreset(data[0]);
      });
    }
  }, [isOpen]);

  const handleIncrement = () => {
    if (selectedPreset && count < selectedPreset.target) {
      setCount(count + 1);
      if (count + 1 === selectedPreset.target) {
        // Vibrate if supported
        if ('vibrate' in navigator) navigator.vibrate(200);
      }
    }
  };

  const handleReset = () => {
    setCount(0);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-cream w-full max-w-md rounded-[3rem] p-10 shadow-2xl text-center overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-6">
              <button onClick={onClose} className="text-emerald-900/40 hover:text-emerald-900"><X /></button>
            </div>

            <div className="mb-8">
              <div className="text-xs font-bold text-gold uppercase tracking-widest mb-4">ডিজিটাল তাসবিহ</div>
              <div className="flex gap-2 justify-center mb-6 overflow-x-auto no-scrollbar pb-2">
                {presets.map(p => (
                  <button 
                    key={p.id}
                    onClick={() => { setSelectedPreset(p); setCount(0); }}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${selectedPreset?.id === p.id ? 'bg-emerald-900 text-cream' : 'bg-emerald-900/5 text-emerald-900'}`}
                  >
                    {p.name} ({p.target})
                  </button>
                ))}
              </div>
            </div>

            <div className="relative mb-10">
              <div className="text-8xl font-serif text-emerald-900 mb-2">{count}</div>
              <div className="text-emerald-900/40 font-medium uppercase tracking-widest text-sm">
                লক্ষ্য: {selectedPreset?.target || 33}
              </div>
              
              <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none" viewBox="0 0 100 100">
                <circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  className="text-emerald-900/5"
                />
                <motion.circle 
                  cx="50" cy="50" r="45" 
                  fill="none" 
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeDasharray="283"
                  animate={{ strokeDashoffset: 283 - (283 * (count / (selectedPreset?.target || 33))) }}
                  className="text-gold"
                />
              </svg>
            </div>

            <div className="flex flex-col gap-4">
              <button 
                onClick={handleIncrement}
                className="w-full aspect-square max-w-[120px] mx-auto bg-emerald-900 text-cream rounded-full shadow-2xl shadow-emerald-900/40 flex items-center justify-center hover:scale-105 active:scale-95 transition-all"
              >
                <Plus className="w-12 h-12" />
              </button>
              <button 
                onClick={handleReset}
                className="text-emerald-900/40 hover:text-emerald-900 font-bold uppercase tracking-widest text-xs mt-4"
              >
                রিসেট করুন
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
const SearchModal = ({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{
    names: NameOfAllah[],
    resources: Resource[],
    sectionItems: (SectionItem & { section_title: string })[],
    qa: QA[]
  }>({ names: [], resources: [], sectionItems: [], qa: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query) {
        handleSearch();
      } else {
        setResults({ names: [], resources: [], sectionItems: [], qa: [] });
      }
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const data = await db.search(query);
      setResults(data);
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-20 px-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            className="relative bg-cream w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
          >
            <div className="p-6 border-b border-emerald-900/10 flex items-center gap-4">
              <Search className="text-emerald-900/40 w-6 h-6" />
              <input 
                autoFocus
                type="text"
                placeholder="নাম, রিসোর্স, প্রশ্নোত্তর খুঁজুন..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-1 bg-transparent text-xl font-serif text-emerald-900 focus:outline-none"
              />
              <button onClick={onClose} className="text-emerald-900/40 hover:text-emerald-900"><X /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8">
              {loading && <div className="text-center py-10 text-emerald-900/40">খুঁজছি...</div>}
              
              {!loading && !query && (
                <div className="text-center py-10 text-emerald-900/40">
                  খুঁজতে কিছু লিখুন...
                </div>
              )}

              {!loading && query && (
                <>
                  {results.names.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-4">আল্লাহর নামসমূহ</h4>
                      <div className="grid grid-cols-2 gap-4">
                        {results.names.map(name => (
                          <div key={name.id} className="p-4 bg-white rounded-2xl border border-emerald-900/5">
                            <div className="text-2xl font-serif text-emerald-900">{name.name_arabic}</div>
                            <div className="text-sm text-emerald-900/60">{name.name_transliteration}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.sectionItems.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-4">বিষয়বস্তু</h4>
                      <div className="space-y-4">
                        {results.sectionItems.map(item => (
                          <div key={item.id} className="p-4 bg-white rounded-2xl border border-emerald-900/5">
                            <div className="text-xs text-emerald-900/40 mb-1">{item.section_title}</div>
                            <div className="font-serif text-lg text-emerald-900">{item.title}</div>
                            <div className="text-sm text-emerald-900/60 line-clamp-1">{item.description}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.resources.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-4">রিসোর্স</h4>
                      <div className="space-y-4">
                        {results.resources.map(res => (
                          <div key={res.id} className="p-4 bg-white rounded-2xl border border-emerald-900/5 flex justify-between items-center">
                            <div>
                              <div className="font-serif text-lg text-emerald-900">{res.title}</div>
                              <div className="text-xs text-gold font-bold uppercase">{res.category}</div>
                            </div>
                            <Download className="w-4 h-4 text-emerald-900/40" />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.qa.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-gold uppercase tracking-widest mb-4">প্রশ্নোত্তর</h4>
                      <div className="space-y-4">
                        {results.qa.map(q => (
                          <div key={q.id} className="p-4 bg-white rounded-2xl border border-emerald-900/5">
                            <div className="font-serif text-lg text-emerald-900">প্রশ্ন: {q.question}</div>
                            <div className="text-sm text-emerald-900/60 line-clamp-2">উত্তর: {q.answer}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {results.names.length === 0 && results.resources.length === 0 && results.sectionItems.length === 0 && results.qa.length === 0 && (
                    <div className="text-center py-10 text-emerald-900/40">
                      "{query}" এর জন্য কোনো ফলাফল পাওয়া যায়নি
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

const AdminLoginModal = ({ isOpen, onClose, onLoginSuccess }: { isOpen: boolean, onClose: () => void, onLoginSuccess: () => void }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'barakahislamic 2026') {
      onLoginSuccess();
      setPassword('');
      setError('');
    } else {
      setError('ভুল পাসওয়ার্ড! আবার চেষ্টা করুন।');
    }
  };

  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
    }
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-emerald-950/60 backdrop-blur-sm"
          />
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="relative bg-cream w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl overflow-hidden border border-emerald-900/10 text-center"
          >
            <button 
              onClick={onClose} 
              className="absolute top-6 right-6 w-10 h-10 bg-emerald-900/5 text-emerald-900/40 rounded-full flex items-center justify-center hover:bg-emerald-900 hover:text-white transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mb-8 mt-4">
              <div className="w-16 h-16 bg-emerald-900/5 text-emerald-900 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Shield className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-serif text-emerald-900 font-bold">এডমিন লগইন</h3>
              <p className="text-emerald-900/40 text-xs font-bold uppercase tracking-widest mt-1">শুধুমাত্র অনুমোদিত ব্যবহারকারীর জন্য</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <input 
                  autoFocus
                  type="password"
                  placeholder="পাসওয়ার্ড লিখুন..."
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="w-full px-6 py-4 bg-white rounded-2xl border border-emerald-900/10 text-emerald-900 font-serif text-center focus:outline-none focus:border-gold transition-all"
                />
                {error && (
                  <p className="text-red-500 text-sm font-medium">{error}</p>
                )}
              </div>

              <button 
                type="submit"
                className="w-full py-4 bg-emerald-900 text-cream rounded-2xl font-bold hover:bg-emerald-800 transition-all shadow-lg shadow-emerald-900/10"
              >
                প্রবেশ করুন
              </button>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isTasbihOpen, setIsTasbihOpen] = useState(false);
  const [isQuranOpen, setIsQuranOpen] = useState(false);
  const [isHadithOpen, setIsHadithOpen] = useState(false);
  const [isQiblaOpen, setIsQiblaOpen] = useState(false);
  const [isMakkahOpen, setIsMakkahOpen] = useState(false);
  const [isBarakahAIOpen, setIsBarakahAIOpen] = useState(false);
  const [isDuaOpen, setIsDuaOpen] = useState(false);
  const [selectedDuaCategory, setSelectedDuaCategory] = useState<DuaCategory | null>(null);

  return (
    <div className="min-h-screen">
      <Navbar 
        isAdmin={isAdmin} 
        onAdminClick={() => setShowAdminLogin(true)} 
        onHomeClick={() => setIsAdmin(false)} 
        onSearchClick={() => setIsSearchOpen(true)}
      />
      <AdminLoginModal 
        isOpen={showAdminLogin} 
        onClose={() => setShowAdminLogin(false)} 
        onLoginSuccess={() => {
          setIsAdmin(true);
          setShowAdminLogin(false);
        }} 
      />
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      <TasbihModal isOpen={isTasbihOpen} onClose={() => setIsTasbihOpen(false)} />
      <QuranModal isOpen={isQuranOpen} onClose={() => setIsQuranOpen(false)} />
      <HadithModal isOpen={isHadithOpen} onClose={() => setIsHadithOpen(false)} />
      <QiblaModal isOpen={isQiblaOpen} onClose={() => setIsQiblaOpen(false)} />
      <LiveMakkahModal isOpen={isMakkahOpen} onClose={() => setIsMakkahOpen(false)} />
      <BarakahAIModal isOpen={isBarakahAIOpen} onClose={() => setIsBarakahAIOpen(false)} />
      <DuaModal 
        isOpen={isDuaOpen} 
        onClose={() => setIsDuaOpen(false)} 
        category={selectedDuaCategory} 
      />
      <main>
        {isAdmin ? (
          <AdminPanel />
        ) : (
          <>
            <DateBar />
            <BarakahAITrigger onClick={() => setIsBarakahAIOpen(true)} />
            <ServiceGrid 
              onTasbihClick={() => setIsTasbihOpen(true)} 
              onQuranClick={() => setIsQuranOpen(true)}
              onHadithClick={() => setIsHadithOpen(true)}
              onQiblaClick={() => setIsQiblaOpen(true)}
              onMakkahClick={() => setIsMakkahOpen(true)}
            />
            <DuaSection onCategoryClick={(cat) => { setSelectedDuaCategory(cat); setIsDuaOpen(true); }} />
            <EventsSection />
            <BarakahPlanner />
            <NamesOfAllahSection />
            <DynamicSections />
            <ResourceLibrary />
            <AskScholar />
          </>
        )}
      </main>
      <Footer />
    </div>
  );
}


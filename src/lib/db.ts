import { seedNames, seedResources, seedDailyContent, seedTasbihPresets } from './initialData';

export interface SectionItem {
  id: number;
  section_id: number;
  title: string;
  description: string;
  image_url: string;
  display_order: number;
}

export interface DynamicSection {
  id: number;
  title: string;
  layout_type: 'grid' | 'list';
  display_order: number;
  items: SectionItem[];
}

export interface NameOfAllah {
  id: number;
  name_arabic: string;
  name_transliteration: string;
  meaning: string;
  benefit: string;
}

export interface QA {
  id: number;
  question: string;
  answer: string;
  status: string;
  created_at: string;
}

export interface Resource {
  id: number;
  title: string;
  category: string;
  url: string;
}

export interface Event {
  id: number;
  title: string;
  date: string;
  location: string;
  description: string;
  image_url: string;
}

export interface DailyContent {
  id: number;
  type: 'ayah' | 'hadith';
  content: string;
  reference: string;
  active: number;
}

export interface TasbihPreset {
  id: number;
  name: string;
  target: number;
}

// Helpers
const getStorage = <T>(key: string, defaultValue: T): T => {
  const val = localStorage.getItem(key);
  if (!val) return defaultValue;
  try {
    return JSON.parse(val) as T;
  } catch (e) {
    return defaultValue;
  }
};

const setStorage = <T>(key: string, value: T): void => {
  localStorage.setItem(key, JSON.stringify(value));
};

export const initializeDB = () => {
  if (!localStorage.getItem('barakah_initialized')) {
    setStorage('barakah_names_of_allah', seedNames.map((n, i) => ({ id: i + 1, name_arabic: n.arabic, name_transliteration: n.transliteration, meaning: n.meaning, benefit: n.benefit })));
    setStorage('barakah_sections', []);
    setStorage('barakah_section_items', []);
    setStorage('barakah_resources', seedResources);
    setStorage('barakah_events', []);
    setStorage('barakah_daily_content', seedDailyContent);
    setStorage('barakah_tasbih_presets', seedTasbihPresets);
    setStorage('barakah_qa', []);
    localStorage.setItem('barakah_initialized', 'true');
  }
};

// Initialize on import
initializeDB();

export const db = {
  // Names of Allah
  getNames: async (): Promise<NameOfAllah[]> => {
    return getStorage<NameOfAllah[]>('barakah_names_of_allah', []);
  },
  addName: async (name: Omit<NameOfAllah, 'id'>): Promise<NameOfAllah> => {
    const list = getStorage<NameOfAllah[]>('barakah_names_of_allah', []);
    const nextId = list.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newItem = { ...name, id: nextId };
    list.push(newItem);
    setStorage('barakah_names_of_allah', list);
    return newItem;
  },
  deleteName: async (id: number): Promise<void> => {
    const list = getStorage<NameOfAllah[]>('barakah_names_of_allah', []);
    setStorage('barakah_names_of_allah', list.filter(item => item.id !== id));
  },

  // Sections
  getSections: async (): Promise<DynamicSection[]> => {
    const sections = getStorage<Omit<DynamicSection, 'items'>[]>('barakah_sections', []);
    const items = getStorage<SectionItem[]>('barakah_section_items', []);
    return sections.map(sec => ({
      ...sec,
      items: items.filter(item => item.section_id === sec.id).sort((a, b) => a.display_order - b.display_order)
    })).sort((a, b) => a.display_order - b.display_order);
  },
  addSection: async (section: { title: string; layout_type: 'grid' | 'list' }): Promise<any> => {
    const list = getStorage<any[]>('barakah_sections', []);
    const nextId = list.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const nextOrder = list.reduce((max, item) => item.display_order > max ? item.display_order : max, 0) + 1;
    const newItem = { id: nextId, title: section.title, layout_type: section.layout_type, display_order: nextOrder };
    list.push(newItem);
    setStorage('barakah_sections', list);
    return newItem;
  },
  deleteSection: async (id: number): Promise<void> => {
    const list = getStorage<any[]>('barakah_sections', []);
    setStorage('barakah_sections', list.filter(item => item.id !== id));
    // Cascade delete items
    const items = getStorage<SectionItem[]>('barakah_section_items', []);
    setStorage('barakah_section_items', items.filter(item => item.section_id !== id));
  },
  addSectionItem: async (item: { section_id: number; title: string; description: string; image_url: string }): Promise<SectionItem> => {
    const list = getStorage<SectionItem[]>('barakah_section_items', []);
    const nextId = list.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const nextOrder = list.filter(i => i.section_id === item.section_id).reduce((max, i) => i.display_order > max ? i.display_order : max, 0) + 1;
    const newItem = { ...item, id: nextId, display_order: nextOrder };
    list.push(newItem);
    setStorage('barakah_section_items', list);
    return newItem;
  },
  deleteSectionItem: async (id: number): Promise<void> => {
    const list = getStorage<SectionItem[]>('barakah_section_items', []);
    setStorage('barakah_section_items', list.filter(item => item.id !== id));
  },

  // Q&A
  getQA: async (publishedOnly = false): Promise<QA[]> => {
    const list = getStorage<QA[]>('barakah_qa', []);
    if (publishedOnly) {
      return list.filter(q => q.status === 'published');
    }
    return list;
  },
  addQuestion: async (question: string): Promise<QA> => {
    const list = getStorage<QA[]>('barakah_qa', []);
    const nextId = list.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newItem: QA = {
      id: nextId,
      question,
      answer: '',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    list.push(newItem);
    setStorage('barakah_qa', list);
    return newItem;
  },
  answerQuestion: async (id: number, answer: string): Promise<QA | null> => {
    const list = getStorage<QA[]>('barakah_qa', []);
    const index = list.findIndex(item => item.id === id);
    if (index !== -1) {
      list[index].answer = answer;
      list[index].status = 'published';
      setStorage('barakah_qa', list);
      return list[index];
    }
    return null;
  },
  deleteQA: async (id: number): Promise<void> => {
    const list = getStorage<QA[]>('barakah_qa', []);
    setStorage('barakah_qa', list.filter(item => item.id !== id));
  },

  // Resources
  getResources: async (): Promise<Resource[]> => {
    return getStorage<Resource[]>('barakah_resources', []);
  },
  addResource: async (resource: Omit<Resource, 'id'>): Promise<Resource> => {
    const list = getStorage<Resource[]>('barakah_resources', []);
    const nextId = list.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newItem = { ...resource, id: nextId };
    list.push(newItem);
    setStorage('barakah_resources', list);
    return newItem;
  },
  deleteResource: async (id: number): Promise<void> => {
    const list = getStorage<Resource[]>('barakah_resources', []);
    setStorage('barakah_resources', list.filter(item => item.id !== id));
  },

  // Events
  getEvents: async (): Promise<Event[]> => {
    return getStorage<Event[]>('barakah_events', []);
  },
  addEvent: async (event: Omit<Event, 'id'>): Promise<Event> => {
    const list = getStorage<Event[]>('barakah_events', []);
    const nextId = list.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newItem = { ...event, id: nextId };
    list.push(newItem);
    setStorage('barakah_events', list);
    return newItem;
  },
  deleteEvent: async (id: number): Promise<void> => {
    const list = getStorage<Event[]>('barakah_events', []);
    setStorage('barakah_events', list.filter(item => item.id !== id));
  },

  // Daily Content
  getDailyContent: async (): Promise<DailyContent[]> => {
    return getStorage<DailyContent[]>('barakah_daily_content', []);
  },
  getActiveDailyContent: async (): Promise<DailyContent | null> => {
    const list = getStorage<DailyContent[]>('barakah_daily_content', []);
    return list.find(item => item.active === 1) || null;
  },
  addDailyContent: async (content: Omit<DailyContent, 'id' | 'active'>): Promise<DailyContent> => {
    const list = getStorage<DailyContent[]>('barakah_daily_content', []);
    const nextId = list.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newItem = { ...content, id: nextId, active: 0 };
    list.push(newItem);
    setStorage('barakah_daily_content', list);
    return newItem;
  },
  activateDailyContent: async (id: number): Promise<void> => {
    const list = getStorage<DailyContent[]>('barakah_daily_content', []);
    const updated = list.map(item => ({
      ...item,
      active: item.id === id ? 1 : 0
    }));
    setStorage('barakah_daily_content', updated);
  },
  deleteDailyContent: async (id: number): Promise<void> => {
    const list = getStorage<DailyContent[]>('barakah_daily_content', []);
    setStorage('barakah_daily_content', list.filter(item => item.id !== id));
  },

  // Tasbih Presets
  getTasbihPresets: async (): Promise<TasbihPreset[]> => {
    return getStorage<TasbihPreset[]>('barakah_tasbih_presets', []);
  },
  addTasbihPreset: async (preset: Omit<TasbihPreset, 'id'>): Promise<TasbihPreset> => {
    const list = getStorage<TasbihPreset[]>('barakah_tasbih_presets', []);
    const nextId = list.reduce((max, item) => item.id > max ? item.id : max, 0) + 1;
    const newItem = { ...preset, id: nextId };
    list.push(newItem);
    setStorage('barakah_tasbih_presets', list);
    return newItem;
  },
  deleteTasbihPreset: async (id: number): Promise<void> => {
    const list = getStorage<TasbihPreset[]>('barakah_tasbih_presets', []);
    setStorage('barakah_tasbih_presets', list.filter(item => item.id !== id));
  },

  // Stats
  getStats: async (): Promise<any> => {
    const questions = getStorage<QA[]>('barakah_qa', []);
    const pendingQuestions = questions.filter(q => q.status === 'pending').length;
    const resources = getStorage<Resource[]>('barakah_resources', []).length;
    const sections = getStorage<any[]>('barakah_sections', []).length;
    const events = getStorage<Event[]>('barakah_events', []).length;
    const names = getStorage<NameOfAllah[]>('barakah_names_of_allah', []).length;

    return {
      questions: questions.length,
      pendingQuestions,
      resources,
      sections,
      events,
      names
    };
  },

  // Search
  search: async (query: string): Promise<{
    names: NameOfAllah[];
    resources: Resource[];
    sectionItems: (SectionItem & { section_title: string })[];
    qa: QA[];
  }> => {
    const lowerQuery = query.toLowerCase().trim();
    if (!lowerQuery) {
      return { names: [], resources: [], sectionItems: [], qa: [] };
    }

    const names = getStorage<NameOfAllah[]>('barakah_names_of_allah', [])
      .filter(n =>
        n.name_arabic.toLowerCase().includes(lowerQuery) ||
        n.name_transliteration.toLowerCase().includes(lowerQuery) ||
        n.meaning.toLowerCase().includes(lowerQuery)
      );

    const resources = getStorage<Resource[]>('barakah_resources', [])
      .filter(r =>
        r.title.toLowerCase().includes(lowerQuery) ||
        r.category.toLowerCase().includes(lowerQuery)
      );

    const sectionsList = getStorage<Omit<DynamicSection, 'items'>[]>('barakah_sections', []);
    const items = getStorage<SectionItem[]>('barakah_section_items', []);
    const sectionItems = items
      .filter(item =>
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description.toLowerCase().includes(lowerQuery)
      )
      .map(item => {
        const parentSec = sectionsList.find(s => s.id === item.section_id);
        return {
          ...item,
          section_title: parentSec ? parentSec.title : ''
        };
      });

    const qa = getStorage<QA[]>('barakah_qa', [])
      .filter(q =>
        q.status === 'published' &&
        (q.question.toLowerCase().includes(lowerQuery) ||
         q.answer.toLowerCase().includes(lowerQuery))
      );

    return {
      names,
      resources,
      sectionItems,
      qa
    };
  }
};

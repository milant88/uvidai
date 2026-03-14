export interface UnratedMessage {
  id: string;
  content: string;
  conversationId: string;
  module: string;
  createdAt: string;
}

export interface AdminRating {
  id: string;
  messageId: string;
  accuracy: number;
  completeness: number;
  relevance: number;
  tone: number;
  overall: number;
  overallScore?: number;
  tags: string[];
  idealResponse?: string;
  idealResponseText?: string;
  notes?: string;
  ratedAt: string;
}

export interface Feedback {
  id: string;
  sentiment: 'positive' | 'negative' | 'neutral';
  comment: string;
  rating?: number;
  categories: string[];
  userId: string;
  messageId: string;
  conversationId: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  user?: string;
  module: string;
  modulesUsed?: string[];
  language?: string;
  rating?: number | null;
  startedAt: string;
  messageCount: number;
}

export interface MockMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    module: string;
    provider: string;
    model: string;
    tokens: { prompt: number; completion: number; total: number };
    latencyMs: number;
    toolCalls: number;
  };
}

export interface QueryVolumeData {
  date: string;
  queries: number;
}

export interface HourlyData {
  hour: string;
  queries: number;
}

export interface AgentUsageData {
  agent: string;
  queries: number;
  avgLatency: number;
}

export interface TopModule {
  module: string;
  count: number;
}

export interface DailyActiveUsers {
  date: string;
  users: number;
}

export interface CostPerProvider {
  provider: string;
  cost: number;
  tokens: number;
}

export interface LatencyPercentiles {
  p50: number;
  p75: number;
  p90: number;
  p95: number;
  p99: number;
}

export interface Stats {
  totalConversations: number;
  totalMessages: number;
  messagesToday: number;
  activeUsers: number;
  avgResponseTime: number;
  avgRating: number;
  totalFeedback: number;
  aiCostToday: number;
}

export const mockUnratedMessages: UnratedMessage[] = [
  { id: 'msg-001', content: 'Kako mogu podnijeti zahtjev za studentsku vizu u Njemačkoj? Trebam informacije o dokumentima, rokovima i postupku prijave.', conversationId: 'conv-001', module: 'visa-info', createdAt: '2026-03-12T14:30:00Z' },
  { id: 'msg-002', content: 'What are the requirements for enrolling in a Master\'s program at the University of Zagreb?', conversationId: 'conv-002', module: 'enrollment', createdAt: '2026-03-12T15:10:00Z' },
  { id: 'msg-003', content: 'Can you explain the grading system used in Croatian universities and how it maps to ECTS?', conversationId: 'conv-003', module: 'academic-info', createdAt: '2026-03-12T15:45:00Z' },
  { id: 'msg-004', content: 'Gdje se mogu prijaviti za smještaj u studentski dom? Koji su kriteriji za dobivanje mjesta?', conversationId: 'conv-004', module: 'housing', createdAt: '2026-03-12T16:20:00Z' },
  { id: 'msg-005', content: 'I need help understanding scholarship opportunities for international students in Croatia.', conversationId: 'conv-005', module: 'financial-aid', createdAt: '2026-03-12T16:55:00Z' },
  { id: 'msg-006', content: 'What documents do I need for diploma recognition in Croatia?', conversationId: 'conv-006', module: 'documents', createdAt: '2026-03-12T17:30:00Z' },
  { id: 'msg-007', content: 'Kako funkcionira Erasmus+ program za studente s hrvatskih sveučilišta?', conversationId: 'conv-007', module: 'exchange', createdAt: '2026-03-12T18:00:00Z' },
  { id: 'msg-008', content: 'Can I take courses from different faculties during my exchange semester?', conversationId: 'conv-008', module: 'academic-info', createdAt: '2026-03-12T18:30:00Z' },
  { id: 'msg-009', content: 'What health insurance do I need as an international student?', conversationId: 'conv-009', module: 'insurance', createdAt: '2026-03-12T19:00:00Z' },
  { id: 'msg-010', content: 'Koji su rokovi za upis u zimski semestar 2026/2027?', conversationId: 'conv-010', module: 'enrollment', createdAt: '2026-03-12T19:30:00Z' },
  { id: 'msg-011', content: 'Where can I find information about part-time jobs for students?', conversationId: 'conv-011', module: 'career', createdAt: '2026-03-13T08:00:00Z' },
  { id: 'msg-012', content: 'How do I apply for a student loan in Croatia?', conversationId: 'conv-012', module: 'financial-aid', createdAt: '2026-03-13T08:30:00Z' },
  { id: 'msg-013', content: 'Trebam informacije o priznavanju inozemne diplome za zaposlenje.', conversationId: 'conv-013', module: 'documents', createdAt: '2026-03-13T09:00:00Z' },
  { id: 'msg-014', content: 'What language proficiency tests are accepted for admission?', conversationId: 'conv-014', module: 'enrollment', createdAt: '2026-03-13T09:30:00Z' },
  { id: 'msg-015', content: 'Can you provide details about the student cafeteria system and meal plans?', conversationId: 'conv-015', module: 'campus-life', createdAt: '2026-03-13T10:00:00Z' },
  { id: 'msg-016', content: 'Kako se prijaviti za demonstraturu na fakultetu?', conversationId: 'conv-016', module: 'academic-info', createdAt: '2026-03-13T10:30:00Z' },
  { id: 'msg-017', content: 'What are the library opening hours and how do I get a library card?', conversationId: 'conv-017', module: 'campus-life', createdAt: '2026-03-13T11:00:00Z' },
  { id: 'msg-018', content: 'I want to know about student sports clubs and recreational activities.', conversationId: 'conv-018', module: 'campus-life', createdAt: '2026-03-13T11:30:00Z' },
  { id: 'msg-019', content: 'Koji su preduvjeti za prijavu diplomskog rada?', conversationId: 'conv-019', module: 'academic-info', createdAt: '2026-03-13T12:00:00Z' },
  { id: 'msg-020', content: 'How does the student transportation card work in Zagreb?', conversationId: 'conv-020', module: 'campus-life', createdAt: '2026-03-13T12:30:00Z' },
  { id: 'msg-021', content: 'What mental health support services are available for students?', conversationId: 'conv-021', module: 'well-being', createdAt: '2026-03-13T13:00:00Z' },
  { id: 'msg-022', content: 'Trebam informacije o ljetnoj praksi za studente informatike.', conversationId: 'conv-022', module: 'career', createdAt: '2026-03-13T13:30:00Z' },
  { id: 'msg-023', content: 'How do I transfer credits from another university?', conversationId: 'conv-023', module: 'academic-info', createdAt: '2026-03-13T14:00:00Z' },
  { id: 'msg-024', content: 'What is the process for extending a student visa?', conversationId: 'conv-024', module: 'visa-info', createdAt: '2026-03-13T14:30:00Z' },
  { id: 'msg-025', content: 'Kako se prijaviti za studentsku razmjenu izvan Europe?', conversationId: 'conv-025', module: 'exchange', createdAt: '2026-03-13T15:00:00Z' },
];

export const mockMessages: MockMessage[] = [
  { id: 'msg-100', conversationId: 'conv-001', role: 'user', content: 'Kako mogu podnijeti zahtjev za studentsku vizu?', timestamp: '2026-03-12T14:25:00Z' },
  { id: 'msg-101', conversationId: 'conv-001', role: 'assistant', content: 'Za studentsku vizu trebate...', timestamp: '2026-03-12T14:26:00Z', metadata: { module: 'visa-info', provider: 'gemini', model: 'gemini-2.0-flash', tokens: { prompt: 120, completion: 80, total: 200 }, latencyMs: 1200, toolCalls: 0 } },
  { id: 'msg-102', conversationId: 'conv-001', role: 'user', content: 'Koji su rokovi?', timestamp: '2026-03-12T14:27:00Z' },
  { id: 'msg-103', conversationId: 'conv-001', role: 'assistant', content: 'Rokovi za prijavu su obično 3 mjeseca prije...', timestamp: '2026-03-12T14:28:00Z', metadata: { module: 'visa-info', provider: 'gemini', model: 'gemini-2.0-flash', tokens: { prompt: 180, completion: 95, total: 275 }, latencyMs: 980, toolCalls: 0 } },
  { id: 'msg-104', conversationId: 'conv-002', role: 'user', content: 'What are the enrollment requirements?', timestamp: '2026-03-12T15:05:00Z' },
  { id: 'msg-105', conversationId: 'conv-002', role: 'assistant', content: 'For Master\'s enrollment at University of Zagreb...', timestamp: '2026-03-12T15:06:00Z', metadata: { module: 'enrollment', provider: 'gemini', model: 'gemini-2.0-flash', tokens: { prompt: 90, completion: 120, total: 210 }, latencyMs: 1100, toolCalls: 1 } },
  { id: 'msg-106', conversationId: 'conv-003', role: 'user', content: 'Explain the grading system.', timestamp: '2026-03-12T15:40:00Z' },
  { id: 'msg-107', conversationId: 'conv-003', role: 'assistant', content: 'Croatian universities use a 1-5 scale...', timestamp: '2026-03-12T15:41:00Z', metadata: { module: 'academic-info', provider: 'gemini', model: 'gemini-2.0-flash', tokens: { prompt: 70, completion: 150, total: 220 }, latencyMs: 950, toolCalls: 0 } },
];

export const mockAdminRatings: AdminRating[] = [
  { id: 'rat-001', messageId: 'msg-101', accuracy: 5, completeness: 4, relevance: 5, tone: 5, overall: 5, overallScore: 5, tags: ['accurate', 'excellent'], idealResponse: '', ratedAt: '2026-03-11T10:00:00Z' },
  { id: 'rat-002', messageId: 'msg-103', accuracy: 3, completeness: 3, relevance: 4, tone: 4, overall: 3, overallScore: 3, tags: ['incomplete'], idealResponse: 'Should include specific deadline dates.', ratedAt: '2026-03-11T10:30:00Z' },
  { id: 'rat-003', messageId: 'msg-105', accuracy: 2, completeness: 2, relevance: 3, tone: 4, overall: 2, overallScore: 2, tags: ['inaccurate', 'incomplete'], idealResponse: 'The visa process described was for a different country.', ratedAt: '2026-03-11T11:00:00Z' },
  { id: 'rat-004', messageId: 'msg-107', accuracy: 4, completeness: 5, relevance: 5, tone: 5, overall: 5, overallScore: 5, tags: ['accurate', 'excellent'], ratedAt: '2026-03-11T11:30:00Z' },
  { id: 'rat-005', messageId: 'msg-109', accuracy: 1, completeness: 1, relevance: 2, tone: 3, overall: 1, overallScore: 1, tags: ['hallucination', 'inaccurate'], idealResponse: 'The response fabricated a scholarship program that does not exist.', ratedAt: '2026-03-11T12:00:00Z' },
  { id: 'rat-006', messageId: 'msg-110', accuracy: 4, completeness: 4, relevance: 4, tone: 3, overall: 4, overallScore: 4, tags: ['accurate'], ratedAt: '2026-03-11T12:30:00Z' },
  { id: 'rat-007', messageId: 'msg-111', accuracy: 5, completeness: 5, relevance: 5, tone: 5, overall: 5, overallScore: 5, tags: ['accurate', 'excellent'], ratedAt: '2026-03-11T13:00:00Z' },
  { id: 'rat-008', messageId: 'msg-112', accuracy: 3, completeness: 2, relevance: 4, tone: 4, overall: 3, overallScore: 3, tags: ['incomplete'], ratedAt: '2026-03-12T09:00:00Z' },
  { id: 'rat-009', messageId: 'msg-113', accuracy: 4, completeness: 4, relevance: 5, tone: 5, overall: 4, overallScore: 4, tags: ['accurate'], ratedAt: '2026-03-12T09:30:00Z' },
  { id: 'rat-010', messageId: 'msg-114', accuracy: 2, completeness: 3, relevance: 3, tone: 2, overall: 2, overallScore: 2, tags: ['wrong_language'], idealResponse: 'Response was in English but user asked in Croatian.', ratedAt: '2026-03-12T10:00:00Z' },
  { id: 'rat-011', messageId: 'msg-115', accuracy: 5, completeness: 4, relevance: 5, tone: 4, overall: 5, overallScore: 5, tags: ['accurate'], ratedAt: '2026-03-12T10:30:00Z' },
  { id: 'rat-012', messageId: 'msg-116', accuracy: 3, completeness: 3, relevance: 3, tone: 5, overall: 3, overallScore: 3, tags: ['incomplete'], ratedAt: '2026-03-12T11:00:00Z' },
];

export const mockFeedback: Feedback[] = [
  { id: 'fb-001', sentiment: 'positive', comment: 'Very helpful and accurate information about enrollment!', rating: 5, categories: ['accuracy', 'helpfulness'], userId: 'user-001', messageId: 'msg-101', conversationId: 'conv-001', createdAt: '2026-03-10T08:00:00Z' },
  { id: 'fb-002', sentiment: 'negative', comment: 'The visa information was outdated and incorrect.', categories: ['accuracy', 'outdated-info'], userId: 'user-002', messageId: 'msg-101', conversationId: 'conv-002', createdAt: '2026-03-10T09:30:00Z' },
  { id: 'fb-003', sentiment: 'positive', comment: 'Quick and concise answer, exactly what I needed.', categories: ['helpfulness', 'speed'], userId: 'user-003', messageId: 'msg-102', conversationId: 'conv-003', createdAt: '2026-03-10T10:15:00Z' },
  { id: 'fb-004', sentiment: 'negative', comment: 'Responded in the wrong language.', categories: ['language', 'ux'], userId: 'user-004', messageId: 'msg-103', conversationId: 'conv-004', createdAt: '2026-03-10T11:00:00Z' },
  { id: 'fb-005', sentiment: 'neutral', comment: 'It was okay, but could have been more detailed.', categories: ['completeness'], userId: 'user-005', messageId: 'msg-104', conversationId: 'conv-005', createdAt: '2026-03-10T12:30:00Z' },
  { id: 'fb-006', sentiment: 'positive', comment: 'Excellent breakdown of the scholarship options available.', categories: ['accuracy', 'helpfulness', 'completeness'], userId: 'user-006', messageId: 'msg-105', conversationId: 'conv-006', createdAt: '2026-03-10T14:00:00Z' },
  { id: 'fb-007', sentiment: 'negative', comment: 'The bot made up a program that doesn\'t exist.', categories: ['hallucination', 'accuracy'], userId: 'user-007', messageId: 'msg-106', conversationId: 'conv-007', createdAt: '2026-03-11T08:30:00Z' },
  { id: 'fb-008', sentiment: 'positive', comment: 'Great response about the housing application process.', categories: ['helpfulness'], userId: 'user-008', messageId: 'msg-107', conversationId: 'conv-008', createdAt: '2026-03-11T09:00:00Z' },
  { id: 'fb-009', sentiment: 'neutral', comment: 'Decent answer but I had to ask follow-up questions.', categories: ['completeness', 'ux'], userId: 'user-009', messageId: 'msg-108', conversationId: 'conv-009', createdAt: '2026-03-11T10:45:00Z' },
  { id: 'fb-010', sentiment: 'negative', comment: 'Completely wrong information about the exam schedule.', categories: ['accuracy', 'outdated-info'], userId: 'user-010', messageId: 'msg-109', conversationId: 'conv-010', createdAt: '2026-03-11T12:00:00Z' },
  { id: 'fb-011', sentiment: 'positive', comment: 'Love the multilingual support!', categories: ['language', 'helpfulness'], userId: 'user-011', messageId: 'msg-110', conversationId: 'conv-011', createdAt: '2026-03-11T13:30:00Z' },
  { id: 'fb-012', sentiment: 'positive', comment: 'Helped me navigate the credit transfer process smoothly.', categories: ['helpfulness', 'accuracy'], userId: 'user-012', messageId: 'msg-111', conversationId: 'conv-012', createdAt: '2026-03-11T15:00:00Z' },
  { id: 'fb-013', sentiment: 'negative', comment: 'Response was too generic, didn\'t address my specific situation.', categories: ['completeness', 'relevance'], userId: 'user-013', messageId: 'msg-112', conversationId: 'conv-013', createdAt: '2026-03-12T08:00:00Z' },
  { id: 'fb-014', sentiment: 'neutral', comment: 'It answered the question but the tone was too formal.', categories: ['tone', 'ux'], userId: 'user-014', messageId: 'msg-113', conversationId: 'conv-014', createdAt: '2026-03-12T09:15:00Z' },
  { id: 'fb-015', sentiment: 'positive', comment: 'Perfect answer about library services, very detailed.', categories: ['accuracy', 'completeness', 'helpfulness'], userId: 'user-015', messageId: 'msg-114', conversationId: 'conv-015', createdAt: '2026-03-12T10:30:00Z' },
  { id: 'fb-016', sentiment: 'negative', comment: 'Gave me deadlines that had already passed.', categories: ['outdated-info', 'accuracy'], userId: 'user-016', messageId: 'msg-115', conversationId: 'conv-016', createdAt: '2026-03-12T11:45:00Z' },
  { id: 'fb-017', sentiment: 'positive', comment: 'Very professional and informative response.', categories: ['tone', 'helpfulness'], userId: 'user-017', messageId: 'msg-116', conversationId: 'conv-017', createdAt: '2026-03-12T13:00:00Z' },
  { id: 'fb-018', sentiment: 'neutral', comment: 'Average response, nothing special.', categories: ['completeness'], userId: 'user-018', messageId: 'msg-117', conversationId: 'conv-018', createdAt: '2026-03-12T14:30:00Z' },
  { id: 'fb-019', sentiment: 'positive', comment: 'Impressed by how well it understood my Croatian question!', categories: ['language', 'accuracy', 'helpfulness'], userId: 'user-019', messageId: 'msg-118', conversationId: 'conv-019', createdAt: '2026-03-13T08:00:00Z' },
  { id: 'fb-020', sentiment: 'negative', comment: 'The system was confused by my question and gave irrelevant information.', categories: ['relevance', 'accuracy'], userId: 'user-020', messageId: 'msg-119', conversationId: 'conv-020', createdAt: '2026-03-13T09:00:00Z' },
];

export const mockConversations: Conversation[] = [
  { id: 'conv-001', userId: 'user-001', user: 'user-001', module: 'visa-info', modulesUsed: ['visa-info'], language: 'sr-Latn', rating: 4, startedAt: '2026-03-12T14:25:00Z', messageCount: 6 },
  { id: 'conv-002', userId: 'user-002', user: 'user-002', module: 'enrollment', modulesUsed: ['enrollment'], language: 'en', rating: 5, startedAt: '2026-03-12T15:05:00Z', messageCount: 4 },
  { id: 'conv-003', userId: 'user-003', user: 'user-003', module: 'academic-info', modulesUsed: ['academic-info'], language: 'en', rating: 4, startedAt: '2026-03-12T15:40:00Z', messageCount: 3 },
  { id: 'conv-004', userId: 'user-004', user: 'user-004', module: 'housing', modulesUsed: ['housing'], language: 'sr-Latn', rating: 3, startedAt: '2026-03-12T16:15:00Z', messageCount: 5 },
  { id: 'conv-005', userId: 'user-005', user: 'user-005', module: 'financial-aid', modulesUsed: ['financial-aid'], language: 'en', rating: null, startedAt: '2026-03-12T16:50:00Z', messageCount: 7 },
  { id: 'conv-006', userId: 'user-006', user: 'user-006', module: 'documents', modulesUsed: ['documents'], language: 'en', rating: 5, startedAt: '2026-03-12T17:25:00Z', messageCount: 3 },
  { id: 'conv-007', userId: 'user-007', user: 'user-007', module: 'exchange', modulesUsed: ['exchange'], language: 'sr-Latn', rating: 2, startedAt: '2026-03-12T17:55:00Z', messageCount: 4 },
  { id: 'conv-008', userId: 'user-008', user: 'user-008', module: 'academic-info', modulesUsed: ['academic-info'], language: 'en', rating: 4, startedAt: '2026-03-12T18:25:00Z', messageCount: 2 },
  { id: 'conv-009', userId: 'user-009', user: 'user-009', module: 'insurance', modulesUsed: ['insurance'], language: 'sr-Latn', rating: 4, startedAt: '2026-03-12T18:55:00Z', messageCount: 5 },
  { id: 'conv-010', userId: 'user-010', user: 'user-010', module: 'enrollment', modulesUsed: ['enrollment'], language: 'sr-Latn', rating: 3, startedAt: '2026-03-12T19:25:00Z', messageCount: 3 },
];

export const mockQueryVolumeData: QueryVolumeData[] = [
  { date: '2026-02-12', queries: 145 }, { date: '2026-02-13', queries: 168 },
  { date: '2026-02-14', queries: 132 }, { date: '2026-02-15', queries: 89 },
  { date: '2026-02-16', queries: 76 }, { date: '2026-02-17', queries: 158 },
  { date: '2026-02-18', queries: 172 }, { date: '2026-02-19', queries: 189 },
  { date: '2026-02-20', queries: 195 }, { date: '2026-02-21', queries: 178 },
  { date: '2026-02-22', queries: 92 }, { date: '2026-02-23', queries: 85 },
  { date: '2026-02-24', queries: 201 }, { date: '2026-02-25', queries: 215 },
  { date: '2026-02-26', queries: 198 }, { date: '2026-02-27', queries: 223 },
  { date: '2026-02-28', queries: 210 }, { date: '2026-03-01', queries: 105 },
  { date: '2026-03-02', queries: 98 }, { date: '2026-03-03', queries: 234 },
  { date: '2026-03-04', queries: 256 }, { date: '2026-03-05', queries: 248 },
  { date: '2026-03-06', queries: 267 }, { date: '2026-03-07', queries: 245 },
  { date: '2026-03-08', queries: 112 }, { date: '2026-03-09', queries: 108 },
  { date: '2026-03-10', queries: 278 }, { date: '2026-03-11', queries: 295 },
  { date: '2026-03-12', queries: 312 }, { date: '2026-03-13', queries: 289 },
];

export const mockHourlyData: HourlyData[] = [
  { hour: '00', queries: 12 }, { hour: '01', queries: 8 },
  { hour: '02', queries: 5 }, { hour: '03', queries: 3 },
  { hour: '04', queries: 4 }, { hour: '05', queries: 7 },
  { hour: '06', queries: 15 }, { hour: '07', queries: 28 },
  { hour: '08', queries: 56 }, { hour: '09', queries: 82 },
  { hour: '10', queries: 95 }, { hour: '11', queries: 88 },
  { hour: '12', queries: 72 }, { hour: '13', queries: 85 },
  { hour: '14', queries: 91 }, { hour: '15', queries: 78 },
  { hour: '16', queries: 65 }, { hour: '17', queries: 48 },
  { hour: '18', queries: 35 }, { hour: '19', queries: 28 },
  { hour: '20', queries: 22 }, { hour: '21', queries: 18 },
  { hour: '22', queries: 15 }, { hour: '23', queries: 14 },
];

export const mockAgentUsageData: AgentUsageData[] = [
  { agent: 'GPT-4o', queries: 3420, avgLatency: 1.8 },
  { agent: 'Claude 3.5', queries: 2150, avgLatency: 2.1 },
  { agent: 'Gemini Pro', queries: 1280, avgLatency: 1.5 },
  { agent: 'Mixtral', queries: 890, avgLatency: 1.2 },
];

export const mockTopModules: TopModule[] = [
  { module: 'enrollment', count: 1245 },
  { module: 'academic-info', count: 1089 },
  { module: 'visa-info', count: 876 },
  { module: 'financial-aid', count: 654 },
  { module: 'housing', count: 543 },
  { module: 'campus-life', count: 432 },
  { module: 'documents', count: 321 },
  { module: 'exchange', count: 287 },
  { module: 'career', count: 198 },
  { module: 'insurance', count: 156 },
];

export const mockDailyActiveUsers: DailyActiveUsers[] = [
  { date: '2026-02-12', users: 89 }, { date: '2026-02-13', users: 102 },
  { date: '2026-02-14', users: 95 }, { date: '2026-02-15', users: 54 },
  { date: '2026-02-16', users: 48 }, { date: '2026-02-17', users: 112 },
  { date: '2026-02-18', users: 125 }, { date: '2026-02-19', users: 134 },
  { date: '2026-02-20', users: 128 }, { date: '2026-02-21', users: 119 },
  { date: '2026-02-22', users: 62 }, { date: '2026-02-23', users: 55 },
  { date: '2026-02-24', users: 138 }, { date: '2026-02-25', users: 145 },
  { date: '2026-02-26', users: 142 }, { date: '2026-02-27', users: 156 },
  { date: '2026-02-28', users: 148 }, { date: '2026-03-01', users: 68 },
  { date: '2026-03-02', users: 61 }, { date: '2026-03-03', users: 162 },
  { date: '2026-03-04', users: 175 }, { date: '2026-03-05', users: 168 },
  { date: '2026-03-06', users: 182 }, { date: '2026-03-07', users: 171 },
  { date: '2026-03-08', users: 78 }, { date: '2026-03-09', users: 72 },
  { date: '2026-03-10', users: 195 }, { date: '2026-03-11', users: 203 },
  { date: '2026-03-12', users: 218 }, { date: '2026-03-13', users: 198 },
];

export const mockCostPerProvider: CostPerProvider[] = [
  { provider: 'OpenAI', cost: 2450.80, tokens: 18500000 },
  { provider: 'Anthropic', cost: 1820.50, tokens: 12300000 },
  { provider: 'Google', cost: 980.25, tokens: 9800000 },
  { provider: 'Mistral', cost: 345.60, tokens: 6200000 },
];

export const mockLatencyPercentiles: LatencyPercentiles = {
  p50: 0.82,
  p75: 1.24,
  p90: 1.95,
  p95: 2.8,
  p99: 4.5,
};

export const mockStats: Stats = {
  totalConversations: 4827,
  totalMessages: 28934,
  messagesToday: 342,
  activeUsers: 1243,
  avgResponseTime: 1.4,
  avgRating: 3.8,
  totalFeedback: 2156,
  aiCostToday: 12.45,
};

// ---------------------------------------------------------------------------
// Prompts (for Prompt Management page)
// ---------------------------------------------------------------------------

export interface AgentPrompt {
  id: string;
  name: string;
  module: string;
  description: string;
  version: number;
  text: string;
}

export interface PromptVersion {
  version: number;
  createdAt: string;
  author: string;
  summary: string;
}

export const mockPrompts: AgentPrompt[] = [
  {
    id: 'prompt-supervisor',
    name: 'Supervisor',
    module: 'orchestrator',
    description: 'Routes user queries to the appropriate specialist agent',
    version: 3,
    text: `You are the UvidAI supervisor. Your job is to route user queries to the right specialist agent.

Available agents:
- eco-agent: Environmental data, air quality, POIs, green spaces
- lifestyle-agent: Housing, prices, neighborhood lifestyle
- legal-agent: Property ownership, cadastre, legal documents

Analyze the user message and respond with the agent name. Be concise.`,
  },
  {
    id: 'prompt-eco-agent',
    name: 'Eco Agent',
    module: 'eco',
    description: 'Handles environmental and air quality queries',
    version: 2,
    text: `You are the UvidAI eco-agent. You help users with:
- Air quality data and SEPA measurements
- POIs from OpenStreetMap (parks, schools, amenities)
- Environmental concerns in neighborhoods

Use tools to fetch real data. Respond in the user's language.`,
  },
  {
    id: 'prompt-lifestyle-agent',
    name: 'Lifestyle Agent',
    module: 'lifestyle',
    description: 'Handles housing, prices, and neighborhood lifestyle',
    version: 4,
    text: `You are the UvidAI lifestyle-agent. You help users with:
- Real estate listings (HaloOglasi, Nekretnine.rs)
- Price estimates and market trends
- Neighborhood lifestyle, schools, transport

Use scrapers and APIs for real data. Be helpful and accurate.`,
  },
  {
    id: 'prompt-legal-agent',
    name: 'Legal Agent',
    module: 'legal',
    description: 'Handles cadastre, ownership, and legal documents',
    version: 2,
    text: `You are the UvidAI legal-agent. You help users with:
- APR (Agency for Business Registers) company lookup
- GeoSrbija cadastre and parcel data
- Property ownership and legal documents

Use official APIs. Provide accurate, legally-sound information.`,
  },
];

export const mockPromptVersions: Record<string, PromptVersion[]> = {
  'prompt-supervisor': [
    { version: 3, createdAt: '2026-03-10T14:00:00Z', author: 'admin', summary: 'Added legal-agent routing' },
    { version: 2, createdAt: '2026-03-05T09:00:00Z', author: 'admin', summary: 'Refined routing logic' },
    { version: 1, createdAt: '2026-02-28T12:00:00Z', author: 'admin', summary: 'Initial version' },
  ],
  'prompt-eco-agent': [
    { version: 2, createdAt: '2026-03-08T11:00:00Z', author: 'admin', summary: 'Added SEPA integration' },
    { version: 1, createdAt: '2026-02-25T10:00:00Z', author: 'admin', summary: 'Initial version' },
  ],
  'prompt-lifestyle-agent': [
    { version: 4, createdAt: '2026-03-12T16:00:00Z', author: 'admin', summary: 'Nekretnine.rs scraper support' },
    { version: 3, createdAt: '2026-03-01T09:00:00Z', author: 'admin', summary: 'HaloOglasi integration' },
    { version: 2, createdAt: '2026-02-20T14:00:00Z', author: 'admin', summary: 'Price module' },
    { version: 1, createdAt: '2026-02-15T10:00:00Z', author: 'admin', summary: 'Initial version' },
  ],
  'prompt-legal-agent': [
    { version: 2, createdAt: '2026-03-06T13:00:00Z', author: 'admin', summary: 'GeoSrbija WFS support' },
    { version: 1, createdAt: '2026-02-22T11:00:00Z', author: 'admin', summary: 'APR registry only' },
  ],
};

// ---------------------------------------------------------------------------
// Data Sources (for Data Sources page)
// ---------------------------------------------------------------------------

export type DataSourceStatus = 'healthy' | 'degraded' | 'error';
export type DataSourceType = 'API' | 'Scraper';

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  status: DataSourceStatus;
  lastRun: string;
  itemsCount: number;
  avgLatencyMs: number;
  errorLog?: string[];
}

// ---------------------------------------------------------------------------
// Fine-Tune Datasets (for Fine-Tuning page)
// ---------------------------------------------------------------------------

export type FineTuneDatasetStatus = 'DRAFT' | 'READY' | 'TRAINING' | 'DEPLOYED';

export interface FineTuneDatasetItem {
  id: string;
  inputMessagesExcerpt: string;
  idealOutputExcerpt: string;
  source: 'ADMIN_REWRITE' | 'HIGH_RATED' | 'USER_APPROVED';
}

export interface FineTuneDataset {
  id: string;
  name: string;
  description: string | null;
  status: FineTuneDatasetStatus;
  itemCount: number;
  modelProvider: string | null;
  createdAt: string;
  items?: FineTuneDatasetItem[];
}

export const mockFineTuneDatasets: FineTuneDataset[] = [
  {
    id: 'ds-ft-001',
    name: 'Visa Info Responses',
    description: 'High-quality visa information responses from admin ratings',
    status: 'READY',
    itemCount: 24,
    modelProvider: 'openai',
    createdAt: '2026-03-12T10:00:00Z',
    items: [
      {
        id: 'item-001',
        inputMessagesExcerpt: 'Kako mogu podnijeti zahtjev za studentsku vizu?',
        idealOutputExcerpt: 'Za studentsku vizu trebate sljedeće dokumente: prijavni obrazac...',
        source: 'HIGH_RATED',
      },
      {
        id: 'item-002',
        inputMessagesExcerpt: 'What are the visa requirements for Croatia?',
        idealOutputExcerpt: 'For Croatia, you typically need a valid passport and...',
        source: 'ADMIN_REWRITE',
      },
    ],
  },
  {
    id: 'ds-ft-002',
    name: 'Enrollment Q&A',
    description: 'University enrollment and admission queries',
    status: 'DRAFT',
    itemCount: 8,
    modelProvider: 'anthropic',
    createdAt: '2026-03-13T14:30:00Z',
    items: [
      {
        id: 'item-003',
        inputMessagesExcerpt: 'Koji su rokovi za upis u zimski semestar?',
        idealOutputExcerpt: 'Rokovi za upis obično su u rujnu. Provjerite službenu stranicu...',
        source: 'USER_APPROVED',
      },
    ],
  },
  {
    id: 'ds-ft-003',
    name: 'Housing Assistance',
    description: 'Student housing and dormitory information',
    status: 'TRAINING',
    itemCount: 42,
    modelProvider: 'openai',
    createdAt: '2026-03-10T09:00:00Z',
    items: [],
  },
];

// ---------------------------------------------------------------------------
// Data Sources (for Data Sources page)
// ---------------------------------------------------------------------------

export const mockDataSources: DataSource[] = [
  { id: 'ds-1', name: 'OpenStreetMap Overpass', type: 'API', status: 'healthy', lastRun: '2026-03-14T08:15:00Z', itemsCount: 12450, avgLatencyMs: 320, errorLog: [] },
  { id: 'ds-2', name: 'SEPA Air Quality', type: 'API', status: 'healthy', lastRun: '2026-03-14T08:10:00Z', itemsCount: 89, avgLatencyMs: 180, errorLog: [] },
  { id: 'ds-3', name: 'APR Registry', type: 'API', status: 'degraded', lastRun: '2026-03-14T07:45:00Z', itemsCount: 125000, avgLatencyMs: 450, errorLog: ['2026-03-14 07:45:12 - Rate limit hit, retrying...'] },
  { id: 'ds-4', name: 'GeoSrbija WFS', type: 'API', status: 'healthy', lastRun: '2026-03-14T08:00:00Z', itemsCount: 8900, avgLatencyMs: 520, errorLog: [] },
  { id: 'ds-5', name: 'HaloOglasi Scraper', type: 'Scraper', status: 'healthy', lastRun: '2026-03-14T08:20:00Z', itemsCount: 3420, avgLatencyMs: 2100, errorLog: [] },
  { id: 'ds-6', name: 'Nekretnine.rs Scraper', type: 'Scraper', status: 'error', lastRun: '2026-03-13T22:30:00Z', itemsCount: 2890, avgLatencyMs: 1800, errorLog: ['2026-03-13 22:30:45 - 403 Forbidden: Blocked by anti-bot', '2026-03-13 22:31:02 - Retry failed'] },
];

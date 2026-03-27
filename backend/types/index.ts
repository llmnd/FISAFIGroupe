// Types pour Articles
export interface IArticle {
  id: number;
  title: string;
  slug: string;
  category: 'technique' | 'innovation' | 'evenement' | 'veille';
  excerpt: string;
  content: string;
  image?: string;
  author?: string;
  published: boolean;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateArticleInput {
  title: string;
  category: string;
  excerpt: string;
  content: string;
  image?: string;
  author?: string;
}

export interface IUpdateArticleInput {
  title?: string;
  category?: string;
  excerpt?: string;
  content?: string;
  image?: string;
  author?: string;
  published?: boolean;
  publishedAt?: Date;
}

// Types pour Formations
export interface IFormation {
  id: number;
  name: string;
  slug: string;
  duration: string;
  level: 'Débutant' | 'Intermédiaire' | 'Avancé';
  description: string;
  content?: string;
  objectives?: string;
  price?: number;
  maxParticipants: number;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateFormationInput {
  name: string;
  duration: string;
  level: string;
  description: string;
  content?: string;
  objectives?: string;
  price?: number;
  maxParticipants?: number;
}

// Types pour Sessions
export interface ISessionFormation {
  id: number;
  formationId: number;
  startDate: Date;
  endDate: Date;
  location: string;
  capacity: number;
  available: number;
  status: 'ouverte' | 'complète' | 'annulée' | 'terminée';
  createdAt: Date;
  updatedAt: Date;
}

// Types pour Inscriptions Formation
export interface IInscriptionFormation {
  id: number;
  sessionId: number;
  formationId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
  status: 'confirme' | 'liste_attente' | 'annule';
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateInscriptionFormationInput {
  sessionId: number;
  formationId: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company?: string;
}

// Types pour Brochures
export interface IBrochure {
  id: number;
  name: string;
  description?: string;
  fileUrl: string;
  fileSize?: string;
  type: string;
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Types pour Inscriptions Contact
export interface IInscription {
  id: number;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'pending' | 'read' | 'responded';
  createdAt: Date;
}

// Type pour réponses API
export interface IApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Authentication & JWT
export interface JWTPayload {
  id: string;
  email: string;
  role?: string;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    role?: string;
  };
}

// Pagination
export interface PaginationParams {
  page?: number;
  limit?: number;
  skip?: number;
}

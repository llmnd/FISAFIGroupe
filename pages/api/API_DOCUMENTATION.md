# API Documentation - FiSAFi Groupe Backend

## Overview

This API provides complete backend functionality for managing:
- Articles & News (Articles techniques, Innovations, Events, Trend monitoring)
- Trainings (Catalog, Sessions, Registrations)
- Brochures

## Base URL

```
/api
```

---

## 🗞️ Articles API

### 1. Get Articles

```
GET /api/articles?category={category}&limit={limit}&offset={offset}
```

**Query Parameters:**
- `category` (optional): Filter by category: `technique`, `innovation`, `evenement`, `veille`, or `tous`
- `limit` (optional): Max results (default: 10)
- `offset` (optional): Pagination offset (default: 0)

**Response:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": 1,
        "title": "Article Title",
        "slug": "article-title",
        "category": "technique",
        "excerpt": "Short description",
        "content": "Full content",
        "image": "image-url.jpg",
        "author": "Author Name",
        "published": true,
        "publishedAt": "2025-03-26T10:00:00Z",
        "createdAt": "2025-03-26T10:00:00Z",
        "updatedAt": "2025-03-26T10:00:00Z"
      }
    ],
    "total": 15
  }
}
```

---

### 2. Create Article

```
POST /api/articles
```

**Request Body:**
```json
{
  "title": "Article Title",
  "category": "technique",
  "excerpt": "Short description",
  "content": "Full content with HTML",
  "image": "image-url.jpg",
  "author": "Author Name"
}
```

**Required Fields:** `title`, `category`, `excerpt`, `content`

---

### 3. Get Single Article

```
GET /api/articles/{id}
```

---

### 4. Update Article

```
PUT /api/articles/{id}
```

**Request Body:**
```json
{
  "title": "Updated Title",
  "published": true,
  "publishedAt": "2025-03-26T10:00:00Z"
}
```

---

### 5. Delete Article

```
DELETE /api/articles/{id}
```

---

## 🎓 Trainings API

### 1. Get Formations (Trainings)

```
GET /api/formations?limit={limit}&offset={offset}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "formations": [
      {
        "id": 1,
        "name": "Formation Réseaux & Télécommunications",
        "slug": "formation-reseaux",
        "duration": "5 jours",
        "level": "Intermédiaire",
        "description": "Formation complète...",
        "content": "Detailed content",
        "objectives": "Learning objectives",
        "price": 1500.00,
        "maxParticipants": 20,
        "published": true,
        "createdAt": "2025-03-26T10:00:00Z",
        "updatedAt": "2025-03-26T10:00:00Z",
        "sessions": [
          {
            "id": 1,
            "startDate": "2025-04-15T08:00:00Z",
            "endDate": "2025-04-19T17:00:00Z",
            "location": "Dakar, Sénégal",
            "capacity": 20,
            "available": 8,
            "status": "ouverte"
          }
        ]
      }
    ],
    "total": 4
  }
}
```

---

### 2. Create Formation

```
POST /api/formations
```

**Request Body:**
```json
{
  "name": "Cybersécurité Avancée",
  "duration": "3 jours",
  "level": "Avancé",
  "description": "Maîtrisez les techniques de sécurisation...",
  "content": "Detailed content",
  "objectives": "Learning objectives",
  "price": 2000.00,
  "maxParticipants": 15
}
```

**Required Fields:** `name`, `duration`, `level`, `description`

---

### 3. Get Single Formation

```
GET /api/formations/{id}
```

---

### 4. Update Formation

```
PUT /api/formations/{id}
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "price": 2500.00,
  "published": true
}
```

---

### 5. Delete Formation

```
DELETE /api/formations/{id}
```

---

## 📅 Training Sessions API

### 1. Get Sessions

```
GET /api/sessions?formationId={formationId}
```

**Query Parameters:**
- `formationId` (optional): Filter by formation

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "formationId": 1,
      "startDate": "2025-04-15T08:00:00Z",
      "endDate": "2025-04-19T17:00:00Z",
      "location": "Dakar, Sénégal",
      "capacity": 20,
      "available": 8,
      "status": "ouverte",
      "createdAt": "2025-03-26T10:00:00Z",
      "updatedAt": "2025-03-26T10:00:00Z",
      "formation": {
        "name": "Réseaux & Télécommunications",
        "duration": "5 jours",
        "level": "Intermédiaire"
      }
    }
  ]
}
```

---

### 2. Create Session

```
POST /api/sessions
```

**Request Body:**
```json
{
  "formationId": 1,
  "startDate": "2025-04-15T08:00:00Z",
  "endDate": "2025-04-19T17:00:00Z",
  "location": "Dakar, Sénégal",
  "capacity": 20
}
```

**Required Fields:** `formationId`, `startDate`, `endDate`, `location`

---

## ✍️ Training Registrations API

### 1. Get Registrations

```
GET /api/inscriptions-formation?sessionId={sessionId}
```

**Query Parameters:**
- `sessionId` (optional): Filter by session

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "sessionId": 1,
      "formationId": 1,
      "firstName": "Jean",
      "lastName": "Dupont",
      "email": "jean@example.com",
      "phone": "+221 77 123 4567",
      "company": "Acme Corp",
      "status": "confirme",
      "createdAt": "2025-03-26T10:00:00Z",
      "updatedAt": "2025-03-26T10:00:00Z",
      "formation": {
        "name": "Réseaux & Télécommunications"
      },
      "session": {
        "startDate": "2025-04-15T08:00:00Z",
        "location": "Dakar, Sénégal"
      }
    }
  ]
}
```

---

### 2. Create Registration

```
POST /api/inscriptions-formation
```

**Request Body:**
```json
{
  "sessionId": 1,
  "formationId": 1,
  "firstName": "Jean",
  "lastName": "Dupont",
  "email": "jean@example.com",
  "phone": "+221 77 123 4567",
  "company": "Acme Corp"
}
```

**Required Fields:** `sessionId`, `formationId`, `firstName`, `lastName`, `email`, `phone`

**Status Behavior:**
- If session has available spots: `status = "confirme"`
- If session is full: `status = "liste_attente"` (Waiting list)

---

## 📄 Brochures API

### 1. Get Brochures

```
GET /api/brochures
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": 1,
      "name": "Catalogue Complet 2025",
      "description": "Catalogue général des formations",
      "fileUrl": "/files/catalogue-2025.pdf",
      "fileSize": "2.4 MB",
      "type": "PDF",
      "published": true,
      "createdAt": "2025-03-26T10:00:00Z",
      "updatedAt": "2025-03-26T10:00:00Z"
    }
  ]
}
```

---

### 2. Create Brochure

```
POST /api/brochures
```

**Request Body:**
```json
{
  "name": "Modalités d'Inscription",
  "description": "Conditions et modalités",
  "fileUrl": "/files/modalites.pdf",
  "fileSize": "956 KB",
  "type": "PDF"
}
```

**Required Fields:** `name`, `fileUrl`

---

### 3. Get Single Brochure

```
GET /api/brochures/{id}
```

---

### 4. Update Brochure

```
PUT /api/brochures/{id}
```

**Request Body:**
```json
{
  "name": "Updated Name",
  "published": true
}
```

---

### 5. Delete Brochure

```
DELETE /api/brochures/{id}
```

---

## Error Handling

All endpoints return error responses in this format:

```json
{
  "error": "Descriptive error message"
}
```

Common HTTP Status Codes:
- `200` - Success
- `201` - Created
- `400` - Bad Request (missing required fields, duplicate email, etc.)
- `404` - Not Found
- `405` - Method Not Allowed
- `500` - Server Error

---

## Database Migrations

After updating `schema.prisma`, run:

```bash
npx prisma migrate dev --name add_news_and_trainings
```

To push schema to database:

```bash
npx prisma db push
```

---

## Next Steps

1. **Frontend Integration:** Create React components to consume these APIs
2. **Authentication:** Add JWT authentication for admin endpoints
3. **File Upload:** Implement file upload handlers for brochures and article images
4. **Email Notifications:** Add email notifications for registrations
5. **Pagination:** Enhance pagination for large datasets
6. **Search:** Add full-text search for articles and formations

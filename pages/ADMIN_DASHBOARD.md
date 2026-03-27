# 🎛️ Dashboard Admin

## Vue d'ensemble

FiSAFi Groupe dispose d'un **dashboard administrateur dédié** pour gérer les utilisateurs de la plateforme. Les administrateurs sont automatiquement redirigés vers ce dashboard lors de la connexion.

---

## 🚀 Accès au Dashboard Admin

### Authentification
1. Rendez-vous sur la page de connexion (`/login`)
2. Connectez-vous avec vos identifiants admin:
   - **Email**: `admin@fisafi.com`
   - **Mot de passe**: `passer` (à changer en production!)

### Redirection automatique
- Les utilisateurs avec le rôle `admin` sont **automatiquement redirigés** vers `/admin-dashboard`
- Les utilisateurs réguliers accèdent à `/dashboard`

---

## 📊 Fonctionnalités du Dashboard Admin

### 1. **Gestion des Utilisateurs**

#### Lister les utilisateurs
- Vue d'ensemble de tous les utilisateurs de la plateforme
- Affichage des colonnes:
  - 👤 **Nom** (Prénom + Nom)
  - 📧 **Email**
  - 🎯 **Rôle** (Admin/User)
  - ✓ **Statut** (Actif/Inactif)
  - 📅 **Date de création**
  - 🔧 **Actions** (Éditer, Activer/Désactiver, Supprimer)

#### Recherche et filtres
```
🔍 Chercher par email ou nom
```

**Filtres disponibles:**
- **Par rôle**: Tous, Utilisateur, Admin
- **Par statut**: Tous, Actif, Inactif

### 2. **Créer un nouvel utilisateur**

Cliquez sur le bouton **➕ Nouvel Utilisateur**

**Formulaire:**
```
Email:     [email@example.com]
Prénom:    [Jean]
Nom:       [Dupont]
Mot de passe: [••••••••••]
```

**Caractéristiques:**
- Tous les champs sont obligatoires
- Le mot de passe est automatiquement hashé (bcrypt)
- Les nouveaux utilisateurs ont le rôle **"user"** par défaut
- Ils sont créés avec le statut **actif**

### 3. **Éditer un utilisateur**

Cliquez sur **✏️ Éditer** dans la ligne de l'utilisateur

**Champs modifiables:**
- Prénom
- Nom
- Mot de passe (optionnel)

**Champs non modifiables:**
- Email (identificateur unique)

### 4. **Activer/Désactiver un utilisateur**

Cliquez sur **⏸️ Désactiver** ou **▶️ Activer**

**Effets:**
- Les utilisateurs inactifs ne peuvent pas se connecter
- Leurs données sont conservées dans la base de données
- C'est une alternative à la suppression complète

### 5. **Supprimer un utilisateur**

Cliquez sur **🗑️ Supprimer**

**Attention:**
- ⚠️ Cette action est **irréversible**
- Une confirmation est demandée avant la suppression
- Les données de l'utilisateur sont supprimées de la base de données

---

## 🔌 API Endpoints

### GET `/api/users`
Récupère la liste de tous les utilisateurs

**Headers:**
```
Authorization: Bearer <token>
```

**Réponse:**
```json
[
  {
    "id": "user_id_here",
    "email": "user@example.com",
    "firstName": "Jean",
    "lastName": "Dupont",
    "role": "user",
    "active": true,
    "createdAt": "2026-03-27T10:30:00Z",
    "updatedAt": "2026-03-27T10:30:00Z"
  }
]
```

### POST `/api/users`
Crée un nouvel utilisateur

**Headers:**
```
Authorization: Bearer <token>
Content-Type: application/json
```

**Body:**
```json
{
  "email": "newuser@example.com",
  "firstName": "Marie",
  "lastName": "Martin",
  "password": "secure_password"
}
```

**Réponse:** `201 Created`
```json
{
  "id": "new_user_id",
  "email": "newuser@example.com",
  "firstName": "Marie",
  "lastName": "Martin",
  "role": "user",
  "active": true,
  "createdAt": "2026-03-27T10:30:00Z",
  "updatedAt": "2026-03-27T10:30:00Z"
}
```

### GET `/api/users/[id]`
Récupère un utilisateur spécifique

**Réponse:** Le même format qu'en GET `/api/users`

### PUT `/api/users/[id]`
Met à jour un utilisateur

**Body (optionnel):**
```json
{
  "firstName": "Jean-Paul",
  "lastName": "Dubois",
  "password": "new_secure_password",
  "role": "admin",
  "active": true
}
```

**Réponse:** `200 OK` avec l'utilisateur mis à jour

### DELETE `/api/users/[id]`
Supprime un utilisateur

**Réponse:** `204 No Content`

### PATCH `/api/users/[id]/toggle-active`
Bascule le statut actif/inactif d'un utilisateur

**Réponse:** `200 OK` avec l'utilisateur mis à jour

---

## 🔐 Sécurité

### Authentification
- ✓ Tous les endpoints nécessitent un token Bearer
- ✓ Seuls les admins peuvent accéder au dashboard admin
- ✓ Les mots de passe sont hashés avec bcrypt

### Bonnes pratiques

1. **Mots de passe forts**
   - Minimum 12 caractères recommandés
   - Mélanger majuscules, minuscules, chiffres et symboles

2. **Changement régulier des mots de passe admin**
   - Les comptes admins doivent avoir des mots de passe forts et uniques
   - Changer le mot de passe par défaut immédiatement après installation

3. **Audit des accès**
   - Vérifier régulièrement la liste des administrateurs
   - Désactiver ou supprimer les comptes inutilisés

4. **Limitation du nombre d'admins**
   - Garder le nombre d'administrateurs au minimum
   - Un seul admin par défaut

---

## 📝 Exemples d'utilisation

### Scénario 1: Ajouter un nouveau superviseur

1. Cliquez sur **➕ Nouvel Utilisateur**
2. Remplissez le formulaire:
   - Email: `superviseur@fisafi.com`
   - Prénom: `Jean`
   - Nom: `Claude`
   - Mot de passe: `SecurePass123!`
3. Cliquez sur **Enregistrer**
4. Le superviseur peut maintenant se connecter

### Scénario 2: Changer le rôle d'un utilisateur

Actuellement, le changement de rôle doit être fait via l'API ou directement en base de données. Une interface pour les rôles sera ajoutée dans une future version.

Pour changer le rôle en base de données:
```sql
UPDATE "User" SET role = 'admin' WHERE email = 'user@example.com';
```

### Scénario 3: Désactiver temporairement un compte

1. Trouvez l'utilisateur avec la barre de recherche
2. Cliquez sur **⏸️ Désactiver**
3. L'utilisateur ne peut plus se connecter
4. Pour réactiver, cliquez sur **▶️ Activer**

### Scénario 4: Nettoyer les anciens comptes

1. Filtrez par date de création
2. Sélectionnez les comptes inactifs
3. Cliquez sur **🗑️ Supprimer** pour chaque compte à supprimer

---

## 🎨 Interface et Navigation

### Layout
```
┌─────────────────────────────────────────────┐
│ FiSAFi    📱 Menu                            │
├─────────────────────────────────────────────┤
│ SIDEBAR                │ MAIN CONTENT        │
│                        │                     │
│ 📊 Gestion Users       │ Utilisateurs        │
│ 📈 Retour Dashboard    │                     │
│                        │ 🔍 [Recherche...]   │
│                        │ ➕ Nouvel User      │
│ 🚪 Déconnexion        │                     │
│                        │ [Table des users]   │
└─────────────────────────────────────────────┘
```

### Mobile responsive
- L'interface s'adapte aux petits écrans
- Menu hamburger sur mobile
- Tableau scrollable horizontalement si nécessaire

---

## ⚙️ Configuration

### Variables d'environnement requises

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/fisafi_db

# JWT
JWT_SECRET=your_super_secret_jwt_key

# Node environment
NODE_ENV=development
```

### Scripts NPM

```bash
# Démarrer le dashboard admin
npm run dev

# Créer un nouvel admin via CLI
npm run create:admin

# Gérer les admins via CLI
npm run admin list
npm run admin create "email" "FirstName" "LastName" "password"
npm run admin delete "email"
```

---

## 🚨 Troubleshooting

### "Unauthorized" error
**Problème:** Token invalide ou expiré
**Solution:** Se reconnecter et générer un nouveau token

### "User already exists"
**Problème:** L'email existe déjà
**Solution:** Utiliser un email différent ou éditer l'utilisateur existant

### "Method not allowed"
**Problème:** Endpoint ou méthode HTTP incorrects
**Solution:** Vérifier la documentation de l'API

### Les utilisateurs ne s'affichent pas
**Problème:** Erreur de connection à la base de données
**Solution:** Vérifier que la base de données est runnée et `DATABASE_URL` est correctement configurée

---

## 📞 Support

Pour des questions ou pour signaler les problèmes:
- Consultez [ADMIN_MANAGEMENT.md](./ADMIN_MANAGEMENT.md)
- Consultez [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- Vérifiez les logs du serveur


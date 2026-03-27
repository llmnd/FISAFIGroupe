# 🔐 Admin Management Guide

Ce guide explique comment créer, gérer et administrer les utilisateurs administrateurs de l'application FiSAFi.

## 📋 Table des matières
- [Création rapide d'admin](#création-rapide-dadmin)
- [Gestion avancée des administrateurs](#gestion-avancée-des-administrateurs)
- [Commandes disponibles](#commandes-disponibles)
- [Sécurité](#sécurité)

---

## 🚀 Création rapide d'admin

### Première fois (par défaut)
Pour créer le premier administrateur avec les identifiants par défaut:

```bash
npm run create:admin
```

**Identifiants par défaut:**
- Email: `admin@fisafi.com`
- Mot de passe: `passer`

### Nouvelle installation complète
Pour une installation complète avec migrations et création d'admin:

```bash
npm run db:setup
```

Cela va:
1. Exécuter les migrations Prisma (`prisma migrate dev`)
2. Générer le client Prisma (`prisma generate`)
3. Créer l'admin par défaut

---

## 🛠️ Gestion avancée des administrateurs

Utilisez le script `manageAdmin.ts` pour une gestion complète:

```bash
npm run admin <command> [options]
```

### Commandes disponibles

#### 1. **Lister tous les administrateurs**
```bash
npm run admin list
npm run admin:list  # alias
```
Affiche tous les utilisateurs avec le rôle `admin`.

**Exemple de sortie:**
```
👥 Listing all admin users...

Found 1 admin user(s):

1. Admin FiSAFi
   📧 Email: admin@fisafi.com
   👤 Role: admin
   ✓ Active: Yes
   📅 Created: 26/03/2026
```

#### 2. **Créer un nouvel administrateur**
```bash
npm run admin create <email> <firstName> <lastName> <password>
```

**Paramètres:**
- `email`: Adresse email unique de l'administrateur
- `firstName`: Prénom
- `lastName`: Nom de famille
- `password`: Mot de passe en clair (sera hashé automatiquement)

**Exemple:**
```bash
npm run admin create "supervisor@fisafi.com" "Jean" "Dupont" "motdepasse123"
```

**Résultat:**
```
🔐 Creating admin user...
✅ Admin user created successfully!
📧 Email: supervisor@fisafi.com
👤 Name: Jean Dupont
🔑 Password: motdepasse123
👤 Role: admin
```

#### 3. **Supprimer un administateur**
```bash
npm run admin delete <email>
```

**Exemple:**
```bash
npm run admin delete "supervisor@fisafi.com"
```

#### 4. **Réinitialiser le mot de passe**
```bash
npm run admin reset <email> <newPassword>
```

**Exemple:**
```bash
npm run admin reset "admin@fisafi.com" "nouveau_mot_de_passe_secure"
```

#### 5. **Désactiver un administrateur**
```bash
npm run admin deactivate <email>
```

Désactive l'administrateur sans le supprimer (conserve les données historiques).

**Exemple:**
```bash
npm run admin deactivate "supervisor@fisafi.com"
```

#### 6. **Réactiver un administrateur**
```bash
npm run admin activate <email>
```

Réactive un administrateur désactivé.

**Exemple:**
```bash
npm run admin activate "supervisor@fisafi.com"
```

#### 7. **Afficher l'aide**
```bash
npm run admin help
npm run admin --help
npm run admin -h
```

---

## 🔒 Sécurité

### Bonnes pratiques

1. **Mots de passe forts**
   - Minimum 12 caractères
   - Mélanger majuscules, minuscules, chiffres et caractères spéciaux
   - Éviter les mots communs ou prévisibles

2. **Gestion des droits**
   - Limiter le nombre d'administrateurs
   - Utiliser des emails professionnels unique
   - Surveiller les accès

3. **Changement régulier**
   ```bash
   npm run admin reset "email@fisafi.com" "nouveau_mot_de_passe_fort"
   ```

4. **Audit**
   ```bash
   npm run admin list  # Vérifier régulièrement qui a accès
   ```

5. **Désactivation au lieu de suppression**
   ```bash
   npm run admin deactivate "email@fisafi.com"  # Préférer plutôt que delete
   ```

### Variables d'environnement importantes

Assurez-vous que votre fichier `.env` contient:

```env
DATABASE_URL=postgresql://user:password@localhost:5432/fisafi_db
JWT_SECRET=your_secret_key_here
NODE_ENV=development
```

---

## 📊 Schéma de la table User

```typescript
model User {
  id        String   @id @default(cuid())           // ID unique généré
  email     String   @unique                        // Email unique
  password  String                                  // Mot de passe hashé
  firstName String?                                 // Prénom (optionnel)
  lastName  String?                                 // Nom (optionnel)
  role      String   @default("user")               // Rôle utilisateur
  active    Boolean  @default(true)                 // Actif/Inactif
  createdAt DateTime @default(now())                // Date de création
  updatedAt DateTime @updatedAt                     // Dernière mise à jour
}
```

---

## 🚨 Troubleshooting

### Erreur: "Cannot find module"
**Solution:** Vérifiez que vous êtes dans le répertoire racine du projet.
```bash
cd "C:\Users\bmd-tech\Desktop\FiSAFi Groupe"
npm run admin list
```

### Erreur: "User already exists"
**Solution:** Utilisez un email différent ou supprimez l'utilisateur d'abord.
```bash
npm run admin delete "email@fisafi.com"
npm run admin create "email@fisafi.com" "John" "Doe" "password"
```

### Erreur: "DATABASE_URL not configured"
**Solution:** Assurez-vous que votre `.env` file contient `DATABASE_URL`.

### Erreur: "Connection timeout"
**Solution:** Vérifiez que votre serveur PostgreSQL est en cours d'exécution.

---

## 📝 Exemples d'utilisation complets

### Scénario 1: Installation initiale
```bash
# 1. Configuration et création du premier admin
npm run db:setup

# 2. Vérifier que l'admin existe
npm run admin list
```

### Scénario 2: Ajouter un superviseur
```bash
# 1. Créer le superviseur
npm run admin create "superviseur@fisafi.com" "Marie" "Martin" "SecurePass123!"

# 2. Vérifier la création
npm run admin list

# 3. Plus tard, réinitialiser le mot de passe
npm run admin reset "superviseur@fisafi.com" "NewSecurePass456!"
```

### Scénario 3: Maintenance
```bash
# Lister les admins actuels
npm run admin list

# Désactiver un ancien superviseur (au lieu de supprimer)
npm run admin deactivate "old.supervisor@fisafi.com"

# Réactiver si nécessaire
npm run admin activate "old.supervisor@fisafi.com"

# Enfin, supprimer si vraiment nécessaire
npm run admin delete "old.supervisor@fisafi.com"
```

---

## 📞 Support

Pour des questions ou des problèmes, consultez:
- [BACKEND_SETUP.md](../BACKEND_SETUP.md)
- [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)


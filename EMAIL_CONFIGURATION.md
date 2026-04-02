# 📧 Configuration Emails OVH MXPLAN

## Vue d'ensemble

Votre backend est maintenant configuré pour envoyer des emails via votre compte **contact@fisafigroupe.com** sur OVH MXPLAN.

## ✅ Emails envoyés automatiquement

### 1. **Formulaire de Contact**
- ✉️ **Confirmation au visiteur** - Remerciement + numéro de demande
- ✉️ **Notification admin** - Alert pour traiter la demande

### 2. **Inscription Utilisateur (Register)**
- ✉️ **Confirmation d'inscription** - Bienvenue + lien de connexion

### 3. **Inscription Formation** (si implémenté)
- ✉️ **Confirmation utilisateur** - Détails de la formation
- ✉️ **Notification admin** - Nouvel inscrit

---

## 🔧 Configuration (3 étapes)

### Étape 1: Localiser votre mot de passe OVH

1. Allez sur https://www.ovh.com/manager
2. **Web Hosting** → **Email** → **Comptes**
3. Trouvez `contact@fisafigroupe.com`
4. Cliquez sur **"Changer le mot de passe"** pour voir le mot de passe (ou réinitialisez-le)

### Étape 2: Ajouter le mot de passe en local

**Fichier: `.env.local`**

Remplacez:
```
EMAIL_PASSWORD="YOUR_EMAIL_PASSWORD_HERE"
```

Par:
```
EMAIL_PASSWORD="votre_mot_de_passe_ici"
```

### Étape 3: Configuration Render (PRODUCTION)

Pour que les emails fonctionnent en production sur Render:

1. Allez sur https://dashboard.render.com
2. Sélectionnez votre service backend `fisafi-backend`
3. **Environment** → **Add Environment Variable**
4. Ajoutez:
   ```
   EMAIL_PASSWORD=votre_mot_de_passe_ici
   ```
5. **Redéployez** votre service

---

## 🧪 Tester les emails

### Localement (dev)

```bash
# Terminal
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001 npm run dev:backend
```

Puis visitez:
- http://localhost:3000/contact
- Remplissez le formulaire
- Vous devriez:
  - ✅ Recevoir un email de confirmation
  - ✅ Voir une notification dans les logs du backend

### Vérifier les logs

```bash
# Dans le terminal backend
✅ Confirmation email sent to visitor@email.com
✅ Admin notification sent for: Demande formation
```

### En production

https://www.fisafigroupe.com/contact
- Les emails seront envoyés via Render
- Vérifiez les logs Render: https://dashboard.render.com

---

## 🔐 Sécurité

### ✅ Ce qu'on fait bien:
- ✔️ Mot de passe **jamais en dur** dans le code
- ✔️ Utilisation de `.env.local` (local) et variables Render (production)
- ✔️ `.env.local` est dans `.gitignore` (pas commité)

### ⚠️ À savoir:
- Les emails sont envoyés **en arrière-plan** (non-bloquant)
- Si l'email échoue, le formulaire est toujours sauvegardé en BD
- Les erreurs d'email sont loggées mais ne bloquent pas l'application

---

## 📋 Variables d'environnement

### `.env` (public, safe to commit):
```
EMAIL_HOST="mail.ovh.net"
EMAIL_PORT=465
EMAIL_FROM="contact@fisafigroupe.com"
```

### `.env.local` (secret, DO NOT commit):
```
EMAIL_PASSWORD="votre_mot_de_passe"
```

### Render Dashboard:
```
EMAIL_PASSWORD=votre_mot_de_passe
```

---

## 🚀 Structure des emails

Chaque email inclut:
- ✅ Logo/branding FiSAFi
- ✅ Message clair en français
- ✅ Lien vers le site
- ✅ Contact direct
- ✅ Design responsive

---

## 🆘 Troubleshooting

| Problème | Cause | Solution |
|----------|-------|----------|
| Pas d'email reçu | Mot de passe incorrect | Vérifier `.env.local` |
| Erreur "EMAIL_PASSWORD not set" | Variable manquante | Ajouter dans `.env.local` |
| Erreur SMTP | Firewall/port bloqué | Verifier port 465 ouvert |
| Email en spam | Domaine nouveau | Ajouter SPF/DKIM/DMARC (voir OVH) |

---

## 📧 Ajouter plus d'emails

Si vous voulez envoyer depuis une autre adresse (ex: `noreply@fisafigroupe.com`):

1. **Créer le compte dans OVH** (3 slots disponibles)
2. **Ajouter une fonction** dans `backend/services/emailService.ts`
3. **Utiliser le même EMAIL_PASSWORD** (tous les comptes OVH partagent)

---

## ✨ Fonctionnalités futures

- [ ] Template de template d'emails HTML (courants maintenant)
- [ ] Logs d'envoi en base de données
- [ ] Retry automatique si email échoue
- [ ] Support de pièces jointes
- [ ] Templates personnalisables par admin

---

**Questions?** Consultez la [documentation OVH Email](https://docs.ovh.com/gb/en/emails/)

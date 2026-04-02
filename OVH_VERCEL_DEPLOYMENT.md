# 🚀 Guide: Connecter Domaine OVH → Vercel (GRATUIT)

## Situation actuelle
- **Domaine**: www.fisafigroupe.com (chez OVH)
- **Frontend**: Vercel (gratuit)
- **Backend**: Render (gratuit)
- **Zone DNS**: OVH

---

## ✅ ÉTAPE 1: Préparer Vercel (2 min)

### 1. Allez sur votre projet Vercel
- Dashboard: https://vercel.com/dashboard

### 2. Sélectionnez votre projet `fisafi-vitrine`

### 3. Settings → Domains
- Cliquez sur **"Add Domain"**
- Tapez: `www.fisafigroupe.com`
- Vercel va vous montrer 2 options:
  - ✅ **Option A: Route to Vercel Nameservers** (PLUS SIMPLE - mais change vos nameservers)
  - Option B: Add DNS records (ce qu'on fera)

---

## ✅ ÉTAPE 2: Deux méthodes (Choisissez UNE)

### 🟢 MÉTHODE 1: Via Nameservers Vercel (RECOMMANDÉE - Plus simple)

#### Avantages:
- ✅ Une seule chose à changer dans OVH
- ✅ Vercel gère automatiquement les DNS
- ✅ Plus facile à maintenir

#### Étapes:

**Dans Vercel:**
1. Vous verrez 4 nameservers:
   ```
   ns1.vercel.com
   ns2.vercel.com
   ns3.vercel.com
   ns4.vercel.com
   ```
   (Exactement OU proches selon la région)

**Dans OVH Manager:**
1. Allez à **Web Hosting → www.fisafigroupe.com → Zone DNS**
2. **Supprimez** les nameservers par défaut:
   - `dns16.ovh.net.`
   - `ns16.ovh.net.`
3. **Ajoutez** les nameservers Vercel:
   ```
   ns1.vercel.com
   ns2.vercel.com
   ns3.vercel.com
   ns4.vercel.com
   ```
4. **Cliquez sur "Valider"** (propagation: 24-48h max, souvent 5-10 min)

**Puis dans Vercel:**
- Cliquez "Verify" ou attendre que Vercel détecte automatiquement

---

### 🟡 MÉTHODE 2: Via Enregistrements DNS OVH (Garde votre email)

Si vous voulez **garder votre email OVH**, utilisez cette méthode.

#### Enregistrements à modifier/ajouter dans OVH:

**1. Enregistrement A (domaine racine)**

| Champ | Valeur |
|-------|--------|
| Sous-domaine | `@` |
| Type | `A` |
| Cible | `76.76.19.165` |

> Remplacez la valeur `5.135.23.164` par `76.76.19.165`

**2. Enregistrement CNAME (www)**

| Champ | Valeur |
|-------|--------|
| Sous-domaine | `www` |
| Type | `CNAME` |
| Cible | `cname.vercel.com.` |

> Actuellement c'est `TXT "3|welcome"` → supprimez et remplacez par CNAME

**3. GARDEZ vos MX pour l'email:**
```
MX 1  mx1.mail.ovh.net.
MX 5  mx2.mail.ovh.net.
MX 100 mx3.mail.ovh.net.
```

#### Étapes OVH:
1. **Zone DNS → Modifier**
2. Pour chaque enregistrement:
   - **Supprimez** l'ancien
   - **Ajoutez** le nouveau
3. **Cliquez "Valider"** pour chaque
4. Attendre 5-10 min de propagation

#### Dans Vercel:
- Cliquez "Verify Domain" pour confirmer

---

## ⏱️ Vérifier que ça fonctionne

### Attendez 5-10 minutes, puis:

```bash
# Vérifier les DNS (dans PowerShell)
nslookup www.fisafigroupe.com
nslookup fisafigroupe.com
```

Vous devriez voir une réponse type Vercel.

### Ou visitez:
- https://www.fisafigroupe.com

Vous devriez voir votre site Vercel! ✅

---

## 🔗 Configurer Backend (Render)

Votre frontend pointe maintenant vers Vercel, mais il faut que le frontend **communique** avec le backend Render.

### Dans votre code (`services/api.ts` ou similaire):

Changez:
```typescript
// Avant
const API_URL = "http://localhost:3001"; // dev
// ou
const API_URL = "https://fisafigroupe.onrender.com"; // prod
```

En:
```typescript
// Après
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL 
  || "https://fisafigroupe.onrender.com";
```

### Dans Vercel (Environment Variables):
1. **Settings → Environment Variables**
2. Ajoutez:
   ```
   NEXT_PUBLIC_BACKEND_URL=https://fisafigroupe.onrender.com
   ```
3. **Redéployez** votre projet

---

## ✅ Checklist finale

- [ ] Domaine OVH lié à Vercel (Méthode 1 ou 2)
- [ ] DNS propagé (5-10 min)
- [ ] Site accessible sur `www.fisafigroupe.com`
- [ ] Backend Render configuré dans les env vars Vercel
- [ ] API communique avec le backend

---

## 🆘 Problèmes courants

| Problème | Solution |
|----------|----------|
| Site inaccessible après 30 min | Vérifier propagation DNS: `nslookup www.fisafigroupe.com` |
| Email ne fonctionne plus | Avec Méthode 1, restaurer MX. Avec Méthode 2, vérifier MX toujours présents |
| Vercel dit "Domain not verified" | Attendre 10 min et cliquer "Verify" à nouveau |
| API ne répond pas | Vérifier `NEXT_PUBLIC_BACKEND_URL` dans Vercel |

---

## 🎯 Résumé final

```
Avant:
fisafigroupe.com → OVH Web Hosting (5.135.23.164)

Après:
www.fisafigroupe.com → Vercel
Backend API → Render
Email → OVH (MX records)
```

**Coût: 0€** ✅ (votre domaine OVH payé une fois)

---

## Questions? 💬

Si quelque chose ne fonctionne pas, dites-moi:
1. Votre domaine exact
2. L'URL du site
3. L'erreur que vous voyez

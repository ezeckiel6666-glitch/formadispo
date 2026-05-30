# FormaDispo — Extranet Formateur METAVISION ACADEMY

Portail mobile-first pour formateurs freelances : gestion profil, pièces administratives, habilitations, sessions affectées, notifications. Logique **push** — l'équipe diffuse les besoins, les formateurs se positionnent.

## Stack
- **Frontend**: React 18 + Vite (no TypeScript)
- **Backend**: Supabase (PostgreSQL) — projet partagé avec FormaPlan
- **Auth**: Supabase Auth (email+password + magic link)
- **Styles**: CSS inline (design tokens METAVISION)
- **Hosting**: Netlify (CI/CD automatique)

## Démarrer

### 1. Cloner & installer
```bash
git clone https://github.com/ezeckiel6666-glitch/formadispo.git
cd formadispo
npm install
```

### 2. Variables d'environnement
Créer `.env` à la racine (jamais commiter) :
```
VITE_SUPABASE_URL=https://ukivccxzicepidxmdtre.supabase.co
VITE_SUPABASE_ANON_KEY=<clé anon du projet Supabase>
```

Récupérer les clés dans Supabase dashboard → Settings > API.

### 3. Lancer le dev server
```bash
npm run dev
```
→ `http://localhost:5173`

## Architecture

```
src/
├── App.jsx                  # Routing principal + gestion session
├── lib/
│   ├── supabase.js         # Client unique (clé anon)
│   ├── auth.js             # Helpers auth (session, login, profil)
│   └── constants.js        # Tokens design + rôles
├── views/
│   ├── Login.jsx           # Email + magic link
│   ├── Invitation.jsx      # Onboarding post-inscription
│   ├── Dashboard.jsx       # Layout + routage
│   ├── MonProfil.jsx       # Zones, formations, rayon
│   ├── MesPieces.jsx       # Upload fichiers + statut
│   ├── MesHabilitations.jsx# Certifications (lecture seule)
│   ├── MesSessions.jsx     # Sessions affectées (RLS cloisonné)
│   └── Notifications.jsx   # Centre + filters
└── components/
    └── UI.jsx              # Composants réutilisables
```

## Règles Non Négociables

🚨 **UN SEUL client Supabase**
- Toute vue importe : `import { supabase } from '../lib/supabase'`
- Vérifier avant commit : `grep -rn "createClient" src/` → **1 ligne**

🔒 **RLS Toujours Actif**
- Aucune requête ne doit désactiver la RLS
- Un formateur ne voit que ses propres lignes
- Table Editor du Supabase dashboard affiche 0 → normal (pas authentifié)

🔑 **Credentials Sécurisées**
- Jamais de clé `service_role` côté navigateur
- Credentials via `import.meta.env.VITE_*`
- `.env` jamais commité (déjà en `.gitignore`)

## Lot 1 — MVP (Livré ✓)

- [x] Auth (email+mdp + magic link)
- [x] Onboarding profil formateur
- [x] Mon Profil (zones, formations, rayon)
- [x] Mes Pièces (upload + statut)
- [x] Mes Habilitations (certifications + alertes)
- [x] Mes Sessions (affectées)
- [x] Notifications
- [x] Mobile-first responsive

## Lot 2 — Backlog

- [ ] Offres : demandes diffusées (push)
- [ ] Se positionner : accepter mission + tarif/message
- [ ] Écran interne : validation positionnements → création sessions
- [ ] Règle « dossier minimum OK »

## Configuration Supabase

Avant de tester le login en prod :

1. **Supabase dashboard** → Authentication → URL Configuration
   - **Site URL** : `http://localhost:5173` (dev), URL de prod (production)
   - **Redirect URLs** : ajouter `http://localhost:5173`, `http://localhost:5173/*`, et équivalents prod

2. **Magic Link** : Supabase Auth → Templates → Verify Email
   - Vérifier que le lien contient `{{ .ConfirmationURL }}`

## Déployer sur Netlify

1. Connecter le repo GitHub à Netlify
2. Build command : `npm run build`
3. Publish directory : `dist`
4. Environment variables :
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   (Ajouter côté Netlify, jamais commiter)

## Dépannage

| Problème | Diagnostic | Solution |
|----------|-----------|----------|
| Écran blanc après login | Session pas attachée aux requêtes | Vérifier 1 seul `createClient()` |
| 401 Unauthorized | Bearer token = `anon` au lieu de session | Chercher double `createClient` |
| Magic link échoue | Redirect URL pas configurée | Ajouter l'URL dans Supabase dashboard |
| Données vides malgré RLS | RLS active = normal si utilisateur pas authentifié | Tester avec un compte connecté |

## Documentation

- `CLAUDE.md` : conventions développement, flux auth, modèle données
- Supabase schema : `formaplan_schema_v2.sql` (base partagée FormaPlan)

## Contributeurs

- PopLearning (brief)
- Claude Code (implémentation Lot 1)

---

**Status** : Lot 1 complet (MVP). Lot 2 en attente.  
**Dernière mise à jour** : Mai 2026

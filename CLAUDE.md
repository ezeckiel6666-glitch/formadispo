# FormaDispo — Extranet Formateur METAVISION ACADEMY

## Stack & Conventions
- **Frontend**: React 18 + Vite (pas TypeScript)
- **Backend**: Supabase (PostgreSQL) — projet partagé avec FormaPlan
- **Auth**: Supabase Auth (email+mdp + magic link)
- **Styles**: CSS inline (design tokens FormaPlan)
- **Hosting**: Netlify (env vars configurées côté dashboard)

## 🚨 Règles Non Négociables

### 1. Client Supabase Unique
- **UN SEUL** `createClient()` dans `src/lib/supabase.js`
- Vérifier avant chaque commit : `grep -rn "createClient" src/` → **1 ligne**
- Toutes les vues importent `import { supabase } from '../lib/supabase'`

### 2. RLS (Row Level Security) — ACTIVE
- Ne JAMAIS la désactiver
- Requête anonyme = 0 ligne (pas d'erreur en lecture, 401 en écriture)
- Table Editor du dashboard affiche 0 → c'est normal, il n'est pas authentifié
- Si un écran est vide : réflexe = « session pas attachée à la requête »

### 3. Clés & Credentials
- **JAMAIS** la clé `service_role` côté navigateur (elle ignore la RLS)
- Credentials via `import.meta.env.VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY`
- `.env` commité jamais (déjà en `.gitignore`)

### 4. Authentification
- Login → session Supabase récupérée par `supabase.auth.getSession()`
- Profil récupéré depuis table `profils` (pont `auth.users` → rôle)
- Magic link : `detectSessionInUrl: true` capture `#access_token` du retour
- Avant le commit : en-tête `Authorization` doit porter `"role":"authenticated"` (pas `anon`)

## Structure de Projet
```
src/
├── App.jsx                  # Routing, garde d'auth, initialisation session
├── lib/
│   ├── supabase.js         # LE client unique
│   ├── auth.js             # Helpers (session, login, profil)
│   └── constants.js        # Couleurs, rôles
├── views/
│   ├── Login.jsx           # Email+mdp + magic link
│   ├── Invitation.jsx      # Onboarding post-inscription
│   ├── Dashboard.jsx       # Layout principal + routage
│   ├── MonProfil.jsx       # Zones, formations, rayon
│   ├── MesPieces.jsx       # Upload fichiers (Storage)
│   ├── MesHabilitations.jsx# Liste certifications (lecture seule)
│   ├── MesSessions.jsx     # Sessions affectées (cloisonnées)
│   └── Notifications.jsx   # Centre notifications
└── components/
    └── UI.jsx              # Badge, Toast, Spinner, Modal
```

## Flux Authentification

1. **Login** : email+mdp ou magic link
   - ✓ Session créée dans `auth.users`
   - ✓ Profil `profils.actif = false` initialement

2. **Invitation / Onboarding** : si `!profils.actif`
   - Création/mise à jour `profils`
   - Saisie zones, formations, rayon
   - ✓ `profils.actif = true` → accès Dashboard

3. **Dashboard** : routage entre vues
   - `currentView` dans App.jsx
   - Sidebar + top bar (responsive)

4. **Logout** : `supabase.auth.signOut()`
   - Retour à Login

## Modèle de Données (Déjà en Base)

### Tables Critiques pour FormaDispo
| Table | Notes |
|-------|-------|
| `profils` | `user_id` (PK), `role`, `formateur_id`, `actif`, `zones_activites`, `formations_specialisees`, `rayon_intervention` |
| `pieces_formateur` | `formateur_id`, `type`, `nom_fichier`, `storage_path`, `statut` |
| `habilitations` | `formateur_id`, `titre_certification`, `date_expiration` |
| `v_habilitations_statut` | Vue : statut (`valide`/`à renouveler`/`expirée`) |
| `sessions` | `date_debut`, `date_fin`, `lieu`, `effectif_prevu`, `bon_statut`, etc. |
| `session_formateurs` | Lien `sessions` ↔ `formateurs` (table affectation) |
| `notifications` | `user_id`, `titre`, `contenu`, `lu`, `created_at` |

### RLS Policies (Déjà Actives)
- Un formateur lit **que ses propres lignes** (via `profils.user_id` ou `session_formateurs.formateur_id`)
- `profils.actif = false` → aucun accès

## Développement

### Démarrer
```bash
npm install
npm run dev
```
→ `http://localhost:5173`

### Variables d'Env
- `.env` : contient les vraies clés (ne pas commiter)
- `.env.example` : template pour le repo

### Critères d'Acceptation Avant Commit
1. ✓ `grep -rn "createClient" src/` → **1 ligne**
2. ✓ Aucune clé `service_role` visible
3. ✓ Login réussi → en-tête `Authorization` porte un jeton `"role":"authenticated"`
4. ✓ Formateur A ne lit **zéro** ligne du formateur B
5. ✓ `profils.actif = false` rend le compte inerte
6. ✓ App responsive (sidebar repliable, mobile-first)
7. ✓ Pas d'erreurs console (network + JS)

## Lot 1 (MVP) — État

- [x] Scaffold Vite + React
- [x] Client Supabase unique + auth
- [x] Login + Magic link
- [x] Invitation / Onboarding
- [x] Dashboard layout (sidebar + routage)
- [x] MonProfil (zones, formations, rayon)
- [x] MesPieces (upload Storage)
- [x] MesHabilitations (lecture seule)
- [x] MesSessions (affectées, cloisonnées)
- [x] Notifications (centre + badge non-lus)

## Lot 2 (Backlog)

- [ ] Offres : demandes diffusées (push)
- [ ] Se positionner : accepter mission + tarif/message
- [ ] Écran interne léger : voir positionnements, présélectionner/retenir, créer session
- [ ] Règle « dossier minimum OK » : pièces + habilitation requise valide

## Dépannage Courant

| Problème | Diagnostic | Solution |
|----------|-----------|----------|
| Écran vide après login | Session pas attachée aux requêtes | Vérifier qu'il y a 1 seul `createClient()` |
| 401 Unauthorized en écriture | Bearer token = `anon` au lieu de session | Chercher un 2e `createClient()` ou headers figés |
| Table Editor affiche 0 lignes | RLS active → normal, Table Editor n'est pas authentifié | Se fier à l'app, pas au TE |
| Magic link échoue | Redirect URL pas configurée | Ajouter l'URL dans Supabase dashboard |
| Formateur voit d'autres données | Policy RLS manquante/bugée | Vérifier policies dans dashboard > Auth > Policies |

## Notes Importantes

- Le projet partage la **même base Supabase** que FormaPlan
- Aucune création de table/policy formulée ici — tout est déjà en base
- Netlify : les env vars sont injectées au build, ne pas les commiter
- Pas de TypeScript : cohérence avec FormaPlan (KISS)
- CSS inline : idem, pour garder la simplicité
- PWA / manifest : à faire une fois le Lot 1 validé

---

*Brief v2 formalisé · Lot 1 en cours d'implémentation*

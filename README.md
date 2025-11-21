# MedCondens

Application de gestion de dossiers patients et d'observations médicales, conçue pour faciliter le suivi et l'organisation des données médicales.

## 📋 Fonctionnalités

### 👥 Gestion des Dossiers Patients

- **Création et édition de dossiers patients** avec informations complètes (nom, prénom, sexe, date de naissance, contact, etc.)
- **Bouton d'inversion nom/prénom** pour corriger rapidement les erreurs de saisie
- **Tags secteur** : Catégorisation multi-tags des patients par secteur
- **Deux modes d'affichage** :
  - Vue liste : Affichage simple et rapide
  - Vue tableau : Affichage détaillé avec tri et filtres
- **Tri des colonnes** : Par nom, prénom, date de naissance, sexe, secteur
- **Filtre par secteur** : Recherche par un ou plusieurs tags (avec normalisation des accents)
- **Recherche globale** : Recherche par nom, prénom ou nom complet
- **Suppression de dossiers** avec confirmation

### 📝 Module Observations

- **Création d'observations** pour chaque patient
- **Types d'observations** : Clinique, Sociale, Psychologique, Familiale, Scolaire, Autre
- **Import massif de patients** depuis une liste de noms
  - Matching intelligent avec recherche exacte et suggestions de patients similaires
  - Création rapide de nouveaux dossiers pour patients non trouvés
- **Vues multiples** :
  - Ce jour : Observations du jour
  - Toutes : Toutes les observations
  - Groupes : Consultations et réunions
- **Popup todos** : Affichage des tâches en cours au survol/clic de l'icône dans la liste
- **Navigation rapide** : Clic sur le nom du patient pour ouvrir son dossier

### 📅 Consultations & Réunions

- **Création de consultations/réunions** avec :
  - Titre éditable en ligne (auto-save au clic extérieur)
  - Type : Consultation, Réunion, Contact, Autre
  - Date personnalisable
  - Tags pour catégorisation (badges violets)
- **Suppression automatique** des consultations vides à la fermeture
- **Vue tableau compacte** avec :
  - Tri par colonne (Titre, Date, Type, Tags)
  - Suppression rapide avec confirmation
  - Édition inline des tags
- **Import de liste de patients** dans une consultation
- **Création d'observations** directement depuis la consultation

### ✅ Gestion des Tâches (Todos)

- **Patient optionnel** : Création de tâches générales ou liées à un patient
- **Champs personnalisables** :
  - Type : Rappel, Prescription, Examen, Courrier, RDV, Avis, Administratif, Autre
  - Urgence : Basse, Normale, Haute, Critique (code couleur)
  - Date d'échéance avec alerte si dépassée
  - Tags multiples (badges violets)
  - Annotations
- **Groupement intelligent** : Par patient ou par type
- **États** : Actif / Complété
- **Création depuis observations** : Ajouter plusieurs todos directement lors de la création d'une observation

### 🎨 Interface & UX

- **Système d'onglets** : Navigation fluide entre différentes vues
- **Auto-save** : Sauvegarde automatique lors de l'édition inline
- **Badges colorés** :
  - Bleu : Secteur patient
  - Violet : Tags consultations/todos
  - Orange : Badge todos avec compteur
  - Rouge/Orange/Bleu/Vert : Urgence des todos
- **Normalisation des recherches** : Insensible aux accents et à la casse
- **Click-outside** : Fermeture automatique des popups et filtres
- **Confirmation de suppression** : Pour toutes les actions destructives

## 🛠 Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Base de données**: Supabase (PostgreSQL)
- **Authentification**: Supabase Auth (Google OAuth)
- **State Management**: Zustand
- **Data Fetching**: TanStack Query (React Query)
- **Styling**: Tailwind CSS
- **UI Components**: Custom components avec Lucide Icons

## 📦 Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase configuré

## 🚀 Installation

1. **Cloner le repository** :
```bash
git clone https://github.com/Evolia/med-to-condens.git
cd med-to-condens
```

2. **Installer les dépendances** :
```bash
npm install
```

3. **Configurer les variables d'environnement** :
```bash
cp .env.local.example .env.local
```

Remplir les variables dans `.env.local` :
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

4. **Lancer le serveur de développement** :
```bash
npm run dev
```

L'application sera accessible à [http://localhost:3000](http://localhost:3000).

## 📜 Scripts

- `npm run dev` : Démarrer le serveur de développement
- `npm run build` : Construire l'application pour la production
- `npm run start` : Démarrer le serveur de production
- `npm run lint` : Linter le code
- `npm run type-check` : Vérifier les types TypeScript

## 📁 Structure du projet

```
src/
├── app/                    # App Router (pages, layouts, routes)
│   ├── (auth)/            # Routes d'authentification
│   └── (dashboard)/       # Routes protégées
├── components/
│   ├── layout/            # Composants de layout (navigation, tabs)
│   ├── modules/           # Modules métier
│   │   ├── dossiers/      # Gestion des patients
│   │   ├── observations/  # Observations et consultations
│   │   └── todos/         # Gestion des tâches
│   └── ui/                # Composants UI réutilisables
├── hooks/                 # Custom hooks (data fetching)
├── lib/                   # Utilitaires et configurations
│   ├── supabase/          # Client Supabase
│   └── date-utils.ts      # Utilitaires de dates
├── stores/                # Stores Zustand (tabs, app-module)
└── types/                 # Types TypeScript
```

## 🗄️ Configuration Supabase

### Tables principales

- `patients` : Dossiers patients
- `observations` : Observations médicales
- `consultations` : Consultations et réunions
- `todos` : Tâches à faire

### Row Level Security (RLS)

Toutes les tables sont protégées par RLS, les utilisateurs ne peuvent accéder qu'à leurs propres données.

### Générer les types de la base de données

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

## 🔐 Authentification

L'application utilise Supabase Auth avec Google OAuth. Le middleware Next.js protège automatiquement les routes non publiques.

Routes publiques :
- `/login`
- `/register`
- `/forgot-password`
- `/reset-password`
- `/auth` (callback OAuth)

## 🎯 Utilisation

1. **Connexion** : Se connecter avec Google
2. **Créer des patients** : Module "Dossiers" → Nouveau dossier
3. **Ajouter des observations** : Module "Observations" → Nouvelle observation
4. **Organiser en consultations** : Créer une consultation et importer une liste de patients
5. **Gérer les tâches** : Module "TODO" pour suivre les actions à effectuer

## 🔄 Fonctionnalités avancées

### Import de liste de patients
Coller une liste de noms (un par ligne) pour créer rapidement une consultation. Le système :
- Recherche les correspondances exactes
- Propose des patients similaires en cas de doute
- Permet de créer rapidement les dossiers manquants

### Auto-save
Les modifications inline (titre de consultation, tags, etc.) se sauvent automatiquement au clic extérieur.

### Filtres intelligents
Recherche insensible aux accents et à la casse pour une meilleure expérience utilisateur.

## 📝 Licence

Privé - Tous droits réservés

## 👨‍💻 Développement

Ce projet a été développé avec Claude Code pour une gestion optimale des dossiers patients et observations médicales.

# MedCondens

Application de condensation de données médicales.

## Stack Technique

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Base de données**: Supabase
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Styling**: Tailwind CSS

## Prérequis

- Node.js 18+
- npm ou yarn
- Compte Supabase

## Installation

1. Cloner le repository :
```bash
git clone https://github.com/Evolia/med-to-condens.git
cd med-to-condens
```

2. Installer les dépendances :
```bash
npm install
```

3. Configurer les variables d'environnement :
```bash
cp .env.local.example .env.local
```

Remplir les variables dans `.env.local` :
- `NEXT_PUBLIC_SUPABASE_URL` : URL de votre projet Supabase
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` : Clé anonyme Supabase

4. Lancer le serveur de développement :
```bash
npm run dev
```

L'application sera accessible à [http://localhost:3000](http://localhost:3000).

## Scripts

- `npm run dev` : Démarrer le serveur de développement
- `npm run build` : Construire l'application pour la production
- `npm run start` : Démarrer le serveur de production
- `npm run lint` : Linter le code
- `npm run type-check` : Vérifier les types TypeScript

## Structure du projet

```
src/
├── app/                 # App Router (pages, layouts)
├── components/          # Composants React réutilisables
├── hooks/              # Hooks personnalisés
├── lib/                # Utilitaires et configurations
│   └── supabase/       # Client Supabase
├── store/              # Stores Zustand
└── types/              # Types TypeScript
```

## Configuration Supabase

### Générer les types de la base de données

```bash
npx supabase gen types typescript --project-id <your-project-id> > src/types/database.ts
```

## Licence

Privé - Tous droits réservés

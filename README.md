# RenoTrack

A browser-first, multi-tenant SaaS platform designed to streamline residential renovation management. RenoTrack enables teams to assess, design, and inspect residential units through a unified, mobile-optimized web interface.

## Features

- 🔐 **Multi-tenant Authentication** - Secure tenant-based login system
- 📋 **Assessment Management** - Structured evaluation workflows per unit
- 🎨 **Design Projects** - Material and cost tracking for renovation projects
- 📊 **Dashboard** - KPI overview and quick actions
- 📱 **Mobile-First Design** - Fully responsive, optimized for mobile, tablet, and desktop
- 🏢 **Hierarchical Structure** - Community → Building → Unit organization
- 📄 **PDF Export** - Generate assessment reports

## Tech Stack

- **Framework**: Next.js 14 (App Router) + React 18
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui, Tremor, Heroicons
- **Database**: Prisma ORM + PostgreSQL (Supabase)
- **Authentication**: NextAuth.js + bcryptjs
- **Utilities**: jsPDF, html2canvas, class-variance-authority

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd TurnTrack
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` and set:
- `DATABASE_URL` - PostgreSQL connection string (for local: use SQLite `file:./dev.db`, for production: use Supabase connection string)
- `NEXTAUTH_URL="http://localhost:3000"` (change to your production URL in production)
- `NEXTAUTH_SECRET` - Generate a random secret (use `openssl rand -base64 32`)

4. Initialize the database:
```bash
npm run db:generate
npm run db:push
```

5. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
/
├── app/                    # Next.js App Router
│   ├── (auth)/            # Authentication routes
│   ├── dashboard/         # Dashboard pages
│   ├── assessments/       # Assessment management
│   ├── designs/           # Design projects
│   └── ...
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── ...
├── lib/                  # Utility functions
│   ├── prisma.ts        # Prisma client
│   └── utils.ts         # Helper functions
├── prisma/              # Database schema
│   └── schema.prisma
└── ...
```

## Database Schema

The application uses Prisma with PostgreSQL (Supabase in production). Key models include:

- **Tenant** - Multi-tenancy root
- **User** - User accounts with role-based permissions
- **Community / Building / Unit** - Project hierarchy
- **Assessment / Room / ComponentAssessment** - Inspection and condition data
- **DesignProject / DesignRoom / DesignComponent** - Design selection and costing

## User Roles

- **Admin** - Full system access
- **Project Manager** - Manage projects and assessments
- **Technician** - Perform assessments
- **Designer** - Create and manage design projects

## Development

### Database Commands

```bash
# Generate Prisma Client
npm run db:generate

# Push schema changes to database
npm run db:push

# Open Prisma Studio
npm run db:studio
```

### Building for Production

```bash
npm run build
npm start
```

## Deployment

See [DEPLOYMENT.md](./DEPLOYMENT.md) for detailed instructions on deploying to Vercel and Supabase.

## Color System

The application uses a color-coded condition system:
- **Keep** (Green) - Component is in good condition
- **Replace** (Yellow) - Component needs replacement
- **Repair** (Orange) - Component needs repair
- **Remove** (Red) - Component should be removed

## License

Private - All rights reserved

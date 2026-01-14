# Vaulta Dashboard (Next.js Fork)

This is a maintained fork of the original [SovIoTech/Vaulta-Dashboard](https://github.com/SovIoTech/Vaulta-Dashboard), built on **Next.js** with AWS Amplify, GraphQL, and React.

## Key Features
- Full dashboard functionality from the original Next.js implementation
- AWS Amplify authentication integration
- GraphQL API configuration (`.graphqlconfig.yml`)
- Responsive UI with modern React patterns

## Originally Noted
Early documentation mentioned Create React App migration, but the core project uses **Next.js** for SSR, API routes, and optimal performance.

## Local Development
```bash
npm install
npm run dev  # Uses Next.js dev server
Deployment
Vercel (native Next.js support)

AWS Amplify (configured via /amplify/)

Any Node.js host with npm run build && npm start

Structure
text
├── amplify/          # AWS Amplify config
├── public/           # Static assets
├── src/              # Next.js pages/components
├── .graphqlconfig.yml # GraphQL setup
└── package.json      # Next.js dependencies

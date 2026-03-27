#!/bin/bash
# backend/setup.sh - Initialisation du backend

echo "🚀 Initialisation du backend FiSAFi..."

echo "📦 Installation des dépendances..."
npm install

echo "🗄️  Configuration de la base de données..."
npx prisma migrate dev --name init

echo "📝 Génération du client Prisma..."
npx prisma generate

echo "✅ Backend configuré! Vous pouvez lancer:"
echo "   npm run dev:backend  (mode développement)"
echo "   npm run dev:all      (frontend + backend)"
echo ""
echo "📚 Documentation: backend/API_DOCUMENTATION.md"

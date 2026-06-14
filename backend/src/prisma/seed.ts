import { PrismaClient, Role, OutletStatus, ReviewSource, Sentiment, Permission } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@franchise.com' },
    update: {},
    create: {
      email: 'admin@franchise.com',
      password: adminPassword,
      firstName: 'Super',
      lastName: 'Admin',
      role: Role.ADMIN,
      isEmailVerified: true,
    },
  });

  // Create franchise
  const franchise = await prisma.franchise.upsert({
    where: { ownerId: admin.id },
    update: {},
    create: {
      name: 'Spice Garden Franchise',
      slug: 'spice-garden-franchise',
      description: 'Premium Indian restaurant franchise',
      email: 'info@spicegarden.com',
      phone: '+91-9876543210',
      address: 'Mumbai, Maharashtra, India',
      ownerId: admin.id,
    },
  });

  // Create manager
  const managerPassword = await bcrypt.hash('Manager@123', 12);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@franchise.com' },
    update: {},
    create: {
      email: 'manager@franchise.com',
      password: managerPassword,
      firstName: 'Rahul',
      lastName: 'Sharma',
      role: Role.MANAGER,
      isEmailVerified: true,
    },
  });

  // Create outlets
  const outlet1 = await prisma.outlet.create({
    data: {
      name: 'Spice Garden - Bandra',
      address: 'Shop 12, Linking Road, Bandra West',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400050',
      phone: '+91-22-26440001',
      email: 'bandra@spicegarden.com',
      status: OutletStatus.ACTIVE,
      franchiseId: franchise.id,
      managerId: manager.id,
      openingHours: {
        monday: { open: '10:00', close: '22:00' },
        tuesday: { open: '10:00', close: '22:00' },
        wednesday: { open: '10:00', close: '22:00' },
        thursday: { open: '10:00', close: '22:00' },
        friday: { open: '10:00', close: '23:00' },
        saturday: { open: '10:00', close: '23:00' },
        sunday: { open: '11:00', close: '22:00' },
      },
    },
  });

  const outlet2 = await prisma.outlet.create({
    data: {
      name: 'Spice Garden - Andheri',
      address: 'Plot 45, Andheri East, Near Metro Station',
      city: 'Mumbai',
      state: 'Maharashtra',
      country: 'India',
      postalCode: '400069',
      phone: '+91-22-26440002',
      email: 'andheri@spicegarden.com',
      status: OutletStatus.ACTIVE,
      franchiseId: franchise.id,
    },
  });

  // Seed reviews
  const reviewData = [
    { outletId: outlet1.id, source: ReviewSource.GOOGLE, rating: 4.5, authorName: 'Priya M.', content: 'Amazing food and great service! The butter chicken is outstanding.' },
    { outletId: outlet1.id, source: ReviewSource.GOOGLE, rating: 5.0, authorName: 'Amit K.', content: 'Best restaurant in Bandra. Highly recommend the thali!' },
    { outletId: outlet1.id, source: ReviewSource.WHATSAPP, rating: 3.5, authorName: 'Sneha R.', content: 'Food was good but service could be faster during peak hours.' },
    { outletId: outlet1.id, source: ReviewSource.INTERNAL, rating: 4.0, authorName: 'Vikram S.', content: 'Consistent quality every time I visit. Love the ambiance.' },
    { outletId: outlet2.id, source: ReviewSource.GOOGLE, rating: 4.2, authorName: 'Ananya B.', content: 'Great outlet with parking facility. Food portions are generous.' },
    { outletId: outlet2.id, source: ReviewSource.ZOMATO, rating: 2.0, authorName: 'Rohit P.', content: 'Delivery was late by 45 minutes. Food was cold.' },
  ];

  for (const review of reviewData) {
    await prisma.review.create({
      data: {
        ...review,
        sentiment: review.rating >= 4 ? Sentiment.POSITIVE : review.rating <= 2 ? Sentiment.NEGATIVE : Sentiment.NEUTRAL,
        reviewDate: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        tags: [],
      },
    });
  }

  // Seed revenue data
  for (let i = 0; i < 30; i++) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    await prisma.revenue.create({
      data: { outletId: outlet1.id, amount: 15000 + Math.random() * 10000, date, category: 'Food' },
    });
    await prisma.revenue.create({
      data: { outletId: outlet2.id, amount: 12000 + Math.random() * 8000, date, category: 'Food' },
    });
  }

  // Seed reputation scores
  await prisma.reputationScore.create({
    data: { outletId: outlet1.id, score: 82.5, googleScore: 85, whatsappScore: 78, totalReviews: 4 },
  });
  await prisma.reputationScore.create({
    data: { outletId: outlet2.id, score: 74.0, googleScore: 76, totalReviews: 2 },
  });

  console.log('✅ Database seeded successfully!');
  console.log('\n📧 Admin credentials: admin@franchise.com / Admin@123');
  console.log('📧 Manager credentials: manager@franchise.com / Manager@123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

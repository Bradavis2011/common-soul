const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createTestData() {
  try {
    console.log('🔄 Creating test data for moderation system...');

    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    const admin = await prisma.user.upsert({
      where: { email: 'admin@thecommonsoul.com' },
      update: {},
      create: {
        email: 'admin@thecommonsoul.com',
        password: adminPassword,
        userType: 'ADMIN',
        isVerified: true,
        profile: {
          create: {
            firstName: 'Admin',
            lastName: 'User',
            phone: '555-0000'
          }
        }
      }
    });
    console.log('✅ Admin user created:', admin.email);

    // Create a problematic healer for testing
    const problemHealerPassword = await bcrypt.hash('healer123', 10);
    const problemHealer = await prisma.user.upsert({
      where: { email: 'problem.healer@test.com' },
      update: {},
      create: {
        email: 'problem.healer@test.com',
        password: problemHealerPassword,
        userType: 'HEALER',
        isVerified: true,
        profile: {
          create: {
            firstName: 'Problem',
            lastName: 'Healer',
            phone: '555-9999',
            avatarUrl: '',
            healerProfile: {
              create: {
                specialties: JSON.stringify(['Fake Healing', 'Questionable Practices']),
                hourlyRate: 200,
                yearsExperience: 1,
                isActive: true,
                averageRating: 2.1,
                totalReviews: 5,
                responseRate: 45,
                cancellationRate: 25,
                completedSessions: 12
              }
            }
          }
        }
      }
    });
    console.log('✅ Problem healer created:', problemHealer.email);

    // Create a reporting customer
    const customerPassword = await bcrypt.hash('customer123', 10);
    const reporter = await prisma.user.upsert({
      where: { email: 'reporter@test.com' },
      update: {},
      create: {
        email: 'reporter@test.com',
        password: customerPassword,
        userType: 'CUSTOMER',
        isVerified: true,
        profile: {
          create: {
            firstName: 'Reporter',
            lastName: 'Customer',
            phone: '555-1111',
            customerProfile: {
              create: {
                preferences: JSON.stringify([])
              }
            }
          }
        }
      }
    });
    console.log('✅ Reporter customer created:', reporter.email);

    // Create some test reports
    const reports = [
      {
        reporterId: reporter.id,
        targetType: 'USER',
        targetId: problemHealer.id,
        targetUserId: problemHealer.id,
        reason: 'FRAUD',
        details: 'This healer claimed to cure cancer with crystals and charged me $500 for a fake healing session.',
        status: 'PENDING'
      },
      {
        reporterId: reporter.id,
        targetType: 'USER',
        targetId: problemHealer.id,
        targetUserId: problemHealer.id,
        reason: 'INAPPROPRIATE',
        details: 'Made inappropriate comments during our session and made me very uncomfortable.',
        status: 'PENDING'
      },
      {
        reporterId: reporter.id,
        targetType: 'USER',
        targetId: problemHealer.id,
        targetUserId: problemHealer.id,
        reason: 'NO_SHOW',
        details: 'Healer was a no-show for our scheduled session and refused to refund.',
        status: 'PENDING'
      }
    ];

    for (const reportData of reports) {
      await prisma.report.create({
        data: reportData
      });
      console.log(`✅ Report created: ${reportData.reason} against ${reportData.targetType}`);
    }

    console.log('\n🎉 Test data created successfully!');
    console.log('\n📋 Test Accounts Created:');
    console.log('👑 Admin: admin@thecommonsoul.com / admin123');
    console.log('🔴 Problem Healer: problem.healer@test.com / healer123');
    console.log('📝 Reporter: reporter@test.com / customer123');
    console.log('\n🔗 URLs for Testing:');
    console.log('• Frontend: http://localhost:8084');
    console.log('• Admin Reports: http://localhost:8084/admin/reports');
    console.log('• Healer Profile: http://localhost:8084/healer/' + problemHealer.id);
    console.log('• Prisma Studio: http://localhost:5555');

  } catch (error) {
    console.error('❌ Error creating test data:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestData();
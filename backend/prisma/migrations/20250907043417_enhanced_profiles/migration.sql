/*
  Warnings:

  - Added the required column `updatedAt` to the `customer_profiles` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `user_profiles` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_customer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "interests" TEXT,
    "preferredLocation" TEXT,
    "preferredSessionTypes" TEXT,
    "goals" TEXT,
    "previousExperience" TEXT,
    "healthConditions" TEXT,
    "availabilityPreferences" TEXT,
    "budgetRange" TEXT,
    "communicationStyle" TEXT,
    "sessionFrequency" TEXT,
    "preferences" TEXT,
    "referralSource" TEXT,
    "emergencyContact" TEXT,
    "consentToContact" BOOLEAN NOT NULL DEFAULT true,
    "marketingOptIn" BOOLEAN NOT NULL DEFAULT false,
    "lastBookingAt" DATETIME,
    "totalSessions" INTEGER NOT NULL DEFAULT 0,
    "favoriteHealers" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "customer_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_customer_profiles" ("id", "interests", "preferredLocation", "profileId") SELECT "id", "interests", "preferredLocation", "profileId" FROM "customer_profiles";
DROP TABLE "customer_profiles";
ALTER TABLE "new_customer_profiles" RENAME TO "customer_profiles";
CREATE UNIQUE INDEX "customer_profiles_profileId_key" ON "customer_profiles"("profileId");
CREATE TABLE "new_healer_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "profileId" TEXT NOT NULL,
    "specialties" TEXT,
    "hourlyRate" REAL,
    "yearsExperience" INTEGER,
    "certifications" TEXT,
    "education" TEXT,
    "languages" TEXT,
    "sessionTypes" TEXT,
    "availability" TEXT,
    "consultationFee" REAL,
    "sessionDuration" TEXT,
    "cancellationPolicy" TEXT,
    "paymentMethods" TEXT,
    "profileBanner" TEXT,
    "socialLinks" TEXT,
    "testimonials" TEXT,
    "isVerified" BOOLEAN NOT NULL DEFAULT false,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastActiveAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "healer_profiles_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "user_profiles" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_healer_profiles" ("certifications", "hourlyRate", "id", "isActive", "profileId", "specialties", "yearsExperience") SELECT "certifications", "hourlyRate", "id", "isActive", "profileId", "specialties", "yearsExperience" FROM "healer_profiles";
DROP TABLE "healer_profiles";
ALTER TABLE "new_healer_profiles" RENAME TO "healer_profiles";
CREATE UNIQUE INDEX "healer_profiles_profileId_key" ON "healer_profiles"("profileId");
CREATE TABLE "new_user_profiles" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "bio" TEXT,
    "phone" TEXT,
    "location" TEXT,
    "avatarUrl" TEXT,
    "dateOfBirth" DATETIME,
    "website" TEXT,
    "timezone" TEXT,
    "isProfileComplete" BOOLEAN NOT NULL DEFAULT false,
    "profileCompletionScore" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "user_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_user_profiles" ("avatarUrl", "bio", "firstName", "id", "lastName", "location", "phone", "userId") SELECT "avatarUrl", "bio", "firstName", "id", "lastName", "location", "phone", "userId" FROM "user_profiles";
DROP TABLE "user_profiles";
ALTER TABLE "new_user_profiles" RENAME TO "user_profiles";
CREATE UNIQUE INDEX "user_profiles_userId_key" ON "user_profiles"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

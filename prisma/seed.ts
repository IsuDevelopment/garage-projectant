import { PrismaClient, Role, FeatureCategory } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const MASTER_FEATURES = [
  // Materials
  { key: 'material_trapez',         name: 'Materiał: Trapez',          category: FeatureCategory.MATERIAL,     isDefault: true,  sortOrder: 1 },
  { key: 'material_blachodachowka', name: 'Materiał: Blachodachówka',  category: FeatureCategory.MATERIAL,     isDefault: true,  sortOrder: 2 },
  { key: 'material_rabek',          name: 'Materiał: Rąbek',           category: FeatureCategory.MATERIAL,     isDefault: false, sortOrder: 3 },
  // Roof types
  { key: 'roof_single',             name: 'Dach jednospadowy',          category: FeatureCategory.ROOF,         isDefault: true,  sortOrder: 10 },
  { key: 'roof_double',             name: 'Dach dwuspadowy (wzdłuż)',   category: FeatureCategory.ROOF,         isDefault: true,  sortOrder: 11 },
  { key: 'roof_double_front_back',  name: 'Dach dwuspadowy (wszerz)',   category: FeatureCategory.ROOF,         isDefault: false, sortOrder: 12 },
  // Gates
  { key: 'gate_tilt',               name: 'Brama uchylna',             category: FeatureCategory.GATE,         isDefault: true,  sortOrder: 20 },
  { key: 'gate_double_wing',        name: 'Brama dwuskrzydłowa',       category: FeatureCategory.GATE,         isDefault: true,  sortOrder: 21 },
  { key: 'gate_sectional',          name: 'Brama segmentowa',          category: FeatureCategory.GATE,         isDefault: false, sortOrder: 22 },
  // Construction
  { key: 'profile_30x30',           name: 'Profil 30×30 mm',           category: FeatureCategory.CONSTRUCTION, isDefault: true,  sortOrder: 30 },
  { key: 'profile_30x40',           name: 'Profil 30×40 mm',           category: FeatureCategory.CONSTRUCTION, isDefault: false, sortOrder: 31 },
  { key: 'construction_galvanized', name: 'Ocynkowanie',               category: FeatureCategory.CONSTRUCTION, isDefault: false, sortOrder: 32 },
  // Advanced
  { key: 'custom_sprites',          name: 'Własne tekstury',           category: FeatureCategory.ADVANCED,     isDefault: false, sortOrder: 40 },
  { key: 'custom_ground',           name: 'Konfiguracja podłoża',      category: FeatureCategory.ADVANCED,     isDefault: false, sortOrder: 41 },
  { key: 'dimension_extended',      name: 'Rozszerzone wymiary',       category: FeatureCategory.ADVANCED,     isDefault: false, sortOrder: 42 },
] as const;

async function main() {
  console.log('Seeding database...');

  // Upsert all master features
  for (const f of MASTER_FEATURES) {
    await prisma.feature.upsert({
      where:  { key: f.key },
      update: { name: f.name, category: f.category, isDefault: f.isDefault, sortOrder: f.sortOrder },
      create: f,
    });
  }
  console.log(`✓ ${MASTER_FEATURES.length} features upserted`);

  // Create super admin
  const email    = process.env.SUPER_ADMIN_EMAIL ?? 'admin@example.com';
  const password = process.env.SUPER_ADMIN_PASSWORD;

  if (!password) {
    console.warn('⚠ SUPER_ADMIN_PASSWORD not set — skipping super admin creation');
    return;
  }

  const passwordHash = await bcrypt.hash(password, 12);

  const admin = await prisma.user.upsert({
    where:  { email },
    update: { passwordHash, role: Role.SUPER_ADMIN },
    create: { email, name: 'Super Admin', passwordHash, role: Role.SUPER_ADMIN },
  });
  console.log(`✓ Super admin: ${admin.email}`);

  console.log('Seeding complete.');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());

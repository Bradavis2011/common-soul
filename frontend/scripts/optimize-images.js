import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const inputDir = path.join(__dirname, '../src/assets');
const outputDir = path.join(__dirname, '../public/optimized');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// Image optimization configurations
const configs = [
  // Hero image optimizations
  {
    input: 'spiritual-hero.jpg',
    outputs: [
      { width: 1920, format: 'webp', quality: 80, suffix: '-xl' },
      { width: 1920, format: 'jpeg', quality: 85, suffix: '-xl' },
      { width: 1200, format: 'webp', quality: 80, suffix: '-lg' },
      { width: 1200, format: 'jpeg', quality: 85, suffix: '-lg' },
      { width: 768, format: 'webp', quality: 80, suffix: '-md' },
      { width: 768, format: 'jpeg', quality: 85, suffix: '-md' },
      { width: 480, format: 'webp', quality: 80, suffix: '-sm' },
      { width: 480, format: 'jpeg', quality: 85, suffix: '-sm' },
    ]
  }
];

async function optimizeImages() {
  console.log('🎨 Starting image optimization...');

  for (const config of configs) {
    const inputPath = path.join(inputDir, config.input);
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Input file not found: ${config.input}`);
      continue;
    }

    console.log(`📸 Processing: ${config.input}`);
    
    const baseName = path.parse(config.input).name;

    for (const output of config.outputs) {
      const outputFileName = `${baseName}${output.suffix}.${output.format}`;
      const outputPath = path.join(outputDir, outputFileName);

      try {
        const pipeline = sharp(inputPath)
          .resize(output.width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          });

        if (output.format === 'webp') {
          pipeline.webp({ quality: output.quality });
        } else if (output.format === 'jpeg') {
          pipeline.jpeg({ quality: output.quality, progressive: true });
        }

        await pipeline.toFile(outputPath);

        const stats = fs.statSync(outputPath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`  ✅ ${outputFileName} (${sizeKB}KB)`);
      } catch (error) {
        console.log(`  ❌ Failed to create ${outputFileName}:`, error.message);
      }
    }
  }

  console.log('🎉 Image optimization complete!');
}

// Also optimize logos and other assets
async function optimizeLogos() {
  const logoDir = path.join(__dirname, '../public/assets');
  const logoFiles = ['Logo.png', 'Logo2.png', 'LogoPurple.png'];

  console.log('🖼️  Optimizing logos...');

  for (const logoFile of logoFiles) {
    const inputPath = path.join(logoDir, logoFile);
    
    if (!fs.existsSync(inputPath)) continue;

    const baseName = path.parse(logoFile).name;
    const outputs = [
      { width: 200, format: 'webp', quality: 90, suffix: '-sm' },
      { width: 400, format: 'webp', quality: 90, suffix: '-md' },
      { width: 800, format: 'webp', quality: 90, suffix: '-lg' },
      { width: 200, format: 'png', suffix: '-sm' },
      { width: 400, format: 'png', suffix: '-md' },
      { width: 800, format: 'png', suffix: '-lg' },
    ];

    console.log(`🏷️  Processing: ${logoFile}`);

    for (const output of outputs) {
      const outputFileName = `${baseName}${output.suffix}.${output.format}`;
      const outputPath = path.join(outputDir, outputFileName);

      try {
        const pipeline = sharp(inputPath)
          .resize(output.width, null, {
            withoutEnlargement: true,
            fit: 'inside'
          });

        if (output.format === 'webp') {
          pipeline.webp({ quality: output.quality });
        } else if (output.format === 'png') {
          pipeline.png({ compressionLevel: 9 });
        }

        await pipeline.toFile(outputPath);

        const stats = fs.statSync(outputPath);
        const sizeKB = Math.round(stats.size / 1024);
        console.log(`  ✅ ${outputFileName} (${sizeKB}KB)`);
      } catch (error) {
        console.log(`  ❌ Failed to create ${outputFileName}:`, error.message);
      }
    }
  }
}

// Run optimization
async function main() {
  try {
    await optimizeImages();
    await optimizeLogos();
    console.log('\n🎯 All image optimizations complete!');
    
    // Show size savings
    const originalHero = fs.statSync(path.join(inputDir, 'spiritual-hero.jpg'));
    const optimizedHeroWebP = fs.statSync(path.join(outputDir, 'spiritual-hero-lg.webp'));
    
    const originalKB = Math.round(originalHero.size / 1024);
    const optimizedKB = Math.round(optimizedHeroWebP.size / 1024);
    const savings = Math.round(((originalHero.size - optimizedHeroWebP.size) / originalHero.size) * 100);
    
    console.log(`\n📊 Size comparison (hero image):`);
    console.log(`   Original: ${originalKB}KB`);
    console.log(`   Optimized WebP: ${optimizedKB}KB`);
    console.log(`   Savings: ${savings}%`);
    
  } catch (error) {
    console.error('❌ Optimization failed:', error);
    process.exit(1);
  }
}

main();
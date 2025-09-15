#!/usr/bin/env node

const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

class RealHealerSearch {
    constructor() {
        this.browser = null;
        this.page = null;
        this.healers = [];
        this.searchedUrls = new Set();

        // Real search terms for finding healers
        this.searchTerms = [
            'reiki healer near me contact',
            'energy healer website email',
            'spiritual coach contact information',
            'crystal healer professional services',
            'chakra healer contact',
            'holistic healer email contact',
            'meditation teacher contact',
            'sound healer website',
            'spiritual healing services contact',
            'energy worker professional'
        ];

        // Email extraction patterns
        this.emailPatterns = [
            /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
            /mailto:([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
            /contact\s*:\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi,
            /email\s*:\s*([A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,})/gi
        ];

        // Phone patterns
        this.phonePatterns = [
            /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g,
            /\+?1[-.\s]?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
        ];
    }

    async initialize() {
        console.log('🚀 Initializing real healer search...');

        this.browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });

        this.page = await this.browser.newPage();

        // Set realistic user agent
        await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

        console.log('✅ Browser initialized');
    }

    async searchGoogle(searchTerm, maxResults = 10) {
        console.log(`🔍 Searching Google for: "${searchTerm}"`);

        try {
            await this.page.goto(`https://www.google.com/search?q=${encodeURIComponent(searchTerm)}`, {
                waitUntil: 'networkidle2',
                timeout: 30000
            });

            // Wait for search results
            await this.page.waitForSelector('div[data-ved]', { timeout: 10000 });

            // Extract search result URLs
            const searchResults = await this.page.evaluate(() => {
                const results = [];
                const links = document.querySelectorAll('a[href^="http"]');

                for (let link of links) {
                    const url = link.href;
                    const text = link.textContent.trim();

                    // Skip Google's own URLs and ads
                    if (!url.includes('google.com') &&
                        !url.includes('youtube.com') &&
                        !url.includes('facebook.com') &&
                        !url.includes('instagram.com') &&
                        !url.includes('linkedin.com') &&
                        text.length > 10) {
                        results.push({
                            url: url,
                            title: text
                        });
                    }
                }

                return results.slice(0, 10); // Limit results
            });

            console.log(`   Found ${searchResults.length} potential websites`);
            return searchResults;

        } catch (error) {
            console.log(`   ❌ Error searching Google: ${error.message}`);
            return [];
        }
    }

    async extractContactInfo(url, title = '') {
        if (this.searchedUrls.has(url)) {
            return null; // Already searched this URL
        }

        this.searchedUrls.add(url);

        try {
            console.log(`   📄 Extracting from: ${url}`);

            await this.page.goto(url, {
                waitUntil: 'networkidle2',
                timeout: 15000
            });

            // Get page content
            const content = await this.page.evaluate(() => {
                return {
                    text: document.body.textContent || '',
                    html: document.body.innerHTML || '',
                    title: document.title || ''
                };
            });

            // Extract emails
            const emails = this.extractEmails(content.text + ' ' + content.html);

            // Extract phone numbers
            const phones = this.extractPhones(content.text);

            // Extract business name
            const businessName = this.extractBusinessName(content.title, content.text, url);

            // Extract location
            const location = this.extractLocation(content.text);

            // Extract services/specialties
            const services = this.extractServices(content.text);

            if (emails.length > 0 || phones.length > 0) {
                const healer = {
                    name: businessName,
                    emails: emails,
                    phones: phones,
                    website: url,
                    location: location,
                    services: services,
                    title: title,
                    discoveryDate: new Date().toISOString(),
                    confidence: this.calculateConfidence(businessName, emails, phones, services, content.text)
                };

                console.log(`   ✅ Found healer: ${businessName} (${emails.length} emails, ${phones.length} phones)`);
                return healer;
            }

        } catch (error) {
            console.log(`   ❌ Error extracting from ${url}: ${error.message}`);
        }

        return null;
    }

    extractEmails(text) {
        const emails = new Set();

        for (let pattern of this.emailPatterns) {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Clean up mailto: prefix
                    const email = match.replace(/^mailto:/, '').toLowerCase().trim();

                    // Filter out common non-business emails
                    if (!email.includes('noreply') &&
                        !email.includes('admin') &&
                        !email.includes('support') &&
                        email.includes('@') &&
                        email.length > 5) {
                        emails.add(email);
                    }
                });
            }
        }

        return Array.from(emails);
    }

    extractPhones(text) {
        const phones = new Set();

        for (let pattern of this.phonePatterns) {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Clean up phone number
                    const phone = match.replace(/[^\d]/g, '');
                    if (phone.length === 10 || (phone.length === 11 && phone.startsWith('1'))) {
                        phones.add(match.trim());
                    }
                });
            }
        }

        return Array.from(phones);
    }

    extractBusinessName(title, text, url) {
        // Try to extract business name from title
        if (title && title.length > 3 && title.length < 100) {
            // Clean up common title patterns
            let name = title.replace(/\s*[-|]\s*.+$/, '').trim();
            if (name.length > 3) {
                return name;
            }
        }

        // Try to extract from URL
        const domain = url.replace(/^https?:\/\//, '').split('/')[0];
        const domainParts = domain.replace('www.', '').split('.');
        if (domainParts[0] && domainParts[0].length > 3) {
            return domainParts[0].charAt(0).toUpperCase() + domainParts[0].slice(1);
        }

        // Look for business names in content
        const businessPatterns = [
            /welcome to ([^.!?\n]+)/i,
            /about ([^.!?\n]+)/i,
            /^([^.!?\n]+) is a/i
        ];

        for (let pattern of businessPatterns) {
            const match = text.match(pattern);
            if (match && match[1] && match[1].length > 3 && match[1].length < 50) {
                return match[1].trim();
            }
        }

        return domain;
    }

    extractLocation(text) {
        // Look for location patterns
        const locationPatterns = [
            /located in ([^.!?\n]+)/i,
            /based in ([^.!?\n]+)/i,
            /serving ([^.!?\n]+)/i,
            /([A-Z][a-z]+,\s*[A-Z]{2})/g, // City, ST format
            /((?:[A-Z][a-z]+\s*)+,\s*(?:Alabama|Alaska|Arizona|Arkansas|California|Colorado|Connecticut|Delaware|Florida|Georgia|Hawaii|Idaho|Illinois|Indiana|Iowa|Kansas|Kentucky|Louisiana|Maine|Maryland|Massachusetts|Michigan|Minnesota|Mississippi|Missouri|Montana|Nebraska|Nevada|New Hampshire|New Jersey|New Mexico|New York|North Carolina|North Dakota|Ohio|Oklahoma|Oregon|Pennsylvania|Rhode Island|South Carolina|South Dakota|Tennessee|Texas|Utah|Vermont|Virginia|Washington|West Virginia|Wisconsin|Wyoming|AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IN|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY))/gi
        ];

        for (let pattern of locationPatterns) {
            const matches = text.match(pattern);
            if (matches && matches[0]) {
                const location = matches[0].replace(/^(located in|based in|serving)\s+/i, '').trim();
                if (location.length > 3 && location.length < 50) {
                    return location;
                }
            }
        }

        return 'Location not specified';
    }

    extractServices(text) {
        const healingKeywords = [
            'reiki', 'energy healing', 'crystal healing', 'spiritual coaching',
            'chakra balancing', 'sound healing', 'meditation', 'holistic healing',
            'energy work', 'spiritual guidance', 'healing arts', 'wellness coaching',
            'sound therapy', 'vibrational healing', 'aura cleansing', 'spiritual counseling'
        ];

        const foundServices = [];
        const lowerText = text.toLowerCase();

        for (let keyword of healingKeywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                foundServices.push(keyword);
            }
        }

        return foundServices.length > 0 ? foundServices : ['General Healing'];
    }

    calculateConfidence(name, emails, phones, services, content) {
        let confidence = 0;

        // Base confidence for having contact info
        if (emails.length > 0) confidence += 40;
        if (phones.length > 0) confidence += 20;

        // Professional email bonus
        const hasBusinessEmail = emails.some(email =>
            email.includes('info@') ||
            email.includes('contact@') ||
            email.includes('hello@') ||
            !email.includes('gmail.com')
        );
        if (hasBusinessEmail) confidence += 15;

        // Healing-related content
        const healingTerms = services.length;
        confidence += Math.min(healingTerms * 5, 15);

        // Professional website indicators
        if (content.includes('appointment') || content.includes('session')) confidence += 5;
        if (content.includes('certified') || content.includes('licensed')) confidence += 5;
        if (content.includes('experience') || content.includes('years')) confidence += 3;

        return Math.min(confidence, 100);
    }

    async delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    async searchForHealers(targetCount = 25) {
        console.log(`🎯 Starting real search for ${targetCount} healers with contact information\n`);

        for (let searchTerm of this.searchTerms) {
            if (this.healers.length >= targetCount) {
                break;
            }

            // Search Google for this term
            const searchResults = await this.searchGoogle(searchTerm);

            // Extract contact info from each result
            for (let result of searchResults) {
                if (this.healers.length >= targetCount) {
                    break;
                }

                const healer = await this.extractContactInfo(result.url, result.title);

                if (healer) {
                    this.healers.push(healer);
                    console.log(`📧 Progress: ${this.healers.length}/${targetCount} healers found`);
                }

                // Delay between requests to be respectful
                await this.delay(2000 + Math.random() * 3000); // 2-5 second delay
            }

            // Delay between search terms
            await this.delay(5000 + Math.random() * 5000); // 5-10 second delay
        }

        console.log(`\n✅ Search complete! Found ${this.healers.length} healers with contact information`);
        return this.healers;
    }

    async saveResults() {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const resultsDir = path.join(__dirname, 'Discovery Results');

        // Ensure directories exist
        const dirs = ['exports', 'databases', 'logs'].map(dir => path.join(resultsDir, dir));
        dirs.forEach(dir => {
            if (!fs.existsSync(dir)) {
                fs.mkdirSync(dir, { recursive: true });
            }
        });

        // Save JSON database
        const jsonPath = path.join(resultsDir, 'databases', `real_healers_${timestamp}.json`);
        const jsonData = {
            searchDate: new Date().toISOString(),
            totalFound: this.healers.length,
            healers: this.healers,
            searchTermsUsed: this.searchTerms,
            summary: {
                withEmails: this.healers.filter(h => h.emails.length > 0).length,
                withPhones: this.healers.filter(h => h.phones.length > 0).length,
                avgConfidence: Math.round(this.healers.reduce((acc, h) => acc + h.confidence, 0) / this.healers.length)
            }
        };

        fs.writeFileSync(jsonPath, JSON.stringify(jsonData, null, 2));

        // Save Excel export
        const excelPath = path.join(resultsDir, 'exports', `real_healer_contacts_${timestamp}.xlsx`);
        const worksheetData = this.healers.map(healer => ({
            'Business Name': healer.name,
            'Primary Email': healer.emails[0] || '',
            'All Emails': healer.emails.join(', '),
            'Primary Phone': healer.phones[0] || '',
            'All Phones': healer.phones.join(', '),
            'Website': healer.website,
            'Location': healer.location,
            'Services': healer.services.join(', '),
            'Confidence Score': healer.confidence + '%',
            'Discovery Date': new Date(healer.discoveryDate).toLocaleDateString(),
            'Page Title': healer.title,
            'Email Count': healer.emails.length,
            'Phone Count': healer.phones.length
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Healer Contacts');
        XLSX.writeFile(workbook, excelPath);

        console.log(`\n📁 Results saved:`);
        console.log(`   Database: ${jsonPath}`);
        console.log(`   Excel: ${excelPath}`);

        return { jsonPath, excelPath };
    }

    printSummary() {
        console.log(`\n📊 REAL SEARCH RESULTS SUMMARY`);
        console.log(`=====================================`);
        console.log(`Total Healers Found: ${this.healers.length}`);
        console.log(`With Emails: ${this.healers.filter(h => h.emails.length > 0).length}`);
        console.log(`With Phone Numbers: ${this.healers.filter(h => h.phones.length > 0).length}`);

        const avgConfidence = this.healers.length > 0 ?
            Math.round(this.healers.reduce((acc, h) => acc + h.confidence, 0) / this.healers.length) : 0;
        console.log(`Average Confidence: ${avgConfidence}%`);

        // Top services
        const serviceCount = {};
        this.healers.forEach(healer => {
            healer.services.forEach(service => {
                serviceCount[service] = (serviceCount[service] || 0) + 1;
            });
        });

        const topServices = Object.entries(serviceCount)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 5);

        console.log(`\nTop Services:`);
        topServices.forEach(([service, count]) => {
            console.log(`   ${service}: ${count} practitioners`);
        });

        // Sample healers
        console.log(`\nSample Healers Found:`);
        this.healers.slice(0, 3).forEach((healer, i) => {
            console.log(`${i + 1}. ${healer.name}`);
            console.log(`   Emails: ${healer.emails.join(', ') || 'None'}`);
            console.log(`   Phone: ${healer.phones[0] || 'None'}`);
            console.log(`   Services: ${healer.services.join(', ')}`);
            console.log(`   Website: ${healer.website}`);
            console.log(`   Confidence: ${healer.confidence}%\n`);
        });
    }

    async cleanup() {
        if (this.browser) {
            await this.browser.close();
        }
    }
}

// Main execution
async function main() {
    const searcher = new RealHealerSearch();

    try {
        await searcher.initialize();

        // Search for real healers
        await searcher.searchForHealers(25); // Target 25 real healers

        // Save results
        await searcher.saveResults();

        // Print summary
        searcher.printSummary();

    } catch (error) {
        console.error('❌ Search failed:', error);
    } finally {
        await searcher.cleanup();
    }
}

// Run if called directly
if (require.main === module) {
    main().catch(console.error);
}

module.exports = RealHealerSearch;
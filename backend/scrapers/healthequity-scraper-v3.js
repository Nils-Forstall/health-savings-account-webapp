const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class HealthEquityScraperV3 {
  constructor() {
    this.driver = null;
  }

  async initialize() {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    options.addArguments('--window-size=1920,1080');
    options.addArguments('--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  async scrapeQualifiedExpenses() {
    console.log('Scraping qualified expenses from HealthEquity...');
    const expenses = [];
    
    await this.driver.get('https://www.healthequity.com/hsa-qme');
    await this.driver.wait(until.elementLocated(By.css('h1')), 15000);
    await this.driver.sleep(5000);
    
    console.log('Extracting HSA qualified expenses...');
    
    try {
      const expenseElements = await this.driver.findElements(By.css('p[tabindex="0"]'));
      console.log(`Found ${expenseElements.length} potential expense elements`);
      
      for (const element of expenseElements) {
        try {
          const text = await element.getText();
          if (text && text.trim()) {
            const cleanText = text.replace(/\s*(Rx|LMN)\s*$/, '').trim();
            
            if (cleanText && 
                cleanText.length > 1 &&
                !cleanText.includes('Verify you are human') &&
                !cleanText.includes('Select product') &&
                !cleanText.includes('Only eligible') &&
                !['HSA', 'FSA', 'DCFSA', 'LPFSA', 'HRA'].includes(cleanText)) {
              
              expenses.push({
                name: cleanText,
                category: 'HSA',
                is_qualified: true,
                source_url: 'https://www.healthequity.com/hsa-qme',
                raw_text: text.trim()
              });
            }
          }
        } catch (e) {
        }
      }
    } catch (e) {
      console.log('Error extracting HSA qualified expenses:', e.message);
    }
    
    console.log(`Found ${expenses.length} HSA qualified expenses`);
    return expenses;
  }

  async scrapeNonQualifiedExpenses() {
    console.log('Scraping non-qualified expenses from HealthEquity...');
    const expenses = [];
    
    await this.driver.get('https://www.healthequity.com/non-qme');
    await this.driver.wait(until.elementLocated(By.css('h1')), 15000);
    await this.driver.sleep(5000);
    
    const categories = ['HSA', 'FSA', 'DCFSA', 'LPFSA', 'HRA'];
    
    for (const category of categories) {
      console.log(`Scraping ${category} non-qualified expenses...`);
      
      try {
        const categoryLinks = await this.driver.findElements(By.xpath(`//a[contains(text(), '${category}')]`));
        
        if (categoryLinks.length > 0) {
          await categoryLinks[0].click();
          await this.driver.sleep(3000);
        }
        
        const expenseElements = await this.driver.findElements(By.css('p[tabindex="0"]'));
        console.log(`Found ${expenseElements.length} potential ${category} non-qualified expense elements`);
        
        for (const element of expenseElements) {
          try {
            const text = await element.getText();
            if (text && text.trim()) {
              const cleanText = text.replace(/\s*(Rx|LMN)\s*$/, '').trim();
              
              if (cleanText && 
                  cleanText.length > 1 &&
                  !cleanText.includes('Verify you are human') &&
                  !cleanText.includes('Select product') &&
                  !cleanText.includes('Only eligible') &&
                  !categories.includes(cleanText)) {
                
                expenses.push({
                  name: cleanText,
                  category: category,
                  is_qualified: false,
                  source_url: 'https://www.healthequity.com/non-qme',
                  raw_text: text.trim()
                });
              }
            }
          } catch (e) {
          }
        }
      } catch (e) {
        console.log(`Error scraping ${category} non-qualified expenses:`, e.message);
      }
    }
    
    console.log(`Found ${expenses.length} total non-qualified expenses`);
    return expenses;
  }

  async scrapeAllExpenses() {
    await this.initialize();
    
    try {
      const qualifiedExpenses = await this.scrapeQualifiedExpenses();
      const nonQualifiedExpenses = await this.scrapeNonQualifiedExpenses();
      
      return {
        qualified: qualifiedExpenses,
        nonQualified: nonQualifiedExpenses,
        total: qualifiedExpenses.length + nonQualifiedExpenses.length
      };
    } finally {
      await this.close();
    }
  }

  async close() {
    if (this.driver) {
      await this.driver.quit();
    }
  }
}

module.exports = HealthEquityScraperV3;

if (require.main === module) {
  (async () => {
    const scraper = new HealthEquityScraperV3();
    try {
      const results = await scraper.scrapeAllExpenses();
      console.log('\n=== SCRAPING RESULTS ===');
      console.log(`Qualified expenses: ${results.qualified.length}`);
      console.log(`Non-qualified expenses: ${results.nonQualified.length}`);
      console.log(`Total expenses: ${results.total}`);
      
      const fs = require('fs');
      fs.writeFileSync('./scraped-expenses-v3.json', JSON.stringify(results, null, 2));
      console.log('Results saved to scraped-expenses-v3.json');
      
      if (results.qualified.length > 0) {
        console.log('\nSample qualified expenses:');
        results.qualified.slice(0, 10).forEach(exp => console.log(`- ${exp.name}`));
      }
      
      if (results.nonQualified.length > 0) {
        console.log('\nSample non-qualified expenses:');
        results.nonQualified.slice(0, 10).forEach(exp => console.log(`- ${exp.name} (${exp.category})`));
      }
    } catch (error) {
      console.error('Scraping failed:', error);
    }
  })();
}

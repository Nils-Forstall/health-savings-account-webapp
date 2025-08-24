const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class HealthEquityScraper {
  constructor() {
    this.driver = null;
  }

  async initialize() {
    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    options.addArguments('--disable-dev-shm-usage');
    options.addArguments('--disable-gpu');
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  async scrapeQualifiedExpenses() {
    console.log('Scraping qualified expenses from HealthEquity...');
    await this.driver.get('https://www.healthequity.com/hsa-qme');
    
    await this.driver.wait(until.elementLocated(By.css('h1')), 10000);
    
    const expenses = [];
    
    const categories = ['HSA', 'FSA', 'DCFSA', 'LPFSA', 'HRA'];
    
    for (const category of categories) {
      console.log(`Scraping ${category} qualified expenses...`);
      
      try {
        const categoryLinks = await this.driver.findElements(By.xpath(`//a[contains(text(), '${category}')]`));
        
        if (categoryLinks.length > 0) {
          await categoryLinks[0].click();
          await this.driver.sleep(1000); // Wait for content to load
        }
        
        const expenseElements = await this.driver.findElements(By.css('p[tabindex="0"]'));
        
        for (const element of expenseElements) {
          try {
            const text = await element.getText();
            if (text && text.trim() && !categories.includes(text.trim())) {
              const cleanText = text.replace(/\s*(Rx|LMN)\s*$/, '').trim();
              if (cleanText) {
                expenses.push({
                  name: cleanText,
                  category: category,
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
        console.log(`Error scraping ${category} expenses:`, e.message);
      }
    }
    
    console.log(`Found ${expenses.length} qualified expenses`);
    return expenses;
  }

  async scrapeNonQualifiedExpenses() {
    console.log('Scraping non-qualified expenses from HealthEquity...');
    await this.driver.get('https://www.healthequity.com/non-qme');
    
    await this.driver.wait(until.elementLocated(By.css('h1')), 10000);
    
    const expenses = [];
    
    const categories = ['HSA', 'FSA', 'DCFSA', 'LPFSA', 'HRA'];
    
    for (const category of categories) {
      console.log(`Scraping ${category} non-qualified expenses...`);
      
      try {
        const categoryLinks = await this.driver.findElements(By.xpath(`//a[contains(text(), '${category}')]`));
        
        if (categoryLinks.length > 0) {
          await categoryLinks[0].click();
          await this.driver.sleep(1000); // Wait for content to load
        }
        
        const expenseElements = await this.driver.findElements(By.css('p[tabindex="0"]'));
        
        for (const element of expenseElements) {
          try {
            const text = await element.getText();
            if (text && text.trim() && !categories.includes(text.trim())) {
              const cleanText = text.replace(/\s*(Rx|LMN)\s*$/, '').trim();
              if (cleanText) {
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
        console.log(`Error scraping ${category} expenses:`, e.message);
      }
    }
    
    console.log(`Found ${expenses.length} non-qualified expenses`);
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

module.exports = HealthEquityScraper;

if (require.main === module) {
  (async () => {
    const scraper = new HealthEquityScraper();
    try {
      const results = await scraper.scrapeAllExpenses();
      console.log('\n=== SCRAPING RESULTS ===');
      console.log(`Qualified expenses: ${results.qualified.length}`);
      console.log(`Non-qualified expenses: ${results.nonQualified.length}`);
      console.log(`Total expenses: ${results.total}`);
      
      const fs = require('fs');
      fs.writeFileSync('./scraped-expenses.json', JSON.stringify(results, null, 2));
      console.log('Results saved to scraped-expenses.json');
    } catch (error) {
      console.error('Scraping failed:', error);
    }
  })();
}

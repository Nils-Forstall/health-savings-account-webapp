const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');

class HealthEquityScraperFinal {
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
    options.addArguments('--disable-blink-features=AutomationControlled');
    options.addArguments('--disable-extensions');
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
      
    await this.driver.executeScript("Object.defineProperty(navigator, 'webdriver', {get: () => undefined})");
  }

  async scrapeQualifiedExpenses() {
    console.log('Scraping qualified expenses from HealthEquity...');
    const expenses = [];
    
    try {
      await this.driver.get('https://www.healthequity.com/hsa-qme');
      await this.driver.wait(until.elementLocated(By.css('h1')), 15000);
      await this.driver.sleep(5000);
      
      console.log('Extracting HSA qualified expenses...');
      
      let expenseElements = [];
      
      try {
        expenseElements = await this.driver.findElements(By.css('p[tabindex="0"]'));
        console.log(`Found ${expenseElements.length} elements with p[tabindex="0"]`);
      } catch (e) {
        console.log('Primary selector failed:', e.message);
      }
      
      if (expenseElements.length === 0) {
        try {
          expenseElements = await this.driver.findElements(By.css('li p'));
          console.log(`Found ${expenseElements.length} elements with li p`);
        } catch (e) {
          console.log('Fallback selector failed:', e.message);
        }
      }
      
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
                !cleanText.includes('HSA qualified medical expenses') &&
                !['HSA', 'FSA', 'DCFSA', 'LPFSA', 'HRA', 'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z'].includes(cleanText)) {
              
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
      
      console.log(`Found ${expenses.length} HSA qualified expenses`);
      
    } catch (e) {
      console.log('Error scraping qualified expenses:', e.message);
    }
    
    return expenses;
  }

  async scrapeNonQualifiedExpenses() {
    console.log('Scraping non-qualified expenses from HealthEquity...');
    const expenses = [];
    
    try {
      await this.driver.get('https://www.healthequity.com/non-qme');
      await this.driver.wait(until.elementLocated(By.css('h1')), 15000);
      await this.driver.sleep(5000);
      
      const categories = ['HSA', 'FSA', 'DCFSA', 'LPFSA', 'HRA'];
      
      for (const category of categories) {
        console.log(`Scraping ${category} non-qualified expenses...`);
        
        try {
          const categoryLinks = await this.driver.findElements(By.xpath(`//a[contains(text(), '${category}')]`));
          
          if (categoryLinks.length > 0) {
            try {
              await categoryLinks[0].click();
              await this.driver.sleep(3000);
            } catch (e) {
              console.log(`Could not click ${category} tab:`, e.message);
            }
          }
          
          const expenseElements = await this.driver.findElements(By.css('p[tabindex="0"]'));
          console.log(`Found ${expenseElements.length} potential ${category} expense elements`);
          
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
      
    } catch (e) {
      console.log('Error scraping non-qualified expenses:', e.message);
    }
    
    console.log(`Found ${expenses.length} total non-qualified expenses`);
    return expenses;
  }

  async scrapeAllExpenses() {
    await this.initialize();
    
    try {
      const qualifiedExpenses = await this.scrapeQualifiedExpenses();
      const nonQualifiedExpenses = await this.scrapeNonQualifiedExpenses();
      
      const allExpenses = [...qualifiedExpenses, ...nonQualifiedExpenses];
      const uniqueExpenses = allExpenses.filter((expense, index, self) => 
        index === self.findIndex(e => e.name === expense.name && e.category === expense.category)
      );
      
      const qualifiedUnique = uniqueExpenses.filter(e => e.is_qualified);
      const nonQualifiedUnique = uniqueExpenses.filter(e => !e.is_qualified);
      
      return {
        qualified: qualifiedUnique,
        nonQualified: nonQualifiedUnique,
        total: uniqueExpenses.length,
        stats: {
          qualifiedCount: qualifiedUnique.length,
          nonQualifiedCount: nonQualifiedUnique.length,
          duplicatesRemoved: allExpenses.length - uniqueExpenses.length
        }
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

module.exports = HealthEquityScraperFinal;

if (require.main === module) {
  (async () => {
    const scraper = new HealthEquityScraperFinal();
    try {
      console.log('Starting comprehensive HealthEquity expense scraping...');
      const results = await scraper.scrapeAllExpenses();
      
      console.log('\n=== FINAL SCRAPING RESULTS ===');
      console.log(`Qualified expenses: ${results.stats.qualifiedCount}`);
      console.log(`Non-qualified expenses: ${results.stats.nonQualifiedCount}`);
      console.log(`Total unique expenses: ${results.total}`);
      console.log(`Duplicates removed: ${results.stats.duplicatesRemoved}`);
      
      fs.writeFileSync('./scraped-expenses-final.json', JSON.stringify(results, null, 2));
      console.log('Results saved to scraped-expenses-final.json');
      
      if (results.qualified.length > 0) {
        console.log('\nSample qualified expenses:');
        results.qualified.slice(0, 10).forEach(exp => console.log(`- ${exp.name}`));
      }
      
      if (results.nonQualified.length > 0) {
        console.log('\nSample non-qualified expenses:');
        results.nonQualified.slice(0, 10).forEach(exp => console.log(`- ${exp.name} (${exp.category})`));
      }
      
      console.log('\nScraping completed successfully!');
    } catch (error) {
      console.error('Scraping failed:', error);
      process.exit(1);
    }
  })();
}

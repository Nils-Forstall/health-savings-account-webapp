const { Builder, By, until } = require('selenium-webdriver');
const chrome = require('selenium-webdriver/chrome');

class HealthEquityScraperV2 {
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
    
    this.driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .build();
  }

  async scrapeQualifiedExpenses() {
    console.log('Scraping qualified expenses from HealthEquity...');
    const expenses = [];
    
    await this.driver.get('https://www.healthequity.com/hsa-qme');
    await this.driver.wait(until.elementLocated(By.css('h1')), 10000);
    await this.driver.sleep(3000);
    
    console.log('Scraping HSA qualified expenses...');
    const hsaExpenses = await this.extractExpensesFromCurrentPage('HSA');
    expenses.push(...hsaExpenses);
    console.log(`Found ${hsaExpenses.length} HSA qualified expenses`);
    
    await this.driver.get('https://www.healthequity.com/fsa-qme');
    await this.driver.wait(until.elementLocated(By.css('h1')), 10000);
    await this.driver.sleep(3000);
    
    console.log('Scraping FSA qualified expenses...');
    const fsaExpenses = await this.extractExpensesFromCurrentPage('FSA');
    expenses.push(...fsaExpenses);
    console.log(`Found ${fsaExpenses.length} FSA qualified expenses`);
    
    console.log(`Total qualified expenses found: ${expenses.length}`);
    return expenses;
  }

  async scrapeNonQualifiedExpenses() {
    console.log('Scraping non-qualified expenses from HealthEquity...');
    await this.driver.get('https://www.healthequity.com/non-qme');
    await this.driver.wait(until.elementLocated(By.css('h1')), 10000);
    await this.driver.sleep(3000);
    
    const expenses = [];
    const categories = ['HSA', 'FSA', 'DCFSA', 'LPFSA', 'HRA'];
    
    for (const category of categories) {
      console.log(`Scraping ${category} non-qualified expenses...`);
      
      try {
        const categoryButton = await this.driver.findElement(By.xpath(`//a[contains(text(), '${category}')]`));
        await categoryButton.click();
        await this.driver.sleep(2000);
        
        const categoryExpenses = await this.extractExpensesFromCurrentPage(category, false);
        expenses.push(...categoryExpenses);
        console.log(`Found ${categoryExpenses.length} ${category} non-qualified expenses`);
      } catch (e) {
        console.log(`Error scraping ${category} non-qualified expenses:`, e.message);
      }
    }
    
    console.log(`Total non-qualified expenses found: ${expenses.length}`);
    return expenses;
  }

  async extractExpensesFromCurrentPage(category, isQualified = true) {
    const expenses = [];
    
    try {
      let expenseElements = [];
      
      expenseElements = await this.driver.findElements(By.css('p[tabindex="0"]'));
      console.log(`Found ${expenseElements.length} elements with p[tabindex="0"]`);
      
      if (expenseElements.length === 0) {
        expenseElements = await this.driver.findElements(By.css('p'));
        console.log(`Found ${expenseElements.length} total p elements`);
      }
      
      if (expenseElements.length === 0) {
        expenseElements = await this.driver.findElements(By.css('a'));
        console.log(`Found ${expenseElements.length} total a elements`);
      }
      
      for (const element of expenseElements) {
        try {
          const text = await element.getText();
          if (text && text.trim()) {
            const cleanText = text.replace(/\s*(Rx|LMN)\s*$/, '').trim();
            
            if (cleanText && 
                !['HSA', 'FSA', 'DCFSA', 'LPFSA', 'HRA'].includes(cleanText) &&
                !cleanText.includes('Select product') &&
                !cleanText.includes('Only eligible') &&
                cleanText.length > 1) {
              
              expenses.push({
                name: cleanText,
                category: category,
                is_qualified: isQualified,
                source_url: await this.driver.getCurrentUrl(),
                raw_text: text.trim()
              });
            }
          }
        } catch (e) {
        }
      }
    } catch (e) {
      console.log(`Error extracting expenses for ${category}:`, e.message);
    }
    
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

module.exports = HealthEquityScraperV2;

if (require.main === module) {
  (async () => {
    const scraper = new HealthEquityScraperV2();
    try {
      const results = await scraper.scrapeAllExpenses();
      console.log('\n=== SCRAPING RESULTS ===');
      console.log(`Qualified expenses: ${results.qualified.length}`);
      console.log(`Non-qualified expenses: ${results.nonQualified.length}`);
      console.log(`Total expenses: ${results.total}`);
      
      const fs = require('fs');
      fs.writeFileSync('./scraped-expenses-v2.json', JSON.stringify(results, null, 2));
      console.log('Results saved to scraped-expenses-v2.json');
      
      if (results.qualified.length > 0) {
        console.log('\nSample qualified expenses:');
        results.qualified.slice(0, 5).forEach(exp => console.log(`- ${exp.name} (${exp.category})`));
      }
      
      if (results.nonQualified.length > 0) {
        console.log('\nSample non-qualified expenses:');
        results.nonQualified.slice(0, 5).forEach(exp => console.log(`- ${exp.name} (${exp.category})`));
      }
    } catch (error) {
      console.error('Scraping failed:', error);
    }
  })();
}

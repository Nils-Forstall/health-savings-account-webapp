const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const sampleExpenses = {
  qualified: [
    { name: "Disposable Face Masks", category: "HSA", keywords: "face masks medical protection" },
    { name: "Anti-Bacterial Hand Sanitizer", category: "HSA", keywords: "hand sanitizer antibacterial medical" },
    { name: "Prescriptions", category: "HSA", keywords: "prescription medication pharmacy rx" },
    { name: "Doctor Fees", category: "HSA", keywords: "doctor physician medical fees" },
    { name: "Dental Cleanings", category: "HSA", keywords: "dental cleaning teeth oral health" },
    { name: "Eyeglasses", category: "HSA", keywords: "eyeglasses glasses vision optical" },
    { name: "Contact Lenses", category: "HSA", keywords: "contact lenses vision eye care" },
    { name: "Flu Shot", category: "HSA", keywords: "flu shot vaccination immunization" },
    { name: "Blood Pressure Monitor", category: "HSA", keywords: "blood pressure monitor medical device" },
    { name: "Thermometer", category: "HSA", keywords: "thermometer temperature medical device" },
    { name: "First Aid Kit", category: "HSA", keywords: "first aid kit medical supplies" },
    { name: "Crutches", category: "HSA", keywords: "crutches mobility medical equipment" },
    { name: "Wheelchair", category: "HSA", keywords: "wheelchair mobility medical equipment" },
    { name: "Hearing Aids", category: "HSA", keywords: "hearing aids medical device" },
    { name: "Orthodontia", category: "HSA", keywords: "orthodontia braces dental" },
    { name: "Physical Therapy", category: "HSA", keywords: "physical therapy rehabilitation medical" },
    { name: "Mental Health Counseling", category: "HSA", keywords: "mental health counseling therapy" },
    { name: "Chiropractic Care", category: "HSA", keywords: "chiropractic care medical treatment" },
    { name: "Acupuncture", category: "HSA", keywords: "acupuncture alternative medicine medical" },
    { name: "Medical Equipment", category: "HSA", keywords: "medical equipment devices supplies" },
    { name: "Hospital Services", category: "HSA", keywords: "hospital medical services" },
    { name: "Laboratory Tests", category: "HSA", keywords: "laboratory tests medical diagnosis" },
    { name: "X-rays", category: "HSA", keywords: "x-rays medical imaging diagnostic" },
    { name: "MRI Scans", category: "HSA", keywords: "mri scan medical imaging" },
    { name: "Ambulance Services", category: "HSA", keywords: "ambulance emergency medical transport" },
    { name: "Surgery", category: "HSA", keywords: "surgery medical procedure operation" },
    { name: "Anesthesia", category: "HSA", keywords: "anesthesia medical procedure" },
    { name: "Insulin", category: "HSA", keywords: "insulin diabetes medication" },
    { name: "Diabetic Supplies", category: "HSA", keywords: "diabetic supplies medical diabetes" },
    { name: "Pregnancy Tests", category: "HSA", keywords: "pregnancy test medical diagnostic" }
  ],
  nonQualified: [
    { name: "Abdominoplasty", category: "HSA", keywords: "abdominoplasty cosmetic surgery" },
    { name: "Activated Charcoal", category: "HSA", keywords: "activated charcoal supplement" },
    { name: "Adoption (fees associated with adopting a child)", category: "DCFSA", keywords: "adoption fees child care" },
    { name: "Adult Day Care", category: "DCFSA", keywords: "adult day care elder care" },
    { name: "After-School Care or Extended Day Care Programs", category: "DCFSA", keywords: "after school care child care" },
    { name: "Agency Fee for Child Care", category: "DCFSA", keywords: "agency fee child care" },
    { name: "Appearance Improvements", category: "HSA", keywords: "appearance improvements cosmetic" },
    { name: "Aromatherapy", category: "HSA", keywords: "aromatherapy alternative wellness" },
    { name: "Artificial Teeth", category: "HSA", keywords: "artificial teeth cosmetic dental" },
    { name: "Electronic Cigarettes", category: "HSA", keywords: "electronic cigarettes vaping" },
    { name: "Exercise Ball", category: "HSA", keywords: "exercise ball fitness equipment" },
    { name: "Face Lift", category: "HSA", keywords: "face lift cosmetic surgery" },
    { name: "Face Wash (Non-Medicated)", category: "HSA", keywords: "face wash cosmetic skincare" },
    { name: "Facial Tissues", category: "HSA", keywords: "facial tissues personal care" },
    { name: "Field Trips", category: "DCFSA", keywords: "field trips school activities" },
    { name: "Nanny", category: "DCFSA", keywords: "nanny child care" },
    { name: "Nitrile Gloves", category: "HSA", keywords: "nitrile gloves protective equipment" },
    { name: "No Show Fee By Provider", category: "HSA", keywords: "no show fee medical provider" },
    { name: "Organic Food", category: "HSA", keywords: "organic food nutrition" },
    { name: "Paraffin Wax", category: "HSA", keywords: "paraffin wax cosmetic treatment" },
    { name: "Pastoral Counseling", category: "HSA", keywords: "pastoral counseling religious" },
    { name: "Paternity Testing", category: "HSA", keywords: "paternity testing genetic" },
    { name: "Pedicure", category: "HSA", keywords: "pedicure cosmetic foot care" },
    { name: "Perfume", category: "HSA", keywords: "perfume cosmetic fragrance" },
    { name: "Personal Trainer", category: "HSA", keywords: "personal trainer fitness" },
    { name: "Pet Care", category: "HSA", keywords: "pet care veterinary" },
    { name: "Plastic Surgery (Cosmetic)", category: "HSA", keywords: "plastic surgery cosmetic" },
    { name: "Teeth Whitening", category: "HSA", keywords: "teeth whitening cosmetic dental" },
    { name: "Vitamins (General Health)", category: "HSA", keywords: "vitamins supplements general health" },
    { name: "Weight Loss Programs", category: "HSA", keywords: "weight loss programs fitness" }
  ]
};

function populateDatabase() {
  const dbPath = path.join(__dirname, '../hsa.db');
  const db = new sqlite3.Database(dbPath);

  console.log('Populating database with sample expense data...');

  db.serialize(() => {
    db.run('DELETE FROM expenses', (err) => {
      if (err) {
        console.error('Error clearing expenses:', err);
        return;
      }
      console.log('Cleared existing expenses');
    });

    const qualifiedStmt = db.prepare(`
      INSERT INTO expenses (name, category_id, is_qualified, keywords, source_url, raw_text)
      SELECT ?, ec.id, 1, ?, 'https://www.healthequity.com/hsa-qme', ?
      FROM expense_categories ec
      WHERE ec.name = ?
    `);

    sampleExpenses.qualified.forEach(expense => {
      qualifiedStmt.run([
        expense.name,
        expense.keywords,
        expense.name,
        expense.category
      ]);
    });

    qualifiedStmt.finalize((err) => {
      if (err) {
        console.error('Error inserting qualified expenses:', err);
      } else {
        console.log(`Inserted ${sampleExpenses.qualified.length} qualified expenses`);
      }
    });

    const nonQualifiedStmt = db.prepare(`
      INSERT INTO expenses (name, category_id, is_qualified, keywords, source_url, raw_text)
      SELECT ?, ec.id, 0, ?, 'https://www.healthequity.com/non-qme', ?
      FROM expense_categories ec
      WHERE ec.name = ?
    `);

    sampleExpenses.nonQualified.forEach(expense => {
      nonQualifiedStmt.run([
        expense.name,
        expense.keywords,
        expense.name,
        expense.category
      ]);
    });

    nonQualifiedStmt.finalize((err) => {
      if (err) {
        console.error('Error inserting non-qualified expenses:', err);
      } else {
        console.log(`Inserted ${sampleExpenses.nonQualified.length} non-qualified expenses`);
      }

      db.close((err) => {
        if (err) {
          console.error('Error closing database:', err);
        } else {
          console.log('Database populated successfully!');
          console.log(`Total expenses: ${sampleExpenses.qualified.length + sampleExpenses.nonQualified.length}`);
        }
      });
    });
  });
}

if (require.main === module) {
  populateDatabase();
}

module.exports = { populateDatabase, sampleExpenses };

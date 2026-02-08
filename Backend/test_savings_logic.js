
import { calculateSavings } from './services/offerService.js';

console.log("--- TESTING calculateSavings ---");

const t1 = calculateSavings({ discount_percentage: 50 }, 200);
console.log(`Test 1 (50% of 200): Expected 100, Got ${t1}`);

const t2 = calculateSavings({ discount_percentage: 150 }, 200);
console.log(`Test 2 (150% of 200 - Cap Check): Expected 200, Got ${t2}`);

console.log("--- DONE ---");

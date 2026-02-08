
import "dotenv/config";
console.log("DB_PASSWORD is " + (process.env.DB_PASSWORD ? "defined" : "undefined"));
console.log("Type of DB_PASSWORD is " + typeof process.env.DB_PASSWORD);

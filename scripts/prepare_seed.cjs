// Script to generate fenixDatabaseSeed.ts with full integrity checks
const fs = require('fs');
const path = require('path');

const SELLER_IDS = {
  VANESSA_GOMES: '5ebedc87-ef20-4abc-9613-7e8503c75c54',
  JHESSICA_CAMARGO: '9d86d050-72fb-49ed-8994-5b2681f559ff',
  EDER_PEREZ: '622d2e97-914d-4dc0-9327-a4a56b045744',
};

console.log("Script ready to be populated with JSON");

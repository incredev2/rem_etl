const path = require('path');
const { FmoEtl } = require('./pipelines/FmoEtl');

const inputFolder = path.join(__dirname, '../input');
const outputFolder = path.join(__dirname, '../output');

const etlProcess = new FmoEtl(inputFolder, outputFolder);

// Run the ETL process
etlProcess.run();

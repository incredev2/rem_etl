const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;
const _ = require('lodash');

class FmoEtl {
    constructor(inputFolder, outputFolder, commissionPeriod = '06/2024', defaultCommissionDate = '2024-06-01') {
        this.inputFolder = inputFolder;
        this.outputFolder = outputFolder;
        this.commissionPeriod = commissionPeriod;
        this.defaultCommissionDate = defaultCommissionDate;
        this.normalizedCsvFile = path.join(outputFolder, 'normalized_commissions.csv');
        this.csvWriter = createCsvWriter({
            path: this.normalizedCsvFile,
            header: [
                { id: 'Carrier', title: 'Carrier' },
                { id: 'Agency', title: 'Agency' },
                { id: 'Agent', title: 'Agent' },
                { id: 'EnrollmentType', title: 'EnrollmentType' },
                { id: 'CommissionPeriod', title: 'CommissionPeriod' },
                { id: 'CommissionAmount', title: 'CommissionAmount' },
                { id: 'CommissionDate', title: 'CommissionDate' }
            ]
        });
    }

    // Ensure output directory exists
    ensureOutputFolder() {
        if (!fs.existsSync(this.outputFolder)) {
            fs.mkdirSync(this.outputFolder);
        }
    }

    // Extract step: read Excel files
    extractData() {
        const allData = [];
        fs.readdirSync(this.inputFolder).forEach(file => {
            if (file.endsWith('.xlsx')) {
                const inputFilePath = path.join(this.inputFolder, file);
                const workbook = XLSX.readFile(inputFilePath, { type: 'file', cellDates: true });

                workbook.SheetNames.forEach(sheetName => {
                    const worksheet = workbook.Sheets[sheetName];
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { raw: false });
                    allData.push(...jsonData);
                });
            }
        });
        return allData;
    }

    // Transform step: normalize data
    cleanAgentName(name) {
        return name.replace(/\b\w\./g, '').trim();
    }

    normalizeRow(row) {
        if (row['Writing Broker Name'] || row['Earner Name']) {
            return {
                Carrier: 'Carrier1',
                Agency: row['Earner Name'] || 'Unknown Agency',
                Agent: this.cleanAgentName(row['Writing Broker Name'] || 'Unknown Agent'),
                EnrollmentType: row['Plan Type'] || 'Unknown',
                CommissionPeriod: this.commissionPeriod,
                CommissionAmount: parseFloat(row['Payment Amount'] || 0),
                CommissionDate: row['Signed Date'] || this.defaultCommissionDate,
            };
        } else if (row['Payee Name'] || row['Rep Name']) {
            return {
                Carrier: 'Carrier2',
                Agency: row['Payee Name'] || 'Unknown Agency',
                Agent: this.cleanAgentName(row['Rep Name'] || 'Unknown Agent'),
                EnrollmentType: row['Plan'] || 'Unknown',
                CommissionPeriod: this.commissionPeriod,
                CommissionAmount: parseFloat(row['Payment'] || 0),
                CommissionDate: this.defaultCommissionDate,
            };
        } else if (row['Producer Name']) {
            return {
                Carrier: 'Carrier3',
                Agency: row['Producer Name'] || 'Unknown Agency',
                Agent: 'Unknown Agent',
                EnrollmentType: row['Enrollment Type'] || 'Unknown',
                CommissionPeriod: row['Period'] || this.commissionPeriod,
                CommissionAmount: parseFloat(row['Amount'] || 0),
                CommissionDate: this.defaultCommissionDate,
            };
        }
        return null;
    }

    transformData(rawData) {
        return rawData.map(row => this.normalizeRow(row)).filter(row => row !== null);
    }

    // Load step: save to CSV and calculate top performers
    loadData(normalizedData) {
        return this.csvWriter.writeRecords(normalizedData).then(() => {
            console.log('Normalized data saved to CSV.');
            const topPerformers = this.calculateTopPerformers(normalizedData);
            console.log('Top 10 Performers:', topPerformers);
        });
    }

    calculateTopPerformers(normalizedData) {
        const groupedData = _.groupBy(normalizedData, 'Agent');
        const totalCommissions = _.map(groupedData, (records, agent) => ({
            agent,
            totalCommission: _.sumBy(records, 'CommissionAmount')
        }));
        return _.orderBy(totalCommissions, 'totalCommission', 'desc').slice(0, 10);
    }

    // Orchestrate the ETL process
    run() {
        this.ensureOutputFolder();
        const rawData = this.extractData(); // Extract
        const normalizedData = this.transformData(rawData); // Transform
        this.loadData(normalizedData); // Load
    }
}

module.exports = { FmoEtl };

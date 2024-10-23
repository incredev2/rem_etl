# FMO ETL Process

This project implements an ETL (Extract, Transform, Load) process to handle commission data from Excel files, normalize it, and save it to a CSV file. It also calculates the top performers based on the total commission amounts.

## Features

- **Extract**: Reads Excel files from the input directory.
- **Transform**: Normalizes commission data (agent names, commission amounts, etc.).
- **Load**: Saves normalized data to a CSV file.
- **Top Performers**: Calculates and prints the top 10 agents based on total commissions.

## Installation and running

1. Install Dependencies and running:

```bash
npm install
npm run start
```

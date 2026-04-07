const fs = require('fs')
const path = require('path')
const csv = require('csv-parser')

const DEFAULT_DATA_DIR = path.join(__dirname, 'data')
const DEFAULT_FILE_NAME = 'mock_districts.csv'

function normalizeDistrict(row) {
  return {
    districtName: row['District Name'] || '',
    state: row.State || '',
    studentTeacherRatio: Number(row.Student_Teacher_Ratio),
    expenditurePerPupil: Number(row.Expenditure_Per_Pupil),
    gradRate: Number(row.Grad_Rate),
  }
}

function resolveCsvPath(filePath) {
  if (filePath) {
    return path.isAbsolute(filePath) ? filePath : path.join(__dirname, filePath)
  }

  const defaultPath = path.join(DEFAULT_DATA_DIR, DEFAULT_FILE_NAME)

  if (fs.existsSync(defaultPath)) {
    return defaultPath
  }

  throw new Error(
    `CSV file not found. Add an NCES district CSV or create ${path.relative(
      __dirname,
      defaultPath
    )}.`
  )
}

function loadDistricts(filePath) {
  const csvPath = resolveCsvPath(filePath)

  return new Promise((resolve, reject) => {
    const districts = []

    fs.createReadStream(csvPath)
      .on('error', reject)
      .pipe(csv())
      .on('data', row => {
        districts.push(normalizeDistrict(row))
      })
      .on('end', () => resolve(districts))
      .on('error', reject)
  })
}

module.exports = {
  loadDistricts,
  normalizeDistrict,
  resolveCsvPath,
}

if (require.main === module) {
  const inputPath = process.argv[2]

  loadDistricts(inputPath)
    .then(districts => {
      console.log(JSON.stringify(districts, null, 2))
    })
    .catch(error => {
      console.error(error.message)
      process.exit(1)
    })
}

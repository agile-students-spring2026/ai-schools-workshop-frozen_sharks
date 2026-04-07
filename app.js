const express = require('express')
const path = require('path')
const { loadDistricts } = require('./loader')

const app = express()
const PORT = process.env.PORT || 3000

app.use(express.static(path.join(__dirname, 'public')))

app.get('/favicon.ico', (req, res) => {
  res.status(204).end()
})

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'))
})

const QUALITY_WEIGHTS = {
  gradRate: 0.5,
  expenditurePerPupil: 0.3,
  studentTeacherRatio: 0.2,
}

function normalize(value, min, max) {
  if (min === max) {
    return 1
  }

  return (value - min) / (max - min)
}

function addQualityScores(districts) {
  const gradRates = districts.map(district => district.gradRate)
  const expenditures = districts.map(district => district.expenditurePerPupil)
  const ratios = districts.map(district => district.studentTeacherRatio)

  const minGradRate = Math.min(...gradRates)
  const maxGradRate = Math.max(...gradRates)
  const minExpenditure = Math.min(...expenditures)
  const maxExpenditure = Math.max(...expenditures)
  const minRatio = Math.min(...ratios)
  const maxRatio = Math.max(...ratios)

  return districts.map(district => {
    const gradRateScore = normalize(district.gradRate, minGradRate, maxGradRate)
    const expenditureScore = normalize(
      district.expenditurePerPupil,
      minExpenditure,
      maxExpenditure
    )
    const ratioScore =
      1 - normalize(district.studentTeacherRatio, minRatio, maxRatio)

    const qualityScore =
      gradRateScore * QUALITY_WEIGHTS.gradRate +
      expenditureScore * QUALITY_WEIGHTS.expenditurePerPupil +
      ratioScore * QUALITY_WEIGHTS.studentTeacherRatio

    return {
      ...district,
      qualityScore: Number((qualityScore * 100).toFixed(2)),
    }
  })
}

app.get('/districts', async (req, res) => {
  try {
    const { state, sort = 'desc' } = req.query
    const districts = await loadDistricts()
    const scoredDistricts = addQualityScores(districts)

    const filteredDistricts = state
      ? scoredDistricts.filter(
          district =>
            district.state.toLowerCase() === String(state).toLowerCase()
        )
      : scoredDistricts

    const sortedDistricts = [...filteredDistricts].sort((a, b) =>
      sort === 'asc'
        ? a.qualityScore - b.qualityScore
        : b.qualityScore - a.qualityScore
    )

    res.json({
      count: sortedDistricts.length,
      filters: {
        state: state || null,
        sort,
      },
      districts: sortedDistricts,
    })
  } catch (error) {
    res.status(500).json({
      error: 'Failed to load district data.',
      details: error.message,
    })
  }
})

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`District API listening on port ${PORT}`)
  })
}

module.exports = {
  app,
  addQualityScores,
}

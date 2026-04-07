const stateFilter = document.getElementById('stateFilter')
const sortOrder = document.getElementById('sortOrder')
const refreshButton = document.getElementById('refreshButton')
const resultsSummary = document.getElementById('resultsSummary')
const errorMessage = document.getElementById('errorMessage')
const loadingMessage = document.getElementById('loadingMessage')
const districtTable = document.getElementById('districtTable')
const districtTableBody = document.getElementById('districtTableBody')

let availableStates = []
let currentRequest = 0

function formatNumber(value, digits = 1) {
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value)
}

function formatCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 0,
  }).format(value)
}

function formatPercent(value) {
  return `${formatNumber(value, 1)}%`
}

function formatRatio(value) {
  return `${formatNumber(value, 1)}:1`
}

function setLoading(isLoading) {
  loadingMessage.hidden = !isLoading
  loadingMessage.textContent = isLoading ? 'Loading district data...' : ''
  refreshButton.disabled = isLoading
  stateFilter.disabled = isLoading
  sortOrder.disabled = isLoading
}

function setError(message = '') {
  errorMessage.textContent = message
  errorMessage.hidden = !message
}

function buildSummary(count, state, sort) {
  const stateLabel = state || 'All states'
  const sortLabel = sort === 'asc' ? 'lowest to highest' : 'highest to lowest'
  return `Showing ${count} district${
    count === 1 ? '' : 's'
  } • ${stateLabel} • Quality score ${sortLabel}`
}

function populateStateOptions(districts) {
  const nextStates = [
    ...new Set(districts.map(district => district.state).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b))

  if (
    availableStates.length === nextStates.length &&
    availableStates.every((state, index) => state === nextStates[index])
  ) {
    return
  }

  availableStates = nextStates
  const selectedValue = stateFilter.value

  stateFilter.innerHTML = '<option value="">All states</option>'

  availableStates.forEach(state => {
    const option = document.createElement('option')
    option.value = state
    option.textContent = state
    stateFilter.appendChild(option)
  })

  stateFilter.value = availableStates.includes(selectedValue)
    ? selectedValue
    : ''
}

function renderDistricts(districts) {
  if (!districts.length) {
    districtTableBody.innerHTML = `
      <tr>
        <td colspan="6">No districts match the selected filters.</td>
      </tr>
    `
    return
  }

  districtTableBody.innerHTML = districts
    .map(
      district => `
        <tr>
          <td><strong>${district.districtName}</strong></td>
          <td>${district.state}</td>
          <td>${formatNumber(district.qualityScore, 2)}</td>
          <td>${formatPercent(district.gradRate)}</td>
          <td>${formatCurrency(district.expenditurePerPupil)}</td>
          <td>${formatRatio(district.studentTeacherRatio)}</td>
        </tr>
      `
    )
    .join('')
}

async function loadDistricts() {
  const requestId = ++currentRequest
  const state = stateFilter.value
  const sort = sortOrder.value || 'desc'
  const params = new URLSearchParams()

  if (state) {
    params.set('state', state)
  }

  params.set('sort', sort)

  setLoading(true)
  setError('')

  try {
    const response = await fetch(`/districts?${params.toString()}`)

    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`)
    }

    const data = await response.json()

    if (requestId !== currentRequest) {
      return
    }

    populateStateOptions(data.districts)
    renderDistricts(data.districts)

    districtTable.hidden = false
    resultsSummary.textContent = buildSummary(
      data.count,
      data.filters.state,
      data.filters.sort
    )
  } catch (error) {
    if (requestId !== currentRequest) {
      return
    }

    districtTableBody.innerHTML = `
      <tr>
        <td colspan="6">Unable to load district data right now.</td>
      </tr>
    `
    resultsSummary.textContent = 'District data could not be loaded.'
    setError('Something went wrong while loading districts. Please try again.')
  } finally {
    if (requestId === currentRequest) {
      setLoading(false)
    }
  }
}

stateFilter.addEventListener('change', loadDistricts)
sortOrder.addEventListener('change', loadDistricts)
refreshButton.addEventListener('click', loadDistricts)

loadingMessage.hidden = false
errorMessage.hidden = true
districtTable.hidden = false

loadDistricts()

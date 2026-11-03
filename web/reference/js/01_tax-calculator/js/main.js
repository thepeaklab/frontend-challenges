const TAX_RATE = 0.19

const fields = {
  net: document.getElementById('net-field'),
  tax: document.getElementById('tax-field'),
  gross: document.getElementById('gross-field'),
}

// Digits with an optional decimal comma and at most two decimals, e.g. "1234,5".
const VALID_INPUT = /^\d+(,\d{0,2})?$/

function parse(value) {
  return Number(value.replace(',', '.'))
}

function format(amount) {
  return amount.toFixed(2).replace('.', ',')
}

// Works in cents to avoid floating point rounding issues (e.g. 33.33 * 0.19).
function calculate(source, amount) {
  const cents = Math.round(amount * 100)
  if (source === 'net') {
    const tax = Math.round(cents * TAX_RATE)
    return { net: cents, tax, gross: cents + tax }
  }
  if (source === 'gross') {
    const net = Math.round(cents / (1 + TAX_RATE))
    return { net, tax: cents - net, gross: cents }
  }
  const net = Math.round(cents / TAX_RATE)
  return { net, tax: cents, gross: net + cents }
}

for (const [name, field] of Object.entries(fields)) {
  field.addEventListener('input', () => {
    const value = field.value.trim()
    const valid = VALID_INPUT.test(value)
    field.classList.toggle('invalid', !valid)
    if (!valid) return

    const result = calculate(name, parse(value))
    for (const [other, otherField] of Object.entries(fields)) {
      if (other !== name) otherField.value = format(result[other] / 100)
    }
  })
}

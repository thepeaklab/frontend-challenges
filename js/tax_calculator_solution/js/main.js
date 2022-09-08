const TAX_FIELD_ID = "tax-field";
const NET_FIELD_ID = "net-field";
const GROSS_FIELD_ID = "gross-field";

function getValue(str) {
  return parseFloat(str.replace(",", "."));
}

function serializeValue(value) {
  return value.toFixed(2).replace(".", ",");
}

function isValid(str) {
  return /^[0-9]+(,[0-9]*)?$/.test(str);
}

function setInvalid(field, invalid) {
  if (invalid) {
    field.classList.add("invalid");
  } else {
    field.classList.remove("invalid");
  }
}

function setFieldValues(fieldIdValuePairs) {
  fieldIdValuePairs.forEach((fieldIdValuePair) => {
    let field = document.getElementById(fieldIdValuePair.id);
    if (field.value !== fieldIdValuePair.value) {
      field.value = fieldIdValuePair.value;
    }
  });
}

function clearFields(fieldIds) {
  setFieldValues(fieldIds.map((id) => ({ id, value: "" })));
}

function linkCalculateFunction(fieldId, calculateFunction) {
  document.getElementById(fieldId).addEventListener("input", (event) => {
    let field = document.getElementById(fieldId);
    let valid = isValid(event.target.value);
    setInvalid(field, !valid);
    if (valid) {
      let value = getValue(event.target.value);
      setFieldValues(calculateFunction(value));
    } else {
      clearFields(
        [NET_FIELD_ID, TAX_FIELD_ID, GROSS_FIELD_ID].filter(
          (id) => id !== fieldId
        )
      );
    }
  });
}

function calculateFromNetValue(netValue) {
  let taxValue = netValue * 0.19;
  let grossValue = netValue + taxValue;
  return [
    { id: TAX_FIELD_ID, value: serializeValue(taxValue) },
    { id: GROSS_FIELD_ID, value: serializeValue(grossValue) },
  ];
}

function calculateFromTaxValue(taxValue) {
  let netValue = taxValue / 0.19;
  let grossValue = netValue + taxValue;
  return [
    { id: NET_FIELD_ID, value: serializeValue(netValue) },
    { id: GROSS_FIELD_ID, value: serializeValue(grossValue) },
  ];
}

function calculateFromGrossValue(grossValue) {
  let netValue = grossValue / 1.19;
  let taxValue = netValue * 0.19;
  return [
    { id: NET_FIELD_ID, value: serializeValue(netValue) },
    { id: TAX_FIELD_ID, value: serializeValue(taxValue) },
  ];
}

window.addEventListener("load", () => {
  linkCalculateFunction(NET_FIELD_ID, calculateFromNetValue);
  linkCalculateFunction(TAX_FIELD_ID, calculateFromTaxValue);
  linkCalculateFunction(GROSS_FIELD_ID, calculateFromGrossValue);
});

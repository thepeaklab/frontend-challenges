const taxpercent = 0.19;

class Calculator {
  constructor(netId, taxId, grossId) {
    this.net = document.getElementById(netId);
    this.tax = document.getElementById(taxId);
    this.gross = document.getElementById(grossId);
    this.addEventListeners();
    this.isValid();
  }

  addEventListeners() {
    this.net.addEventListener("input", () => this.calculateNet());
    this.tax.addEventListener("input", () => this.calculateTax());
    this.gross.addEventListener("input", () => this.calculateGross());
  }

  isValid() {
    const array = [this.net, this.tax, this.gross];

    array.forEach((ar) => {
      ar.addEventListener("input", () => {
        this.formateValue(ar);
      });
      ar.addEventListener("keydown", (event) => {
        if (
          !/[0-9]/.test(event.key) &&
          event.key !== "Backspace" &&
          event.key !== "Tab" &&
          event.key !== "ArrowLeft" &&
          event.key !== "ArrowRight" &&
          event.key !== "Delete"
        ) {
          event.preventDefault();
        }
      });
    });
  }

  formateValue(input) {
    let digits = input.value.replace(/\D/g, "");
    if (digits.length > 2) {
      const before = digits.slice(0, -2);
      const after = digits.slice(-2);
      input.value = before + "." + after;
    } else {
      input.value = digits;
    }
  }

  calculateNet() {
    const netvalue = parseFloat(this.net.value) || 0;
    const taxvalue = netvalue * taxpercent;
    const grossvalue = netvalue + taxvalue;

    this.tax.value = taxvalue.toFixed(2);
    this.gross.value = grossvalue.toFixed(2);
  }
  calculateTax() {
    const taxvalue = parseFloat(this.tax.value) || 0;
    const netvalue = taxvalue / taxpercent;
    const grossvalue = netvalue + taxvalue;

    this.net.value = netvalue.toFixed(2);
    this.gross.value = grossvalue.toFixed(2);
  }

  calculateGross() {
    const grossvalue = parseFloat(this.gross.value) || 0;
    const netvalue = grossvalue / (1 + taxpercent);
    const taxvalue = grossvalue - netvalue;

    this.net.value = netvalue.toFixed(2);
    this.tax.value = taxvalue.toFixed(2);
  }
}

new Calculator("net-field", "tax-field", "gross-field");

//import verhindern
// entweder anzeige invalid oder erst garnicht ermöglichen

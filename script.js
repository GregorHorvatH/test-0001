const form = document.getElementById("register-form");
const errorBox = document.getElementById("error");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalText = document.getElementById("modal-text");
const modalClose = document.getElementById("modal-close");

form.addEventListener("submit", function (event) {
  event.preventDefault();

  const name = document.getElementById("name").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  if (name === "" || email === "" || password === "") {
    errorBox.textContent = "Kérlek, töltsd ki a név, e-mail és jelszó mezőket!";
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    errorBox.textContent = "Kérlek, adj meg érvényes e-mail címet!";
    return;
  }

  errorBox.textContent = "";
  modalTitle.textContent = "Sikeres regisztráció!";
  modalText.textContent =
    "Köszönjük, " + name + "! A regisztrációd sikeres volt. (Ez csak egy példa, valójában nem történt regisztráció.)";
  modal.classList.remove("hidden");
  form.reset();
});

const subscribeForm = document.getElementById("subscribe-form");
const subError = document.getElementById("sub-error");

const planSelect = document.getElementById("plan");
const periodSelect = document.getElementById("period");

function updatePeriodPrices() {
  const price = Number(planSelect.selectedOptions[0].dataset.price);
  for (const option of periodSelect.options) {
    const months = Number(option.dataset.months);
    const label = months + " hónap";
    option.textContent =
      price === 0 ? label + " – ingyenes" : label + " – " + price * months + " Ft";
  }
}

planSelect.addEventListener("change", updatePeriodPrices);
updatePeriodPrices();

subscribeForm.addEventListener("submit", function (event) {
  event.preventDefault();

  const email = document.getElementById("sub-email").value.trim();
  const plan = document.getElementById("plan").value;
  const period = document.getElementById("period").value;
  const payment = document.querySelector('input[name="payment"]:checked').value;

  if (email === "") {
    subError.textContent = "Kérlek, add meg az e-mail címedet!";
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    subError.textContent = "Kérlek, adj meg érvényes e-mail címet!";
    return;
  }

  subError.textContent = "";
  modalTitle.textContent = "Sikeres előfizetés!";
  modalText.textContent =
    "Köszönjük! Előfizettél a következőre: " + plan + ", " + period +
    ", fizetési mód: " + payment + ". (Ez csak egy példa, valójában nem történt előfizetés.)";
  modal.classList.remove("hidden");
  subscribeForm.reset();
  updatePeriodPrices();
});

modalClose.addEventListener("click", function () {
  modal.classList.add("hidden");
});

modal.addEventListener("click", function (event) {
  if (event.target === modal) {
    modal.classList.add("hidden");
  }
});

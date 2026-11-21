export const HTML_FEEDBACK = `
<div>
  <h1 style="font-size: 2em; font-weight: bold; text-align: center">
    Thank you for your feedback
  </h1>
  <p
    style="
      font-size: 1.5em;
      text-align: center;
      margin-top: 1em;
      margin-bottom: 1em;
    "
  >
    We will contact you shortly using the contact information you provided
  </p>
</div>
`;

export const getHTMLToME = (values: {
  email: string;
  name: string;
  phone: string;
  message: string;
}) => `
<div>
  <h1 style="font-size: 2em; font-weight: bold; text-align: center">
    Запрос на зворотній звязок від ${values.name}
  </h1>
  <p
    style="
      font-size: 1.5em;
      text-align: center;
      margin-top: 1em;
      margin-bottom: 1em;
    "
  >
    Користувач вказав:
  </p>
  <p
    style="
      font-size: 1.5em;
      text-align: center;
      margin-top: 1em;
      margin-bottom: 1em;
    "
  >
    Імя: ${values.name}
  </p>
  <p
    style="
      font-size: 1.5em;
      text-align: center;
      margin-top: 1em;
      margin-bottom: 1em;
    "
  >
    Email: ${values.email}
  </p>
  <p
    style="
      font-size: 1.5em;
      text-align: center;
      margin-top: 1em;
      margin-bottom: 1em;
    "
  >
    Номер телефону: ${values.phone}
  </p>
  <p
    style="
      font-size: 1.5em;
      text-align: center;
      margin-top: 1em;
      margin-bottom: 1em;
    "
  >
    Коментар: ${values.message}
  </p>
</div>
`;

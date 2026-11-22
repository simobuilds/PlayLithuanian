import {Credentials, Translator} from "@translated/lara";

const LARA_ACCESS_KEY_ID = "ABC123..."      // Replace with your Access Key ID
const LARA_ACCESS_KEY_SECRET = "aBc123..."  // Replace with your Access Key SECRET

const credentials = new Credentials(LARA_ACCESS_KEY_ID, LARA_ACCESS_KEY_SECRET);
const lara = new Translator(credentials);

async function main() {
  // This translates your text from English ("en-US") to Italian ("it-IT").
  const res = await lara.translate('Hello, how are you? This text can be very long.',
      'en-US', 'it-IT');

  // Prints the translated text: "Ciao, come stai? Questo testo può essere molto lungo."
  console.log(res.translation)
}

main().finally(() => console.log('Done!'))
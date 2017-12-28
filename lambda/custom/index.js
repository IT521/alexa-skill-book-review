require('babel-register');

const Alexa = require('alexa-sdk');
const handlers = require('./handlers');
const config = require('./config');

const helpText = ['Say tell me about, or say review, to hear a review of the book,',
  'or, say tell me if recommended, to hear whether book is recommended,',
  'or, say what is its rating, to hear the books rating.'];
const aboutText = [`Ask ${config.skillName} for a review from iDreamBooks.com`,
  'which selects reviews from the New York Times, NPR, and IndieReader.'
];
const languageStrings = {
  en: {
    translation: {
      WELCOME: `Welcome to ${config.skillName}!`,
      HELP: helpText.join(' '),
      ABOUT: aboutText.join(' '),
      STOP: 'Okay, see you next time!'
    }
  }
};

// eslint-disable-next-line func-names
exports.handler = function (event, context) {
  const alexa = Alexa.handler(event, context);

  alexa.appId = config.appId;
  alexa.resources = languageStrings;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

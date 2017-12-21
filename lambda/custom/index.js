require('babel-register');

const Alexa = require('alexa-sdk');
const handlers = require('./handlers');
const config = require('./config');

const helpText = ['Say tell me about, or say review, to hear a review of the book,',
  'or, say tell me if recommended, to hear whether book is recommended,',
  'or, say what is its rating, to hear the books rating.'];

const languageStrings = {
  en: {
    translation: {
      WELCOME: 'Welcome to Book Review!',
      HELP: helpText.join(' '),
      ABOUT: 'Ask Book Review for a review from iDreamBooks.com which selects reviews from the New York Times, NPR, and IndieReader.',
      STOP: 'Okay, see you next time!'
    }
  }
};

exports.handler = function (event, context) {
  const alexa = Alexa.handler(event, context);

  alexa.appId = config.appId;
  alexa.resources = languageStrings;
  alexa.registerHandlers(handlers);
  alexa.execute();
};

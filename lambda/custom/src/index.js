process.env.PATH += `:${process.env.LAMBDA_TASK_ROOT}`;

const Alexa = require('alexa-sdk');
const { toWords, toWordsOrdinal } = require('number-to-words');

const config = require('./config');
const genericGetJSON = require('./utilities/genericGetJSON');

const languageStrings = {
  'en-US': {
    translation: {
      WELCOME: config.welcomeText,
      HELP: config.helpText.join(' '),
      ABOUT: config.aboutText.join(' '),
      STOP: config.stopText
    }
  }
};
const bookReview = {
  reviewCount: 0,
  rating: 0,
  consolidatedReview: '',
  criticReviews: []
};

const alexaResponse = {
  speakMsg: '',
  cardRendererMsg: ''
};

const iDreamBooksParams = {
  key: config.idreambooksApiKey,
  q: ''
};

// eslint-disable-next-line func-names
exports.handler = function (event, context, callback) {
  // eslint-disable-next-line no-console
  console.log(`${config.skillName} Alexa Application ID: ${config.appId}`);
  const alexa = Alexa.handler(event, context);

  alexa.appId = config.appId;
  alexa.resources = languageStrings;
  // eslint-disable-next-line no-use-before-define
  alexa.registerHandlers(handlers);
  alexa.execute();
  callback(null, `Alexa Application ID: ${config.appId}`);
};

// Handler Functions ===============================================================================

const handlers = {
  // eslint-disable-next-line func-names, object-shorthand
  LaunchRequest: function () {
    const say = `${this.t('WELCOME')} ${this.t('HELP')}`;
    this.response.speak(say).listen(say);
    this.emit(':responseReady');
  },

  // eslint-disable-next-line func-names, object-shorthand
  AboutIntent: function () {
    this.response.speak(this.t('ABOUT'));
    this.emit(':responseReady');
  },
  // eslint-disable-next-line func-names, object-shorthand
  ReviewIntent: function () {
    const title = this.request.slot('Book');
    const author = this.request.slot('Author');

    // eslint-disable-next-line no-use-before-define
    getReviews(title, author)
      .then((reviews) => {
        const { 'review-count': reviewCount = 0, rating = 0, 'critic-reviews': criticReviews = [] } = reviews;
        bookReview.reviewCount = reviewCount;
        // A 'rating' is not calculated if the 'review-count' is less than 5.0.
        bookReview.rating = rating;
        bookReview.criticReviews = criticReviews.slice();
        // eslint-disable-next-line no-use-before-define
        bookReview.consolidatedReview = getConsolidatedReview(title, bookReview.criticReviews);

        alexaResponse.speakMsg = bookReview.consolidatedReview;
        alexaResponse.cardRendererMsg = alexaResponse.speakMsg;
        this.emit('SpeakResponse');
      })
      .catch((error) => {
        const notFound = `${title} was not found`;
        // eslint-disable-next-line no-console
        console.log(notFound, error);

        alexaResponse.speakMsg = notFound;
        alexaResponse.cardRendererMsg = alexaResponse.speakMsg;
        this.emit('SpeakResponse').emit('SessionEndedRequest');
      });
  },
  // eslint-disable-next-line func-names, object-shorthand
  RecommendedIntent: function () {
    const title = this.request.slot('Book');
    alexaResponse.speakMsg = (bookReview.rating >= config.minimumRating) ?
      `${title} is recommended by critics` : `${title} is not recommended by critics`;
    alexaResponse.cardRendererMsg = alexaResponse.speakMsg;
    this.emit('SpeakResponse');
  },
  // eslint-disable-next-line func-names, object-shorthand
  RatingIntent: function () {
    const title = this.request.slot('Book');
    // eslint-disable-next-line no-use-before-define
    alexaResponse.speakMsg = `The rating for ${title} is ${toDecimalWord(bookReview.rating)} percent`;
    alexaResponse.cardRendererMsg = alexaResponse.speakMsg;
    this.emit('SpeakResponse');
  },
  // eslint-disable-next-line func-names, object-shorthand
  SpeakResponse: function () {
    this.response.speak(alexaResponse.speakMsg)
      .cardRenderer(config.skillName, alexaResponse.cardRendererMsg).listen(alexaResponse.speakMsg);
    this.emit(':responseReady');
  },

  // eslint-disable-next-line func-names
  'AMAZON.HelpIntent': function () {
    this.response.speak(this.t('HELP')).listen(this.t('HELP'));
    this.emit(':responseReady');
  },
  // eslint-disable-next-line func-names
  'AMAZON.CancelIntent': function () {
    this.response.speak(this.t('STOP'));
    this.emit(':responseReady');
  },
  // eslint-disable-next-line func-names
  'AMAZON.StopIntent': function () {
    this.emit('SessionEndedRequest');
  },
  // eslint-disable-next-line func-names, object-shorthand
  SessionEndedRequest: function () {
    this.response.speak(this.t('STOP'));
    this.emit(':responseReady');
  }
};

// Helper Functions ===============================================================================

/**
 * getReviews()
 * @param {string} title - The title of the book to lookup.
 * @param {string} author - The author name of the book to lookup.
 */
function getReviews(title, author) {
  return genericGetJSON(config.idreambooksApi, {
    ...iDreamBooksParams,
    ...{
      q: title + (author ? (` by ${author}`) : '')
    }
  });
}

/**
 * toDecimalWord()
 * @param {number} number - A number with decimals.
 */
function toDecimalWord(number) {
  const integer = Math.trunc(number);
  const decimal = (number % 1).toFixed(1).substring(2);

  return decimal > 0 ? `${toWords(integer)} point ${toWords(decimal)}` : toWords(integer);
}

/**
 * toMonthWord()
 * @param {number} month - The month value 0-11.
 */
function toMonthWord(month) {
  const MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December'];

  return MONTHS[month];
}

/**
 * toDateWords()
 * @param {string} reviewDate - Date.
 */
function toDateWords(reviewDate) {
  const currentDate = new Date(reviewDate);
  const dateWords = [
    toMonthWord(currentDate.getMonth()),
    toWordsOrdinal(currentDate.getDate()),
    toWords(currentDate.getFullYear())
  ];
  return dateWords.join(' ');
}

/**
 * formatReview()
 * @param {Object[]} review - Critic review.
 * @param {string} review[].snippet - One or two sentences expressing the opinion of the reviewer.
 * @param {string} review[]['pos-or-neg'] - Positive or negative rating of the book.
 * @param {string} review[].source - Name of the web property where the review was published.
 * @param {string} review[]['review-date'] - Date of review.
 * @param {number} index - review number.
 */
function formatReview(review, index) {
  const {
    snippet = '', 'pos-or-neg': posNeg = '', source = '', 'review-date': reviewDate = ''
  } = review;
  const formattedReview = [`Review number ${toWords(index)}`];
  if (posNeg) {
    formattedReview.push(`has a ${posNeg} review`);
  }
  if (reviewDate) {
    formattedReview.push(`given on ${toDateWords(reviewDate)}`);
  }
  if (source) {
    formattedReview.push(`by ${source}`);
  }
  formattedReview.push(`, states: ${snippet}.`);
  return formattedReview.join(' ').trim();
}

/**
 * getConsolidatedReview()
 * @param {string} title - The title of the book to lookup.
 * @param {Object[]} reviews - Collection of up to 5 critic reviews.
 * @param {string} reviews[].snippet - One or two sentences expressing the opinion of the reviewer.
 * @param {string} reviews[]['pos-or-neg'] - Positive or negative rating of the book.
 * @param {string} reviews[].source - Name of the web property where the review was published.
 * @param {string} reviews[]['review-date'] - Date of review.
 */
function getConsolidatedReview(title, reviews) {
  const consolidatedReview = [];
  if (reviews.length) {
    const reviewCount = reviews.length;
    if (reviewCount === 1) {
      consolidatedReview.push(`There is one critic review for ${title}.`);
    } else {
      consolidatedReview.push(`There are ${toWords(reviewCount)} critic reviews for ${title}.`);
    }
    reviews.forEach((review, index) => {
      consolidatedReview.push(formatReview(review, index + 1));
    });
  } else {
    consolidatedReview.push(`There are no critic reviews for ${title}.`);
  }
  return consolidatedReview.join(' ').trim();
}

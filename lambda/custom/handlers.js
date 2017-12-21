import { toWords, toWordsOrdinal } from 'number-to-words';
import genericGetJSON from './utilities/genericGetJSON';
import config from './config';

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

// Helper Functions ===============================================================================

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
 * getDate()
 * @param {string} reviewDate - Date.
 */
function getDate(reviewDate) {
  const currentDate = new Date(reviewDate);

  return `${toMonthWord(currentDate.getMonth())} ${toWordsOrdinal(currentDate.getDate())} ${toWords(currentDate.getFullYear())}`;
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
    formattedReview.push(`given on ${getDate(reviewDate)}`);
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

const handlers = {
  LaunchRequest: () => {
    const say = `${this.t('WELCOME')} ${this.t('HELP')}`;
    this.response.speak(say).listen(say);
    this.emit(':responseReady');
  },

  AboutIntent: () => {
    this.response.speak(this.t('ABOUT'));
    this.emit(':responseReady');
  },
  ReviewIntent: () => {
    const title = this.request.slot('Book');
    const author = this.request.slot('Author');
    const notFound = `${title} was not found`;
    let endSesion = false;

    alexaResponse.speakMsg = getReviews(title, author)
      .then((reviews) => {
        const { 'review-count': reviewCount = 0, rating = 0, 'critic-reviews': criticReviews = [] } = reviews;
        bookReview.reviewCount = reviewCount;
        // A 'rating' is not calculated if the 'review-count' is less than 5.0.
        bookReview.rating = rating;
        bookReview.criticReviews = criticReviews.slice();
        bookReview.consolidatedReview = getConsolidatedReview(title, bookReview.criticReviews);
        return bookReview.consolidatedReview;
      })
      .catch(() => {
        endSesion = true;
        return notFound;
      });
    alexaResponse.cardRendererMsg = endSesion ? notFound : 'Reviews';
    this.emit('SpeakResponse');
  },
  RecommendedIntent: () => {
    const title = this.request.slot('Book');
    alexaResponse.speakMsg = (bookReview.rating >= config.minimumRating) ? `${title} is recommended by critics` : `${title} is not recommended by critics`;
    alexaResponse.cardRendererMsg = (bookReview.rating >= config.minimumRating) ? 'Recommended by Critics' : 'Not Recommended by Critics';
    this.emit('SpeakResponse');
  },
  RatingIntent: () => {
    const title = this.request.slot('Book');
    alexaResponse.speakMsg = `The rating for ${title} is ${toDecimalWord(bookReview.rating)} percent`;
    alexaResponse.cardRendererMsg = 'Rating';
    this.emit('SpeakResponse');
  },
  SpeakResponse: () => {
    this.response.speak(alexaResponse.speakMsg)
      .cardRenderer(config.skillName, alexaResponse.cardRendererMsg).listen(alexaResponse.speakMsg);
    this.emit(':responseReady');
  },

  'AMAZON.HelpIntent': () => {
    this.response.speak(this.t('HELP')).listen(this.t('HELP'));
    this.emit(':responseReady');
  },
  'AMAZON.CancelIntent': () => {
    this.response.speak(this.t('STOP'));
    this.emit(':responseReady');
  },
  'AMAZON.StopIntent': () => {
    this.emit('SessionEndedRequest');
  },
  SessionEndedRequest: () => {
    this.response.speak(this.t('STOP'));
    this.emit(':responseReady');
  }
};

export default handlers;

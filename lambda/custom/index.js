import "babel-register";
import Alexa from 'alexa-sdk';
import genericGetJSON from './utilities/genericGetJSON';

const SKILL_NAME = "Book Review";
// Replace with your app ID (OPTIONAL). You can find this value at the top of your skill's page on http://developer.amazon.com.
// Make sure to enclose your value in quotes, like this: const APP_ID = 'amzn1.ask.skill.bb4045e6-b3e8-4133-b650-72923c5980f1';
const APP_ID = undefined;
const NUMBER_WORDS = ["zero", "one", "two", "three", "four", "five"];
// Book Reviews courtesy of the iDreamBooks API.
const IDREAMBOOKS_API = 'http://idreambooks.com/api/books/reviews.json'
const IDREAMBOOKS_API_KEY = undefined;

// 1. Text strings =====================================================================================================
// Modify these strings and messages to change the behavior of your Lambda function

const languageStrings = {
	'en': {
		'translation': {
			'WELCOME': "Welcome to Book Review!",
			'HELP': "Say tell me about, or say review, to hear a review of the book.",
			'ABOUT': "Access millions of reviews. Ask Book Review for the reviews from iDreamBooks.com",
			'STOP': "Okay, see you next time!"
		}
	}
	// , 'de-DE': { 'translation' : { 'TITLE' : "Local Helfer etc." } }
};
const bookReview = {
	'review-count': 0,
	'rating': 0,
	'to-read-or-not': '',
	'detail-link': '',
	'critic-reviews': []
};

const alexaResponse = {
	speakMsg: '',
	cardRendererMsg: '',
};
const iDreamBooksParams = {
    key: IDREAMBOOKS_API_KEY,
	q: ''
};

// 2. Skill Code =======================================================================================================

exports.handler = (event, context, callback) => {
	const alexa = Alexa.handler(event, context);

	alexa.appId = APP_ID;
	alexa.resources = languageStrings;
	alexa.registerHandlers(handlers);
	alexa.execute();
};

const handlers = {
	'LaunchRequest': () => {
		const say = this.t('WELCOME') + ' ' + this.t('HELP');
		this.response.speak(say).listen(say);
		this.emit(':responseReady');
	},

	'AboutIntent': () => {
		this.response.speak(this.t('ABOUT'));
		this.emit(':responseReady');
	},
	'ReviewIntent': () => {
		alexaResponse.speakMsg = bookReview.parentsNeedToKnow;
		alexaResponse.cardRendererMsg = 'Parental Guidelines';
		this.emit('SpeakResponse');
	},
	'ReviewIntent': () => {
		alexaResponse.speakMsg = bookReview.description;
		alexaResponse.cardRendererMsg = 'Book Description';
		this.emit('SpeakResponse');
	},
	'AgeRatingIntent': () => {
		alexaResponse.speakMsg = bookReview.ageRating;
		alexaResponse.cardRendererMsg = 'Age Rating';
		this.emit('SpeakResponse');
	},
	'StarsIntent': () => {
		alexaResponse.speakMsg = bookReview.stars;
		alexaResponse.cardRendererMsg = 'Star Rating';
		this.emit('SpeakResponse');
	},
	'GoodIntent': () => {
		alexaResponse.speakMsg = bookReview.anyGood;
		alexaResponse.cardRendererMsg = 'Is It Any Good';
		this.emit('SpeakResponse');
	},
	'PointsIntent': () => {
		alexaResponse.speakMsg = bookReview.talkingPoints;
		alexaResponse.cardRendererMsg = 'Talking Points';
		this.emit('SpeakResponse');
	},
	// TODO: Rename DetailsIntent to AwardsIntent
	'DetailsIntent': () => {
		alexaResponse.speakMsg = getResponse(bookReview.product.awards);
		alexaResponse.cardRendererMsg = 'Book Details';
		this.emit('SpeakResponse');
	},
	'ReleaseIntent': () => {
		alexaResponse.speakMsg = bookReview.TBD;
		alexaResponse.cardRendererMsg = 'Release Dates';
		this.emit('SpeakResponse');
	},
	'DirectIntent': () => {
		alexaResponse.speakMsg = bookReview.TBD;
		alexaResponse.cardRendererMsg = 'Directors';
		this.emit('SpeakResponse');
	},
	'CastIntent': () => {
		alexaResponse.speakMsg = bookReview.TBD;
		alexaResponse.cardRendererMsg = 'Cast';
		this.emit('SpeakResponse');
	},
	'GenreIntent': () => {
		alexaResponse.speakMsg = bookReview.TBD;
		alexaResponse.cardRendererMsg = 'Genres';
		this.emit('SpeakResponse');
	},
	'LengthIntent': () => {
		alexaResponse.speakMsg = bookReview.TBD;
		alexaResponse.cardRendererMsg = 'Book Length';
		this.emit('SpeakResponse');
	},
	'RatingIntent': () => {
		alexaResponse.speakMsg = bookReview.TBD;
		alexaResponse.cardRendererMsg = 'MPAA Rating';
		this.emit('SpeakResponse');
	},
	'SpeakResponse': () => {
		this.response.speak(alexaResponse.speakMsg)
		.cardRenderer(SKILL_NAME, alexaResponse.cardRendererMsg);
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
	'SessionEndedRequest': () => {
		this.response.speak(this.t('STOP'));
		this.emit(':responseReady');
	}

};

// Helper Functions ========================================================================================

/**
 * getReview()
 * @param {string} title - The title of the book to lookup.
 * @param {string} author - The author name of the book to lookup. This is optional, but is recommended for accuracy.
 */
const getReview = (title, author) => genericGetJSON(IDREAMBOOKS_API, { ...iDreamBooksParams, ...{ q: title + (!!author ? (' by ' + author) : '') } }).then((reviews) => {
			bookReview['review-count'] = reviews['review-count'];
			bookReview['rating' = reviews['rating'];
			bookReview['to-read-or-not' = reviews['to-read-or-not'];
			bookReview['detail-link' = reviews['detail-link'];
			bookReview['critic-reviews'] = reviews['critic-reviews'];
});

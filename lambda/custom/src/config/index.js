const SKILL_NAME = 'Book Review';
module.exports = {
  skillName: SKILL_NAME,
  // TODO: Add Application ID
  appId: process.env.ALEXA_APP_ID,
  // Book Reviews courtesy of iDreamBooks API.
  idreambooksApi: 'http://idreambooks.com/api/books/reviews.json',
  idreambooksApiKey: process.env.IDB_API_KEY,
  // Recommend a book if rating is >= 70.0%
  minimumRating: 70,
  welcomeText: `Welcome to ${SKILL_NAME}!`,
  helpText: ['Say tell me about, or say review, to hear a review of the book,',
    'or, say tell me if recommended, to hear whether book is recommended,',
    'or, say what is its rating, to hear the books rating.'],
  aboutText: [`Ask ${SKILL_NAME} for a review from iDreamBooks.com`,
    'which selects reviews from the New York Times, NPR, and IndieReader.'],
  stopText: 'Okay, see you next time!'
};

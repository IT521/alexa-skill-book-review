const config = {
  skillName: 'Book Review',
  // TODO: Add Application ID
  appId: process.env.ALEXA_APP_ID,
  // Book Reviews courtesy of iDreamBooks API.
  idreambooksApi: 'http://idreambooks.com/api/books/reviews.json',
  // TODO: Add iDreamBooks API Key
  idreambooksApiKey: process.env.IDB_API_KEY,
  // Recommend a book if rating is >= 70.0%
  minimumRating: 70
};

export default config;

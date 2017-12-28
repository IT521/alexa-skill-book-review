import log4js from 'log4js';

log4js.configure({
  appenders: { bookreview: { type: 'file', filename: 'bookreview.log' } },
  categories: { default: { appenders: ['bookreview'], level: 'error' } }
});

const logger = log4js.getLogger('bookreview');

export default logger;

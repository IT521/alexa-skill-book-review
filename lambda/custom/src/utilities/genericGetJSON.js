import qs from 'querystring';
import fetch from 'isomorphic-fetch';

const fetchBaseOptions = {
  method: 'GET'
  // credentials: 'same-origin',
};

export default (endpoint, data, options = {}) =>
  fetch(endpoint + (data ? `?${qs.stringify(data)}` : ''), { ...fetchBaseOptions, ...options })
    .then(response => response.json());

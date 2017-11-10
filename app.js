'use strict';
/*global $*/

const API = {
  BASE_API_URL: 'https://opentdb.com', //line 9
  //const BASE_API_URL = 'https://opentdb.com';
  buildTokenUrl : function() {
    return new URL(this.BASE_API_URL + '/api_token.php');
  }, //line 54
  buildBaseUrl: function(amt = 10, query = {}) {
    const url = new URL(this.BASE_API_URL + '/api.php');
    const queryKeys = Object.keys(query);
    url.searchParams.set('amount', amt);
  
    if (store.sessionToken) {
      url.searchParams.set('token', store.sessionToken);
    }

    queryKeys.forEach(key => url.searchParams.set(key, query[key]));
    return url;
  } //line 53
};

const PAGE = {

// Render function - uses `store` object to construct entire page every time it's run
// ===============
  render: function() {
    console.log('Inside the render function.');
    hideAll();

    const question = getCurrentQuestion();
    const { feedback } = store; 
    const { current, total } = getProgress();

    $('.js-score').html(`<span>Score: ${getScore()}</span>`);
    $('.js-progress').html(`<span>Question ${current} of ${total}`);

    switch (store.page) {
    case 'intro':
      $('.js-intro').show();
      break;
      
    case 'question':
      this.html = generateQuestionHtml(question);
      $('.js-question').html(this.html);
      console.log(this.html);
      $('.js-question').show();
      $('.quiz-status').show();
      break;

    case 'answer':
      this.html = generateFeedbackHtml(feedback);
      $('.js-question-feedback').html(this.html);
      $('.js-question-feedback').show();
      $('.quiz-status').show();
      break;

    case 'outro':
      $('.js-outro').show();
      $('.quiz-status').show();
      break;

    default:
      return;
    }
  }
};

const TOP_LEVEL_COMPONENTS = [
  'js-intro', 'js-question', 'js-question-feedback', 
  'js-outro', 'js-quiz-status'
];

let QUESTIONS = [];

// token is global because store is reset between quiz games, but token should persist for 
// entire session
let sessionToken;

const getInitialStore = function(){
  return {
    page: 'intro',
    currentQuestionIndex: null,
    userAnswers: [],
    feedback: null,
    sessionToken,
  };
};

let store = getInitialStore();

// Helper functions
// ===============
const hideAll = function() {
  TOP_LEVEL_COMPONENTS.forEach(component => $(`.${component}`).hide());
};

// const buildBaseUrl = function(amt = 10, query = {}) {
//   const url = new URL(API.BASE_API_URL + '/api.php');
//   const queryKeys = Object.keys(query);
//   url.searchParams.set('amount', amt);

//   if (store.sessionToken) {
//     url.searchParams.set('token', store.sessionToken);
//   }

//   queryKeys.forEach(key => url.searchParams.set(key, query[key]));
//   return url;
// };

// const buildTokenUrl = function() {
//   return new URL(API.BASE_API_URL + '/api_token.php');
// };

const fetchToken = function(callback) {
  if (sessionToken) {
    return callback();
  }

  const url = API.buildTokenUrl();
  url.searchParams.set('command', 'request');

  $.getJSON(url, res => {
    sessionToken = res.token;
    callback();
  }, err => console.log(err));
};

const fetchQuestions = function(amt, query, callback) {
  $.getJSON(API.buildBaseUrl(amt, query), callback, err => console.log(err.message));
};

const seedQuestions = function(questions) {
  QUESTIONS.length = 0;
  questions.forEach(q => QUESTIONS.push(createQuestion(q)));
};

const fetchAndSeedQuestions = function(amt, query, callback) {
  fetchQuestions(amt, query, res => {
    seedQuestions(res.results);
    callback();
  });
};

const createQuestion = function(question) {
  return {
    text: question.question,
    answers: [ ...question.incorrect_answers, question.correct_answer ],
    correctAnswer: question.correct_answer
  };
};

const getScore = function() {
  return store.userAnswers.reduce((accumulator, userAnswer, index) => {
    const question = getQuestion(index);

    if (question.correctAnswer === userAnswer) {
      return accumulator + 1;
    } else {
      return accumulator;
    }
  }, 0);
};

const getProgress = function() {
  return {
    current: store.currentQuestionIndex + 1,
    total: QUESTIONS.length
  };
};

const getCurrentQuestion = function() {
  return QUESTIONS[store.currentQuestionIndex];
};

const getQuestion = function(index) {
  return QUESTIONS[index];
};

// HTML generator functions
// ========================
const generateAnswerItemHtml = function(answer) {
  return `
    <li class="answer-item">
      <input type="radio" name="answers" value="${answer}" />
      <span class="answer-text">${answer}</span>
    </li>
  `;
};

const generateQuestionHtml = function(question) {
  const answers = question.answers
    .map((answer, index) => generateAnswerItemHtml(answer, index))
    .join('');

  return `
    <form>
      <fieldset>
        <legend class="question-text">${question.text}</legend>
          ${answers}
          <button type="submit">Submit</button>
      </fieldset>
    </form>
  `;
};

const generateFeedbackHtml = function(feedback) {
  return `
    <p>
      ${feedback}
    </p>
    <button class="continue js-continue">Continue</button>
  `;
};

// // Render function - uses `store` object to construct entire page every time it's run
// // ===============
// const render = function() {
//   let html;
//   hideAll();

const question = getCurrentQuestion();
const { feedback } = store; //object destructuring = const feedback = store.feedback; 
const { current, total } = getProgress();

//   $('.js-score').html(`<span>Score: ${getScore()}</span>`);
//   $('.js-progress').html(`<span>Question ${current} of ${total}`);

//   switch (store.page) {
//   case 'intro':
//     $('.js-intro').show();
//     break;
    
//   case 'question':
//     html = generateQuestionHtml(question);
//     $('.js-question').html(html);
//     $('.js-question').show();
//     $('.quiz-status').show();
//     break;

//   case 'answer':
//     html = generateFeedbackHtml(feedback);
//     $('.js-question-feedback').html(html);
//     $('.js-question-feedback').show();
//     $('.quiz-status').show();
//     break;

//   case 'outro':
//     $('.js-outro').show();
//     $('.quiz-status').show();
//     break;

//   default:
//     return;
//   }
// };

// Event handler functions
// =======================
const handleStartQuiz = function() {
  store = getInitialStore();
  store.page = 'question';
  store.currentQuestionIndex = 0;
  const quantity = parseInt($('#js-question-quantity').find(':selected').val(), 10);
  fetchAndSeedQuestions(quantity, { type: 'multiple' }, () => {
    PAGE.render();
  });
};

const handleSubmitAnswer = function(e) {
  e.preventDefault();
  const question = getCurrentQuestion();
  const selected = $('input:checked').val();
  store.userAnswers.push(selected);
  
  if (selected === question.correctAnswer) {
    store.feedback = 'You got it!';
  } else {
    store.feedback = `Too bad! The correct answer was: ${question.correctAnswer}`;
  }

  store.page = 'answer';
  PAGE.render();
};

const handleNextQuestion = function() {
  if (store.currentQuestionIndex === QUESTIONS.length - 1) {
    store.page = 'outro';
    PAGE.render();
    return;
  }

  store.currentQuestionIndex++;
  store.page = 'question';
  PAGE.render();
};

// On DOM Ready, run render() and add event listeners
$(() => {
  // Run first render
  PAGE.render();

  // Fetch session token, enable Start button when complete
  fetchToken(() => {
    $('.js-start').attr('disabled', false);
  });

  $('.js-intro, .js-outro').on('click', '.js-start', handleStartQuiz);
  $('.js-question').on('submit', handleSubmitAnswer);
  $('.js-question-feedback').on('click', '.js-continue', handleNextQuestion);
});

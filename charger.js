/* eslint-disable  func-names */
/* eslint quote-props: ["error", "consistent"]*/
/**
 * This sample demonstrates a sample skill built with Amazon Alexa Skills nodejs
 * skill development kit.
 * This sample supports multiple languages (en-US, en-GB, de-GB).
 * The Intent Schema, Custom Slot and Sample Utterances for this skill, as well
 * as testing instructions are located at https://github.com/alexa/skill-sample-nodejs-howto
 **/

'use strict';

const Alexa = require('alexa-sdk');
const recipes = require('./recipes');
const querystring = require('querystring');
const https = require('https');
const fs = require('fs');

const APP_ID = 'amzn1.ask.skill.a67277ef-80a9-45c3-8215-62474abd5e54'; // TODO replace with your app ID (OPTIONAL).
const stationNumberMapping = {
    68: '4265',
    70: '4267',
    75: '4272',
    81: '4278',
};

const languageStrings = {
    'en': {
        translation: {
            RECIPES: recipes.RECIPE_EN_US,
            SKILL_NAME: 'Charger',
            WELCOME_MESSAGE: "Welcome to %s. Tell me what you want to do today.",
            WELCOME_REPROMPT: 'For instructions on what you can say, please say help me.',
            DISPLAY_CARD_TITLE: '%s  - Recipe for %s.',
            HELP_MESSAGE: "This skill helps to charge your car at Amazon building Invictus.",
            HELP_REPROMPT: "You can say things like, Charge at station Number, or you can say exit...Now, what can I help you with?",
            STOP_MESSAGE: 'Happy to serve you! Goodbye!',
            RECIPE_REPEAT_MESSAGE: 'Try saying repeat.',
            RECIPE_NOT_FOUND_MESSAGE: "I\'m sorry, I currently do not know ",
            RECIPE_NOT_FOUND_WITH_ITEM_NAME: 'the recipe for %s. ',
            RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME: 'that recipe. ',
            RECIPE_NOT_FOUND_REPROMPT: 'What else can I help with?',
            CONCLUDE_CHARGING: 'Okay. I have kicked off charging at station %s for you. ',
        },
    },
    'en-US': {
        translation: {
            RECIPES: recipes.RECIPE_EN_US,
            SKILL_NAME: 'Charger in Amazon Invictus',
        },
    },
    'en-GB': {
        translation: {
            RECIPES: recipes.RECIPE_EN_GB,
            SKILL_NAME: 'Charger GB',
        },
    },
    'de': {
        translation: {
            RECIPES: recipes.RECIPE_DE_DE,
            SKILL_NAME: 'Assistent für Minecraft in Deutsch',
            WELCOME_MESSAGE: 'Willkommen bei %s. Du kannst beispielsweise die Frage stellen: Welche Rezepte gibt es für eine Truhe? ... Nun, womit kann ich dir helfen?',
            WELCOME_REPROMPT: 'Wenn du wissen möchtest, was du sagen kannst, sag einfach „Hilf mir“.',
            DISPLAY_CARD_TITLE: '%s - Rezept für %s.',
            HELP_MESSAGE: 'Du kannst beispielsweise Fragen stellen wie „Wie geht das Rezept für“ oder du kannst „Beenden“ sagen ... Wie kann ich dir helfen?',
            HELP_REPROMPT: 'Du kannst beispielsweise Sachen sagen wie „Wie geht das Rezept für“ oder du kannst „Beenden“ sagen ... Wie kann ich dir helfen?',
            STOP_MESSAGE: 'Auf Wiedersehen!',
            RECIPE_REPEAT_MESSAGE: 'Sage einfach „Wiederholen“.',
            RECIPE_NOT_FOUND_MESSAGE: 'Tut mir leid, ich kenne derzeit ',
            RECIPE_NOT_FOUND_WITH_ITEM_NAME: 'das Rezept für %s nicht. ',
            RECIPE_NOT_FOUND_WITHOUT_ITEM_NAME: 'dieses Rezept nicht. ',
            RECIPE_NOT_FOUND_REPROMPT: 'Womit kann ich dir sonst helfen?',
        },
    },
};

const handlers = {
    'LaunchRequest': function () {
        this.attributes.speechOutput = this.t('WELCOME_MESSAGE', this.t('SKILL_NAME'));
        // If the user either does not reply to the welcome message or says something that is not
        // understood, they will be prompted again with this text.
        this.attributes.repromptSpeech = this.t('WELCOME_REPROMPT');
        this.response.speak(this.attributes.speechOutput).listen(this.attributes.repromptSpeech);
        this.emit(':responseReady');
    },
    'StartCharging': function () {

        var filledSlots = delegateSlotCollection.call(this);

        const stationNumberSlot = this.event.request.intent.slots.stationNumber;
        let stationNumber;
        if (stationNumberSlot && stationNumberSlot.value) {
            stationNumber = stationNumberSlot.value;
            chargeAt.call(this, stationNumber);

        } else {
            let sss = "Station number undefined!";
            this.response.speak(sss);
            this.emit(":responseReady");
        }
    },
    'AMAZON.HelpIntent': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.RepeatIntent': function () {
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
    'AMAZON.StopIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'AMAZON.CancelIntent': function () {
        this.emit('SessionEndedRequest');
    },
    'SessionEndedRequest': function () {
        this.emit(':tell', this.attributes.speechOutput);
    },
    'Unhandled': function () {
        this.attributes.speechOutput = this.t('HELP_MESSAGE');
        this.attributes.repromptSpeech = this.t('HELP_REPROMPT');
        this.emit(':ask', this.attributes.speechOutput, this.attributes.repromptSpeech);
    },
};

exports.handler = function (event, context) {
    const alexa = Alexa.handler(event, context);
    alexa.APP_ID = APP_ID;
    // To enable string internationalization (i18n) features, set a resources object.
    alexa.resources = languageStrings;
    alexa.registerHandlers(handlers);
    alexa.execute();
};

function delegateSlotCollection() {
    console.log("in delegateSlotCollection");
    console.log("current dialogState: " + this.event.request.dialogState);
      if (this.event.request.dialogState === "STARTED") {
        console.log("in Beginning");
        var updatedIntent = this.event.request.intent;
        //optionally pre-fill slots: update the intent object with slot values for which
        //you have defaults, then return Dialog.Delegate with this updated intent
        // in the updatedIntent property
        this.emit(":delegate", updatedIntent);
      } else if (this.event.request.dialogState !== "COMPLETED") {
        console.log("in not completed");
        // return a Dialog.Delegate directive with no updatedIntent property.
        this.emit(":delegate");
      } else {
        console.log("in completed");
        // Dialog is now complete and all required slots should be filled,
        // so call your normal intent handler.
        
        // this.event.request.intent.confirmationStatus
        
        console.log("in confirmed");
        console.log("returning: "+ JSON.stringify(this.event.request.intent));
        return this.event.request.intent;
        
      }
  }

  function chargeAt(stationNumber) {
      let meterId = stationNumberMapping[stationNumber];
      let that = this;
      if (!meterId) {
        let sss = "Unsupported station number: " + stationNumber;
        console.log(sss);
        that.response.speak(sss);
        that.emit(":responseReady");
        return;
      }
      let formData = {
          "action" : "preAuthCard",
          "meter_id" : meterId,
          "card_no" : "",
          "exp_month" : "",
          "exp_year" : ""
      };

      let postData = querystring.stringify(formData);
      console.log("postData: " + postData);

      let postOptions = {
          host: 'network.semaconnect.com',
          port: '443',
          path: '/get_data.php',
          method: 'POST',
          headers: {
              'Accept-Encoding': 'gzip, deflate, br',
              'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
              'Accept': '*/*',
              'X-Requested-With': 'XMLHttpRequest'
          }
       };

       var postReq = https.request(postOptions, function(res) {
            res.setEncoding('utf8');
            res.on('data', function (chunk) {
                console.log("Raw response: " + chunk);
                that.attributes.speechOutput = that.t('CONCLUDE_CHARGING', stationNumber);
                let sss = that.t('CONCLUDE_CHARGING', stationNumber);
                console.log("output: " + that.attributes.speechOutput);
                that.response.speak(sss);
                that.emit(":responseReady");
            });
         });
  
        // post the data
        postReq.write(postData);
        postReq.end();
  }

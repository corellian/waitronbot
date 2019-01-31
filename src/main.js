#!/usr/bin/env node
"use strict";

const Slouch = require('couch-slouch');
const schedule = require('node-schedule');
const Telegraf = require('telegraf');
const extra = require('telegraf/extra');
const markup = extra.markdown();
const config = require('./config');

// Create the bot using the token
const bot = new Telegraf(config.token);

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

const slouch = new Slouch(`http://${config.db.username}:${config.db.password}@${config.db.host}`);

const getReplies = () => {
  return slouch.doc.find(config.db.name, {
    "selector": {
      "name": "replies"
    }
  });
};

/*
schedule.scheduleJob('0 * * * *', () => {
  bot.telegram.sendMessage('422853836', 'Woot!');
});
*/

// This method will send the reply, based on the answer type
// (text / gif / sticker). See replies.js for objects structure.
const sendReply = (ctx, reply, value, type) => {
  // reply method will be the Telegraf method for sending the reply
  let replyMethod = {
    text: ctx.reply,
    gif: ctx.replyWithAnimation,
    sticker: ctx.replyWithSticker
  }[type];
  
  console.log(ctx.message);
  replyMethod(value, {
    // this will make the bot reply to the original message instead of just sending it
    reply_to_message_id: ctx.message.message_id
  }).catch((err) => {
    console.log(err);
  });
};

// /list command - will send all the triggers defined in replies.js.
bot.command('list', ctx => {
  getReplies().then((r) => {
    const list = r.content;
    ctx.reply(
      'Coses que entenc:\n\n' +
      list.map(x => '`' + x.cmd + '`').join('\n\n'), markup
    );
  });
});

bot.command('matar', ctx => {
    console.log(ctx.message); ctx.reply( 'Hasta la vista, baby.' );
});

// Listen on every text message, if message.text is one of the trigger,
// send the reply
bot.on('text', ctx => {
  let cmd = ctx.message.text.toLowerCase();
  console.log(cmd);
  console.log(ctx.from);
  
  let fromUser = ctx.from.username;
  let isMention = ctx.message.entities && ctx.message.entities.find(x => x.type === 'mention')
    && cmd.includes('@waitronbot');

  console.log('isMention to me: ' + !!isMention);

  getReplies().then((r) => {
    const replies = r.docs[0].content;
    let reply = replies.find(x => cmd.match(new RegExp(x.cmd, 'ig')));
  
    if (reply) {
      let value, type;
      if (Array.isArray(reply.value)) {
        let r = (reply.value.find(x => x.fromUser === fromUser)
          || reply.value.find(x => x.fromUser === '*'));
        value = r.value;
        type = r.type || reply.type;
      } else {
        type = reply.type;
        value = reply.value;
      }
      if (Array.isArray(value)) { // array of values, we want to pick one randomly
        value = value[Math.floor(Math.random() * value.length)];
      }
      sendReply(ctx, reply, value, type);
    }
  });
});

bot.on('document', ctx => {
  console.log('FILE ID: ' + ctx.message.document.file_id);
  if (ctx.message.chat.type === 'private') {
    ctx.reply(ctx.message.document.file_id);
  }
  //let file_id = ctx.message.document.file_id;
  /*ctx.replyWithAnimation(file_id, {
    reply_to_message_id: getReplyToMessageId(ctx)
  });*/
});

bot.on('sticker', ctx => {
  console.log('FILE ID: ' + ctx.message.sticker.file_id);
  if (ctx.message.chat.type === 'private') {
    ctx.reply(ctx.message.sticker.file_id);
  }
});

bot.startPolling();

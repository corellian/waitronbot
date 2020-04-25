#!/usr/bin/env node
"use strict";

const Telegraf = require('telegraf');
const Extra = require('telegraf/extra');
const markup = Extra.markdown();

const config = require('./config');
const db = require('./db');
const scheduler = require("./scheduler");

// Create the bot using the token
const bot = new Telegraf(config.token);

bot.telegram.getMe().then((botInfo) => {
  bot.options.username = botInfo.username
})

const executeScheduledItem = (item) => {
  if (item.itemType === "message") {
    item.recipients.forEach((recipient) => {
      bot.telegram.sendMessage(recipient.id, item.message);
    });
  }
};

// Reschedule every 5 min
scheduler.start(executeScheduledItem, 300000);

// This method will send the reply, based on the answer type
// (text / gif / sticker). See database for objects structure.
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
  db.getReplies().then((r) => {
    const list = r.docs[0].content;
    ctx.reply(
      'Coses que entenc:\n\n' +
      list.map(x => '`' + x.cmd + '`').join('\n\n'), markup
    );
  });
});

bot.command('scheduled', ctx => {
  ctx.reply(
    'Scheduled tasks:\n\n' +
    scheduler.scheduledJobInvocations().map(i => i.name + ': ' + i.invocation).join('\n'), markup
  )
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

  db.getReplies().then((r) => {
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

bot.launch();

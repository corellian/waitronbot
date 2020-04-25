const schedule = require('node-schedule');
const moment = require('moment');

const config = require('./config');
const db = require('./db');
const random = require('./utils/random');

moment.locale(config.lang);

exports.calculateItemRules = (item) => {
  let rules = Object.assign({}, item.rules);
  Object.keys(item.rules).forEach((key) => {
    rules[key] = random.numFromRange(item.rules[key]);
    // Month in recurrence and object-literal syntax are 0 based.
    if (key === 'month') rules[key] = rules[key] - 1;
  });
  let calculatedItem = Object.assign({}, item);
  calculatedItem.rules = Object.assign({}, rules);
  return calculatedItem;
}

exports.scheduleItem = (item, func) => {
  const { scheduledJobs } = schedule;
  if (scheduledJobs && scheduledJobs.hasOwnProperty(item._id)) {
    let job = scheduledJobs[item._id];
    // The item is already scheduled, we have to check if _rev changed.
    if (item._rev !== job.rev) {
      // New revision, we have to reschedule.
      const calculatedItem = this.calculateItemRules(item);
      job.reschedule(calculatedItem.rules);
      // Update revision.
      job.rev = item._rev;
      job.itemName = item.name;
      console.log(`Item ${job.itemName} has changed and has been rescheduled.`);
    }
  } else {
    // The item is not scheduled, we add it.
    const calculatedItem = this.calculateItemRules(item);
    let job = schedule.scheduleJob(calculatedItem._id, calculatedItem.rules, func.bind(null, calculatedItem));
    job.rev = calculatedItem._rev;
    job.itemName = calculatedItem.name;
    console.log(`Item ${job.itemName} scheduled.`);
  }
}

// Cancels jobs not in docs
exports.cancelDeletedDocuments = (docs) => {
  Object.keys(schedule.scheduledJobs).forEach(k => {
    if (!docs.filter(d => d._id === k).length) {
      schedule.scheduledJobs[k].cancel();
      console.log(`Cancelled job ${k}`);
    }
  });
};

exports.scheduleAllItems = (func) => {
  db.getScheduledItems().then(r => {
    const { docs } = r;
    docs.forEach((i) => this.scheduleItem(i, func));
    this.cancelDeletedDocuments(docs);
  });
};

exports.scheduledJobInvocations = () => {
  return Object.keys(schedule.scheduledJobs).map(k => {
    return {
      name: schedule.scheduledJobs[k].itemName,
      invocation: moment(schedule.scheduledJobs[k].nextInvocation().getTime()).fromNow()
    };
  });
};

/**
 * Starts the scheduler and sets the function handler of tasks.
 * @param func {function} Tasks handler
 * @param syncInterval {number} Milliseconds to sync scheduled tasks with database
 */
exports.start = (func, syncInterval) => {
  this.scheduleAllItems(func);
  // Sync schedule every 'syncInterval' milliseconds
  setInterval(() => {
    this.scheduleAllItems(func);
  }, syncInterval);
};
import schedule, { scheduleJob, scheduledJobs as _scheduledJobs } from 'node-schedule';
import moment, { locale } from 'moment';

import { lang } from './config';
import { getScheduledItems } from './db';
import { Random } from './utils/random';

locale(lang);

export function calculateItemRules(item) {
  let rules = Object.assign({}, item.rules);
  Object.keys(item.rules).forEach((key) => {
    rules[key] = Random.numFromRange(item.rules[key]);
    // Month in recurrence and object-literal syntax are 0 based.
    if (key === 'month') rules[key] = rules[key] - 1;
  });
  let calculatedItem = Object.assign({}, item);
  calculatedItem.rules = Object.assign({}, rules);
  return calculatedItem;
}

export function scheduleItem(item, func) {
  const { scheduledJobs } = schedule;
  if (scheduledJobs && scheduledJobs.hasOwnProperty(item._id)) {
    let job = scheduledJobs[item._id];
    // The item is already scheduled, we have to check if _rev changed.
    if (item._rev !== job.rev) {
      // New revision, we have to reschedule.
      const calculatedItem = calculateItemRules(item);
      job.reschedule(calculatedItem.rules);
      // Update revision.
      job.rev = item._rev;
      job.itemName = item.name;
      console.log(`Item ${job.itemName} has changed and has been rescheduled.`);
    }
  } else {
    // The item is not scheduled, we add it.
    const calculatedItem = calculateItemRules(item);
    let job = scheduleJob(calculatedItem._id, calculatedItem.rules, func.bind(null, calculatedItem));
    job.rev = calculatedItem._rev;
    job.itemName = calculatedItem.name;
    console.log(`Item ${job.itemName} scheduled.`);
  }
}

// Cancels jobs not in docs
export function cancelDeletedDocuments(docs) {
  Object.keys(_scheduledJobs).forEach(k => {
    if (!docs.filter(d => d._id === k).length) {
      _scheduledJobs[k].cancel();
      console.log(`Cancelled job ${k}`);
    }
  });
}

export function scheduleAllItems(func) {
  getScheduledItems().then(r => {
    const { docs } = r;
    docs.forEach((i) => scheduleItem(i, func));
    cancelDeletedDocuments(docs);
  });
}

export function scheduledJobInvocations() {
  return Object.keys(_scheduledJobs).map(k => {
    return {
      name: _scheduledJobs[k].itemName,
      invocationFromNow: moment(_scheduledJobs[k].nextInvocation().getTime()).fromNow(),
      invocationDate: moment(_scheduledJobs[k].nextInvocation().getTime()).format('LLLL'),
    };
  });
}

/**
 * Starts the scheduler and sets the function handler of tasks.
 * @param func {function} Tasks handler
 * @param syncInterval {number} Milliseconds to sync scheduled tasks with database
 */
export function start(func, syncInterval) {
  scheduleAllItems(func);
  // Sync schedule every 'syncInterval' milliseconds
  setInterval(() => {
    scheduleAllItems(func);
  }, syncInterval);
}
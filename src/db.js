const Slouch = require('couch-slouch');

const config = require('./config');

const slouch = new Slouch(`http://${config.db.username}:${config.db.password}@${config.db.host}`);

exports.getReplies = () => {
    return slouch.doc.find(config.db.name, {
        "selector": {
            "name": "replies"
        }
    });
};

exports.getScheduledItems = () => {
    return slouch.doc.find(config.db.name, {
        "selector": {
            "docType": "SCHEDULED_ITEM"
        }
    });
};
import Slouch from "couch-slouch";

import { db } from "./config";

const slouch = new Slouch(`http://${db.username}:${db.password}@${db.host}`);

export const getReplies = () => {
  return slouch.doc.find(db.name, {
    selector: {
      name: "replies",
    },
  });
};

export const getScheduledItems = () => {
  return slouch.doc.find(db.name, {
    selector: {
      docType: "SCHEDULED_ITEM",
    },
  });
};

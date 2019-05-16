import { Meteor } from 'meteor/meteor';
import { check } from 'meteor/check';

import { Subscriptions } from '../../app/models';

Meteor.methods({
	//	TODO maxicon
	hideRooms(rids) {
		for (let i = 0; i < rids.length; i++) {
			check(rids[i], String);

			if (!Meteor.userId()) {
				throw new Meteor.Error('error-invalid-user', 'Invalid user', {
					method: 'hideRoom',
				});
			}
			Subscriptions.hideByRoomIdAndUserId(rids[i], Meteor.userId());
		}
	},
	hideRoom(rid) {
		check(rid, String);

		if (!Meteor.userId()) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'hideRoom',
			});
		}

		return Subscriptions.hideByRoomIdAndUserId(rid, Meteor.userId());
	},
});

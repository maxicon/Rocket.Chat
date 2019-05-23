import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import { popover, call, modal } from '../../ui-utils';
import { getUserPreference, t } from '../../utils';
import { settings } from '../../settings';
import { ChatSubscription } from '../../models';


const checked = function(prop, field) {
	const userId = Meteor.userId();

	if (prop === 'sidebarShowDiscussion') {
		return getUserPreference(userId, 'sidebarShowDiscussion');
	}
	//	TODO Maxicon
	if (prop === 'sidebarGroupByRole') {
		return getUserPreference(userId, 'sidebarGroupByRole');
	}
	//	TODO Maxicon
	if (prop === 'sidebarFindOnline') {
		return getUserPreference(userId, 'sidebarFindOnline');
	}
	if (prop === 'sidebarShowFavorites') {
		return getUserPreference(userId, 'sidebarShowFavorites');
	}
	if (prop === 'sidebarGroupByType') {
		return getUserPreference(userId, 'sidebarGroupByType');
	}
	if (prop === 'sidebarShowUnread') {
		return getUserPreference(userId, 'sidebarShowUnread');
	}
	if (prop === 'sidebarSortby') {
		return (getUserPreference(userId, 'sidebarSortby') || 'alphabetical') === field;
	}
};

Template.sortlist.helpers({
	favorite() {
		return settings.get('Favorite_Rooms');
	},
	checked,
	bold(...props) {
		return checked(...props) ? 'rc-popover__item--bold' : '';
	},
});

Template.sortlist.events({
	'change input'({ currentTarget }) {
		const name = currentTarget.getAttribute('name');
		let value = currentTarget.getAttribute('type') === 'checkbox' ? currentTarget.checked : currentTarget.value;
		//  TODO Maxicon
		if (name === 'hideOneDay') {
			modal.open({
				title: t('Are_you_sure'),
				text: t('Hide_One_Day_Room'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: true,
				html: false,
			}, async function() {
				const data = new Date();
				data.setHours(0, 0, 0);
				const chats = ChatSubscription.find({ open: true, ls: { $lt: data } }, {}).fetch();
				const rids = [];
				for (let i = 0; i < chats.length; i++) {
					rids.push(chats[i].rid);
				}
				console.log('rids', rids);
				await call('hideRooms', rids);
				for (let r = 0; r < rids.length; r++) {
					if (rids[r] === Session.get('openedRoom')) {
						Session.delete('openedRoom');
					}
				}
			});
			return;
		}
		//  TODO Maxicon
		if (name === 'hideAll') {
			modal.open({
				title: t('Are_you_sure'),
				text: t('Hide_All_Room'),
				type: 'warning',
				showCancelButton: true,
				confirmButtonColor: '#DD6B55',
				confirmButtonText: t('Yes'),
				cancelButtonText: t('Cancel'),
				closeOnConfirm: true,
				html: false,
			}, async function() {
				const chats = ChatSubscription.find({ open: true }, {}).fetch();
				const rids = [];
				for (let i = 0; i < chats.length; i++) {
					rids.push(chats[i].rid);
				}
				await call('hideRooms', rids);
				for (let r = 0; r < rids.length; r++) {
					if (rids[r] === Session.get('openedRoom')) {
						Session.delete('openedRoom');
					}
				}
			});
			return;
		}

		//	TODO Maxicon
		if (name === 'sidebarFindOnline') {
			Meteor.call('saveUserPreferences', {
				[name]: value,
			});
			return;
		}
		// TODO change mergeChannels to GroupByType
		if (name === 'mergeChannels') {
			value = !value;
		}
		Meteor.call('saveUserPreferences', {
			[name]: value,
		});
		// TODO Maxicon
		if (name === 'sidebarSortby') {
			popover.close();
			return;
		}
		if (name !== 'sidebarGroupByRole' && value) {
			Meteor.call('saveUserPreferences', {
				sidebarGroupByRole: false,
			});
		}
		if (name === 'sidebarGroupByRole' && value) {
			Meteor.call('saveUserPreferences', {
				sidebarGroupByType: false,
				sidebarShowFavorites: false,
				sidebarShowUnread: false,
				sidebarShowDiscussion: false,
			});
		}
		popover.close();
	},
});

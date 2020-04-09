import { Meteor } from 'meteor/meteor';
import { Tracker } from 'meteor/tracker';
import { ReactiveVar } from 'meteor/reactive-var';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import { TAPi18n } from 'meteor/rocketchat:tap-i18n';
import _ from 'underscore';

import { toolbarSearch } from './sidebarHeader';
import { Rooms, Subscriptions } from '../../models';
import { roomTypes } from '../../utils';
import { hasAtLeastOnePermission } from '../../authorization';
import { menu } from '../../ui-utils';

let filterText = '';
let usernamesFromClient;
let resultsFromClient;

const isLoading = new ReactiveVar(false);

const getFromServer = (cb, type) => {
	console.log('init ', new Date());
	isLoading.set(true);
	const currentFilter = filterText.trim();
	//	TODO Maxicon
	if(!currentFilter){
		const find = sessionStorage.getItem('find');
		if(find){
			const ofind = JSON.parse(find);
			const diffMs = (new Date().getTime() - ofind.data);
			if(diffMs < 10000 ){
				cb(ofind.list);
				return;
			}
		}
	}
	Meteor.call('spotlight', currentFilter, usernamesFromClient, type, (err, results) => {
		if (currentFilter !== filterText) {
			return;
		}

		isLoading.set(false);

		if (err) {
			return false;
		}

		console.log('spotlight');
		const resultsFromServer = [];
		const usersLength = results.users.length;
		console.log(results.users[0]);
		const roomsLength = results.rooms.length;
		const notGroup = ['user', 'bot', 'guest', 'admin', 'livechat-agent', 'livechat-guest'];

		for (let i = 0; i < roomsLength; i++) {
			resultsFromServer.push({
				_id: results.rooms[i]._id,
				t: results.rooms[i].t,
				name: results.rooms[i].name,
				fname: results.rooms[i].fname ? results.rooms[i].fname : results.rooms[i].name,
				description: results.rooms[i].description ? results.rooms[i].description : results.rooms[i].name,
				icon: results.rooms[i].prid ? 'discussion' : null,
				prid: results.rooms[i].prid,
				roles: [],
				role: undefined,
			});
		}
		if (usersLength) {
			let roles = [];
			_.forEach(results.users, function(r) {
				for(const role of r.roles){
					roles.push(role);
				}
			});
			roles = _.uniq(roles);
			roles = _.reject(roles, function(r){ return notGroup.includes(r) }).sort();

			for (const role of roles) {
				const users = _.reject(results.users, function(u) { return _.find(u.roles, function(r){ return !notGroup.includes(r) }) != role});
				for(const u of users){
					resultsFromServer.push({
						_id: u._id,
						t: 'd',
						name: u.username,
						fname: u.name,
						roles: u.roles,
						role: role,
						rid: u.rid
					});

				}

			}

			for (let i = 0; i < resultsFromServer.length; i++) {
				let showGroup;
				if (!resultsFromServer[i].role) {
					showGroup = false;
				} else if (i === 0 || resultsFromServer[i].role !== resultsFromServer[i - 1].role) {
					showGroup = true;
				}
				resultsFromServer[i].showGroup = showGroup;
			}
		}
		if (roomsLength) {
			for (let i = 0; i < roomsLength; i++) {
				let alreadyOnClient = true;
				if (resultsFromClient) {
					alreadyOnClient = resultsFromClient.find((item) => item._id === results.rooms[i]._id);
				}
				if (alreadyOnClient) {
					continue;
				}

				resultsFromServer.push({
					_id: results.rooms[i]._id,
					t: results.rooms[i].t,
					name: results.rooms[i].name,
					lastMessage: results.rooms[i].lastMessage,
					roles: [],
					role: '',
					rid: results.rooms[i].rid,
					showGroup: false,
				});
			}
		}
		if (usersLength === 30) {
			resultsFromServer[resultsFromServer.length - 1].showLoadMore = true;
		}
		if (resultsFromServer.length) {
			if (resultsFromClient) {
				cb(resultsFromClient.concat(resultsFromServer));
			} else {
				if(!currentFilter){
				sessionStorage.setItem('find', JSON.stringify({data: new Date().getTime(), list: resultsFromServer}));
				}
				cb(resultsFromServer);
			}
		}
	});

};

const getFromServerDebounced = _.debounce(getFromServer, 300);

Template.toolbar.helpers({
	results() {
		return Template.instance().resultsList.get();
	},
	getPlaceholder() {
		let placeholder = TAPi18n.__('Search');

		if (!Meteor.Device.isDesktop()) {
			return placeholder;
		} if (window.navigator.platform.toLowerCase().includes('mac')) {
			placeholder = `${ placeholder } (\u2318+K)`;
		} else {
			placeholder = `${ placeholder } (\u2303+K)`;
		}

		return placeholder;
	},
	popupConfig() {
		const config = {
			cls: 'search-results-list',
			collection: Meteor.userId() ? Subscriptions : Rooms,
			template: 'toolbarSearchList',
			sidebar: true,
			emptyTemplate: 'toolbarSearchListEmpty',
			input: '.toolbar__search .rc-input__element',
			cleanOnEnter: true,
			closeOnEsc: true,
			blurOnSelectItem: true,
			isLoading,
			open: Template.instance().open,
			getFilter(collection, filter, cb) {
				filterText = filter;

				const type = {
					users: true,
					rooms: true,
				};

				const query = {
					rid: {
						$ne: Session.get('openedRoom'),
					},
				};

				if (!Meteor.userId()) {
					query._id = query.rid;
					delete query.rid;
				}
				const searchForChannels = filterText[0] === '#';
				const searchForDMs = filterText[0] === '@';
				if (searchForChannels) {
					filterText = filterText.slice(1);
					type.users = false;
					query.t = 'c';
				}

				if (searchForDMs) {
					filterText = filterText.slice(1);
					type.rooms = false;
					query.t = 'd';
				}

				const searchQuery = new RegExp(RegExp.escape(filterText), 'i');
				query.$or = [
					{ name: searchQuery },
					{ fname: searchQuery },
				];

				getFromServerDebounced(cb, type);
			},

			getValue(_id, collection, records) {
				const doc = _.findWhere(records, { _id });

				roomTypes.openRouteLink(doc.t, doc, FlowRouter.current().queryParams);
				menu.close();
			},
		};

		return config;
	},
});

Template.toolbar.events({
	'submit form'(e) {
		e.preventDefault();
		return false;
	},

	'click [role="search"] input'() {
		toolbarSearch.shortcut = false;
	},

	'click [role="search"] button, touchend [role="search"] button'(e) {
		if (hasAtLeastOnePermission(['create-c', 'create-p'])) {
			// TODO: resolve this name menu/sidebar/sidebav/flex...
			menu.close();
			FlowRouter.go('create-channel');
		} else {
			e.preventDefault();
		}
	},
});

Template.toolbar.onRendered(function() {
	this.$('.js-search').select().focus();
});

Template.toolbar.onCreated(function() {
	this.open = new ReactiveVar(true);

	Tracker.autorun(() => !this.open.get() && toolbarSearch.close());
});

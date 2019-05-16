import { Meteor } from 'meteor/meteor';
import { DDPRateLimiter } from 'meteor/ddp-rate-limiter';
import s from 'underscore.string';

import { hasPermission } from '../../app/authorization';
import { Users, Subscriptions, Rooms, Roles, Messages, Solics } from '../../app/models';
import { settings } from '../../app/settings';
import { roomTypes } from '../../app/utils';

function fetchRooms(userId, rooms) {
	if (!settings.get('Store_Last_Message') || hasPermission(userId, 'preview-c-room')) {
		return rooms;
	}

	return rooms.map((room) => {
		delete room.lastMessage;
		return room;
	});
}

Meteor.methods({
	/*	TODO Maxicon */
	'isBlockRoom'(rid, userId) {
		return Subscriptions.findOneByRoomIdAndUserId(rid, userId);
	},
	'unBlock'(rId) {
		const subs = Subscriptions.find({ rid: rId });
		for (const s of subs) {
			if (s.u._id !== Meteor.userId()) {
				Meteor.call('unblockUser', { rid: rId, blocked: s.u._id }, (error, success) => {
					if (error) {
						throw new Meteor.Error('erro ao desbloquear', error, {
							method: 'unBlock',
						});
					}
					if (success) {
						return true;
					}
				});
			}
		}
	},
	'openSolic2'(data) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'openSolic',
			});
		}
		const room = Meteor.call('canAccessRoom', data.rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'openSolic',
			});
		}
		const clienteId = data.rid.replace(Meteor.user()._id, '');
		const client = Users.find({ _id: clienteId }, { fields: { emails: 1, roles: 1 } }).fetch();
		let empresa = null;
		for (let i = 0; i < client[0].roles.length; i++) {
			empresa = Roles.find({ _id: client[0].roles[i] }).fetch();
		}
		let times = [];
		let strMsgProblema = '';
		for (let i = 0; i < data.messagesProblema.length; i++) {
			const msgs = Messages.find({ _id: data.messagesProblema[i] }, { fields: { msg: 1, ts: 1 } }).fetch();
			strMsgProblema += msgs[0].msg;
			times.push(msgs[0].ts);
			strMsgProblema += ' \n';
		}

		let strMsgSolucao = '';
		for (let i = 0; i < data.messagesSolucao.length; i++) {
			const msgs = Messages.find({ _id: data.messagesSolucao[i] }, { fields: { msg: 1, ts: 1 } }).fetch();
			strMsgSolucao += msgs[0].msg;
			times.push(msgs[0].ts);
			strMsgSolucao += ' \n';
		}
		times = times.sort();

		const result = {};
		result.cliente = client[0];
		result.room = room;
		result.empresa = empresa[0];
		result.msgProblema = strMsgProblema;
		result.msgSolucao = strMsgSolucao;
		result.dtInicio = times[0];
		result.dtFim = times[times.length - 1];

		return result;
	},
	'openSolic'(data) {
		const userId = Meteor.userId();
		if (!userId) {
			throw new Meteor.Error('error-invalid-user', 'Invalid user', {
				method: 'openSolic',
			});
		}
		const room = Meteor.call('canAccessRoom', data.rid, userId);
		if (!room) {
			throw new Meteor.Error('error-invalid-room', 'Invalid room', {
				method: 'openSolic',
			});
		}
		if (!hasPermission(userId, 'open-solic')) {
			throw new Meteor.Error('error-action-not-allowed', 'Sem permissão para abrir solicitação', {
				method: 'openSolic',
				action: 'openSolic',
			});
		}

		data.userId = userId;
		return Solics.createOrUpdate(data);
	},
	'getUserRoom'(name) {
		return Users.findByUsername(name, { fields: { roles: 1 } }).fetch();
	},
	/*	TODO Maxicon */
	loadroomlist(chats) {
		const notGroup = ['user', 'bot', 'guest', 'admin', 'livechat-agent', 'livechat-guest'];
		const roles = [];
		for (let i = 0; i < chats.length; i++) {
			if (chats[i].name) {
				let usr = {};
				const usrs = Users.findByUsername(chats[i].name, { fields: { roles: 1 } }).fetch();
				if (usrs && usrs[0]) {
					usr = usrs[0];
				}
				if (usr && usr.roles) {
					chats[i].roles = usr.roles;
					for (let r = 0; r < usr.roles.length; r++) {
						if (!roles.includes(usr.roles[r]) && !notGroup.includes(usr.roles[r])) {
							roles.push(usr.roles[r]);
						}
					}
				}
			}
		}
		roles.sort();
		const rooms = [];
		for (let i = 0; i < chats.length; i++) {
			if (chats[i].t === 'c' || chats[i].t === 'p') {
				rooms.push(chats[i]);
			} else if (chats[i].rid && (!chats[i].roles || (chats[i].roles && chats[i].roles.length === 0))) {
				rooms.push(chats[i]);
			}
		}


		for (let r = 0; r < roles.length; r++) {
			for (let i = 0; i < chats.length; i++) {
				if (chats[i].roles) {
					let role;
					for (let ro = 0; ro < chats[i].roles.length; ro++) {
						if (!notGroup.includes(chats[i].roles[ro])) {
							role = chats[i].roles[ro];
							break;
						}
					}
					if (role === roles[r]) {
						chats[i].role = roles[r];
						rooms.push(chats[i]);
					}
				}
			}
		}

		for (let i = 0; i < rooms.length; i++) {
			let showGroup = false;
			if (i === 0 || rooms[i].role !== rooms[i - 1].role) {
				showGroup = true;
			}
			rooms[i].showGroup = showGroup;
		}
		return rooms;
	},
	/*	TODO Maxicon */
	spotlight(text, usernames, type = { users: true, rooms: true }, rid) {
		const searchForChannels = text[0] === '#';
		const searchForDMs = text[0] === '@';
		if (searchForChannels) {
			type.users = false;
			text = text.slice(1);
		}
		if (searchForDMs) {
			type.rooms = false;
			text = text.slice(1);
		}
		const regex = new RegExp(s.trim(s.escapeRegExp(text)), 'i');
		const result = {
			users: [],
			rooms: [],
		};
		const roomOptions = {
			limit: 100,
			fields: {
				t: 1,
				prid: 1,
				name: 1,
				fname: 1,
				description: 1,
				joinCodeRequired: 1,
				lastMessage: 1,
			},
			sort: {
				name: 1,
			},
		};
		const { userId } = this;
		if (userId == null) {
			if (settings.get('Accounts_AllowAnonymousRead') === true) {
				result.rooms = fetchRooms(userId, Rooms.findByNameAndTypeNotDefault(regex, 'c', roomOptions).fetch());
			}
			return result;
		}
		const userOptions = {
			limit: 300,
			fields: {
				username: 1,
				name: 1,
				status: 1,
				roles: 1, //  TODO Maxicon
			},
			sort: {},
		};
		if (settings.get('UI_Use_Real_Name')) {
			userOptions.sort.name = 1;
		} else {
			userOptions.sort.username = 1;
		}

		//	TODO Maxicon
		if (hasPermission(userId, 'view-only-group')
			&& !hasPermission(userId, 'view-outside-room')) {
			const user = Users.find({ _id: userId }).fetch();
			const roles = Roles.find({ public: true }).fetch();
			const sRoles = user[0].roles;
			if (roles) {
				for (let r = 0; r < roles.length; r++) {
					sRoles.push(roles[r].name);
				}
			}
			roles.push(user[0].roles[0]);

			result.users = Users.findByActiveUsersGroupExcept(text, user[0].roles, usernames, userOptions).fetch();
			return result;
		}

		if (hasPermission(userId, 'view-outside-room')) {
			if (type.users === true && hasPermission(userId, 'view-d-room')) {
				result.users = Users.findByActiveUsersExcept(text, usernames, userOptions).fetch();
			}

			if (type.rooms === true && hasPermission(userId, 'view-c-room')) {
				const searchableRoomTypes = Object.entries(roomTypes.roomTypes)
					.filter((roomType) => roomType[1].includeInRoomSearch())
					.map((roomType) => roomType[0]);

				const roomIds = Subscriptions.findByUserIdAndTypes(userId, searchableRoomTypes, { fields: { rid: 1 } }).fetch().map((s) => s.rid);
				result.rooms = fetchRooms(userId, Rooms.findByNameAndTypesNotInIds(regex, searchableRoomTypes, roomIds, roomOptions).fetch());
				// TODO Maxicon
				const roomPIds = Subscriptions.findByUserIdAndTypes(userId, ['p'], { fields: { rid: 1 } }).fetch().map((s) => s.rid);
				const roomsP = fetchRooms(userId, Rooms.findByIds(roomPIds, roomOptions).fetch());
				for (let i = 0; i < roomsP.length; i++) {
					result.rooms.push(roomsP[i]);
				}
			}
		} else if (type.users === true && rid) {
			const subscriptions = Subscriptions.find({
				rid,
				'u.username': {
					$regex: regex,
					$nin: [...usernames, Meteor.user().username],
				},
			}, { limit: userOptions.limit }).fetch().map(({ u }) => u._id);
			result.users = Users.find({ _id: { $in: subscriptions } }, {
				fields: userOptions.fields,
				sort: userOptions.sort,
			}).fetch();
		}

		return result;
	},
});

DDPRateLimiter.addRule({
	type: 'method',
	name: 'spotlight',
	userId(/* userId*/) {
		return true;
	},
}, 100, 100000);

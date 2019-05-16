import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Blaze } from 'meteor/blaze';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { ChatRoom } from '../../../models';
import { t, isEmail, handleError, roomTypes } from '../../../utils';
import { settings } from '../../../settings';
import resetSelection from '../resetSelection';

const filterNames = (old) => {
	const reg = new RegExp(`^${ settings.get('UTF8_Names_Validation') }$`);
	return [...old.replace(' ', '').toLocaleLowerCase()].filter((f) => reg.test(f)).join('');
};

const formatData = (d) => `${ d.getDate() }/${ d.getMonth() + 1 }/${ d.getFullYear() } ${ d.getHours() } :  ${ d.getMinutes() }`;

const convertUnicode = (filtro) => {
	let result = '';
	for (let i = 0; i < filtro.length; i++) {
		switch (filtro[i]) {
			case 'À': result += '%C0'; break;
			case 'Á': result += '%C1'; break;
			case 'Â': result += '%C2'; break;
			case 'Ã': result += '%C3'; break;
			case 'Ä': result += '%C4'; break;
			case 'Å': result += '%C5'; break;
			case 'Æ': result += '%C6'; break;
			case 'Ç': result += '%C7'; break;
			case 'È': result += '%C8'; break;
			case 'É': result += '%C9'; break;
			case 'Ê': result += '%CA'; break;
			case 'Ë': result += '%CB'; break;
			case 'Ì': result += '%CC'; break;
			case 'Í': result += '%CD'; break;
			case 'Î': result += '%CE'; break;
			case 'Ï': result += '%CF'; break;
			case 'Ð': result += '%D0'; break;
			case 'Ñ': result += '%D1'; break;
			case 'Ò': result += '%D2'; break;
			case 'Ó': result += '%D3'; break;
			case 'Ô': result += '%D4'; break;
			case 'Õ': result += '%D5'; break;
			case 'Ö': result += '%D6'; break;
			case 'Ø': result += '%D8'; break;
			case 'Ù': result += '%D9'; break;
			case 'Ú': result += '%DA'; break;
			case 'Û': result += '%DB'; break;
			case 'Ü': result += '%DC'; break;
			case 'Ý': result += '%DD'; break;
			case 'Þ': result += '%DE'; break;
			case 'ß': result += '%DF'; break;
			case 'à': result += '%E0'; break;
			case 'á': result += '%E1'; break;
			case 'â': result += '%E2'; break;
			case 'ã': result += '%E3'; break;
			case 'ä': result += '%E4'; break;
			case 'å': result += '%E5'; break;
			case 'æ': result += '%E6'; break;
			case 'ç': result += '%E7'; break;
			case 'è': result += '%E8'; break;
			case 'é': result += '%E9'; break;
			case 'ê': result += '%EA'; break;
			case 'ë': result += '%EB'; break;
			case 'ì': result += '%EC'; break;
			case 'í': result += '%ED'; break;
			case 'î': result += '%EE'; break;
			case 'ï': result += '%EF'; break;
			case 'ð': result += '%F0'; break;
			case 'ñ': result += '%F1'; break;
			case 'ò': result += '%F2'; break;
			case 'ó': result += '%F3'; break;
			case 'ô': result += '%F4'; break;
			case 'õ': result += '%F5'; break;
			case 'ö': result += '%F6'; break;
			case '÷': result += '%F7'; break;
			case 'ø': result += '%F8'; break;
			case 'ù': result += '%F9'; break;
			case 'ú': result += '%FA'; break;
			case 'û': result += '%FB'; break;
			case 'ü': result += '%FC'; break;
			case 'ý': result += '%FD'; break;
			case 'þ': result += '%FE'; break;
			case 'ÿ': result += '%FF'; break;
			default: result += filtro[i];
		}
	}
	return result;
};

Template.openSolicInstructions.helpers({
	name() {
		return Meteor.user().name;
	},
	email() {
		const { emails } = Meteor.user();
		return emails && emails[0] && emails[0].address;
	},
	roomName() {
		const room = ChatRoom.findOne(Session.get('openedRoom'));
		return room && roomTypes.getRoomName(room.t, room);
	},
	erroredEmails() {
		const instance = Template.instance();
		return instance && instance.erroredEmails.get().join(', ');
	},
	selectedProblema() {
		return Template.instance().selectedProblema.get();
	},
	selectedSolucao() {
		return Template.instance().selectedSolucao.get();
	},
	config() {
		const filter = Template.instance().userFilter;
		return {
			filter: filter.get(),
			noMatchTemplate: 'userSearchEmpty',
			modifier(text) {
				const f = filter.get();
				return `@${ f.length === 0 ? text : text.replace(new RegExp(filter.get()), function(part) {
					return `<strong>${ part }</strong>`;
				}) }`;
			},
		};
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
	},
	items() {
		return Template.instance().ac.filteredList();
	},
	errorMessage() {
		return Template.instance().errorMessage.get();
	},
});

Template.openSolicInstructions.events({
	'click .js-cancel, click .mail-messages__instructions--selected'(e, t) {
		console.log('click .js-cancel');
		t.reset(true);
	},
	'click .js-cancel, click .mail-messages__instructionsSolucao--selected'(e, t) {
		console.log('click .js-cancel');
		t.reset(true);
	},
	'click .js-send'(e, instance) {
		const { selectedProblema, selectedSolucao, selectedRange } = instance;
		console.log(selectedRange);
		const subject = instance.$('[name="subject"]').val();
		if (!selectedProblema.get().length) {
			instance.errorMessage.set(t('Mail_Message_No_messages_selected_select_all'));
			return false;
		}
		if (!selectedSolucao.get().length) {
			instance.errorMessage.set(t('Mail_Message_No_messages_selected_select_all'));
			return false;
		}

		const data = {
			rid: Session.get('openedRoom'),
			userId: Meteor.user()._id,
			assunto: subject,
			messagesProblema: selectedProblema.get(),
			messagesSolucao: selectedSolucao.get(),
			language: localStorage.getItem('userLanguage'),
		};

		Meteor.call('openSolic2', data, function(err, result) {
			if (err != null) {
				return handleError(err);
			}
			toastr.success(t('Você sera redirecionado '));
			let filtro = '';
			filtro += `i_cd_empresa=${ result.empresa.cdEmpresa }`;
			filtro += `&i_email_usuario=${ result.cliente.emails[0].address }`;
			filtro += '&i_tp_solic=C';
			filtro += `&i_ds_problema=${ convertUnicode(result.msgProblema) }`;
			filtro += `&i_ds_solucao=${ convertUnicode(result.msgSolucao) }`;
			filtro += `&i_dt_inicio=${ formatData(result.dtInicio) }`;
			filtro += `&i_dt_fim=${ formatData(result.dtFim) }`;
			filtro += `&i_ds_assunto=${ convertUnicode(subject) }`;
			console.log('redirecti');
			const a = document.getElementById('teste');
			a.href = `https://sds.maxiconsystems.com.br/pls/maxicon/sup003?${ filtro }`;
			a.click();
			//   window.open(`https://sds.maxiconsystems.com.br/pls/maxicon/sup003?${ filtro }`, '_blank', 'noopener,noreferrer');
			//   instance.reset(true);
		});
	},
	'click .rc-input--usernames .rc-tags__tag'({ target }, t) {
		const { username } = Blaze.getData(target);
		t.selectedUsers.set(t.selectedUsers.get().filter((user) => user.username !== username));
	},
	'click .rc-input--emails .rc-tags__tag'({ target }, t) {
		const { text } = Blaze.getData(target);
		t.selectedEmails.set(t.selectedEmails.get().filter((email) => email.text !== text));
	},
	'click .rc-popup-list__item'(e, t) {
		t.ac.onItemClick(this, e);
	},
	'input [name="users"]'(e, t) {
		const input = e.target;
		const position = input.selectionEnd || input.selectionStart;
		const { length } = input.value;
		const modified = filterNames(input.value);
		input.value = modified;
		document.activeElement === input && e && /input/i.test(e.type) && (input.selectionEnd = position + input.value.length - length);

		t.userFilter.set(modified);
	},
	'keydown [name="emails"]'(e, t) {
		const input = e.target;
		if ([9, 13, 188].includes(e.keyCode) && isEmail(input.value)) {
			e.preventDefault();
			const emails = t.selectedEmails;
			const emailsArr = emails.get();
			emailsArr.push({ text: input.value });
			input.value = '';
			return emails.set(emailsArr);
		}

		if ([8, 46].includes(e.keyCode) && input.value === '') {
			const emails = t.selectedEmails;
			const emailsArr = emails.get();
			emailsArr.pop();
			return emails.set(emailsArr);
		}
	},
	'keydown [name="users"]'(e, t) {
		if ([8, 46].includes(e.keyCode) && e.target.value === '') {
			const users = t.selectedUsers;
			const usersArr = users.get();
			usersArr.pop();
			return users.set(usersArr);
		}

		t.ac.onKeyDown(e);
	},
	'keyup [name="users"]'(e, t) {
		t.ac.onKeyUp(e);
	},
	'focus [name="users"]'(e, t) {
		t.ac.onFocus(e);
	},
	'blur [name="users"]'(e, t) {
		t.ac.onBlur(e);
	},
});

Template.openSolicInstructions.onRendered(function() {
	const { selectedProblema } = this;
	const { selectedSolucao } = this;

	$('.messages-box .message').on('dblclick', function() {
		console.log('duplo click');
		const { id } = this;
		const messagesProblema = selectedProblema.get();
		if ($(this)[0].style.background === 'green') {
			$(this)[0].style.background = 'white';
			selectedProblema.set(messagesProblema.filter((message) => message !== id));
		} else {
			$(this)[0].style.background = 'green';
			selectedProblema.set(messagesProblema.concat(id));
		}
	});

	$('.messages-box .message').on('click', function() {
		console.log('click');
		const { id } = this;
		const messages = selectedSolucao.get();
		if ($(this).hasClass('selected')) {
			selectedSolucao.set(messages.filter((message) => message !== id));
		} else {
			selectedSolucao.set(messages.concat(id));
		}
	});
});

Template.openSolicInstructions.onCreated(function() {
	console.log('create');
	resetSelection(true);

	this.selectedEmails = new ReactiveVar([]);
	this.selectedProblema = new ReactiveVar([]);
	this.selectedSolucao = new ReactiveVar([]);
	this.errorMessage = new ReactiveVar('');
	this.selectedUsers = new ReactiveVar([]);
	this.userFilter = new ReactiveVar('');

	this.reset = (bool) => {
		console.log('reset');
		this.selectedUsers.set([]);
		this.selectedEmails.set([]);
		this.selectedProblema.set([]);
		this.selectedSolucao.set([]);
		this.errorMessage.set('');
		resetSelection(bool);
	};
});

Template.openSolicInstructions.onDestroyed(function() {
	Template.instance().reset(false);
});

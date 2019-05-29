import { Meteor } from 'meteor/meteor';
import { ReactiveVar } from 'meteor/reactive-var';
import { Session } from 'meteor/session';
import { Template } from 'meteor/templating';
import toastr from 'toastr';

import { t, handleError } from '../../../utils';
import resetSelection from '../resetSelection';

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
	selectedProblema() {
		if (Session.get('selectedProblema')) {
			return Session.get('selectedProblema');
		}
		return [];
	},
	selectedSolucao() {
		if (Session.get('selectedSolucao')) {
			return Session.get('selectedSolucao');
		}
		return [];
	},
	autocomplete(key) {
		const instance = Template.instance();
		const param = instance.ac[key];
		return typeof param === 'function' ? param.apply(instance.ac) : param;
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
		const subject = instance.$('[name="subject"]').val();
		if (!Session.get('selectedProblema').length) {
			instance.errorMessage.set(t('Mail_Message_No_messages_selected_select_all'));
			return false;
		}
		if (!Session.get('selectedSolucao').length) {
			instance.errorMessage.set(t('Mail_Message_No_messages_selected_select_all'));
			return false;
		}

		const data = {
			rid: Session.get('openedRoom'),
			userId: Meteor.user()._id,
			assunto: subject,
			messagesProblema: Session.get('selectedProblema'),
			messagesSolucao: Session.get('selectedSolucao'),
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
		});
	},
});

Template.openSolicInstructions.onRendered(function() {
	if (!$('.messages-box .message').hasClass('create')) {
		$('.messages-box .message').addClass('create');
		$('.messages-box .message').on('dblclick', function() {
			const { id } = this;
			const messages = Session.get('selectedProblema');
			if ($(this).hasClass('selectedProblema')) {
				$(this).removeClass('selectedProblema');
				messages.splice(id, 1);
				Session.set('selectedProblema', messages);
			} else {
				messages.push(id);
				Session.set('selectedProblema', messages);
				$(this).addClass('selectedProblema');
				$(this).removeClass('selected');
			}
		});

		$('.messages-box .message').on('click', function() {
			const { id } = this;
			const messages = Session.get('selectedSolucao');
			if ($(this).hasClass('selectedProblema')) {
				return;
			}
			if ($(this).hasClass('selected')) {
				messages.splice(id, 1);
				Session.set('selectedSolucao', messages);
			} else {
				messages.push(id);
				Session.set('selectedSolucao', messages);
			}
		});
	}
});

Template.openSolicInstructions.onCreated(function() {
	resetSelection(true);
	Session.set('selectedProblema', []);
	Session.set('selectedSolucao', []);
	this.errorMessage = new ReactiveVar('');

	this.reset = (bool) => {
		this.errorMessage.set('');
		resetSelection(bool);
	};
});

Template.openSolicInstructions.onDestroyed(function() {
	Template.instance().reset(false);
});

//  TODO Maxicon
import { Meteor } from 'meteor/meteor';

import { slashCommands } from '../../utils';

function Solic(command, params, item) {
	if (command === 'solic') {
		const url = `https://sds.maxiconsystems.com.br/pls/maxicon/show_solic_v2?i_nr_solicitacao=${ params }`;
		const msg = item;
		msg.msg = `${ url }`;
		Meteor.call('sendMessage', msg);
	}
}

function OSolic(command, params) {
	if (command === 'osolic') {
		const url = `https://sds.maxiconsystems.com.br/pls/maxicon/show_solic_v2?i_nr_solicitacao=${ params }`;
		const ac = document.createElement('a');
		ac.id = 'osolic';
		document.body.appendChild(ac);
		const a = document.getElementById('osolic');
		a.href = url;
		a.target = '_blank';
		a.click();
	}
}

slashCommands.add('solic', Solic, {
	description: 'Enviar link da solicitação',
	params: 'solcitação',
	clientOnly: true,
});

slashCommands.add('osolic', OSolic, {
	description: 'Abrir solicitação',
	params: 'solcitação',
	clientOnly: true,
});
